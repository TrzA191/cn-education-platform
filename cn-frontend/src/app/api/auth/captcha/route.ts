// src/app/api/auth/captcha/route.ts
import { NextResponse } from 'next/server'
import svgCaptcha from 'svg-captcha'
import { captchaStore } from '@/lib/captcha.store'
import { randomUUID } from 'crypto'

export async function GET() {
  const captcha = svgCaptcha.create({
    size: 5,          // 5 caracteres
    noise: 3,         // líneas de ruido
    color: true,      // caracteres de colores
    background: '#f0f4ff',
    fontSize: 48,
    width: 160,
    height: 60,
    ignoreChars: '0O1lIi', // evita caracteres confusos
  })

  const captchaId = randomUUID()
  captchaStore.set(captchaId, captcha.text)

  return NextResponse.json({
    captchaId,
    svg: captcha.data  // SVG en string, el frontend lo renderiza directo
  })
}