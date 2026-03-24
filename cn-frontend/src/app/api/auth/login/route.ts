// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { createHash, randomUUID } from 'crypto'
import { captchaStore } from '@/lib/captcha.store'

const CAPTCHA_THRESHOLD = 3   // intentos antes de pedir captcha
const BLOCK_THRESHOLD    = 10  // intentos antes de bloquear cuenta

export async function POST(req: NextRequest) {
  const ip        = req.headers.get('x-forwarded-for') ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? 'unknown'
  const body      = await req.json()
  const { email, password, captchaId, captchaInput } = body

  // ── 1. Contar intentos recientes (últimos 15 min) ──────────────────────
  const attemptsResult = await db.query(`
    SELECT COUNT(*) as total
    FROM failed_login_attempts
    WHERE email = @email
      AND attempted_at >= DATEADD(MINUTE, -15, GETDATE())
  `, { email })

  const recentAttempts = attemptsResult[0]?.total ?? 0

  // ── 2. Si supera umbral, validar captcha ANTES de cualquier otra cosa ──
  if (recentAttempts >= CAPTCHA_THRESHOLD) {
    if (!captchaId || !captchaInput) {
      return NextResponse.json(
        { error: 'Se requiere completar el captcha', requires_captcha: true },
        { status: 400 }
      )
    }

    const captchaOk = captchaStore.verify(captchaId, captchaInput)
    if (!captchaOk) {
      return NextResponse.json(
        { error: 'Captcha incorrecto o expirado', requires_captcha: true },
        { status: 400 }
      )
    }
  }

  // ── 3. Buscar usuario ──────────────────────────────────────────────────
  const users = await db.query(
    `SELECT * FROM users WHERE email = @email`,
    { email }
  )
  const user = users[0]

  // ── 4. Verificar si está bloqueado ────────────────────────────────────
  if (user?.is_blocked) {
    await registrarLog(db, null, 'unauthorized_access',
      `Intento de login en cuenta bloqueada: ${email}`,
      ip, userAgent, 'alto')

    return NextResponse.json(
      { error: 'Cuenta bloqueada. Contacta al administrador.' },
      { status: 403 }
    )
  }

  // ── 5. Verificar contraseña ───────────────────────────────────────────
  const passwordOk = user && await bcrypt.compare(password, user.password_hash)

  if (!user || !passwordOk) {
    // Registrar intento fallido en failed_login_attempts
    await db.query(`
      INSERT INTO failed_login_attempts (email, ip_address, user_agent, attempted_at)
      VALUES (@email, @ip, @userAgent, GETDATE())
    `, { email, ip, userAgent })

    // Incrementar contador en users si el usuario existe
    if (user) {
      const newAttempts = (user.failed_attempts ?? 0) + 1
      await db.query(`
        UPDATE users SET failed_attempts = @attempts WHERE id = @id
      `, { attempts: newAttempts, id: user.id })

      // Si llega al umbral de bloqueo
      if (newAttempts >= BLOCK_THRESHOLD) {
        await db.query(`
          UPDATE users SET is_blocked = 1 WHERE id = @id
        `, { id: user.id })

        await db.query(`
          INSERT INTO blocked_accounts (user_id, reason, blocked_at, is_active)
          VALUES (@userId, 'intentos_fallidos', GETDATE(), 1)
        `, { userId: user.id })

        await registrarLog(db, user.id, 'account_blocked',
          `Cuenta bloqueada automáticamente por ${newAttempts} intentos fallidos`,
          ip, userAgent, 'critico')
      }
    }

    // Registrar en security_logs
    await registrarLog(db, user?.id ?? null, 'login_failed',
      `Intento fallido de login para: ${email}`,
      ip, userAgent, recentAttempts >= 5 ? 'alto' : 'medio')

    return NextResponse.json(
      {
        error: 'Credenciales incorrectas',
        requires_captcha: (recentAttempts + 1) >= CAPTCHA_THRESHOLD
      },
      { status: 401 }
    )
  }

  // ── 6. Login exitoso ──────────────────────────────────────────────────
  // Limpiar intentos fallidos y generar JWT
  await db.query(`
    UPDATE users
    SET failed_attempts = 0, last_login_at = GETDATE()
    WHERE id = @id
  `, { id: user.id })

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '12h' }
  )

  const tokenHash = createHash('sha256').update(token).digest('hex')

  await db.query(`
    INSERT INTO active_sessions (user_id, token_hash, ip_address, user_agent, created_at, expires_at)
    VALUES (@userId, @tokenHash, @ip, @userAgent, GETDATE(), DATEADD(HOUR, 12, GETDATE()))
  `, { userId: user.id, tokenHash, ip, userAgent })

  await registrarLog(db, user.id, 'login_success',
    `Login exitoso para ${email}`,
    ip, userAgent, 'bajo')

  return NextResponse.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role }
  })
}

// ── Helper: insertar en security_logs ──────────────────────────────────────
async function registrarLog(
  db: any,
  userId: number | null,
  eventType: string,
  description: string,
  ip: string,
  userAgent: string,
  severity: string
) {
  await db.query(`
    INSERT INTO security_logs
      (user_id, event_type, description, ip_address, user_agent, severity, status, created_at)
    VALUES
      (@userId, @eventType, @description, @ip, @userAgent, @severity, 'abierto', GETDATE())
  `, { userId, eventType, description, ip, userAgent, severity })
}