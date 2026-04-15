'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import Link from 'next/link'
import { 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  FileText,
  Video,
  FileBox,
  Map as MapIcon,
  ChevronRight
} from 'lucide-react'

interface Tag {
  _id: string
  name: string
  category: string
}

interface Content {
  _id: string
  title: string
  content_type: string
  duration_seconds: number | null
  status: string
}

interface Path {
  _id: string
  title: string
  difficulty_level: string
  is_system_generated: boolean
}

function StatCard({ label, value, icon, gradient }: {
  label: string
  value: string | number
  icon: React.ReactNode
  gradient: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-md`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
        </div>
      </div>
    </div>
  )
}

function difficultyColor(level: string) {
  const map: Record<string, string> = {
    basico: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
    intermedio: 'text-amber-600 bg-amber-50 border border-amber-200',
    avanzado: 'text-rose-600 bg-rose-50 border border-rose-200',
  }
  return map[level] || 'text-slate-600 bg-slate-50 border border-slate-200'
}

function ContentIcon({ type }: { type: string }) {
  if (type === 'video') return <Video className="w-5 h-5 text-indigo-500" />
  if (type === 'pdf') return <FileText className="w-5 h-5 text-rose-500" />
  return <FileBox className="w-5 h-5 text-emerald-500" />
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [tags, setTags] = useState<Tag[]>([])
  const [contents, setContents] = useState<Content[]>([])
  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsRes, contentsRes, pathsRes] = await Promise.all([
          api.get('/api/tags'),
          api.get('/api/contents'),
          api.get('/api/paths'),
        ])
        setTags(tagsRes.data?.data || tagsRes.data || [])
        setContents(contentsRes.data?.data || contentsRes.data || [])
        setPaths(pathsRes.data?.data || pathsRes.data || [])
      } catch (err) {
        console.error('Error cargando datos:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="max-w-[1400px] mx-auto animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Overview Stats */}
      <h3 className="text-lg font-bold text-slate-800 mb-4">Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Courses in Progress"
          value={loading ? '...' : contents.length}
          gradient="from-indigo-500 to-indigo-600"
          icon={<PlayCircle className="w-7 h-7" />}
        />
        <StatCard
          label="Learning Paths"
          value={loading ? '...' : paths.length}
          gradient="from-emerald-400 to-emerald-600"
          icon={<CheckCircle2 className="w-7 h-7" />}
        />
        <StatCard
          label="Available Tags"
          value={loading ? '...' : tags.length}
          gradient="from-purple-500 to-fuchsia-600"
          icon={<Clock className="w-7 h-7" />}
        />
        <StatCard
          label="Performance"
          value={loading ? '...' : '92%'}
          gradient="from-blue-500 to-cyan-500"
          icon={<TrendingUp className="w-7 h-7" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Courses & Content) - Spans 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Current Courses / Content Section */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Recent Materials</h2>
              <Link href="/dashboard/contenidos" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />)}
              </div>
            ) : contents.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileBox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No contents available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contents.slice(0, 6).map((c) => (
                  <Link href={`/contenidos/${c._id}`} key={c._id} className="group p-4 rounded-xl border border-slate-100 hover:border-indigo-100 bg-slate-50 hover:bg-indigo-50/50 transition-all duration-300 cursor-pointer block">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                        <ContentIcon type={c.content_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">{c.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{c.content_type}</span>
                          {c.duration_seconds && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="text-xs text-slate-500">{Math.round(c.duration_seconds / 60)} min read</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Tags / Topics Section */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Explore Topics</h2>
            </div>
            {loading ? (
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 w-24 bg-slate-50 rounded-full animate-pulse" />)}
              </div>
            ) : tags.length === 0 ? (
              <p className="text-sm text-slate-400">No topics registered.</p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {tags.map((tag) => (
                  <span key={tag._id}
                    className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 text-sm font-medium rounded-full hover:bg-slate-800 hover:text-white transition-all cursor-pointer shadow-sm">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Timeline / Paths) - Spans 1 column */}
        <div className="lg:col-span-1 space-y-8">
          
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <MapIcon className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">My Learning Paths</h2>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse" />)}
              </div>
            ) : paths.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">No paths active right now.</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {paths.slice(0, 5).map((p, i) => (
                  <div key={p._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Timeline Node */}
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-indigo-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                    
                    {/* Card */}
                    <Link href={`/rutas/${p._id}`} className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer block">
                      <div className="mb-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${difficultyColor(p.difficulty_level)}`}>
                          {p.difficulty_level}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1">{p.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {p.is_system_generated ? 'AI Generated' : 'Teacher Created'}
                      </p>
                      
                      {/* Fake Progress Bar for UI Aesthetics */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 font-medium">Progress</span>
                          <span className="text-indigo-600 font-bold">{Math.floor(Math.random() * 60 + 20)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.floor(Math.random() * 60 + 20)}%` }}></div>
                        </div>
                      </div>
                    </Link>
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