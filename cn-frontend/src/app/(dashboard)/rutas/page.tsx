'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import { Plus, Route, Loader2, BookOpen, X } from 'lucide-react'

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
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [availableTags, setAvailableTags] = useState<{_id: string, name: string}[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [savingInterests, setSavingInterests] = useState(false)

  const fetchPaths = () => {
    setLoading(true)
    api.get('/api/paths')
      .then(res => setPaths(res.data?.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPaths()
    api.get('/api/tags').then(res => setAvailableTags(res.data || [])).catch(console.error)
    api.get('/api/tags/interests/me').then(res => {
      const interests = res.data || []
      setSelectedTagIds(interests.map((i: any) => i.tag_id?._id || i.tag_id))
    }).catch(console.error)
  }, [])

  const handleSaveAndGenerate = async () => {
    setSavingInterests(true)
    setGenerateError('')
    try {
      await api.put('/api/tags/interests/me', { tagIds: selectedTagIds })
      setGenerating(true)
      await api.post('/api/paths/generate')
      setShowConfigModal(false)
      fetchPaths()
    } catch (err: any) {
      setGenerateError(err.response?.data?.error || 'Error al crear ruta')
    } finally {
      setSavingInterests(false)
      setGenerating(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rutas de aprendizaje</h1>
          <p className="text-slate-500 font-medium mt-1">Secuencias de contenido para guiar tu aprendizaje desde nivel básico hasta avanzado.</p>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Crear Ruta
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
              className="relative overflow-hidden bg-white rounded-3xl border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl shadow-slate-100"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                    <Route className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${difficultyColor(p.difficulty_level)}`}>
                      {p.difficulty_level}
                    </span>
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
                    className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all bg-slate-50 text-slate-700 hover:bg-slate-100"
                  >
                    Explorar ruta →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de configuración de intereses */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Configura tus intereses</h2>
              <button onClick={() => setShowConfigModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-slate-500 mb-6">
                Selecciona los temas que más te interesan para armar tu ruta a medida.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {availableTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag._id)
                  return (
                    <button
                      key={tag._id}
                      onClick={() => toggleTag(tag._id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        isSelected 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  )
                })}
                {availableTags.length === 0 && (
                  <p className="text-sm text-slate-400">Cargando temas...</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                disabled={generating || savingInterests}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAndGenerate}
                disabled={generating || savingInterests || selectedTagIds.length === 0}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-all"
              >
                {(generating || savingInterests) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Route className="w-4 h-4" />}
                {generating ? 'Creando...' : 'Crear Ruta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}