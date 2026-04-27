'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function SessionGuard() {
  const { token, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!token) return

    const checkSession = () => {
      try {
        // Decodificar el payload del JWT (segunda parte del string separado por '.')
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )

        const { exp } = JSON.parse(jsonPayload)
        const currentTime = Math.floor(Date.now() / 1000)

        if (currentTime >= exp) {
          console.warn('Sesión expirada — Cerrando sesión automáticamente')
          logout()
          router.push('/login')
        }
      } catch (e) {
        console.error('Error verificando sesión', e)
        logout()
        router.push('/login')
      }
    }

    // Verificar cada 10 segundos
    const interval = setInterval(checkSession, 10000)
    
    // Verificar inmediatamente al montar o cambiar token
    checkSession()

    return () => clearInterval(interval)
  }, [token, logout, router])

  return null
}
