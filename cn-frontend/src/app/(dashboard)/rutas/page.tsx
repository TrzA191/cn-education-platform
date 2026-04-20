'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import { Plus, Route, Loader2, BookOpen, X, Trash2, Edit2, RotateCcw, Archive, AlertTriangle, Search, CheckCircle2, GripVertical } from 'lucide-react'

interface Path {
  _id: string
  title: string
  description: string
  difficulty_level: string
  is_system_generated: boolean
  status: 'active' | 'archived'
  created_at: string
}

interface Content {
  _id: string
  title: string
  content_type: string
  duration_seconds: number | null
}

interface PathContentItem {
  _id: string
  content_id: Content
  sequence_order: number
}

function difficultyColor(level: string) {
  const map: Record<string, string> = {
    basico    : 'bg-green-50 text-green-700',
    intermedio: 'bg-yellow-50 text-yellow-700',
    avanzado  : 'bg-red-50 text-red-700',
  }
  return map[level] || 'bg-gray-100 text-gray-600'
}

/* ─────────── Componente Modal de Confirmación SaaS ─────────── */
interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  variant: 'danger' | 'warning'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({ isOpen, title, message, confirmLabel, variant, isLoading, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null
  const isDanger = variant === 'danger'
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header con icono */}
        <div className={`p-8 flex flex-col items-center text-center gap-4 ${isDanger ? 'bg-rose-50' : 'bg-amber-50'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDanger ? 'bg-rose-100' : 'bg-amber-100'}`}>
            {isDanger
              ? <Trash2 className="w-7 h-7 text-rose-600" />
              : <Archive className="w-7 h-7 text-amber-600" />
            }
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{message}</p>
          </div>
        </div>
        {/* Acciones */}
        <div className="p-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-5 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white rounded-2xl transition-all shadow-lg ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
            } disabled:opacity-60`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────── Página Principal ─────────── */
export default function RutasPage() {
  const [paths, setPaths]   = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [availableTags, setAvailableTags] = useState<{_id: string, name: string}[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [savingInterests, setSavingInterests] = useState(false)
  const [activeView, setActiveView] = useState<'active' | 'archived'>('active')

  // Modal de confirmación
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    pathId: string
    isArchived: boolean
    isLoading: boolean
  }>({ open: false, pathId: '', isArchived: false, isLoading: false })

  // Modal de edición ampliada
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPath, setEditingPath] = useState<Path | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDifficulty, setEditDifficulty] = useState('basico')
  const [isUpdating, setIsUpdating] = useState(false)
  const [pathContents, setPathContents] = useState<PathContentItem[]>([])
  const [allContents, setAllContents] = useState<Content[]>([])
  const [contentSearch, setContentSearch] = useState('')
  const [loadingContents, setLoadingContents] = useState(false)
  const [addingContent, setAddingContent] = useState(false)

  const fetchPaths = () => {
    setLoading(true)
    api.get(`/api/paths?status=${activeView}`)
      .then(res => setPaths(res.data?.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPaths() }, [activeView])

  useEffect(() => {
    api.get('/api/tags').then(res => setAvailableTags(res.data || [])).catch(console.error)
    api.get('/api/tags/interests/me').then(res => {
      const interests = res.data || []
      setSelectedTagIds(interests.map((i: any) => i.tag_id?._id || i.tag_id))
    }).catch(console.error)
  }, [])

  const handleSaveAndGenerate = async () => {
    setSavingInterests(true)
    setGenerateError('')
    try {
      await api.put('/api/tags/interests/me', { tagIds: selectedTagIds })
      setGenerating(true)
      await api.post('/api/paths/generate')
      setShowConfigModal(false)
      fetchPaths()
    } catch (err: any) {
      setGenerateError(err.response?.data?.error || 'Error al crear ruta')
    } finally {
      setSavingInterests(false)
      setGenerating(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  /* ── Archivar / Eliminar con modal ── */
  const requestDelete = (pathId: string, isArchived: boolean) => {
    setConfirmModal({ open: true, pathId, isArchived, isLoading: false })
  }

  const handleConfirmDelete = async () => {
    setConfirmModal(prev => ({ ...prev, isLoading: true }))
    try {
      await api.delete(`/api/paths/${confirmModal.pathId}`)
      setConfirmModal({ open: false, pathId: '', isArchived: false, isLoading: false })
      fetchPaths()
    } catch (err) {
      console.error(err)
      setConfirmModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleRestore = async (pathId: string) => {
    try {
      await api.put(`/api/paths/${pathId}`, { status: 'active' })
      fetchPaths()
    } catch (err) {
      console.error(err)
    }
  }

  /* ── Edición Ampliada ── */
  const handleOpenEdit = async (path: Path) => {
    setEditingPath(path)
    setEditTitle(path.title)
    setEditDesc(path.description)
    setEditDifficulty(path.difficulty_level)
    setShowEditModal(true)
    setContentSearch('')

    setLoadingContents(true)
    try {
      const [pathRes, allRes] = await Promise.all([
        api.get(`/api/paths/${path._id}`),
        api.get('/api/contents')
      ])
      const data = pathRes.data?.data || pathRes.data
      setPathContents(data?.contents || [])
      setAllContents(allRes.data?.data || allRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingContents(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingPath) return
    setIsUpdating(true)
    try {
      await api.put(`/api/paths/${editingPath._id}`, {
        title: editTitle,
        description: editDesc,
        difficulty_level: editDifficulty
      })
      setShowEditModal(false)
      fetchPaths()
    } catch (err) {
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddContent = async (contentId: string) => {
    if (!editingPath) return
    setAddingContent(true)
    try {
      const nextOrder = pathContents.length + 1
      await api.post('/api/paths/contents', {
        path_id: editingPath._id,
        content_id: contentId,
        sequence_order: nextOrder
      })
      // Recargar contenidos de esa ruta
      const res = await api.get(`/api/paths/${editingPath._id}`)
      const data = res.data?.data || res.data
      setPathContents(data?.contents || [])
    } catch (err) {
      console.error(err)
    } finally {
      setAddingContent(false)
    }
  }

  const handleRemoveContent = async (pathContentId: string) => {
    try {
      await api.delete(`/api/paths/contents/${pathContentId}`)
      setPathContents(prev => prev.filter(c => c._id !== pathContentId))
    } catch (err) {
      console.error(err)
    }
  }

  const alreadyAdded = new Set(pathContents.map(pc => pc.content_id?._id))
  const filteredContents = allContents.filter(c =>
    !alreadyAdded.has(c._id) &&
    c.title.toLowerCase().includes(contentSearch.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rutas de aprendizaje</h1>
          <p className="text-slate-500 font-medium mt-1">Secuencias de contenido para guiar tu aprendizaje desde nivel básico hasta avanzado.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveView('active')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeView === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Activas
            </button>
            <button
              onClick={() => setActiveView('archived')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeView === 'archived' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Archivadas
            </button>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            Crear Ruta
          </button>
        </div>
      </div>

      {generateError && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
          <p className="text-sm font-medium text-rose-700">{generateError}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-40 bg-white rounded-3xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : paths.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">
            {activeView === 'archived' ? 'No hay rutas archivadas' : 'No hay rutas disponibles aún'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paths.map(p => (
            <div
              key={p._id}
              className={`relative overflow-hidden bg-white rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl shadow-slate-100 ${activeView === 'archived' ? 'border-slate-200 opacity-80' : 'border-slate-100'}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className={`p-3 rounded-2xl ${activeView === 'archived' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Route className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    {activeView === 'active' ? (
                      <>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Editar y gestionar contenidos"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => requestDelete(p._id, false)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Archivar ruta"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(p._id)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Restaurar"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => requestDelete(p._id, true)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${difficultyColor(p.difficulty_level)}`}>
                      {p.difficulty_level}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{p.title}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{p.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <BookOpen className="w-4 h-4" />
                    <span>{activeView === 'active' ? 'Ruta' : 'Archivada'}</span>
                  </div>
                  {activeView === 'active' && (
                    <Link
                      href={`/rutas/${p._id}`}
                      className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all bg-slate-50 text-slate-700 hover:bg-slate-100"
                    >
                      Explorar ruta →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Confirmación Archivar / Eliminar ── */}
      <ConfirmModal
        isOpen={confirmModal.open}
        variant={confirmModal.isArchived ? 'danger' : 'warning'}
        title={confirmModal.isArchived ? 'Eliminar permanentemente' : 'Archivar ruta'}
        message={
          confirmModal.isArchived
            ? 'Esta acción eliminará la ruta y todo su contenido de forma permanente. No podrás recuperarla.'
            : 'La ruta se moverá a "Archivadas". Podrás restaurarla o eliminarla definitivamente desde allí.'
        }
        confirmLabel={confirmModal.isArchived ? 'Sí, eliminar' : 'Sí, archivar'}
        isLoading={confirmModal.isLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ open: false, pathId: '', isArchived: false, isLoading: false })}
      />

      {/* ── Modal de configuración de intereses ── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Configura tus intereses</h2>
              <button onClick={() => setShowConfigModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-slate-500 mb-6">
                Selecciona los temas que más te interesan para armar tu ruta a medida.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {availableTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag._id)
                  return (
                    <button
                      key={tag._id}
                      onClick={() => toggleTag(tag._id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  )
                })}
                {availableTags.length === 0 && (
                  <p className="text-sm text-slate-400">Cargando temas...</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                disabled={generating || savingInterests}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAndGenerate}
                disabled={generating || savingInterests || selectedTagIds.length === 0}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-all"
              >
                {(generating || savingInterests) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Route className="w-4 h-4" />}
                {generating ? 'Creando...' : 'Crear Ruta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Edición Ampliada ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Personalizar Ruta</h2>
                <p className="text-xs text-slate-400 mt-0.5">Edita el detalle y gestiona los módulos de esta ruta</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Información básica */}
              <div className="p-6 space-y-4 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Información básica</p>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Título de la ruta</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-900"
                    placeholder="Ej: Mi ruta de Backend"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Descripción corta</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-slate-900 resize-none h-20"
                    placeholder="¿De qué trata esta ruta?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nivel de dificultad</label>
                  <div className="flex gap-2">
                    {(['basico', 'intermedio', 'avanzado'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setEditDifficulty(d)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${editDifficulty === d ? difficultyColor(d) + ' border-current' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Módulos actuales */}
              <div className="p-6 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Módulos de la ruta <span className="text-indigo-500">({pathContents.length})</span>
                </p>
                {loadingContents ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
                  </div>
                ) : pathContents.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Aún no hay módulos en esta ruta</p>
                ) : (
                  <div className="space-y-2">
                    {pathContents.map((pc, idx) => (
                      <div key={pc._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group">
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{pc.content_id?.title || 'Sin título'}</p>
                          <p className="text-xs text-slate-400 capitalize">{pc.content_id?.content_type}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveContent(pc._id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Quitar de la ruta"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Agregar nuevo contenido */}
              <div className="p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Agregar más contenidos</p>
                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar contenido..."
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm text-slate-900"
                  />
                </div>
                {loadingContents ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
                  </div>
                ) : filteredContents.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    {contentSearch ? 'Sin resultados para tu búsqueda' : 'Todos los contenidos ya están en la ruta'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {filteredContents.map(c => (
                      <div key={c._id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-all group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{c.title}</p>
                          <p className="text-xs text-slate-400 capitalize">{c.content_type}</p>
                        </div>
                        <button
                          onClick={() => handleAddContent(c._id)}
                          disabled={addingContent}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold rounded-lg transition-all shadow-sm shadow-indigo-500/20"
                          title="Agregar a la ruta"
                        >
                          {addingContent
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Plus className="w-3.5 h-3.5" />
                          }
                          Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                disabled={isUpdating}
              >
                Cerrar
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating || !editTitle.trim()}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-all"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}