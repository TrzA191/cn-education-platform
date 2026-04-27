/**
 * auth.controller.ts
 * Controlador de autenticación con logging de seguridad completo.
 * Implementa: bloqueo por intentos, registro de sesiones, audit trail.
 */

import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'
import { pool } from '../lib/db'
import { sendVerificationCode, sendPasswordResetCode } from '../lib/email'
import {
  logSecurityEvent,
  recordFailedAttempt,
  countRecentFailedAttempts,
  isAccountBlocked,
  blockAccount,
  registerSession,
  updateUserOnLogin,
  requiresCaptcha,
} from '../services/security.service'

const MAX_FAILED_ATTEMPTS = 3

// ─── CODIGO DE VERIFICACION ───────────────────────────────────────────────────
export async function requestVerificationCode(req: Request, res: Response) {
  const { email } = req.body;
  
  try {
    // Generar OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Eliminar códigos anteriores
    await pool.request()
      .input('email', email)
      .query(`DELETE FROM verification_codes WHERE email = @email`);

    // Insertar nuevo
    await pool.request()
      .input('email', email)
      .input('code', code)
      .input('expires_at', expiresAt)
      .query(`
        INSERT INTO verification_codes (email, code, expires_at) 
        VALUES (@email, @code, @expires_at)
      `);

    // Enviar correo
    const emailResult = await sendVerificationCode(email, code);
    if (!emailResult.success) {
      return res.status(500).json({ error: 'No se pudo enviar el correo de verificación' });
    }

    res.json({ message: 'Código de verificación enviado al correo' });
  } catch (err) {
    console.error('[requestVerificationCode]', err);
    res.status(500).json({ error: 'Error interno del servidor al enviar código' });
  }
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export async function register(req: Request, res: Response) {
  const { username, email, password, role, verificationCode } = req.body
  const ipAddress = req.ip ?? 'unknown'
  const userAgent = req.headers['user-agent'] ?? 'unknown'

  try {
    // Verificar el código
    const verifyResult = await pool.request()
      .input('email', email)
      .input('code', verificationCode)
      .query(`
        SELECT * FROM verification_codes 
        WHERE email = @email AND code = @code AND expires_at > GETDATE()
      `);

    if (verifyResult.recordset.length === 0) {
      return res.status(400).json({ error: 'Código de verificación inválido o expirado' });
    }

    const hash = await bcrypt.hash(password, 12)

    // Verificar duplicados antes de insertar para dar un mensaje exacto
    const duplicateCheck = await pool.request()
      .input('username', username)
      .input('email', email)
      .query(`SELECT username, email FROM users WHERE username = @username OR email = @email`);
    
    if (duplicateCheck.recordset.length > 0) {
      const isEmail = duplicateCheck.recordset.some(r => r.email === email);
      const isUser = duplicateCheck.recordset.some(r => r.username === username);
      if (isEmail && isUser) return res.status(409).json({ error: 'El correo y el usuario ya están registrados.' });
      if (isEmail) return res.status(409).json({ error: 'Este correo electrónico ya está registrado.' });
      if (isUser) return res.status(409).json({ error: 'El nombre de usuario ya está en uso. Elige otro.' });
    }

    const result = await pool.request()
      .input('username', username)
      .input('email',    email)
      .input('password', hash)
      .input('role',     role || 'student')
      .query(`
        INSERT INTO users (username, email, password_hash, role)
        OUTPUT INSERTED.id
        VALUES (@username, @email, @password, @role)
      `)

    const userId = result.recordset[0].id

    await pool.request()
      .input('user_id', userId)
      .query(`INSERT INTO user_profiles (user_id) VALUES (@user_id)`)

    // Eliminar el código usado
    await pool.request()
      .input('email', email)
      .query(`DELETE FROM verification_codes WHERE email = @email`);

    // Log de auditoría: creación de usuario (acción crítica)
    await logSecurityEvent({
      userId,
      eventType  : 'login_success',
      description: `Nuevo usuario registrado: ${email} con rol ${role || 'student'}`,
      ipAddress,
      userAgent,
      severity   : 'bajo',
      status     : 'cerrado',
    })

    res.json({ message: 'Usuario creado correctamente' })

  } catch (err: any) {
    console.error('[register]', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  const { email, password, captchaToken } = req.body
  const ipAddress = req.ip ?? 'unknown'
  const userAgent = req.headers['user-agent'] ?? 'unknown'

  try {
    // 1. Buscar usuario
    const result = await pool.request()
      .input('email', email)
      .query(`SELECT * FROM users WHERE email = @email`)

    const user = result.recordset[0]

    // 2. Usuario no existe — registrar intento igualmente (no revelar si existe)
    if (!user) {
      await recordFailedAttempt({ email, ipAddress, userAgent })
      await logSecurityEvent({
        userId     : null,
        eventType  : 'login_failed',
        description: `Intento de login con email no registrado: ${email}`,
        ipAddress,
        userAgent,
        severity   : 'medio',
      })
      // Respuesta genérica para no revelar si el email existe (seguridad)
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // 3. Verificar si la cuenta está bloqueada
    const blockStatus = await isAccountBlocked(user.id)
    if (blockStatus.blocked) {
      const minutesLeft = blockStatus.minutesLeft > 0 ? blockStatus.minutesLeft : 1;

      await logSecurityEvent({
        userId     : user.id,
        eventType  : 'unauthorized_access',
        description: `Intento de login en cuenta bloqueada: ${email}`,
        ipAddress,
        userAgent,
        severity   : 'alto',
      })
      return res.status(403).json({
        error: `Cuenta bloqueada temporalmente. Intenta en ${minutesLeft} minutos.`,
        blocked: true,
      })
    }

    // 4. Verificar contraseña
    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      await recordFailedAttempt({ email, ipAddress, userAgent })
      await updateUserOnLogin({ userId: user.id, success: false })

      const newFailedAttempts = (user.failed_attempts || 0) + 1; // absolute count

      let isCaptchaValid = false;
      const recaptchaToken = req.headers['x-recaptcha-token'] as string;
      if (recaptchaToken) {
        try {
          const secretKey = '6LfQ4rcsAAAAAJypblktPdhKJD1oGlQ2MESZpN6C';
          const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
          const captchaRes = await fetch(verifyUrl, { method: 'POST' });
          const captchaData = await captchaRes.json();
          isCaptchaValid = captchaData.success;
        } catch (e) {
          console.error('[ReCAPTCHA] Error verifying token', e);
        }
      }

      // 1. Prioridad: Escalating Lockout (Aumentando dinámicamente)
      if (newFailedAttempts >= 5) {
        let blockMinutes = 10;
        if (newFailedAttempts === 6) blockMinutes = 15;
        if (newFailedAttempts === 7) blockMinutes = 30;
        if (newFailedAttempts >= 8) blockMinutes = 60;

        await blockAccount({ userId: user.id, reason: 'intentos_fallidos', minutes: blockMinutes })
        await logSecurityEvent({
          userId     : user.id,
          eventType  : 'account_blocked',
          description: `Cuenta bloqueada por ${blockMinutes} min tras ${newFailedAttempts} intentos fallidos acumulados: ${email}`,
          ipAddress, userAgent, severity: 'critico', status: 'en_proceso',
        })
        return res.status(403).json({
          error  : `Cuenta bloqueada por múltiples intentos fallidos. Intenta de nuevo en ${blockMinutes} minutos.`,
          blocked: true,
        })
      }

      // 2. Si no es bloqueado, pero llegó a zona amarilla (>= 3) y no mandó token válido → Pedir Captcha
      if (newFailedAttempts >= 3 && !isCaptchaValid) {
        await logSecurityEvent({
          userId     : user.id,
          eventType  : 'login_failed',
          description: `${newFailedAttempts} intentos fallidos para ${email}. Captcha requerido.`,
          ipAddress, userAgent, severity: 'medio',
        })
        return res.status(429).json({
          error          : 'Demasiados intentos fallidos. Por favor, verifica que no eres un robot.',
          requiresCaptcha: true,
        })
      }

      await logSecurityEvent({
        userId     : user.id,
        eventType  : 'login_failed',
        description: `Contraseña incorrecta para ${email}. Intento ${newFailedAttempts}.`,
        ipAddress, userAgent,
        severity   : newFailedAttempts >= 3 ? 'alto' : 'medio',
      })

      return res.status(401).json({
        error         : 'Credenciales incorrectas',
        failedAttempts: newFailedAttempts,
      })
    }

    // 6. Login exitoso — generar token
    const secret  = process.env.JWT_SECRET as string
    const expires = process.env.JWT_EXPIRES || '1h'
    const options: SignOptions = { expiresIn: expires as any }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      options
    )

    // 7. Registrar sesión activa (hash del token para no guardar texto plano)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    
    // Calcular fecha de expiración para la DB basada en el string (1h, 7d, etc)
    const parseMs = (exp: string) => {
      const val = parseInt(exp);
      if (exp.endsWith('h')) return val * 60 * 60 * 1000;
      if (exp.endsWith('d')) return val * 24 * 60 * 60 * 1000;
      if (exp.endsWith('m')) return val * 60 * 1000;
      if (exp.endsWith('s')) return val * 1000;
      return 7 * 24 * 60 * 60 * 1000; // default 7d
    };

    const expiresAt = new Date(Date.now() + parseMs(expires))

    await registerSession({ userId: user.id, tokenHash, ipAddress, userAgent, expiresAt })
    await updateUserOnLogin({ userId: user.id, success: true })

    // 8. Log de login exitoso
    await logSecurityEvent({
      userId     : user.id,
      eventType  : 'login_success',
      description: `Login exitoso para ${email}`,
      ipAddress,
      userAgent,
      severity   : 'bajo',
      status     : 'cerrado',
    })

    // 9. Responder con token Y objeto user (fix del bug anterior)
    res.json({
      token,
      user: {
        userId: user.id,
        email : user.email,
        role  : user.role,
      },
    })

  } catch (err) {
    console.error('[login]', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── ME ───────────────────────────────────────────────────────────────────────
export async function me(req: Request, res: Response) {
  const userId = (req as any).user.id

  try {
    const result = await pool.request()
      .input('id', userId)
      .query(`SELECT id, username, email, role FROM users WHERE id = @id`)

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error('[me]', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  try {
    // Verificar si el usuario existe
    const userResult = await pool.request()
      .input('email', email)
      .query(`SELECT id FROM users WHERE email = @email`);

    if (userResult.recordset.length === 0) {
      // Por seguridad, no revelamos si el correo existe o no a un atacante potencial.
      res.json({ message: 'Si el correo existe, se ha enviado un código de recuperación.' });
      return;
    }

    // Generar OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Eliminar códigos anteriores
    await pool.request()
      .input('email', email)
      .query(`DELETE FROM verification_codes WHERE email = @email`);

    // Insertar nuevo
    await pool.request()
      .input('email', email)
      .input('code', code)
      .input('expires_at', expiresAt)
      .query(`
        INSERT INTO verification_codes (email, code, expires_at) 
        VALUES (@email, @code, @expires_at)
      `);

    // Enviar correo
    const emailResult = await sendPasswordResetCode(email, code);
    if (!emailResult.success) {
      res.status(500).json({ error: 'No se pudo enviar el correo de recuperación' });
      return;
    }

    res.json({ message: 'Si el correo existe, se ha enviado un código de recuperación.' });
  } catch (err) {
    console.error('[forgotPassword]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────
export async function resetPassword(req: Request, res: Response) {
  const { email, code, newPassword } = req.body;
  const ipAddress = req.ip ?? 'unknown'
  const userAgent = req.headers['user-agent'] ?? 'unknown'

  try {
    // 1. Verificar el código
    const verifyResult = await pool.request()
      .input('email', email)
      .input('code', code)
      .query(`
        SELECT * FROM verification_codes 
        WHERE email = @email AND code = @code AND expires_at > GETDATE()
      `);

    if (verifyResult.recordset.length === 0) {
      res.status(400).json({ error: 'Código de recuperación inválido o expirado' });
      return;
    }

    // 2. Verificar el usuario
    const userResult = await pool.request()
      .input('email', email)
      .query(`SELECT id FROM users WHERE email = @email`);

    if (userResult.recordset.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    const userId = userResult.recordset[0].id;

    // 3. Hashear nueva contraseña
    const hash = await bcrypt.hash(newPassword, 12);

    // 4. Actualizar contraseña y password_changed_at
    await pool.request()
      .input('email', email)
      .input('password_hash', hash)
      .query(`
        UPDATE users 
        SET password_hash = @password_hash, password_changed_at = GETDATE()
        WHERE email = @email
      `);

    // 5. Inhabilitar sesiones activas antiguas (Cierre de sesión automático)
    await pool.request()
      .input('user_id', userId)
      .query(`
        UPDATE active_sessions 
        SET is_revoked = 1 
        WHERE user_id = @user_id
      `);

    // 6. Eliminar el código usado
    await pool.request()
      .input('email', email)
      .query(`DELETE FROM verification_codes WHERE email = @email`);

    // 7. Log de seguridad
    await logSecurityEvent({
      userId: userId,
      eventType: 'password_changed',
      description: 'Contraseña restablecida correctamente. Sesiones previas revocadas.',
      ipAddress: ipAddress,
      userAgent: userAgent,
      severity: 'medio',
      status: 'cerrado'
    });

    res.json({ message: 'Contraseña restablecida exitosamente. Todas las sesiones anteriores han sido cerradas.' });
  } catch (err) {
    console.error('[resetPassword]', err);
    res.status(500).json({ error: 'Error interno del servidor al restablecer contraseña' });
  }
}