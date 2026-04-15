'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import CaptchaGate from '@/components/CaptchaGate'
import { GraduationCap, ArrowRight, ShieldCheck, Mail } from 'lucide-react'
import { useCaptchaRequired } from '@/hooks/useCaptchaRequired'

type Tab  = 'login' | 'register'
type Role = 'student' | 'teacher'

// Dominios de correo permitidos
const ALLOWED_EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|icloud\.com|unach\.mx|uvc\.edu\.mx|live\.com|me\.com)$/i

// Validadores de contraseña
const passwordRules = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Al menos un número',  test: (p: string) => /\d/.test(p) },
  { label: 'Al menos una letra',  test: (p: string) => /[a-zA-Z]/.test(p) },
]

export default function LoginPage() {
  const router      = useRouter()
  const { setAuth } = useAuthStore()

  const [tab,              setTab]              = useState<Tab>('login')
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [captchaToken,    setCaptchaToken]      = useState<string | null>(null)
  const [forceShowCaptcha, setForceShowCaptcha] = useState(false)

  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({
    username: '', email: '', password: '', confirmPassword: '', role: 'student' as Role,
  })

  const [registerStep, setRegisterStep] = useState<1 | 2>(1)
  const [verificationCode, setVerificationCode] = useState('')

  // Errores de validación del formulario de registro
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { required: captchaRequired, loading: captchaLoading, recheck } =
    useCaptchaRequired(tab === 'login' ? loginData.email : undefined)

  if (tab === 'login' && (captchaRequired || forceShowCaptcha) && !captchaToken) {
    return (
      <CaptchaGate onVerified={(token) => {
        setCaptchaToken(token)
        setForceShowCaptcha(false)
      }} />
    )
  }

  // ── Validación del registro ──────────────────────────────────────────────────
  const validateRegister = (): boolean => {
    const errors: Record<string, string> = {}

    if (!ALLOWED_EMAIL_REGEX.test(registerData.email)) {
      errors.email = 'Usa un correo válido: @gmail.com, @hotmail.com, @unach.mx, etc.'
    }

    const failedRules = passwordRules.filter(r => !r.test(registerData.password))
    if (failedRules.length > 0) {
      errors.password = 'La contraseña no cumple los requisitos.'
    }

    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (captchaToken) headers['x-recaptcha-token'] = captchaToken

      const res = await api.post('/api/auth/login', loginData, { headers })
      const { token, user } = res.data
      setAuth(token, user)
      router.push('/dashboard')
    } catch (err: any) {
      const data = err.response?.data
      if (data?.requiresCaptcha) {
        setCaptchaToken(null)
        setForceShowCaptcha(true)
        setError('')
        return
      }
      if (data?.blocked) {
        setError(data?.error || 'Cuenta bloqueada. Intenta más tarde.')
        return
      }
      setError(data?.error || 'Error al iniciar sesión')
      setCaptchaToken(null)
      recheck()
    } finally {
      setLoading(false)
    }
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateRegister()) return

    setLoading(true)
    try {
      await api.post('/api/auth/send-verification-code', {
        email: registerData.email,
      })
      setRegisterStep(2)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar código')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/register', {
        username: registerData.username,
        email   : registerData.email,
        password: registerData.password,
        role    : registerData.role,
        verificationCode: verificationCode,
      })
      const res = await api.post('/api/auth/login', {
        email: registerData.email, password: registerData.password,
      })
      const { token, user } = res.data
      setAuth(token, user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const pwd = registerData.password

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pathly</h1>
          <p className="text-slate-500 font-medium mt-1">Trace your path, learn at your pace</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex bg-slate-100 rounded-xl p-1.5 mb-8">
            <button
              onClick={() => { setTab('login'); setError(''); setCaptchaToken(null); setForceShowCaptcha(false); setRegisterStep(1); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                tab === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >Log in</button>
            <button
              onClick={() => { setTab('register'); setError(''); setFieldErrors({}); setRegisterStep(1); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                tab === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >Sign up</button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ── FORMULARIO LOGIN ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="email" required
                    value={loginData.email}
                    onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                     <ShieldCheck className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="password" required
                    value={loginData.password}
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-indigo-300 disabled:to-indigo-300 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/30 hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* ── FORMULARIO REGISTRO ── */}
          {tab === 'register' && registerStep === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
                <input
                  type="text" required
                  value={registerData.username}
                  onChange={e => setRegisterData({ ...registerData, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="usuario123"
                />
              </div>

              {/* Email con validación de dominio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input
                  type="email" required
                  value={registerData.email}
                  onChange={e => {
                    setRegisterData({ ...registerData, email: e.target.value })
                    setFieldErrors(prev => ({ ...prev, email: '' }))
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    fieldErrors.email
                      ? 'border-red-300 focus:ring-red-400 bg-red-50'
                      : 'border-gray-200 focus:ring-indigo-500'
                  }`}
                  placeholder="tu@gmail.com / tu@unach.mx"
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Contraseña con indicadores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password" required
                  value={registerData.password}
                  onChange={e => {
                    setRegisterData({ ...registerData, password: e.target.value })
                    setFieldErrors(prev => ({ ...prev, password: '' }))
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    fieldErrors.password
                      ? 'border-red-300 focus:ring-red-400 bg-red-50'
                      : 'border-gray-200 focus:ring-indigo-500'
                  }`}
                  placeholder="Mínimo 8 caracteres"
                />
                {/* Indicadores de requisitos */}
                {pwd.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordRules.map(rule => (
                      <div key={rule.label} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          rule.test(pwd) ? 'bg-green-500' : 'bg-gray-200'
                        }`}>
                          {rule.test(pwd) && (
                            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs transition-colors ${
                          rule.test(pwd) ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <input
                  type="password" required
                  value={registerData.confirmPassword}
                  onChange={e => {
                    setRegisterData({ ...registerData, confirmPassword: e.target.value })
                    setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    fieldErrors.confirmPassword
                      ? 'border-red-300 focus:ring-red-400 bg-red-50'
                      : registerData.confirmPassword.length > 0 && registerData.confirmPassword === pwd
                        ? 'border-green-400 focus:ring-green-400'
                        : 'border-gray-200 focus:ring-indigo-500'
                  }`}
                  placeholder="Repite tu contraseña"
                />
                {/* Indicador de coincidencia en tiempo real */}
                {registerData.confirmPassword.length > 0 && (
                  <p className={`text-xs mt-1 ${
                    registerData.confirmPassword === pwd ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {registerData.confirmPassword === pwd ? '✓ Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                  </p>
                )}
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={registerData.role}
                  onChange={e => setRegisterData({ ...registerData, role: e.target.value as Role })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
                >
                  <option value="student">Estudiante</option>
                  <option value="teacher">Profesor</option>
                </select>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-indigo-300 disabled:to-indigo-300 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/30 hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? 'Enviando código...' : 'Continuar paso 2'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {tab === 'register' && registerStep === 2 && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  Enviamos un código de 6 dígitos a <span className="font-semibold text-gray-900">{registerData.email}</span>.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de verificación</label>
                <input
                  type="text" required
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  disabled={loading}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors border border-slate-200"
                >
                  Volver
                </button>
                <button
                  type="submit" disabled={loading || verificationCode.length !== 6}
                  className="w-2/3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-indigo-300 disabled:to-indigo-300 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/30 hover:shadow-lg"
                >
                  {loading ? 'Verificando...' : 'Verificar e Ingresar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}