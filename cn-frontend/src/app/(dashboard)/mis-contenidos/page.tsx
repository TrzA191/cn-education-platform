'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
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
  X,
  Edit
} from 'lucide-react'

interface Content {
  _id: string
  title: string
  description?: string
  content_type: 'video' | 'pdf' | 'texto'
  difficulty_level?: 'basico' | 'intermedio' | 'avanzado'
  duration_seconds?: number
  average_rating?: number
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

export default function MisContenidosPage() {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')
  const { user } = useAuthStore()

  const fetchContents = async (searchTerm?: string) => {
    const finalSearch = searchTerm !== undefined ? searchTerm : search
    
    try {
      const params = new URLSearchParams()
      if (finalSearch) params.append('title', finalSearch)
      if (difficultyFilter) params.append('difficulty_level', difficultyFilter)
      if (user?.userId) params.append('author_id', user.userId.toString())

      const res = await api.get(`/api/contents?${params.toString()}`)
      setContents(res.data?.data || res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.userId) {
      fetchContents()
    }
  }, [difficultyFilter, user?.userId])

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    fetchContents()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Mis Contenidos</h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">Administra, edita y actualiza tus recursos educativos publicados.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
          <BookOpen className="w-4 h-4" />
          <span>{contents.length} Contenidos propios</span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
          
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar mis contenidos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-13 pr-4 h-[58px] bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
            />
            {search && (
              <button 
                type="button" 
                onClick={() => { setSearch(''); fetchContents(''); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="w-full md:w-64 relative group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full pl-13 pr-4 h-[58px] bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-800 dark:text-white font-medium appearance-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
            >
              <option value="">Todas las dificultades</option>
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>
          
          <button 
            type="submit"
            className="h-[58px] px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-indigo-600/20 whitespace-nowrap"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Grid Section */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-[32px] p-8 h-[380px] animate-pulse border border-slate-100 dark:border-slate-800">
              <div className="flex gap-2 mb-6">
                <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                <div className="w-16 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              </div>
              <div className="h-6 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4"></div>
              <div className="h-6 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8"></div>
              <div className="h-20 bg-slate-50 dark:bg-slate-800 rounded-xl mt-auto"></div>
            </div>
          ))}
        </div>
      ) : contents.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white dark:bg-slate-900 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No has subido contenidos aún</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">Tus contenidos aparecerán aquí para que puedas editarlos.</p>
          <Link href="/subir" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700">
            Ir a Subir Contenido <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {contents.map((content) => (
            <div 
              key={content._id} 
              className="group bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 flex flex-col h-[400px]"
            >
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
                  <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {formatDuration(content.duration_seconds) || '0 min'}
                      </span>
                    </div>
                    {(content.average_rating ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-xs font-bold uppercase tracking-wider">{content.average_rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <Link 
                    href={`/editar-contenido/${content._id}`}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-indigo-700 dark:text-indigo-300 hover:text-white font-bold text-xs rounded-xl transition-all group/btn"
                  >
                    Editar
                    <Edit className="w-3 h-3 transform group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
