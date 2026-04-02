'use client'

import { useState, useCallback, useEffect } from 'react'

interface CaptchaGateProps {
  onVerified: () => void  // callback cuando el usuario pasa el captcha
}

function generateChallenge() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  const ops = ['+', '-', 'x'] as const
  const op = ops[Math.floor(Math.random() * ops.length)]
  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b
  return { question: `${a} ${op} ${b}`, answer }
}

export default function CaptchaGate({ onVerified }: CaptchaGateProps) {
  // 1. Iniciamos con un estado por defecto que sea igual en Servidor y Cliente
  const [challenge, setChallenge] = useState({ question: '...', answer: 0 })
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  
  // 2. Estado para saber si ya estamos en el navegador
  const [mounted, setMounted] = useState(false)

  // 3. Generamos el reto matemático SÓLO cuando ya estamos en el cliente
  useEffect(() => {
    setChallenge(generateChallenge())
    setMounted(true)
  }, [])

  const refresh = useCallback(() => {
    setChallenge(generateChallenge())
    setInput('')
    setError(false)
  }, [])

  const handleVerify = () => {
    if (parseInt(input, 10) === challenge.answer) {
      onVerified()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setInput('')
      refresh()
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify()
  }

  // 4. Si aún no está montado, devolvemos null para evitar el choque de hidratación
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header igual al login */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">UVC Platform</h1>
          <p className="text-gray-500 text-sm mt-1">Universidad Virtual Continental</p>
        </div>

        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-8 ${shake ? 'animate-shake' : ''}`}>
          
          {/* Icono de escudo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">Verificación de seguridad</h2>
            <p className="text-sm text-gray-500 text-center mt-1">
              Resuelve el siguiente cálculo para continuar
            </p>
          </div>

          {/* Reto matemático */}
          <div className="bg-gray-50 rounded-xl p-6 mb-5 text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">¿Cuánto es?</p>
            <p className="text-4xl font-bold text-indigo-600 tracking-wide">
              {challenge.question} = ?
            </p>
          </div>

          {/* Input */}
          <div className="mb-4">
            <input
              type="number"
              value={input}
              onChange={e => { setInput(e.target.value); setError(false) }}
              onKeyDown={handleKey}
              placeholder="Tu respuesta"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-center font-medium focus:outline-none focus:ring-2 transition
                ${error
                  ? 'border-red-300 focus:ring-red-400 bg-red-50'
                  : 'border-gray-200 focus:ring-indigo-500'
                }`}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500 text-center mt-2">
                Respuesta incorrecta. Intenta con el nuevo cálculo.
              </p>
            )}
          </div>

          {/* Botones */}
          <button
            onClick={handleVerify}
            disabled={!input}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors mb-3"
          >
            Verificar y continuar
          </button>

          <button
            onClick={refresh}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Cambiar pregunta
          </button>
        </div>
      </div>
    </div>
  )
}