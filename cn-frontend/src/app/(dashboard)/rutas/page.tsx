'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'

interface Path {
  _id: string
  title: string
  description: string
  difficulty_level: string
  is_system_generated: boolean
  created_at: string
}

function difficultyColor(level: string) {
  const map: Record<string, string> = {
    basico    : 'bg-green-50 text-green-700',
    intermedio: 'bg-yellow-50 text-yellow-700',
    avanzado  : 'bg-red-50 text-red-700',
  }
  return map[level] || 'bg-gray-100 text-gray-600'
}

export default function RutasPage() {
  const [paths, setPaths]   = useState<Path[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/paths')
      .then(res => setPaths(res.data?.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rutas de aprendizaje</h1>
        <p className="text-gray-500 mt-1">Secuencias de contenido para guiar tu aprendizaje</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : paths.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No hay rutas disponibles aún</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paths.map(p => (
            <div key={p._id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    {p.is_system_generated && (
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        🤖 Auto
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${difficultyColor(p.difficulty_level)}`}>
                      {p.difficulty_level}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Ver detalle — aquí se puede inscribir */}
                <Link
                  href={`/rutas/${p._id}`}
                  className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  Ver ruta →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}