'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { 
  UploadCloud, 
  CheckCircle2, 
  FileType, 
  Clock, 
  Type,
  AlignLeft,
  XCircle,
  FileUp,
  File as FileIcon
} from 'lucide-react'

export default function SubirContenidoPage() {
  const { user } = useAuthStore()
  const router   = useRouter()

  const [form, setForm] = useState({
    title           : '',
    description     : '',
    content_type    : 'video',
    duration_seconds: '',
    difficulty_level: 'basico',
    tags            : [] as string[]
  })
  const [file, setFile] = useState<File | null>(null)
  const [availableTags, setAvailableTags] = useState<{_id: string, name: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('content_type', form.content_type)
      if (form.duration_seconds) {
        formData.append('duration_seconds', form.duration_seconds)
      }
      formData.append('difficulty_level', form.difficulty_level)
      formData.append('tags', JSON.stringify(form.tags))
      formData.append('status', 'active')
      if (file) {
        formData.append('file', file)
      }

      const stored = localStorage.getItem('auth-storage')
      let token = ''
      if (stored) {
        try {
           token = JSON.parse(stored).state?.token
        } catch (e) {}
      }

      const baseURL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3002'
      const response = await fetch(`${baseURL}/api/contents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Importante: No setear Content-Type, fetch lo pone automáticamente con el boundary
        },
        body: formData
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al subir el contenido')
      }

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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Publicar Contenido</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Sube un nuevo recurso directamente a Azure para tus estudiantes.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
        {success ? (
          <div className="text-center py-16 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">¡Contenido subido exitosamente!</p>
            <p className="text-slate-500 font-medium mt-2">Guardando en Azure y redirigiendo al catálogo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Type className="w-4 h-4 text-indigo-500" /> Título
              </label>
              <input
                type="text" required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm"
                placeholder="Ej. Introducción a la Inteligencia Artificial"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <AlignLeft className="w-4 h-4 text-indigo-500" /> Descripción
              </label>
              <textarea
                rows={4} required
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm resize-none"
                placeholder="Describe el objetivo y temario de este contenido..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <FileType className="w-4 h-4 text-indigo-500" /> Tipo de Recurso
                </label>
                <select
                  value={form.content_type}
                  onChange={e => setForm({ ...form, content_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                >
                  <option value="video" className="dark:bg-slate-800">Video</option>
                  <option value="pdf" className="dark:bg-slate-800">Documento PDF</option>
                  <option value="texto" className="dark:bg-slate-800">Archivo genérico</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-indigo-500" /> Duración Estimada
                </label>
                <div className="relative">
                  <input
                    type="number" min="0"
                    value={form.duration_seconds}
                    onChange={e => setForm({ ...form, duration_seconds: e.target.value })}
                    className="w-full pr-16 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm"
                    placeholder="Ej. 45"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Type className="w-4 h-4 text-indigo-500" /> Nivel de Dificultad
                </label>
                <select
                  value={form.difficulty_level}
                  onChange={e => setForm({ ...form, difficulty_level: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                >
                  <option value="basico" className="dark:bg-slate-800">Básico</option>
                  <option value="intermedio" className="dark:bg-slate-800">Intermedio</option>
                  <option value="avanzado" className="dark:bg-slate-800">Avanzado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                  {availableTags.length === 0 && (
                    <span className="text-sm text-slate-400 dark:text-slate-500">Cargando...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <FileUp className="w-4 h-4 text-indigo-500" /> 
                Archivo a Subir
              </label>
              
              <div 
                className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer group flex flex-col items-center justify-center text-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-3">
                      <FileIcon className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null) }}
                      className="mt-4 text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
                    >
                      Quitar archivo
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 rounded-xl flex items-center justify-center mb-3 transition-colors">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Haz clic para explorar tus archivos
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 font-medium">
                      Soporta Videos, PDFs y Documentos
                    </p>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold py-3.5 rounded-xl text-sm transition-colors border border-slate-200 dark:border-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={loading || !file}
                className="flex-[2] bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-slate-200 disabled:dark:from-slate-800 disabled:text-slate-400 disabled:dark:text-slate-600 disabled:shadow-none text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                {loading ? 'Subiendo a Azure Blob...' : 'Subir y Publicar'}
                {!loading && <UploadCloud className="w-5 h-5" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}