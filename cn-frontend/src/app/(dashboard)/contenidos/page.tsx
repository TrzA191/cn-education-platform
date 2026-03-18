'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'

// Definimos la estructura de datos que viene de tus microservicios (Zona A/B)
interface Content {
  _id: string | number
  title: string
  description: string
  content_type: 'video' | 'pdf' | 'texto'
  duration_seconds: number | null
  status: 'activo' | 'inactivo'
  cdn_url: string
}

// Helper para iconos descriptivos
function contentTypeIcon(type: string) {
  switch (type) {
    case 'video': return '🎬'
    case 'pdf': return '📄'
    case 'texto': return '📝'
    default: return '📁'
  }
}

// Helper para formatear tiempo (útil para la tesis)
function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}min`
  return `${m} min`
}

export default function ContenidosPage() {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')

  useEffect(() => {
    // Llamada al Gateway o Microservicio
    api.get('/api/contents')
      .then(res => {
        // Manejamos diferentes estructuras de respuesta comunes en Express/Nest
        const data = res.data?.data || res.data || []
        setContents(data)
      })
      .catch(err => {
        console.error("Error conectando con el microservicio:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  // Lógica de filtrado en el cliente
  const filtered = contents.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'todos' || c.content_type === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Contenidos</h1>
        <p className="text-gray-500 mt-2 text-lg">Explora las rutas de aprendizaje y recursos disponibles.</p>
      </div>

      {/* Barra de Herramientas (Buscador + Filtros) */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="¿Qué quieres aprender hoy?..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-5 py-3 rounded-2xl border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['todos', 'video', 'pdf', 'texto'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Estado de Carga (Skeletons) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-gray-50 rounded-3xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-gray-500 font-medium">No encontramos resultados para tu búsqueda</p>
        </div>
      ) : (
        /* Grid de Resultados */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => (
            <Link key={c._id} href={`/dashboard/contenidos/${c._id}`} className="group bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="p-3 bg-indigo-50 rounded-2xl text-3xl">
                  {contentTypeIcon(c.content_type)}
                </div>
                <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold ${
                  c.status === 'activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {c.status}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 text-xl mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {c.title}
              </h3>
              
              <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                {c.description}
              </p>

              <div className="pt-5 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-tight">
                  {c.content_type}
                  {c.duration_seconds ? ` • ${formatDuration(c.duration_seconds)}` : ''}
                </span>
                
                {c.cdn_url && (
                  <a 
                    href={c.cdn_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
                  >
                    Abrir <span>→</span>
                  </a>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}