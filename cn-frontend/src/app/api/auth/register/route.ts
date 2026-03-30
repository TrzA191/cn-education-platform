// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import zonaA from '@/lib/zonaA'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { username, email, password, role } = body

  try {
    const { data } = await zonaA.post('/api/auth/register', {
      username,
      email,
      password,
      role
    })

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    const status = err.response?.status ?? 500
    const error  = err.response?.data?.error ?? 'Error al registrarse'
    return NextResponse.json({ error }, { status })
  }
}