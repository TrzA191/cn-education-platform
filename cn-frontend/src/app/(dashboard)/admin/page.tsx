'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import {
  Users as UsersIcon,
  Activity,
  AlertOctagon,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldHalf,
  EyeOff,
  ShieldCheck,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Settings2,
  Loader2,
  Plus,
  ArrowRight,
  UserCheck,
  AlertTriangle
} from 'lucide-react'

// --- Interfaces ---
interface User {
  id: number
  username: string
  email: string
  role: string
  created_at: string
}

interface SecurityLog {
  id: number
  user_id: number | null
  email: string | null
  event_type: string
  description: string
  ip_address: string
  severity: 'bajo' | 'medio' | 'alto' | 'critico'
  status: string
  created_at: string
}

interface FailedAttempt {
  id: number
  email: string
  ip_address: string
  user_agent: string
  attempted_at: string
}

// --- Constants ---
const severityColor: Record<string, string> = {
  bajo: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  medio: 'bg-amber-50 text-amber-700 border border-amber-200',
  alto: 'bg-orange-50 text-orange-700 border border-orange-200',
  critico: 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm',
}

const eventTypeIcon: Record<string, React.ReactNode> = {
  login_success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  login_failed: <XCircle className="w-4 h-4 text-rose-500" />,
  account_blocked: <ShieldAlert className="w-4 h-4 text-rose-600" />,
  session_revoked: <AlertOctagon className="w-4 h-4 text-amber-500" />,
  unauthorized_access: <EyeOff className="w-4 h-4 text-orange-500" />,
  password_changed: <KeyRound className="w-4 h-4 text-indigo-500" />,
}

const eventTypeLabel: Record<string, string> = {
  login_success: 'Login exitoso',
  login_failed: 'Login fallido',
  account_blocked: 'Cuenta bloqueada',
  session_revoked: 'Sesión revocada',
  unauthorized_access: 'Acceso no autorizado',
  xss_attempt: 'Intento XSS',
  idor_attempt: 'Intento IDOR',
  sqli_attempt: 'Intento SQLi',
  password_changed: 'Cambio de contraseña',
  suspicious_access: 'Acceso sospechoso',
}

