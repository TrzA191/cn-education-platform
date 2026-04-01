import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3002',
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor de Peticiones (Request)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Intentamos obtener el token del auth-storage (Zustand o similar)
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      try {
        const { state } = JSON.parse(stored)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      } catch (e) {
        console.error("Error parseando auth-storage", e)
      }
    }
  }
  return config
})

// Interceptor de Respuestas (Response) — AQUÍ ESTÁ EL ARREGLO
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isUnauthorized = error.response?.status === 401
    const isAtLogin = typeof window !== 'undefined' && window.location.pathname.includes('/login')

    // Solo redirigimos si es un 401 Y NO estamos ya en la página de login
    if (isUnauthorized && typeof window !== 'undefined' && !isAtLogin) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api