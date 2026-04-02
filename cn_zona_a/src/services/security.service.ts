/**
 * security.service.ts
 * Servicio centralizado de seguridad para Zona A.
 * Maneja: logs, intentos fallidos, bloqueos y sesiones activas.
 * Referencia: OWASP Authentication Cheat Sheet, ISO 27001 A.12.4
 */

import { pool } from '../lib/db'

// ─── Constantes de política de seguridad ──────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5      // intentos antes de bloqueo
const BLOCK_MINUTES       = 30      // duración del bloqueo automático
const CAPTCHA_THRESHOLD   = 3       // intentos antes de requerir captcha

// ─── Tipos internos ───────────────────────────────────────────────────────────
interface LogSecurityEventParams {
  userId?    : number | null
  eventType  : 'login_failed' | 'login_success' | 'account_blocked' |
               'session_revoked' | 'unauthorized_access' | 'xss_attempt' |
               'idor_attempt' | 'sqli_attempt' | 'password_changed' | 'suspicious_access'
  description: string
  ipAddress? : string
  userAgent? : string
  severity   : 'bajo' | 'medio' | 'alto' | 'critico'
  status?    : 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado'
}

// ─── 1. Registrar evento en security_logs ─────────────────────────────────────
export async function logSecurityEvent(params: LogSecurityEventParams) {
  try {
    const {
      userId = null, eventType, description,
      ipAddress = null, userAgent = null,
      severity, status = 'abierto'
    } = params

    await pool.request()
      .input('user_id',     userId)
      .input('event_type',  eventType)
      .input('description', description)
      .input('ip_address',  ipAddress)
      .input('user_agent',  userAgent)
      .input('severity',    severity)
      .input('status',      status)
      .query(`
        INSERT INTO security_logs
          (user_id, event_type, description, ip_address, user_agent, severity, status, created_at)
        VALUES
          (@user_id, @event_type, @description, @ip_address, @user_agent, @severity, @status,
           GETUTCDATE())
      `)
  } catch (err) {
    // Los errores de logging nunca deben romper el flujo principal
    console.error('[SecurityService] Error al escribir security_log:', err)
  }
}

// ─── 2. Registrar intento fallido en failed_login_attempts ────────────────────
export async function recordFailedAttempt(params: {
  email    : string
  ipAddress: string
  userAgent: string
}) {
  try {
    await pool.request()
      .input('email',      params.email)
      .input('ip_address', params.ipAddress)
      .input('user_agent', params.userAgent)
      .query(`
        INSERT INTO failed_login_attempts (email, ip_address, user_agent, attempted_at)
        VALUES (@email, @ip_address, @user_agent, GETUTCDATE())
      `)
  } catch (err) {
    console.error('[SecurityService] Error al registrar intento fallido:', err)
  }
}

// ─── 3. Contar intentos fallidos recientes (últimos 30 min) ───────────────────
export async function countRecentFailedAttempts(email: string): Promise<number> {
  try {
    const result = await pool.request()
      .input('email', email)
      .query(`
        SELECT COUNT(*) AS total
        FROM failed_login_attempts
        WHERE email = @email
          AND attempted_at >= DATEADD(MINUTE, -${BLOCK_MINUTES}, GETUTCDATE())
      `)
    return result.recordset[0]?.total ?? 0
  } catch (err) {
    console.error('[SecurityService] Error al contar intentos fallidos:', err)
    return 0
  }
}

// ─── 4. Verificar si una cuenta está bloqueada ────────────────────────────────
export async function isAccountBlocked(userId: number): Promise<boolean> {
  try {
    const result = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT TOP 1 id
        FROM blocked_accounts
        WHERE user_id  = @user_id
          AND is_active = 1
          AND (blocked_until IS NULL OR blocked_until > GETUTCDATE())
      `)
    return result.recordset.length > 0
  } catch (err) {
    console.error('[SecurityService] Error al verificar bloqueo:', err)
    return false
  }
}

// ─── 5. Bloquear cuenta automáticamente ──────────────────────────────────────
export async function blockAccount(params: {
  userId   : number
  reason   : 'intentos_fallidos' | 'sospechoso' | 'manual'
  minutes? : number
}) {
  try {
    const minutes = params.minutes ?? BLOCK_MINUTES
    await pool.request()
      .input('user_id',       params.userId)
      .input('reason',        params.reason)
      .input('blocked_until', new Date(Date.now() + minutes * 60 * 1000))
      .query(`
        INSERT INTO blocked_accounts (user_id, reason, blocked_at, blocked_until, is_active)
        VALUES (@user_id, @reason, GETUTCDATE(), @blocked_until, 1)
      `)

    // También marcar is_blocked en users para consultas rápidas
    await pool.request()
      .input('user_id', params.userId)
      .query(`UPDATE users SET is_blocked = 1 WHERE id = @user_id`)

  } catch (err) {
    console.error('[SecurityService] Error al bloquear cuenta:', err)
  }
}

// ─── 6. Registrar sesión activa ───────────────────────────────────────────────
export async function registerSession(params: {
  userId   : number
  tokenHash: string
  ipAddress: string
  userAgent: string
  expiresAt: Date
}) {
  try {
    await pool.request()
      .input('user_id',    params.userId)
      .input('token_hash', params.tokenHash)
      .input('ip_address', params.ipAddress)
      .input('user_agent', params.userAgent)
      .input('expires_at', params.expiresAt)
      .query(`
        INSERT INTO active_sessions
          (user_id, token_hash, ip_address, user_agent, created_at, expires_at, is_revoked)
        VALUES
          (@user_id, @token_hash, @ip_address, @user_agent, GETUTCDATE(), @expires_at, 0)
      `)
  } catch (err) {
    console.error('[SecurityService] Error al registrar sesión:', err)
  }
}

// ─── 7. Actualizar campos de seguridad en users ───────────────────────────────
export async function updateUserOnLogin(params: {
  userId         : number
  success        : boolean
  resetAttempts? : boolean
}) {
  try {
    if (params.success) {
      await pool.request()
        .input('user_id', params.userId)
        .query(`
          UPDATE users
          SET last_login_at    = GETUTCDATE(),
              failed_attempts  = 0
          WHERE id = @user_id
        `)
    } else {
      await pool.request()
        .input('user_id', params.userId)
        .query(`
          UPDATE users
          SET failed_attempts = failed_attempts + 1
          WHERE id = @user_id
        `)
    }
  } catch (err) {
    console.error('[SecurityService] Error al actualizar usuario:', err)
  }
}

// ─── 8. ¿Requiere captcha? (para el endpoint del frontend) ───────────────────
export async function requiresCaptcha(email: string): Promise<boolean> {
  const count = await countRecentFailedAttempts(email)
  return count >= CAPTCHA_THRESHOLD
}