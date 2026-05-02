'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  Video, 
  FileText, 
  Type, 
  BookOpen, 
  Clock, 
  Star,
  ChevronRight,
  PlayCircle,
  Loader2,
  X
} from 'lucide-react'

interface Content {
  _id: string
  title: string
  description?: string
  content_type: 'video' | 'pdf' | 'texto'
  difficulty_level?: 'basico' | 'intermedio' | 'avanzado'
  duration_seconds?: number
  created_at: string
}

function difficultyColor(level: string) {
  const map: Record<string, string> = {
    basico: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    intermedio: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    avanzado: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  }
  return map[level] || 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
}

function ContentIcon({ type, className }: { type: string, className?: string }) {
  switch (type) {
    case 'video': return <Video className={className} />
    case 'pdf': return <FileText className={className} />
    case 'texto': return <Type className={className} />
    default: return <BookOpen className={className} />
  }
}

function formatDuration(seconds?: number) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

export default function ContenidosPage() {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')

  const fetchContents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('title', search)
      if (typeFilter) params.append('content_type', typeFilter)
      if (difficultyFilter) params.append('difficulty_level', difficultyFilter)

      const res = await api.get(`/api/contents?${params.toString()}`)
      setContents(res.data?.data || res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContents()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, typeFilter, difficultyFilter])

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Catálogo de Contenidos</h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">Explora nuestra biblioteca de recursos multimedia y potencia tu aprendizaje.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
          <BookOpen className="w-4 h-4" />
          <span>{contents.length} Recursos disponibles</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título del contenido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-3xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Group */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-widest">Tipo</span>
            {[
              { id: '', label: 'Todos' },
              { id: 'video', label: 'Videos' },
              { id: 'pdf', label: 'PDFs' },
              { id: 'texto', label: 'Lecturas' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  typeFilter === t.id 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-widest">Nivel</span>
            {[
              { id: '', label: 'Todos' },
              { id: 'basico', label: 'Básico' },
              { id: 'intermedio', label: 'Inter' },
              { id: 'avanzado', label: 'Pro' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficultyFilter(d.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  difficultyFilter === d.id 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Section */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-[420px] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 animate-pulse overflow-hidden">
               <div className="h-48 bg-slate-50 dark:bg-slate-800/50" />
               <div className="p-8 space-y-4">
                 <div className="h-6 w-3/4 bg-slate-50 dark:bg-slate-800/50 rounded-lg" />
                 <div className="h-20 w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg" />
                 <div className="flex gap-2">
                    <div className="h-8 w-20 bg-slate-50 rounded-lg" />
                    <div className="h-8 w-20 bg-slate-50 rounded-lg" />
                 </div>
               </div>
            </div>
          ))}
        </div>
      ) : contents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 rounded-full flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">No encontramos resultados</h3>
          <p className="text-slate-600 dark:text-slate-300 font-medium mt-2 mb-8">Intenta ajustar los filtros o buscar con otros términos.</p>
          <button 
            onClick={() => { setSearch(''); setTypeFilter(''); setDifficultyFilter('') }}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {contents.map((content) => (
            <div 
              key={content._id}
              className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] dark:hover:shadow-none overflow-hidden flex flex-col"
            >
              {/* Card Image Placeholder / Pattern */}
              <div className={`h-48 relative overflow-hidden flex items-center justify-center ${
                content.content_type === 'video' ? 'bg-slate-900' : 
                content.content_type === 'pdf' ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-indigo-50 dark:bg-indigo-500/10'
              }`}>
                {/* Decorative background */}
                <div className="absolute inset-0 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400 rounded-full blur-3xl" />
                </div>

                <div className={`p-6 rounded-3xl shadow-2xl transform group-hover:scale-110 transition-transform duration-500 ${
                  content.content_type === 'video' ? 'bg-white/10 text-white backdrop-blur-md' : 
                  content.content_type === 'pdf' ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  <ContentIcon type={content.content_type} className="w-10 h-10" />
                </div>

                {content.content_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <PlayCircle className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${difficultyColor(content.difficulty_level || '')}`}>
                    {content.difficulty_level || 'General'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <ContentIcon type={content.content_type} className="w-3 h-3" />
                    {content.content_type}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">
                  {content.title}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-300 text-sm font-medium line-clamp-3 mb-6 leading-relaxed">
                  {content.description || 'Sin descripción disponible para este recurso educativo.'}
                </p>

                <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {formatDuration(content.duration_seconds) || '0 min'}
                    </span>
                  </div>
                  
                  <Link 
                    href={`/contenidos/${content._id}`}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-slate-700 dark:text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all group/btn"
                  >
                    Ver Ahora
                    <ChevronRight className="w-3 h-3 transform group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom CTA or Info */}
      {!loading && contents.length > 0 && (
        <div className="mt-12 p-8 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="z-10">
            <h4 className="text-2xl font-bold mb-2">¿No encuentras lo que buscas?</h4>
            <p className="text-indigo-200/80 font-medium">Nuestro equipo sube contenido nuevo todas las semanas. ¡Mantente atento!</p>
          </div>
          <Link 
            href="/perfil"
            className="z-10 px-8 py-4 bg-white text-indigo-900 font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-xl shadow-black/20"
          >
            Configurar mis intereses
          </Link>
        </div>
      )}
    </div>
  )
}
