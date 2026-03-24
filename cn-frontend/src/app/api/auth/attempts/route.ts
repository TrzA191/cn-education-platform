// src/app/api/auth/attempts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db' // tu instancia de BD

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ attempts: 0, requires_captcha: false })

  // Cuenta intentos fallidos de los últimos 15 minutos
  const result = await db.query(`
    SELECT COUNT(*) as total
    FROM failed_login_attempts
    WHERE email = @email
      AND attempted_at >= DATEADD(MINUTE, -15, GETDATE())
  `, { email })

  const attempts = result[0]?.total ?? 0

  return NextResponse.json({
    attempts,
    requires_captcha: attempts >= 3  // umbral: 3 intentos
  })
}