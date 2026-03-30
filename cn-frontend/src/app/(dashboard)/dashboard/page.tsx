'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'

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

function StatCard({ label, value, icon, color }: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function difficultyBadge(level: string) {
  const map: Record<string, string> = {
    basico:     'bg-green-50 text-green-700',
    intermedio: 'bg-yellow-50 text-yellow-700',
    avanzado:   'bg-red-50 text-red-700',
  }
  return map[level] || 'bg-gray-100 text-gray-600'
}

function contentTypeIcon(type: string) {
  if (type === 'video') return '🎬'
  if (type === 'pdf')   return '📄'
  return '📝'
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [tags, setTags]         = useState<Tag[]>([])
  const [contents, setContents] = useState<Content[]>([])
  const [paths, setPaths]       = useState<Path[]>([])
  const [loading, setLoading]   = useState(true)

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

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}{user?.email ? `, ${user.email.split('@')[0]}` : ''} 👋
        </h1>
        <p className="text-gray-500 mt-1">Aquí está tu resumen de aprendizaje</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Contenidos disponibles"
          value={loading ? '...' : contents.length}
          color="bg-indigo-50"
          icon={
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Rutas de aprendizaje"
          value={loading ? '...' : paths.length}
          color="bg-emerald-50"
          icon={
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
        />
        <StatCard
          label="Temas disponibles"
          value={loading ? '...' : tags.length}
          color="bg-violet-50"
          icon={
            <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Contenidos recientes</h2>
            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">
              {contents.length} total
            </span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : contents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay contenidos aún</p>
          ) : (
            <div className="space-y-2">
              {contents.slice(0, 5).map((c) => (
                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="text-xl">{contentTypeIcon(c.content_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {c.content_type}
                      {c.duration_seconds ? ` · ${Math.round(c.duration_seconds / 60)} min` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.status === 'active' || c.status === 'activo'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Rutas de aprendizaje</h2>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
              {paths.length} disponibles
            </span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : paths.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay rutas aún</p>
          ) : (
            <div className="space-y-2">
              {paths.slice(0, 5).map((p) => (
                <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-400">
                      {p.is_system_generated ? '🤖 Generada automáticamente' : '👨‍🏫 Creada por docente'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${difficultyBadge(p.difficulty_level)}`}>
                    {p.difficulty_level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Temas disponibles</h2>
          {loading ? (
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5].map(i => <div key={i} className="h-7 w-20 bg-gray-50 rounded-full animate-pulse" />)}
            </div>
          ) : tags.length === 0 ? (
            <p className="text-sm text-gray-400">No hay temas registrados aún</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag._id}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full hover:bg-indigo-100 transition-colors cursor-default">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}