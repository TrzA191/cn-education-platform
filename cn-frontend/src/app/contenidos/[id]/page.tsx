'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'

interface Content {
  _id: number
  title: string
  description: string
  content_type: string
  duration_seconds: number | null
  status: string
  cdn_url: string
  blob_storage_url: string
}

interface Comment {
  _id: number
  user_id: number
  body: string
  created_at: string
}

interface Rating {
  rating_stars: number
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}min`
  return `${m} min`
}

function getYouTubeId(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  )
  return match ? match[1] : ''
}
export default function ContenidoDetallePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuthStore()

  const [content, setContent] = useState<Content | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [myRating, setMyRating] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [id])

  const fetchAll = async () => {
    try {
      const [contentRes, commentsRes, ratingsRes] = await Promise.all([
        api.get(`/api/contents/${id}`),
        api.get(`/api/comments/${id}`),
        api.get(`/api/ratings/${id}`),
      ])
      setContent(contentRes.data?.data || contentRes.data)
      setComments(commentsRes.data?.data || commentsRes.data || [])
      const ratings: Rating[] = ratingsRes.data?.data || ratingsRes.data || []
      if (ratings.length > 0) {
        const avg = ratings.reduce((a, r) => a + r.rating_stars, 0) / ratings.length
        setAvgRating(Math.round(avg * 10) / 10)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSending(true)
    try {
      await api.post('/api/comments', {
        content_id: id,
        user_id: user?.userId,
        body: newComment,
      })
      setNewComment('')
      fetchAll()
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleRating = async (stars: number) => {
    setMyRating(stars)
    try {
      await api.post('/api/ratings', {
        content_id: id,
        user_id: user?.userId,
        rating_stars: stars,
      })
      fetchAll()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Contenido no encontrado</p>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 text-sm">
          ← Volver
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver al catálogo
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium capitalize">
                {content.content_type}
              </span>
              {content.duration_seconds && (
                <span className="text-xs text-gray-400">
                  {formatDuration(content.duration_seconds)}
                </span>
              )}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${content.status === 'active' || content.status === 'activo'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-500'
                }`}>
                {content.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
          </div>
          {avgRating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-yellow-400 text-lg">★</span>
              <span className="font-bold text-gray-900">{avgRating}</span>
            </div>
          )}
        </div>

        <p className="text-gray-600 mb-6">{content.description}</p>

        {/* Visor de contenido adaptado para YouTube con aspecto 16:9 */}
        {content.cdn_url && content.content_type === 'video' && (
          <div className="rounded-xl overflow-hidden bg-black mb-4" style={{ aspectRatio: '16/9' }}>
            {content.cdn_url.includes('youtube.com') || content.cdn_url.includes('youtu.be') ? (
              <iframe
                width="100%"
                height="100%"
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${getYouTubeId(content.cdn_url)}`}
                title="Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video controls className="w-full" src={content.cdn_url}>
                Tu navegador no soporta video HTML5.
              </video>
            )}
          </div>
        )}

        {content.cdn_url && content.content_type === 'pdf' && (
          <a href={content.cdn_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Abrir PDF</p>
              <p className="text-xs text-gray-500 truncate">{content.cdn_url}</p>
            </div>
          </a>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Califica este contenido</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} onClick={() => handleRating(star)}
              className={`text-3xl transition-transform hover:scale-110 ${star <= myRating ? 'text-yellow-400' : 'text-gray-200'
                }`}>★</button>
          ))}
          {myRating > 0 && (
            <span className="ml-2 text-sm text-gray-500 self-center">
              Calificaste con {myRating} estrella{myRating > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Comentarios
          <span className="ml-2 text-sm font-normal text-gray-400">({comments.length})</span>
        </h2>
        <form onSubmit={handleComment} className="mb-6">
          <textarea rows={3} value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
          />
          <div className="flex justify-end">
            <button type="submit" disabled={sending || !newComment.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors">
              {sending ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
        </form>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sé el primero en comentar</p>
        ) : (
          <div className="space-y-4">
            {comments.map(c => (
              <div key={c._id} className="flex gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600">{String(c.user_id)[0]}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">Usuario {c.user_id}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}