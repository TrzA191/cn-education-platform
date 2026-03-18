import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'uvc_jwt_secret_local'
)

// Rutas públicas que no requieren token
const PUBLIC_ROUTES = ['/login']

// Rutas por rol
const ROLE_ROUTES: Record<string, string[]> = {
  admin:   ['/dashboard/admin'],
  teacher: ['/dashboard/subir', '/dashboard/admin'],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Dejar pasar rutas públicas
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Verificar token en cookie o header
  const token = req.cookies.get('token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = payload.role as string

    // Verificar acceso por rol
    for (const [restrictedRole, routes] of Object.entries(ROLE_ROUTES)) {
      if (routes.some(r => pathname.startsWith(r))) {
        if (role !== restrictedRole && role !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}