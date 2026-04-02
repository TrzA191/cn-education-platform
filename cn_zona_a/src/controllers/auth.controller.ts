/**
 * auth.controller.ts
 * Controlador de autenticación con logging de seguridad completo.
 * Implementa: bloqueo por intentos, registro de sesiones, audit trail.
 */

import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'
import type { StringValue } from 'ms'
import { pool } from '../lib/db'
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

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export async function register(req: Request, res: Response) {
  const { username, email, password, role } = req.body
  const ipAddress = req.ip ?? 'unknown'
  const userAgent = req.headers['user-agent'] ?? 'unknown'

  try {
    const hash = await bcrypt.hash(password, 12)

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
    // Detectar duplicado de email/username
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({ error: 'El correo o usuario ya está registrado' })
    }
    console.error('[register]', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  const { email, password } = req.body
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
    const blocked = await isAccountBlocked(user.id)
    if (blocked) {
      await logSecurityEvent({
        userId     : user.id,
        eventType  : 'unauthorized_access',
        description: `Intento de login en cuenta bloqueada: ${email}`,
        ipAddress,
        userAgent,
        severity   : 'alto',
      })
      return res.status(403).json({
        error: 'Cuenta bloqueada temporalmente. Intenta más tarde.',
        blocked: true,
      })
    }

    // 4. Verificar contraseña
    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
  await recordFailedAttempt({ email, ipAddress, userAgent })
  await updateUserOnLogin({ userId: user.id, success: false })

  const recentFails = await countRecentFailedAttempts(email)
  const captchaVerified = req.headers['x-captcha-verified'] === 'true'

  // Si llegó al umbral del captcha pero NO lo ha verificado → pedir captcha sin bloquear
  if (recentFails >= 3 && !captchaVerified) {
    await logSecurityEvent({
      userId     : user.id,
      eventType  : 'login_failed',
      description: `${recentFails} intentos fallidos para ${email}. Captcha requerido.`,
      ipAddress, userAgent, severity: 'medio',
    })
    return res.status(429).json({
      error          : 'Demasiados intentos fallidos.',
      requiresCaptcha: true,
    })
  }

  // Si ya verificó el captcha pero sigue fallando → ahí sí bloquear
  if (recentFails >= 5 && captchaVerified) {
    await blockAccount({ userId: user.id, reason: 'intentos_fallidos' })
    await logSecurityEvent({
      userId     : user.id,
      eventType  : 'account_blocked',
      description: `Cuenta bloqueada tras ${recentFails} intentos con captcha verificado: ${email}`,
      ipAddress, userAgent, severity: 'critico', status: 'en_proceso',
    })
    return res.status(403).json({
      error  : 'Cuenta bloqueada por múltiples intentos fallidos. Intenta en 30 minutos.',
      blocked: true,
    })
  }

  await logSecurityEvent({
    userId     : user.id,
    eventType  : 'login_failed',
    description: `Contraseña incorrecta para ${email}. Intento ${recentFails} de 3.`,
    ipAddress, userAgent,
    severity   : recentFails >= 3 ? 'alto' : 'medio',
  })

  return res.status(401).json({
    error         : 'Credenciales incorrectas',
    failedAttempts: recentFails,
    maxAttempts   : 3,
  })
}

    // 6. Login exitoso — generar token
    const secret  = process.env.JWT_SECRET as string
    const expires = (process.env.JWT_EXPIRES_IN || '7d') as StringValue
    const options: SignOptions = { expiresIn: expires }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      options
    )

    // 7. Registrar sesión activa (hash del token para no guardar texto plano)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

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