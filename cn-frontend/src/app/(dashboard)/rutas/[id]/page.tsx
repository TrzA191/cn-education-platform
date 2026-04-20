'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import {
  PlayCircle, CheckCircle2, BookOpen, Clock, Play, Map as MapIcon,
  ChevronLeft, Check, X, FileText, Video, Loader2, Star, Send, MessageSquare
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface PathDetail {
  _id: number
  title: string
  description: string
  difficulty_level: string
  is_system_generated: boolean
  created_at: string
}

interface PathContent {
  _id: string
  sequence_order: number
  content_id: {
    _id: string
    title: string
    content_type: string
    duration_seconds: number | null
  }
}

interface FullContent {
  _id: string
  title: string
  description: string
  content_type: string
  duration_seconds: number | null
  cdn_url: string
}

interface Comment {
  _id: string
  user_id: string
  body: string
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function difficultyColor(level: string) {
  const map: Record<string, string> = {
    basico: 'bg-green-50 text-green-700',
    intermedio: 'bg-yellow-50 text-yellow-700',
    avanzado: 'bg-red-50 text-red-700',
  }
  return map[level] || 'bg-gray-100 text-gray-600'
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}min`
  return `${m} min`
}

function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? match[1] : ''
}

// ── Inline Content Viewer Panel ───────────────────────────────────────────────

function ContentViewer({
  contentId,
  onClose,
}: {
  contentId: string
  onClose: () => void
}) {
  const { user } = useAuthStore()
  const [content, setContent] = useState<FullContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [myRating, setMyRating] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [contentRes, commentsRes, ratingsRes] = await Promise.all([
          api.get(`/api/contents/${contentId}`),
          api.get(`/api/comments/${contentId}`),
          api.get(`/api/ratings/${contentId}`),
        ])
        setContent(contentRes.data?.data || contentRes.data)
        setComments(commentsRes.data?.data || commentsRes.data || [])
        const ratings: { rating_stars: number }[] = ratingsRes.data?.data || ratingsRes.data || []
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
    fetchData()
  }, [contentId])

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSending(true)
    try {
      await api.post('/api/comments', {
        content_id: contentId,
        user_id: user?.userId,
        body: newComment,
      })
      setNewComment('')
      const res = await api.get(`/api/comments/${contentId}`)
      setComments(res.data?.data || res.data || [])
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
        content_id: contentId,
        user_id: user?.userId,
        rating_stars: stars,
      })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div className="bg-white w-full sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-w-3xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-5 w-40 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <>
                <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-bold uppercase tracking-wider border ${
                  content?.content_type === 'video'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {content?.content_type === 'video'
                    ? <Video className="w-3.5 h-3.5" />
                    : <FileText className="w-3.5 h-3.5" />
                  }
                  {content?.content_type}
                </span>
                <h2 className="text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">{content?.title}</h2>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 space-y-4">
              <div className="aspect-video bg-slate-100 rounded-2xl animate-pulse" />
              <div className="h-4 w-3/4 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ) : !content ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-slate-400 font-medium">Contenido no disponible</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Video player */}
              {content.cdn_url && content.content_type === 'video' && (
                <div className="rounded-2xl overflow-hidden bg-black shadow-xl border-4 border-slate-900" style={{ aspectRatio: '16/9' }}>
                  {content.cdn_url.includes('youtube.com') || content.cdn_url.includes('youtu.be') ? (
                    <iframe
                      width="100%"
                      height="100%"
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${getYouTubeId(content.cdn_url)}?autoplay=1`}
                      title={content.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video controls autoPlay className="w-full h-full object-cover" src={content.cdn_url}>
                      Tu navegador no soporta video HTML5.
                    </video>
                  )}
                </div>
              )}

              {/* PDF */}
              {content.cdn_url && content.content_type === 'pdf' && (
                <a
                  href={content.cdn_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all group"
                >
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <FileText className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-bold text-rose-900">Abrir documento PDF</p>
                    <p className="text-xs text-rose-400 truncate max-w-sm mt-0.5">{content.cdn_url}</p>
                  </div>
                </a>
              )}

              {/* Description */}
              {content.description && (
                <p className="text-slate-600 text-sm leading-relaxed">{content.description}</p>
              )}

              {/* Rating + avg */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tu valoración</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => handleRating(star)} className="transition-transform hover:scale-125">
                        <Star className={`w-7 h-7 ${star <= myRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                  {myRating > 0 && (
                    <p className="text-xs text-emerald-600 font-bold mt-1.5">¡Gracias por calificar {myRating}/5!</p>
                  )}
                </div>
                {avgRating > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-amber-700 text-lg">{avgRating}</span>
                    <span className="text-xs text-amber-500 font-medium">promedio</span>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" /> Comentarios
                  </h3>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{comments.length}</span>
                </div>

                <form onSubmit={handleComment} className="mb-6 relative">
                  <div className="absolute top-3 left-3">
                    <div className="w-7 h-7 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {user?.email?.[0].toUpperCase() || '?'}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Añade un comentario..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none bg-white transition-all"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={sending || !newComment.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Comentar
                    </button>
                  </div>
                </form>

                {comments.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4">Sé el primero en comentar</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map(c => (
                      <div key={c._id} className="flex gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-slate-500">{String(c.user_id)[0] || 'U'}</span>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-xl rounded-tl-none p-3 border border-slate-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-700">Usuario #{c.user_id}</span>
                            <span className="text-xs text-slate-400">
                              {new Date(c.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RutaDetallePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuthStore()

  const [path, setPath] = useState<PathDetail | null>(null)
  const [contents, setContents] = useState<PathContent[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)

  // Viewer inline
  const [activeContentId, setActiveContentId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const res = await api.get(`/api/paths/${id}`)
      const data = res.data?.data || res.data
      setPath(data.path || data)
      setContents(data.contents || [])

      try {
        const enrollRes = await api.get('/api/progress/enrollments')
        const enrollments = enrollRes.data || []
        const isEnrolled = enrollments.some(
          (e: any) => e.path_id?._id === id || e.path_id === id
        )
        setEnrolled(isEnrolled)
      } catch {
        // si falla no bloquea la página
      }
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
    <>
      <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a rutas
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm sticky top-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <MapIcon className="w-6 h-6" />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${difficultyColor(path.difficulty_level)}`}>
                  {path.difficulty_level}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-3">{path.title}</h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">{path.description}</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <BookOpen className="w-4 h-4" />
                    Módulos
                  </div>
                  <span className="font-semibold text-slate-900">{contents.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4" />
                    Tiempo est.
                  </div>
                  <span className="font-semibold text-slate-900">
                    {Math.round(contents.reduce((acc, curr) => acc + (curr.content_id?.duration_seconds || 0), 0) / 60)} min
                  </span>
                </div>
              </div>

              {enrolled ? (
                <div className="w-full">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500 font-medium">Progreso</span>
                    <span className="text-indigo-600 font-bold">Inscrito</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">Continúa con el primer módulo</p>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-indigo-500/20"
                >
                  {enrolling
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando...</>
                    : <><PlayCircle className="w-4 h-4" /> Empezar</>
                  }
                </button>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm h-full">
              <h2 className="text-xl font-bold text-slate-900 mb-8">Contenido de la ruta</h2>

              {contents.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">Esta ruta no tiene contenidos asignados aún</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-0 md:before:translate-x-0 md:before:left-6 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-slate-200 before:to-transparent">
                  {contents.map((item, index) => {
                    const isCompleted = false
                    const isCurrent = enrolled ? index === 0 : false
                    const contentId = item.content_id?._id || String(item.content_id)

                    return (
                      <div key={item._id} className="relative flex items-start gap-6 group">
                        {/* Timeline Node */}
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-sm shrink-0 z-10 transition-colors ${
                          isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-500'}`}>{index + 1}</span>
                          )}
                        </div>

                        {/* Content Card */}
                        <div className={`flex-1 p-5 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'border-indigo-200 bg-indigo-50/30 shadow-md shadow-indigo-500/5'
                            : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              {item.content_id ? (
                                <>
                                  <h3 className={`text-base font-bold mb-1 ${isCurrent ? 'text-indigo-900' : 'text-slate-800'}`}>
                                    {item.content_id.title}
                                  </h3>
                                  <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                    <span className="uppercase tracking-wider">{item.content_id.content_type}</span>
                                    {item.content_id.duration_seconds && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {formatDuration(item.content_id.duration_seconds)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm text-slate-500 font-medium">Contenido sin título</p>
                              )}
                            </div>

                            {/* Botón Play inline — sin navegación */}
                            {contentId && (
                              <button
                                onClick={() => setActiveContentId(contentId)}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                  isCurrent
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 border border-transparent'
                                }`}
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                Ver
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Content Viewer */}
      {activeContentId && (
        <ContentViewer
          contentId={activeContentId}
          onClose={() => setActiveContentId(null)}
        />
      )}
    </>
  )
}