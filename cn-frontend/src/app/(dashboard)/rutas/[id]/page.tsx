'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import Link from 'next/link'

interface PathDetail {
  _id: number
  title: string
  description: string
  difficulty_level: string
  is_system_generated: boolean
  created_at: string
}

interface PathContent {
  _id: number
  sequence_order: number
  content_id: number
  content?: {
    title: string
    content_type: string
    duration_seconds: number | null
  }
}

function difficultyColor(level: string) {
  const map: Record<string, string> = {
    basico:     'bg-green-50 text-green-700',
    intermedio: 'bg-yellow-50 text-yellow-700',
    avanzado:   'bg-red-50 text-red-700',
  }
  return map[level] || 'bg-gray-100 text-gray-600'
}

export default function RutaDetallePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuthStore()

  const [path, setPath]         = useState<PathDetail | null>(null)
  const [contents, setContents] = useState<PathContent[]>([])
  const [loading, setLoading]   = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled]   = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const res = await api.get(`/api/paths/${id}`)
      const data = res.data?.data || res.data
      setPath(data)
      setContents(data?.contents || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      await api.post('/api/progress/enroll', {
        user_id: user?.userId,
        path_id: Number(id),
      })
      setEnrolled(true)
    } catch (err) {
      console.error(err)
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!path) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Ruta no encontrada</p>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 text-sm">← Volver</button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a rutas
      </button>

      {/* Header de la ruta */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${difficultyColor(path.difficulty_level)}`}>
                {path.difficulty_level}
              </span>
              {path.is_system_generated && (
                <span className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full font-medium">
                  🤖 Generada automáticamente
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{path.title}</h1>
            <p className="text-gray-600">{path.description}</p>
          </div>

          {enrolled ? (
            <div className="flex-shrink-0 bg-green-50 text-green-700 text-sm font-medium px-5 py-2.5 rounded-xl">
              ✓ Inscrito
            </div>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              {enrolling ? 'Inscribiendo...' : 'Inscribirse'}
            </button>
          )}
        </div>
      </div>

      {/* Contenidos de la ruta */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Contenidos de la ruta
          <span className="ml-2 text-sm font-normal text-gray-400">({contents.length} recursos)</span>
        </h2>

        {contents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Esta ruta no tiene contenidos asignados aún</p>
        ) : (
          <div className="space-y-3">
            {contents.map((item, index) => (
              <div key={item._id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {item.content ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{item.content.title}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {item.content.content_type}
                        {item.content.duration_seconds
                          ? ` · ${Math.round(item.content.duration_seconds / 60)} min`
                          : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Contenido #{item.content_id}</p>
                  )}
                </div>
                <Link
                  href={`/dashboard/contenidos/${item.content_id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex-shrink-0"
                >
                  Ver →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}