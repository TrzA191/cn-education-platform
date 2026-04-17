'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { 
  UploadCloud, 
  CheckCircle2, 
  FileType, 
  Clock, 
  Link as LinkIcon,
  Type,
  AlignLeft,
  XCircle
} from 'lucide-react'

export default function SubirContenidoPage() {
  const { user } = useAuthStore()
  const router   = useRouter()

  const [form, setForm] = useState({
    title           : '',
    description     : '',
    content_type    : 'video',
    cdn_url         : '',
    duration_seconds: '',
    difficulty_level: 'basico',
    tags            : [] as string[]
  })
  const [availableTags, setAvailableTags] = useState<{_id: string, name: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  useEffect(() => {
    api.get('/api/tags')
      .then(res => setAvailableTags(res.data || []))
      .catch(console.error)
  }, [])

  const toggleTag = (tagId: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) 
        ? prev.tags.filter(id => id !== tagId) 
        : [...prev.tags, tagId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/contents', {
        title           : form.title,
        description     : form.description,
        content_type    : form.content_type,
        cdn_url         : form.cdn_url || null,
        duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : null,
        difficulty_level: form.difficulty_level,
        tags            : form.tags,
        author_id       : user?.userId,
        status          : 'active',
      })
      setSuccess(true)
      setTimeout(() => router.push('/contenidos'), 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al subir el contenido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 pl-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Publicar Contenido</h1>
        <p className="text-slate-500 font-medium mt-1">Agrega un nuevo recurso educativo a la plataforma para tus estudiantes.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        {success ? (
          <div className="text-center py-16 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">¡Contenido subido exitosamente!</p>
            <p className="text-slate-500 font-medium mt-2">Guardando en la Zona B y redirigiendo al catálogo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Type className="w-4 h-4 text-indigo-500" /> Título
              </label>
              <input
                type="text" required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                placeholder="Ej. Introducción a la Inteligencia Artificial"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <AlignLeft className="w-4 h-4 text-indigo-500" /> Descripción
              </label>
              <textarea
                rows={4} required
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm resize-none"
                placeholder="Describe el objetivo y temario de este contenido..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileType className="w-4 h-4 text-indigo-500" /> Tipo de Recurso
                </label>
                <select
                  value={form.content_type}
                  onChange={e => setForm({ ...form, content_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm bg-white"
                >
                  <option value="video">Video Interactivo</option>
                  <option value="pdf">Documento PDF</option>
                  <option value="texto">Artículo / Texto</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Clock className="w-4 h-4 text-indigo-500" /> Duración Estimada
                </label>
                <div className="relative">
                  <input
                    type="number" min="0"
                    value={form.duration_seconds}
                    onChange={e => setForm({ ...form, duration_seconds: e.target.value })}
                    className="w-full pr-16 pl-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="Ej. 45"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm font-medium">min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Type className="w-4 h-4 text-indigo-500" /> Nivel de Dificultad
                </label>
                <select
                  value={form.difficulty_level}
                  onChange={e => setForm({ ...form, difficulty_level: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm bg-white"
                >
                  <option value="basico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                  <Type className="w-4 h-4 text-indigo-500" /> Etiquetas
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const isSelected = form.tags.includes(tag._id)
                    return (
                      <button
                        key={tag._id}
                        type="button"
                        onClick={() => toggleTag(tag._id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                          isSelected 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                  {availableTags.length === 0 && (
                    <span className="text-sm text-slate-400">Cargando...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <LinkIcon className="w-4 h-4 text-indigo-500" /> 
                {form.content_type === 'video' ? 'Enlace de YouTube' : 'URL de la Nube (CDN / Drive)'}
              </label>
              <input
                type="url"
                value={form.cdn_url}
                onChange={e => setForm({ ...form, cdn_url: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                placeholder={
                  form.content_type === 'video'
                    ? 'https://www.youtube.com/watch?v=XyZ...'
                    : 'https://almacen.tuservidor.com/documento.pdf'
                }
              />
              {form.content_type === 'video' && (
                <p className="text-xs font-semibold text-indigo-500/80 mt-1.5 ml-1">
                  * El sistema incrustará automáticamente el reproductor optimizado de YouTube.
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold py-3.5 rounded-xl text-sm transition-colors border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={loading}
                className="flex-[2] bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-indigo-300 disabled:to-indigo-300 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                {loading ? 'Procesando en la Nube...' : 'Publicar Material'}
                {!loading && <UploadCloud className="w-5 h-5" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}