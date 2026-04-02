// Hook escalable: hoy siempre requiere captcha al entrar al login.
// Cuando tengas el endpoint listo, descomenta el bloque de API
// y conecta a GET /api/auth/captcha-required?email=xxx

import { useState, useEffect } from 'react'

export function useCaptchaRequired(_email?: string): {
  required: boolean
  loading: boolean
} {
  const [required, setRequired] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // --- FASE 1: siempre requerir captcha al cargar login ---
    setRequired(true)

    // --- FASE 2 (descomentar cuando tengas el endpoint): ---
    // if (!_email) { setRequired(true); return }
    // setLoading(true)
    // api.get(`/api/auth/captcha-required?email=${_email}`)
    //   .then(res => setRequired(res.data.required))
    //   .catch(() => setRequired(true)) // si falla, mostrar por seguridad
    //   .finally(() => setLoading(false))
  }, [_email])

  return { required, loading }
}