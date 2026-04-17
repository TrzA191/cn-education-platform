'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import Link from 'next/link'
import { PlayCircle, CheckCircle2, BookOpen, Clock, Play, Map as MapIcon, ChevronLeft, Check } from 'lucide-react'

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
    basico: 'bg-green-50 text-green-700',
    intermedio: 'bg-yellow-50 text-yellow-700',
    avanzado: 'bg-red-50 text-red-700',
  }
  return map[level] || 'bg-gray-100 text-gray-600'
}



  export default function RutaDetallePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuthStore()

  const [path, setPath] = useState<PathDetail | null>(null)
  const [contents, setContents] = useState<PathContent[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)

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
    <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a rutas
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Información de la Ruta (Sidebar) */}
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
                  {Math.round(contents.reduce((acc, curr) => acc + (curr.content?.duration_seconds || 0), 0) / 60)} min
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
                {enrolling ? 'Inscribiendo...' : 'Inscribirme para empezar'}
              </button>
            )}
          </div>
        </div>

        {/* Columna Derecha: Timeline de Contenidos */}
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
                  // Lógica visual básica
                  const isCompleted = false;
                  const isCurrent = enrolled ? index === 0 : false;

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
                        isCurrent ? 'border-indigo-200 bg-indigo-50/30 shadow-md shadow-indigo-500/5' : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            {item.content ? (
                              <>
                                <h3 className={`text-base font-bold mb-1 ${isCurrent ? 'text-indigo-900' : 'text-slate-800'}`}>
                                  {item.content.title}
                                </h3>
                                <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                  <span className="uppercase tracking-wider">{item.content.content_type}</span>
                                  {item.content.duration_seconds && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {Math.round(item.content.duration_seconds / 60)} min
                                      </span>
                                    </>
                                  )}
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-slate-500 font-medium">Contenido #{item.content_id}</p>
                            )}
                          </div>
                          
                          <Link
                            href={`/contenidos/${item.content_id}`}
                            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                              isCurrent 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Play className="w-4 h-4 ml-0.5" />
                          </Link>
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
  )
}