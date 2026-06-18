'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import { 
  UploadCloud, 
  CheckCircle2, 
  FileType, 
  Clock, 
  Type,
  AlignLeft,
  XCircle,
  FileUp,
  File as FileIcon,
  Video,
  ShieldCheck,
  Tags,
  Loader2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  Heading1,
  Heading2
} from 'lucide-react'


export default function EditarContenidoPage() {
  const { user } = useAuthStore()
  const router   = useRouter()
  const params   = useParams()
  const contentId = params.id as string

  const [form, setForm] = useState({
    title           : '',
    description     : '',
    body_content    : '',
    content_type    : 'video',
    difficulty_level: 'basico',
    is_introductory : false,
    visibility      : 'public',
    allowed_emails  : '',
    tags            : [] as string[]
  })

  
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [availableTags, setAvailableTags] = useState<{_id: string, name: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef    = useRef<HTMLDivElement>(null)

  const execCommand = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value || undefined)
    if (editorRef.current) {
      setForm(prev => ({ ...prev, body_content: editorRef.current?.innerHTML || '' }))
    }
  }

  const applyLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl)
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }

  useEffect(() => {
    api.get('/api/tags')
      .then(res => setAvailableTags(res.data || []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!contentId) return
    const fetchContent = async () => {
      try {
        const res = await api.get(`/api/contents/${contentId}`)
        const content = res.data?.data || res.data
        
        // Resolver los IDs de alumnos a correos para mostrarlos en el form
        let emails = ''
        if (content.allowed_students?.length > 0) {
          try {
            const profileRes = await api.post('/api/users/bulk-profiles', { ids: content.allowed_students })
            emails = profileRes.data.map((p: any) => p.email).join(', ')
          } catch (e) {
            console.error("Error al resolver correos de alumnos:", e)
          }
        }

        setForm({
          title: content.title || '',
          description: content.description || '',
          body_content: content.body_content || '',
          content_type: content.content_type || 'video',
          difficulty_level: content.difficulty_level || 'basico',
          is_introductory: !!content.is_introductory,
          visibility: content.visibility || 'public',
          allowed_emails: emails,
          tags: content.tags?.map((t: any) => typeof t === 'string' ? t : t._id) || []
        })
        if (editorRef.current && content.body_content) {
          editorRef.current.innerHTML = content.body_content
        }
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar la información del contenido.')
      } finally {
        setInitialLoading(false)
      }
    }
    fetchContent()
  }, [contentId])

  const toggleTag = (tagId: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) 
        ? prev.tags.filter(id => id !== tagId) 
        : [...prev.tags, tagId]
    }))
  }

  const createNewTag = async (name: string) => {
    try {
      const cleanName = name.trim()
      if (!cleanName) return
      
      const pseudoId = `new_${Date.now()}`
      setAvailableTags(prev => [...prev, { _id: cleanName, name: cleanName }])
      
      toggleTag(cleanName)
      
      const input = document.getElementById('newTagInput') as HTMLInputElement
      if (input) input.value = ''
    } catch (e) {
      console.error('Error al crear tag:', e)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (!selectedFile.type.startsWith('video/')) {
        setError('Por favor, selecciona un archivo de video válido (mp4, mov, webm).')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setError('')
    setLoading(true)
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('body_content', form.body_content)
      formData.append('content_type', form.content_type)
      formData.append('difficulty_level', form.difficulty_level)
      formData.append('is_introductory', String(form.is_introductory))
      formData.append('visibility', form.visibility)
      formData.append('allowed_emails', form.allowed_emails)

      let finalTags = [...form.tags];
      const tagInput = document.getElementById('newTagInput') as HTMLInputElement;
      if (tagInput && tagInput.value.trim()) {
        const val = tagInput.value.trim();
        if (!finalTags.includes(val)) finalTags.push(val);
      }

      formData.append('tags', JSON.stringify(finalTags))
      formData.append('status', 'active')

      if (file) {
        formData.append('file', file)
      }

      const stored = localStorage.getItem('auth-storage')
      let token = ''
      if (stored) {
        try {
           token = JSON.parse(stored).state?.token
        } catch (e) {}
      }

      const baseURL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3002'
      
      await axios({
        method: 'patch',
        url: `${baseURL}/api/contents/${contentId}`,
        data: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setUploadProgress(percentCompleted)
        }
      })

      setSuccess(true)
      setTimeout(() => router.push('/mis-contenidos'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al conectar con el servidor. Verifica el Gateway.')
      setIsUploading(false)
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Video className="w-8 h-8 text-white" />
            </div>
            Editar Clase
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-md">
            Modifica los detalles, actualiza el texto o reemplaza el video.
          </p>
        </div>
      </div>

      {success ? (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 p-16 text-center animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-500/40">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">¡Actualización Exitosa!</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mb-8">
            Los cambios han sido guardados correctamente.
          </p>
          <div className="inline-flex items-center gap-2 text-indigo-500 font-bold animate-pulse">
            Redirigiendo <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* SECCIÓN 1: METADATOS BÁSICOS */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-8 space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800">
              <Type className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Información de la Clase</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Título de la Clase</label>
                <input
                  type="text" required minLength={3}
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-5 py-4 h-[58px] rounded-[20px] border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder-slate-400"
                  placeholder="Ej. Dominando el DOM con JavaScript"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Resumen Corto</label>
                <input
                  type="text" required minLength={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-5 py-4 h-[58px] rounded-[20px] border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder-slate-400"
                  placeholder="Una breve descripción para la tarjeta del catálogo..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Dificultad</label>
                <div className="relative group">
                  <select
                    value={form.difficulty_level}
                    onChange={e => setForm({ ...form, difficulty_level: e.target.value })}
                    className="w-full px-5 py-4 h-[58px] rounded-[20px] border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="basico">🐣 Básico</option>
                    <option value="intermedio">🚀 Intermedio</option>
                    <option value="avanzado">🔥 Avanzado</option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">¿Es Introductorio?</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_introductory: !form.is_introductory })}
                  className={`w-full px-5 py-4 h-[58px] rounded-[20px] border transition-all flex items-center justify-center gap-2 text-sm font-bold ${
                    form.is_introductory 
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {form.is_introductory ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                  {form.is_introductory ? 'Sí, es Intro' : 'No, es Temático'}
                </button>
              </div>


            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-50 dark:border-slate-800">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Visibilidad</label>
                <div className="relative group">
                  <select
                    value={form.visibility}
                    onChange={e => setForm({ ...form, visibility: e.target.value })}
                    className="w-full px-5 py-4 h-[58px] rounded-[20px] border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="public">🌍 Público (Catálogo General)</option>
                    <option value="private">🔒 Privado (Solo invitados)</option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              {form.visibility === 'private' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Invitar Alumnos (Correos)</label>
                  <input
                    type="text"
                    value={form.allowed_emails}
                    onChange={e => setForm({ ...form, allowed_emails: e.target.value })}
                    className="w-full px-5 py-4 h-[58px] rounded-[20px] border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder-slate-400"
                    placeholder="Ej. alumno@gmail.com, otro@pathly.com"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Categorías / Tags</label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <input 
                    type="text"
                    placeholder="Nueva etiqueta..."
                    id="newTagInput"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value;
                        if (val) createNewTag(val);
                      }
                    }}
                    className="flex-1 px-5 py-4 h-[58px] rounded-[20px] border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('newTagInput') as HTMLInputElement;
                      if (input.value) createNewTag(input.value);
                    }}
                    className="w-[58px] h-[58px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[20px] flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    <Tags className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-[2] flex flex-wrap gap-2 items-center p-4 bg-slate-50/30 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 rounded-[24px] min-h-[58px] transition-all">
                  {availableTags.length === 0 ? (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mx-auto">Selecciona etiquetas de la base de datos</p>
                  ) : (
                    availableTags.map(tag => (
                      <button
                        key={tag._id}
                        type="button"
                        onClick={() => toggleTag(tag._id)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border ${
                          form.tags.includes(tag._id) 
                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/20' 
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: VIDEO Y PROGRESO */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-8 space-y-6">

            <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800">
              <FileUp className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Reemplazar Video (Opcional)</h3>
            </div>

            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[24px] flex flex-col items-center justify-center gap-4 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all cursor-pointer group"
              >
                <input 
                  type="file" ref={fileInputRef} className="hidden" 
                  accept="video/mp4,video/x-m4v,video/*"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500 group-hover:bg-white dark:group-hover:bg-slate-700 rounded-3xl flex items-center justify-center transition-all shadow-sm">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Arrastra un nuevo video si deseas cambiar el actual</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">MP4, MOV o WEBM • Máximo 500MB</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[24px] p-6 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                      <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[200px] md:max-w-md">{file.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button 
                      type="button" onClick={() => setFile(null)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                      <span>Subiendo a la nube...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SECCIÓN 3: CONTENIDO DE TEXTO ENRIQUECIDO */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <AlignLeft className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 dark:text-white">Material de Lectura / Notas</h3>
              </div>
              <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg uppercase tracking-widest">
                Rich Text Enabled
              </div>
            </div>

            <div className="space-y-4 relative">
              <div className="flex flex-wrap gap-1 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative z-10">
                <button onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} type="button" className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300" title="Negrita"><Bold className="w-4 h-4" /></button>
                <button onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} type="button" className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300" title="Cursiva"><Italic className="w-4 h-4" /></button>
                <button onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }} type="button" className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300" title="Subrayado"><Underline className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
                <button onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'h1'); }} type="button" className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300" title="Título 1"><Heading1 className="w-4 h-4" /></button>
                <button onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'h2'); }} type="button" className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300" title="Título 2"><Heading2 className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
                <button onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }} type="button" className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300" title="Lista"><List className="w-4 h-4" /></button>
                <button onMouseDown={(e) => { e.preventDefault(); setShowLinkInput(!showLinkInput); }} type="button" className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${showLinkInput ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`} title="Insertar Link"><LinkIcon className="w-4 h-4" /></button>

                {showLinkInput && (
                  <div className="absolute top-14 right-1.5 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex gap-2 animate-in slide-in-from-top-2 duration-300 z-50">
                    <input 
                      type="url" 
                      placeholder="https://ejemplo.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyLink()}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"
                      autoFocus
                    />
                    <button onClick={applyLink} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">Añadir</button>
                  </div>
                )}
              </div>
              
              <div
                ref={editorRef}
                contentEditable
                data-placeholder="Escribe aquí el contenido teórico, resumen o instrucciones adicionales..."
                onInput={() => {
                  if (editorRef.current) {
                    setForm(prev => ({ ...prev, body_content: editorRef.current?.innerHTML || '' }))
                  }
                }}
                className="w-full min-h-[350px] px-10 py-12 rounded-[40px] border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30 text-slate-900 dark:text-white text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 transition-all overflow-y-auto font-serif leading-relaxed editor-content"
                style={{ outline: 'none' }}
              />
              <style jsx>{`
                .editor-content:empty:before {
                  content: attr(data-placeholder);
                  color: #94a3b8;
                  cursor: text;
                }
                .editor-content h1 { font-size: 2.25rem; font-weight: 900; margin-bottom: 1.5rem; line-height: 1.2; color: #0f172a; }
                .editor-content h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: 1.25rem; line-height: 1.3; color: #1e293b; }
                .editor-content ul { list-style-type: disc; margin-left: 2rem; margin-bottom: 1.25rem; }
                .editor-content li { margin-bottom: 0.5rem; }
                .editor-content a { color: #4f46e5; text-decoration: underline; font-weight: 600; text-underline-offset: 4px; }
                .dark .editor-content h1 { color: #f8fafc; }
                .dark .editor-content h2 { color: #f1f5f9; }
                .dark .editor-content a { color: #818cf8; }
                .dark .editor-content:empty:before { color: #475569; }
              `}</style>

            </div>
          </section>

          {error && (
            <div className="flex items-center gap-4 p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-[24px] animate-in shake duration-500">
              <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-[20px] text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit" 
              disabled={loading}
              className="flex-1 px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[20px] text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploadProgress > 0 && uploadProgress < 100 ? `Subiendo Video (${uploadProgress}%)` : 'Guardando Cambios...'}
                </>
              ) : (
                <>
                  Guardar Cambios
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  )
}