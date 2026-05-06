'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { 
  BarChart3, 
  Users, 
  Star, 
  MessageSquare, 
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react'

interface Content {
  _id: string
  title: string
  average_rating: number
  created_at: string
}

interface AssessmentResult {
  _id: string
  user_id: number
  user_name?: string
  score: number
  passed: boolean
  taken_at: string
  assessment_title: string
  content_title: string
}

export default function MetricasDocentePage() {
  const { user } = useAuthStore()
  const [contents, setContents] = useState<Content[]>([])
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.userId) {
      const fetchMetrics = async () => {
        try {
          const contentsRes = await api.get(`/api/contents?author_id=${user.userId}`)
          setContents(contentsRes.data?.data || contentsRes.data || [])

          const resultsRes = await api.get('/api/assessments/teacher-results')
          let results = resultsRes.data || []
          
          if (results.length > 0) {
            // Obtener nombres de los alumnos
            const userIds = [...new Set(results.map((r: any) => r.user_id))]
            const profilesRes = await api.post('/api/users/bulk-profiles', { ids: userIds })
            const profilesMap = new Map(profilesRes.data.map((p: any) => [p.user_id || p.id, p.name || p.email]))
            
            results = results.map((r: any) => ({
              ...r,
              user_name: profilesMap.get(r.user_id) || `Estudiante #${r.user_id}`
            }))
          }
          setAssessmentResults(results)
        } catch (err) {
          console.error("Error fetching metrics", err)
        } finally {
          setLoading(false)
        }
      }
      fetchMetrics()
    }
  }, [user?.userId])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-3xl" />)}
        </div>
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
      </div>
    )
  }

  // Cálculos simulados para demostración basados en la cantidad de contenidos reales
  const totalContents = contents.length
  const globalRating = contents.reduce((acc, curr) => acc + (curr.average_rating || 0), 0) / (totalContents || 1)
  const totalViews = totalContents * Math.floor(Math.random() * 50 + 20) // Mock
  const totalComments = totalContents * Math.floor(Math.random() * 15 + 5) // Mock

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          Rendimiento y Métricas
        </h1>
        <p className="text-slate-500 font-medium mt-2">Monitorea el impacto de tu contenido en la comunidad estudiantil.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <Users className="w-8 h-8 text-blue-500 mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Vistas Totales</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              {totalViews} <TrendingUp className="w-5 h-5 text-emerald-500" />
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 dark:bg-amber-500/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <Star className="w-8 h-8 text-amber-500 mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Calificación Global</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              {globalRating.toFixed(1)} / 5
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <MessageSquare className="w-8 h-8 text-emerald-500 mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Comentarios</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              {totalComments}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 dark:bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <BookOpen className="w-8 h-8 text-purple-500 mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Clases Activas</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              {totalContents}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Rendimiento por clase */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col max-h-[600px]">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 shrink-0">Rendimiento por Clase</h2>
          {contents.length === 0 ? (
            <p className="text-slate-500">No tienes contenidos subidos aún.</p>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-2 pb-2">
              {contents.map((c, i) => (
                <div key={c._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Subido el {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Vistas</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{Math.floor(Math.random() * 100) + 10}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Rating</p>
                      <div className="flex items-center gap-1 font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" /> {c.average_rating || '5.0'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resultados de exámenes simulados */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col max-h-[600px]">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 shrink-0">
            <Award className="w-5 h-5 text-indigo-500" /> Resultados Recientes
          </h2>
          <div className="space-y-5 overflow-y-auto pr-2 pb-2 flex-1">
            {assessmentResults.length === 0 ? (
              <p className="text-sm text-slate-500">Aún no hay resultados de evaluaciones.</p>
            ) : (
              assessmentResults.map((result, i) => {
                const dateStr = new Date(result.taken_at).toLocaleDateString()
                return (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                      {result.user_name?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{result.user_name || 'Usuario Anónimo'}</p>
                      <p className="text-xs text-slate-500 truncate">{result.content_title} • {dateStr}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-black shrink-0 ${
                      result.score >= 90 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                      result.score >= 70 ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                      'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}>
                      {result.score}%
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <button className="w-full mt-6 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-colors shrink-0">
            Descargar Reporte (CSV)
          </button>
        </div>

      </div>
    </div>
  )
}
