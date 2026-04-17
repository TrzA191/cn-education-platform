'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import { Sparkles, Route, Loader2, BookOpen } from 'lucide-react'

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
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  const fetchPaths = () => {
    setLoading(true)
    api.get('/api/paths')
      .then(res => setPaths(res.data?.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPaths()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateError('')
    try {
      await api.post('/api/paths/generate')
      fetchPaths() // reload
    } catch (err: any) {
      setGenerateError(err.response?.data?.error || 'Error al generar ruta')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rutas de aprendizaje</h1>
          <p className="text-slate-500 font-medium mt-1">Secuencias de contenido para guiar tu aprendizaje desde nivel básico hasta avanzado.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-slate-400 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {generating ? 'Generando...' : 'Generar Ruta Automática'}
        </button>
      </div>

      {generateError && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
          <p className="text-sm font-medium text-rose-700">{generateError}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-40 bg-white rounded-3xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : paths.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No hay rutas disponibles aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paths.map(p => (
            <div 
              key={p._id} 
              className={`relative overflow-hidden bg-white rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl ${
                p.is_system_generated ? 'border-violet-200 shadow-indigo-100' : 'border-slate-100 shadow-slate-100'
              }`}
            >
              {p.is_system_generated && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className={`p-3 rounded-2xl ${p.is_system_generated ? 'bg-violet-50 text-violet-600' : 'bg-slate-50 text-slate-600'}`}>
                    {p.is_system_generated ? <Sparkles className="w-6 h-6" /> : <Route className="w-6 h-6" />}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${difficultyColor(p.difficulty_level)}`}>
                      {p.difficulty_level}
                    </span>
                    {p.is_system_generated && (
                      <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        Recomendado
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{p.title}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{p.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <BookOpen className="w-4 h-4" />
                    <span>Ruta</span>
                  </div>
                  <Link
                    href={`/rutas/${p._id}`}
                    className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
                      p.is_system_generated 
                        ? 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Explorar ruta →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}