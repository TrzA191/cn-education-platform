'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  FileText, 
  Video, 
  PlaySquare,
  MessageSquare,
  Send,
  CheckCircle2
} from 'lucide-react'

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-[400px] bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-in fade-in">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <PlaySquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-xl font-bold text-slate-800 dark:text-white">Contenido no encontrado</p>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">El material que buscas fue movido o eliminado.</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
          Regresar al Catálogo
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors group"
      >
        <div className="p-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 shadow-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Volver a mis cursos
      </button>

      {/* Main Content Player Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
        
        {/* Header Info */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center gap-1.5 text-xs bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-md font-bold uppercase tracking-wider">
                  {content.content_type === 'video' ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  {content.content_type}
                </span>
                {content.duration_seconds && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-100 dark:border-slate-700">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(content.duration_seconds)}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{content.title}</h1>
            </div>
            {avgRating > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0 bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="font-bold text-amber-700 dark:text-amber-400 text-lg">{avgRating}</span>
              </div>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-3xl">{content.description}</p>
        </div>

        {/* Video / Content Viewer */}
        <div className="p-8 bg-slate-50/50 dark:bg-slate-950/20">
          {content.cdn_url && content.content_type === 'video' && (
            <div className="rounded-2xl overflow-hidden bg-black shadow-xl border-4 border-slate-900" style={{ aspectRatio: '16/9' }}>
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
                <video controls className="w-full h-full object-cover" src={content.cdn_url}>
                  Tu navegador no soporta video HTML5.
                </video>
              )}
            </div>
          )}

          {content.cdn_url && content.content_type === 'pdf' && (
            <a href={content.cdn_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center">
                  <FileText className="w-7 h-7 text-rose-500 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-rose-900 dark:text-rose-200 group-hover:text-rose-700 dark:group-hover:text-rose-100 transition-colors">Abrir Documento PDF</p>
                  <p className="text-sm font-medium text-rose-500/80 truncate max-w-sm mt-0.5">{content.cdn_url}</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-rose-200/50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center group-hover:bg-rose-600 dark:group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5 rotate-135" style={{transform: "rotate(135deg)"}} />
              </div>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Ratings Section */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sticky top-28">
            <h2 className="font-bold text-slate-800 dark:text-white text-lg mb-1">Tu Valoración</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">¿Te sirvió este material?</p>
            <div className="flex gap-1.5 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => handleRating(star)}
                  className="transition-transform hover:scale-125 focus:outline-none">
                  <Star className={`w-8 h-8 ${star <= myRating ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-200 dark:text-slate-700'}`} />
                </button>
              ))}
            </div>
            {myRating > 0 && (
              <div className="mt-4 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">¡Gracias por calificar {myRating}/5!</span>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" /> Conversación
              </h2>
              <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
                {comments.length}
              </span>
            </div>
            
            <form onSubmit={handleComment} className="mb-10 relative">
              <div className="absolute top-4 left-4">
                <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs ring-4 ring-white shadow-sm">
                  {user?.email?.[0].toUpperCase() || '?'}
                </div>
              </div>
              <textarea rows={3} value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Añade un comentario a la clase..."
                className="w-full pl-16 pr-5 py-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white transition-all shadow-sm placeholder-slate-400 dark:placeholder-slate-500"
              />
              <div className="flex justify-end mt-3">
                <button type="submit" disabled={sending || !newComment.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-md flex items-center gap-2">
                  {sending ? 'Posteando...' : 'Comentar'}
                  {!sending && <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>

            {comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Aún no hay comentarios. Inicia la discusión.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map(c => (
                  <div key={c._id} className="flex gap-4 group">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{String(c.user_id)[0] || 'U'}</span>
                    </div>
                    <div className="flex-1 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl rounded-tl-none p-4 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">Estudiante #{c.user_id}</span>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700 shadow-sm">
                          {new Date(c.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric'})}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}