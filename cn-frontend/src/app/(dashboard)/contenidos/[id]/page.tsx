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
  CheckCircle2,
  ShieldCheck,
  MapIcon,
  Award
} from 'lucide-react'

interface Content {
  _id: number
  title: string
  description: string
  body_content?: string
  content_type: string
  duration_seconds: number | null
  status: string
  cdn_url: string
  blob_storage_url: string
  author_id: number
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

interface Assessment {
  _id: string
  title: string
  passing_score: number
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
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [examScore, setExamScore] = useState<number | null>(null)
  
  const [newAssessment, setNewAssessment] = useState({ title: '', passing_score: 80 })
  const [takingExam, setTakingExam] = useState(false)
  const [examResult, setExamResult] = useState<{ score: number, passed: boolean } | null>(null)

  const [authorProfile, setAuthorProfile] = useState<any>(null)
  const [commenterProfiles, setCommenterProfiles] = useState<Record<string, any>>({})
  const [comments, setComments] = useState<Comment[]>([])
  const [myRating, setMyRating] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showForceRating, setShowForceRating] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [id])

  const fetchAll = async () => {
    try {
      const contentRes = await api.get(`/api/contents/${id}`)
      const contentData = contentRes.data?.data || contentRes.data
      setContent(contentData)

      const [commentsRes, ratingsRes, profileRes, assessmentRes] = await Promise.all([
        api.get(`/api/comments/${id}`),
        api.get(`/api/ratings/${id}`),
        api.get(`/api/users/${contentData.author_id}/profile`).catch(() => null),
        api.get(`/api/assessments/content/${id}`).catch(() => null)
      ])

      if (profileRes?.data) setAuthorProfile(profileRes.data)
      if (assessmentRes?.data) setAssessment(assessmentRes.data)

      const commentsData = commentsRes.data?.data || commentsRes.data || []
      setComments(commentsData)
      
      const userIds = Array.from(new Set(commentsData.map((c: any) => c.user_id)))
      if (userIds.length > 0) {
        api.post('/api/users/bulk-profiles', { ids: userIds })
          .then(res => {
            const profilesMap: Record<string, any> = {}
            res.data.forEach((p: any) => {
              profilesMap[p.user_id] = p
            })
            setCommenterProfiles(profilesMap)
          })
          .catch(console.error)
      }

      const ratingData = ratingsRes.data?.data || ratingsRes.data
      if (ratingData) {
        setAvgRating(parseFloat(ratingData.average || 0))
        const myR = ratingData.ratings?.find((r: any) => String(r.user_id) === String(user?.userId))
        if (myR) setMyRating(myR.rating_stars)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssessment.title.trim()) return
    try {
      const res = await api.post('/api/assessments', {
        content_id: id,
        ...newAssessment
      })
      setAssessment(res.data)
      setShowAssessmentForm(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (examScore === null || !assessment) return
    try {
      const res = await api.post(`/api/assessments/${assessment._id}/results`, {
        score: examScore
      })
      setExamResult(res.data)
      setTakingExam(false)
    } catch (err) {
      console.error(err)
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
    setShowForceRating(false)
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

  const handleComplete = async () => {
    try {
      // Registrar que completó el video
      if (content?.duration_seconds) {
        await api.post('/api/progress', {
          content_id: id,
          watched_seconds: content.duration_seconds
        })
      } else {
        // Fallback for PDF or content without duration
        await api.post('/api/progress', {
          content_id: id,
          watched_seconds: 100 // Arbitrary > 0
        })
      }
    } catch (err) {
      console.error('Error saving progress:', err)
    }

    if (myRating === 0) {
      setShowForceRating(true)
    } else {
      alert('¡Clase completada!')
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
                <video controls onEnded={handleComplete} className="w-full h-full object-cover" src={content.cdn_url}>
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

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              Marcar como Completado
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE EXAMEN / EVALUACIÓN */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 p-10 mb-8">
        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
          Evaluación Final
        </h2>

        {/* MODO DOCENTE (Autor) */}
        {user?.userId === content.author_id ? (
          <div>
            {!assessment && !showAssessmentForm ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 font-medium mb-4">No has creado una evaluación para esta clase.</p>
                <button onClick={() => setShowAssessmentForm(true)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                  + Crear Examen Final
                </button>
              </div>
            ) : showAssessmentForm ? (
              <form onSubmit={handleCreateAssessment} className="space-y-4 max-w-md bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Título del Examen</label>
                  <input type="text" required value={newAssessment.title} onChange={e => setNewAssessment({...newAssessment, title: e.target.value})} className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Ej. Quiz sobre React" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calificación Mínima Aprobatoria (%)</label>
                  <input type="number" required min={0} max={100} value={newAssessment.passing_score} onChange={e => setNewAssessment({...newAssessment, passing_score: Number(e.target.value)})} className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAssessmentForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm">Guardar Examen</button>
                </div>
              </form>
            ) : (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-400 text-lg">{assessment?.title}</p>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500 mt-1">El alumno debe sacar {assessment?.passing_score}% para aprobar.</p>
                </div>
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MODO ESTUDIANTE */
          <div>
            {!assessment ? (
              <p className="text-slate-500 italic">El docente no ha asignado un examen para esta clase.</p>
            ) : examResult ? (
              <div className={`p-8 rounded-3xl border text-center ${examResult.passed ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'}`}>
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm ${examResult.passed ? 'bg-white text-emerald-500 dark:bg-slate-900' : 'bg-white text-rose-500 dark:bg-slate-900'}`}>
                  {examResult.passed ? <Award className="w-8 h-8" /> : <PlaySquare className="w-8 h-8" />}
                </div>
                <h3 className={`text-2xl font-black mb-2 ${examResult.passed ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-800 dark:text-rose-400'}`}>
                  {examResult.passed ? '¡Aprobado!' : 'Intenta de nuevo'}
                </h3>
                <p className="text-lg font-medium opacity-80 mb-6">Tu puntuación: <strong>{examResult.score}%</strong></p>
                {!examResult.passed && (
                  <button onClick={() => setExamResult(null)} className="px-6 py-2 bg-white dark:bg-slate-900 border border-current font-bold rounded-xl hover:opacity-80 transition-opacity">Volver a intentar</button>
                )}
              </div>
            ) : takingExam ? (
              <form onSubmit={handleSubmitAssessment} className="p-8 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 rounded-3xl max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 text-center">{assessment.title}</h3>
                <div className="space-y-4 mb-8">
                  <p className="text-sm text-slate-500 font-medium text-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm">
                    Para propósitos de esta demo, ingresa tu puntuación simulada (0-100):
                  </p>
                  <input type="number" required min={0} max={100} value={examScore ?? ''} onChange={e => setExamScore(Number(e.target.value))} className="w-full text-center text-3xl font-black px-4 py-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/20 text-indigo-600 dark:text-indigo-400" placeholder="0 - 100" />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setTakingExam(false)} className="px-6 py-3 font-bold text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</button>
                  <button type="submit" className="flex-1 px-6 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md">Enviar Resultados</button>
                </div>
              </form>
            ) : (
              <div className="p-8 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl flex flex-col items-center text-center">
                <Award className="w-12 h-12 text-indigo-500 mb-4" />
                <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-2">{assessment.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium mb-6 max-w-sm">Demuestra lo que has aprendido. Necesitas un {assessment.passing_score}% para aprobar.</p>
                <button onClick={() => setTakingExam(true)} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  Iniciar Evaluación
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {content.body_content && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 p-10 mb-8">
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            Material de Estudio y Notas
          </h2>
          <div 
            className="editor-content text-slate-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content.body_content }}
          />
          <style jsx>{`
            .editor-content h1 { font-size: 2.25rem; font-weight: 900; margin-bottom: 1.5rem; color: #1e293b; line-height: 1.2; }
            .editor-content h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: 1.25rem; color: #334155; margin-top: 2rem; }
            .editor-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1.5rem; }
            .editor-content li { margin-bottom: 0.5rem; }
            .editor-content a { color: #4f46e5; text-decoration: underline; font-weight: 600; }
            .dark .editor-content h1 { color: #f8fafc; }
            .dark .editor-content h2 { color: #f1f5f9; }
            .dark .editor-content a { color: #818cf8; }
          `}</style>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile & Ratings Column */}
        <div className="md:col-span-1 space-y-6">
          {/* Author Profile */}
          {authorProfile && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
              <h2 className="font-bold text-slate-800 dark:text-white text-lg mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" /> Creador
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-md border-4 border-white dark:border-slate-800">
                  {authorProfile.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white leading-tight">
                    {authorProfile.name || 'Docente'}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                    {authorProfile.country ? (
                      <>
                        <MapIcon className="w-3 h-3" />
                        {authorProfile.country}
                      </>
                    ) : 'Docente Experto'}
                  </p>
                </div>
              </div>
              {authorProfile.bio && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    "{authorProfile.bio}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Ratings Section */}
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
                {comments.map(c => {
                  const profile = commenterProfiles[c.user_id] || {}
                  const name = profile.name || `Estudiante #${c.user_id}`
                  const initial = profile.name ? profile.name[0].toUpperCase() : (String(c.user_id)[0] || 'U')

                  return (
                    <div key={c._id} className="flex gap-4 group">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors shadow-sm">
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{initial}</span>
                      </div>
                      <div className="flex-1 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl rounded-tl-none p-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-800 dark:text-white">{name}</span>
                          {profile.country && (
                            <span className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                              <MapIcon className="w-3 h-3" /> {profile.country}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700 shadow-sm ml-auto">
                            {new Date(c.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric'})}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{c.body}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Force Rating Modal */}
      {showForceRating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">¡Felicidades por terminar!</h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium mb-8">
              Para continuar, por favor califica qué tan útil te pareció este contenido.
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => handleRating(star)}
                  className="transition-transform hover:scale-125 focus:outline-none p-1"
                >
                  <Star className={`w-10 h-10 ${star <= myRating ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-200 dark:text-slate-700'}`} />
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-6">
              Tu opinión es obligatoria
            </p>
          </div>
        </div>
      )}
    </div>
  )
}