const roleColor: Record<string, string> = {
  admin: 'bg-rose-50 text-rose-700 border-rose-200',
  teacher: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  student: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

// --- Components ---
function AdminStatCard({ label, value, icon, gradient }: { label: string, value: string | number, icon: React.ReactNode, gradient: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-sm`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { user: currentUser } = useAuthStore()
  const router = useRouter()

  // State
  const [mainCategory, setMainCategory] = useState<'security' | 'management'>('management')
  const [securityTab, setSecurityTab] = useState<'usuarios' | 'logs' | 'intentos'>('usuarios')
  
  const [users, setUsers] = useState<User[]>([])
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [attempts, setAttempts] = useState<FailedAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [severityFilter, setSeverityFilter] = useState('todos')
  const [search, setSearch] = useState('')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'add' | 'edit'>('add')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'student' })

  // New Confirmation Modals
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean,
    type: 'delete' | 'success' | 'error',
    title: string,
    message: string,
    action?: () => void
  }>({ open: false, type: 'success', title: '', message: '' })

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchAll()
  }, [currentUser])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [usersRes, logsRes, attemptsRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/users/security-logs'),
        api.get('/api/users/failed-attempts'),
      ])
      setUsers(usersRes.data || [])
      setLogs(logsRes.data || [])
      setAttempts(attemptsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Handlers
  const handleOpenAdd = () => {
    setModalType('add')
    setFormData({ username: '', email: '', password: '', role: 'student' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setModalType('edit')
    setSelectedUser(user)
    setFormData({ username: user.username, email: user.email, password: '', role: user.role })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      if (modalType === 'add') {
        await api.post('/api/users', formData)
        setConfirmModal({
          open: true,
          type: 'success',
          title: '¡Usuario Creado!',
          message: `El usuario ${formData.username} ha sido registrado exitosamente en el sistema.`
        })
      } else {
        await api.patch(`/api/users/${selectedUser?.id}`, {
          username: formData.username,
          email: formData.email,
          role: formData.role
        })
        setConfirmModal({
          open: true,
          type: 'success',
          title: 'Cambios Guardados',
          message: 'La información del usuario se ha actualizado correctamente.'
        })
      }
      setIsModalOpen(false)
      fetchAll()
    } catch (err) {
      console.error(err)
      setConfirmModal({
        open: true,
        type: 'error',
        title: 'Error de Servidor',
        message: 'No pudimos completar la operación. Por favor intenta de nuevo.'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRequest = (user: User) => {
    setConfirmModal({
      open: true,
      type: 'delete',
      title: '¿Confirmar Eliminación?',
      message: `Estás a punto de borrar permanentemente la cuenta de ${user.username}. Esta acción no se puede deshacer.`,
      action: () => executeDelete(user.id)
    })
  }

  const executeDelete = async (id: number) => {
    setActionLoading(true)
    try {
      await api.delete(`/api/users/${id}`)
      setConfirmModal({
        open: true,
        type: 'success',
        title: 'Usuario Eliminado',
        message: 'La cuenta ha sido removida del directorio de forma definitiva.'
      })
      fetchAll()
    } catch (err) {
      console.error(err)
      setConfirmModal({
        open: true,
        type: 'error',
        title: 'Fallo al Eliminar',
        message: 'Hubo un error al intentar borrar el registro.'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredLogs = logs.filter(l => {
    const matchSeverity = severityFilter === 'todos' || l.severity === severityFilter
    const matchSearch = search === '' ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.event_type.toLowerCase().includes(search.toLowerCase())
    return matchSeverity && matchSearch
  })

  const stats = {
    total: logs.length,
    criticos: logs.filter(l => l.severity === 'critico').length,
    altos: logs.filter(l => l.severity === 'alto').length,
    usuarios: users.length,
  }

  return (
    <div className="max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-500 fade-in pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
             <ShieldCheck className="w-8 h-8 text-indigo-600" /> Administrative Control
          </h1>
          <p className="text-slate-500 mt-1 font-medium ml-11">Gestión integral de identidad y auditoría de seguridad</p>
        </div>
      </div>

      {/* Main Category Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-200">
        <button
          onClick={() => setMainCategory('management')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all relative ${
            mainCategory === 'management' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          Gestión de Cuentas
          {mainCategory === 'management' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 animate-in fade-in zoom-in duration-300" />}
        </button>
        <button
          onClick={() => setMainCategory('security')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all relative ${
            mainCategory === 'security' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Seguridad y Auditoría
          {mainCategory === 'security' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 animate-in fade-in zoom-in duration-300" />}
        </button>
      </div>

      {/* --- GESTIÓN DE CUENTAS --- */}
      {mainCategory === 'management' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex gap-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Profesores</p>
                <p className="text-2xl font-black text-indigo-600">{users.filter(u => u.role === 'teacher').length}</p>
              </div>
              <div className="w-px h-10 bg-slate-100 self-center" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Estudiantes</p>
                <p className="text-2xl font-black text-emerald-600">{users.filter(u => u.role === 'student').length}</p>
              </div>
            </div>
            <button
              onClick={handleOpenAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">Directorio de Gestión</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Usuario</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">Rol</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                     [1,2,3,4,5].map(i => (
                        <tr key={i}>
                          <td colSpan={4} className="px-6 py-4 animate-pulse"><div className="h-4 bg-slate-50 rounded" /></td>
                        </tr>
                     ))
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{u.username}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: #{u.id}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold capitalize border ${roleColor[u.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            disabled={Number(u.id) === Number(currentUser?.userId)}
                            onClick={() => handleDeleteRequest(u)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SEGURIDAD Y AUDITORÍA --- */}
      {mainCategory === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
             <AdminStatCard label="Eventos Logs" value={loading ? '...' : stats.total} icon={<Activity className="w-6 h-6" />} gradient="from-indigo-500 to-indigo-600" />
             <AdminStatCard label="Logs Críticos" value={loading ? '...' : stats.criticos} icon={<AlertOctagon className="w-6 h-6" />} gradient="from-rose-500 to-rose-600" />
             <AdminStatCard label="Intentos Bloqueo" value={loading ? '...' : attempts.length} icon={<ShieldAlert className="w-6 h-6" />} gradient="from-amber-500 to-orange-500" />
             <AdminStatCard label="Usuarios Activos" value={loading ? '...' : stats.usuarios} icon={<UsersIcon className="w-6 h-6" />} gradient="from-slate-500 to-slate-600" />
          </div>

          {/* Sub-tabs inside Security */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-1 px-6 pt-6 border-b border-slate-100 flex gap-6">
                {(['usuarios', 'logs', 'intentos'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setSecurityTab(t)}
                    className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                      securityTab === t ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t === 'logs' ? 'Bitácora' : t === 'intentos' ? 'Intentos Fallidos' : 'Visualización'}
                    {securityTab === t && <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800 rounded-t-full" />}
                  </button>
                ))}
             </div>

             <div className="p-6">
                {securityTab === 'usuarios' && (
                   <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-slate-400 border-b border-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left">Usuario</th>
                            <th className="px-4 py-3 text-left">Email</th>
                            <th className="px-4 py-3 text-left">Rol</th>
                            <th className="px-4 py-3 text-left">Miembro desde</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {users.map(u => (
                            <tr key={u.id}>
                              <td className="px-4 py-3 font-bold text-slate-700">{u.username}</td>
                              <td className="px-4 py-3 text-slate-500">{u.email}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleColor[u.role]}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-xs">
                                {new Date(u.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                )}

                {securityTab === 'logs' && (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                      <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text" placeholder="Filtrar eventos..."
                          className="w-full pl-10 pr-4 py-2 text-sm border border-slate-100 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          value={search} onChange={e => setSearch(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        {['todos', 'bajo', 'medio', 'alto', 'critico'].map(s => (
                          <button key={s} onClick={() => setSeverityFilter(s)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                              severityFilter === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-3 text-left uppercase">Timeline</th>
                            <th className="px-4 py-3 text-left uppercase">Evento</th>
                            <th className="px-4 py-3 text-left uppercase">Ubicación (IP)</th>
                            <th className="px-4 py-3 text-left uppercase">Severidad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredLogs.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-700">{new Date(l.created_at).toLocaleTimeString()}</p>
                                <p className="text-[10px] text-slate-400">{new Date(l.created_at).toLocaleDateString()}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {eventTypeIcon[l.event_type] || <ShieldHalf className="w-4 h-4 text-slate-400" />}
                                  <div>
                                    <p className="font-bold text-slate-800 leading-none mb-1">{eventTypeLabel[l.event_type] || l.event_type}</p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{l.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-400">{l.ip_address}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-tighter ${severityColor[l.severity]}`}>
                                  {l.severity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {securityTab === 'intentos' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-slate-400 border-b border-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left">Email Objetivo</th>
                          <th className="px-4 py-3 text-left">Origen (IP)</th>
                          <th className="px-4 py-3 text-left">Momento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attempts.map(a => (
                          <tr key={a.id} className="bg-rose-50/10">
                            <td className="px-4 py-3 font-bold text-rose-700">{a.email}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono">{a.ip_address}</td>
                            <td className="px-4 py-3 text-slate-400">{new Date(a.attempted_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* --- CRUD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-50 p-6 border-b border-slate-100">
               <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  {modalType === 'add' ? <UserPlus className="w-5 h-5 text-indigo-600" /> : <Edit3 className="w-5 h-5 text-indigo-600" />}
                  {modalType === 'add' ? 'Añadir Nuevo Usuario' : 'Editar Usuario'}
               </h3>
               <p className="text-xs font-medium text-slate-500 mt-1">Completa los datos para el acceso a la plataforma.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <input
                  type="text" required
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="ej. JuanPerez88"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email corporativo/personal</label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="juan@universidad.com"
                />
              </div>

              {modalType === 'add' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña inicial</label>
                  <input
                    type="password" required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asignar Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'student'})}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all ${
                      formData.role === 'student' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    Estudiante
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'teacher'})}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all ${
                      formData.role === 'teacher' 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    Profesor
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm border border-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-[2] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    modalType === 'add' ? <Plus className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />
                  )}
                  {modalType === 'add' ? 'Crear Cuenta' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- REUSABLE CONFIRMATION MODAL --- */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
              <div className="p-8 text-center">
                 <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-sm ${
                   confirmModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                   confirmModal.type === 'delete' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                 }`}>
                    {confirmModal.type === 'success' ? <UserCheck className="w-10 h-10" /> :
                     confirmModal.type === 'delete' ? <AlertTriangle className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
                 </div>
                 <h4 className="text-xl font-black text-slate-900 mb-2">{confirmModal.title}</h4>
                 <p className="text-sm font-medium text-slate-500 leading-relaxed px-2">
                    {confirmModal.message}
                 </p>
              </div>
              <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex gap-3">
                 {confirmModal.type === 'delete' ? (
                   <>
                    <button 
                      onClick={() => setConfirmModal({...confirmModal, open: false})}
                      className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl text-sm hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        confirmModal.action?.()
                        setConfirmModal({...confirmModal, open: false})
                      }}
                      className="flex-1 py-3 px-4 bg-rose-600 text-white font-bold rounded-2xl text-sm hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all"
                    >
                      Sí, Eliminar
                    </button>
                   </>
                 ) : (
                   <button 
                    onClick={() => setConfirmModal({...confirmModal, open: false})}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-[20px] text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                   >
                    Entendido <ArrowRight className="w-4 h-4" />
                   </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  )
}