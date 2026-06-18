import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function useCaptchaRequired(email?: string): {
  required: boolean
  loading : boolean
  recheck : () => void
} {
  const [required, setRequired] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [tick,     setTick]     = useState(0)

  const recheck = () => setTick(t => t + 1)

  useEffect(() => {
    // Email vacío o incompleto — no consultar
    if (!email || !email.includes('@') || !email.includes('.')) {
      setRequired(false)
      return
    }

    // Debounce: esperar 600ms antes de consultar
    const timer = setTimeout(() => {
      setLoading(true)
      api.get(`/api/auth/captcha-required?email=${encodeURIComponent(email)}`)
        .then(res => setRequired(res.data.required))
        .catch(() => setRequired(false))
        .finally(() => setLoading(false))
    }, 600)

    // Cancelar si el email cambia antes de los 600ms
    return () => clearTimeout(timer)
  }, [email, tick])

  return { required, loading, recheck }
}