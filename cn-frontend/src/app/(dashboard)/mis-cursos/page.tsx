'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import { BookOpen, Route, Loader2, PlayCircle, ChevronRight } from 'lucide-react'

import { useAuthStore } from '@/store/auth.store'

interface ProgressItem {
  _id: string
  content_id: {
    _id: string
    title: string
    description: string
    content_type: string
    difficulty_level: string
    duration_seconds: number
  }
  completion_percentage: number
  is_completed: boolean
  last_watched_at: string
}

function difficultyColor(level: string) {
  const map: Record<string, string> = {
    basico    : 'bg-green-50 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    intermedio: 'bg-yellow-50 text-yellow-700 dark:bg-amber-500/10 dark:text-amber-400',
    avanzado  : 'bg-red-50 text-red-700 dark:bg-rose-500/10 dark:text-rose-400',
  }
  return map[level] || 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
}

export default function MisCursosPage() {
  const [courses, setCourses] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  const fetchCourses = async () => {
    if (!user?.userId) return
    setLoading(true)
    try {
      const res = await api.get(`/api/progress/${user.userId}`)
      // filter out items where content_id is null in case of deleted contents
      const validCourses = (res.data || []).filter((item: any) => item.content_id)
      setCourses(validCourses)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.userId) fetchCourses()
  }, [user?.userId])

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mis Cursos</h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">Sigue aprendiendo. Aquí están todas las rutas en las que estás inscrito.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white dark:bg-slate-900 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No has empezado ningún contenido</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">Explora el catálogo y comienza a aprender un tema específico.</p>
          <Link href="/contenidos" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700">
            Explorar Catálogo <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((e) => {
            const content = e.content_id
            if (!content) return null;
            return (
              <div
                key={e._id}
                className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl shadow-slate-100 dark:shadow-none flex flex-col"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                      {content.content_type}
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${difficultyColor(content.difficulty_level || 'basico')}`}>
                      {content.difficulty_level || 'basico'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">{content.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 line-clamp-2 leading-relaxed">{content.description}</p>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      <span>Progreso</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{Math.round(e.completion_percentage || 0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-1000" 
                        style={{ width: `${Math.round(e.completion_percentage || 0)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                  <Link
                    href={`/contenidos/${content._id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
                  >
                    <PlayCircle className="w-5 h-5" />
                    {e.completion_percentage >= 90 ? 'Volver a ver' : 'Continuar Aprendiendo'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}