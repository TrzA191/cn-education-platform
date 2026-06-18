'use client'

import React, { useRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

interface CaptchaGateProps {
  onVerified: (token: string) => void
}

export default function CaptchaGate({ onVerified }: CaptchaGateProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const handleVerify = (token: string | null) => {
    if (token) {
      onVerified(token)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Pathly</h1>
          <p className="text-gray-500 text-sm mt-1">Verificación de seguridad requerida</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">Validación reCAPTCHA</h2>
            <p className="text-sm text-gray-500 text-center mt-1">
              Por favor completa el captcha para probar que eres humano.
            </p>
          </div>

          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey="6LfQ4rcsAAAAAI713yA4fSAAYADHodvCLfRjnsFL"
            onChange={handleVerify}
          />
        </div>
      </div>
    </div>
  )
}