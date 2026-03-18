'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function SubirContenidoPage() {
  const { user, loadFromStorage } = useAuthStore()
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    description: '',
    content_type: 'video',
    blob_storage_url: '',
    cdn_url: '',
    duration_seconds: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/contents', {
        ...form,
        author_id: user?.userId,
        duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : null,
        status: 'activo',
      })
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/contenidos'), 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al subir el contenido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subir contenido</h1>
        <p className="text-gray-500 mt-1">Agrega un nuevo recurso educativo a la plataforma</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {success ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">¡Contenido subido correctamente!</p>
            <p className="text-sm text-gray-500 mt-1">Redirigiendo al catálogo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text" required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nombre del contenido"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                rows={3} required
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Describe el contenido educativo..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.content_type}
                  onChange={e => setForm({ ...form, content_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="texto">Texto</option>
                  <option value="presentacion">Presentación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (segundos)
                </label>
                <input
                  type="number" min="0"
                  value={form.duration_seconds}
                  onChange={e => setForm({ ...form, duration_seconds: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Solo para video"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de almacenamiento</label>
              <input
                type="url" required
                value={form.blob_storage_url}
                onChange={e => setForm({ ...form, blob_storage_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://storage.example.com/archivo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL CDN</label>
              <input
                type="url"
                value={form.cdn_url}
                onChange={e => setForm({ ...form, cdn_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://cdn.example.com/archivo (opcional)"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {loading ? 'Subiendo...' : 'Subir contenido'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}