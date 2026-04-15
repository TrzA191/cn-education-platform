'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { 
  Users, 
  Activity, 
  AlertOctagon, 
  ShieldAlert, 
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldHalf,
  EyeOff,
  ShieldCheck
} from 'lucide-react'

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

type Tab = 'usuarios' | 'logs' | 'intentos'

const severityColor: Record<string, string> = {
  bajo   : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  medio  : 'bg-amber-50 text-amber-700 border border-amber-200',
  alto   : 'bg-orange-50 text-orange-700 border border-orange-200',
  critico: 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm',
}

const eventTypeIcon: Record<string, React.ReactNode> = {
  login_success      : <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  login_failed       : <XCircle className="w-4 h-4 text-rose-500" />,
  account_blocked    : <ShieldAlert className="w-4 h-4 text-rose-600" />,
  session_revoked    : <AlertOctagon className="w-4 h-4 text-amber-500" />,
  unauthorized_access: <EyeOff className="w-4 h-4 text-orange-500" />,
  password_changed   : <KeyRound className="w-4 h-4 text-indigo-500" />,
}

const eventTypeLabel: Record<string, string> = {
  login_success      : 'Login exitoso',
  login_failed       : 'Login fallido',
  account_blocked    : 'Cuenta bloqueada',
  session_revoked    : 'Sesión revocada',
  unauthorized_access: 'Acceso no autorizado',
  xss_attempt        : 'Intento XSS',
  idor_attempt       : 'Intento IDOR',
  sqli_attempt       : 'Intento SQLi',
  password_changed   : 'Cambio de contraseña',
  suspicious_access  : 'Acceso sospechoso',
}

const roleColor: Record<string, string> = {
  admin  : 'bg-rose-50 text-rose-700 border-rose-200',
  teacher: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  student: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

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
  const { user } = useAuthStore()
  const router   = useRouter()

  const [tab,            setTab]            = useState<Tab>('usuarios')
  const [users,          setUsers]          = useState<User[]>([])
  const [logs,           setLogs]           = useState<SecurityLog[]>([])
  const [attempts,       setAttempts]       = useState<FailedAttempt[]>([])
  const [loading,        setLoading]        = useState(true)
  const [severityFilter, setSeverityFilter] = useState('todos')
  const [search,         setSearch]         = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchAll()
  }, [user])

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

  const filteredLogs = logs.filter(l => {
    const matchSeverity = severityFilter === 'todos' || l.severity === severityFilter
    const matchSearch   = search === '' ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.event_type.toLowerCase().includes(search.toLowerCase())
    return matchSeverity && matchSearch
  })

  const stats = {
    total   : logs.length,
    criticos: logs.filter(l => l.severity === 'critico').length,
    altos   : logs.filter(l => l.severity === 'alto').length,
    bloqueados: users.filter(u => u.role).length, // placeholder
  }

  return (
    <div className="max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control Panel</h1>
          <p className="text-slate-500 mt-1">Gestión de usuarios y auditoría de seguridad</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminStatCard label="Usuarios registrados" value={loading ? '...' : users.length} icon={<Users className="w-6 h-6" />} gradient="from-indigo-500 to-indigo-600" />
        <AdminStatCard label="Eventos totales" value={loading ? '...' : logs.length} icon={<Activity className="w-6 h-6" />} gradient="from-slate-500 to-slate-600" />
        <AdminStatCard label="Eventos críticos" value={loading ? '...' : stats.criticos} icon={<AlertOctagon className="w-6 h-6" />} gradient="from-rose-500 to-rose-600" />
        <AdminStatCard label="Intentos fallidos" value={loading ? '...' : attempts.length} icon={<ShieldAlert className="w-6 h-6" />} gradient="from-amber-500 to-orange-500" />
      </div>

      {/* Modern Tabs */}
      <div className="flex bg-slate-100/80 p-1.5 rounded-xl mb-6 w-fit border border-slate-200/50">
        {(['usuarios', 'logs', 'intentos'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize duration-300 ${
              tab === t ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
            }`}>
            {t === 'logs' ? 'Bitácora de seguridad' : t === 'intentos' ? 'Intentos fallidos' : 'Usuarios'}
          </button>
        ))}
      </div>

      {/* ── TAB USUARIOS ── */}
      {tab === 'usuarios' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Directorio de Usuarios</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">ID</th>
                    <th className="px-6 py-4 text-left">Usuario</th>
                    <th className="px-6 py-4 text-left">Correo</th>
                    <th className="px-6 py-4 text-left">Rol</th>
                    <th className="px-6 py-4 text-left">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">#{u.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{u.username}</td>
                      <td className="px-6 py-4 text-slate-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold capitalize border ${roleColor[u.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                        {new Date(u.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB LOGS ── */}
      {tab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text" placeholder="Buscar por email, descripcion..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            <div className="flex gap-2.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100 overflow-x-auto w-full md:w-auto">
              {['todos', 'bajo', 'medio', 'alto', 'critico'].map(s => (
                <button key={s} onClick={() => setSeverityFilter(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                    severityFilter === s
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Fecha</th>
                    <th className="px-6 py-4 text-left">Usuario / IP</th>
                    <th className="px-6 py-4 text-left">Evento</th>
                    <th className="px-6 py-4 text-left">Descripción</th>
                    <th className="px-6 py-4 text-left">Severidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-slate-400 text-xs font-medium whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString('es-MX')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700 font-medium">{l.email || '—'}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{l.ip_address}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {eventTypeIcon[l.event_type] || <ShieldHalf className="w-4 h-4 text-slate-400" />}
                          <span className="text-sm font-semibold text-slate-700">
                            {eventTypeLabel[l.event_type] || l.event_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm max-w-xs truncate">{l.description}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1 uppercase rounded-md font-bold tracking-wider ${severityColor[l.severity]}`}>
                          {l.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className="text-center py-12 flex flex-col items-center">
                  <ShieldCheck className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="text-sm font-medium text-slate-500">No hay eventos de seguridad</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB INTENTOS FALLIDOS ── */}
      {tab === 'intentos' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Alertas de Intrusión (Failed Logins)</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Timeline</th>
                    <th className="px-6 py-4 text-left">Target Email</th>
                    <th className="px-6 py-4 text-left">Origen (IP)</th>
                    <th className="px-6 py-4 text-left">Dispositivo / Agente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attempts.map(a => (
                    <tr key={a.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-medium text-xs whitespace-nowrap">
                        {new Date(a.attempted_at).toLocaleString('es-MX')}
                      </td>
                      <td className="px-6 py-4 text-rose-700 font-semibold">{a.email}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{a.ip_address}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-sm">{a.user_agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attempts.length === 0 && (
                <div className="text-center py-12 flex flex-col items-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-200 mb-3" />
                  <p className="text-sm font-medium text-emerald-600">No hay brechas de seguridad recientes.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}