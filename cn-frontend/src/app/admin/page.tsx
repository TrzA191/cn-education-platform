'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

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
  bajo   : 'bg-green-50 text-green-700',
  medio  : 'bg-yellow-50 text-yellow-700',
  alto   : 'bg-orange-50 text-orange-700',
  critico: 'bg-red-50 text-red-700',
}

const eventTypeLabel: Record<string, string> = {
  login_success      : '✓ Login exitoso',
  login_failed       : '✗ Login fallido',
  account_blocked    : '🔒 Cuenta bloqueada',
  session_revoked    : '⊘ Sesión revocada',
  unauthorized_access: '⚠ Acceso no autorizado',
  xss_attempt        : '🛡 Intento XSS',
  idor_attempt       : '🛡 Intento IDOR',
  sqli_attempt       : '🛡 Intento SQLi',
  password_changed   : '🔑 Cambio de contraseña',
  suspicious_access  : '👁 Acceso sospechoso',
}

const roleColor: Record<string, string> = {
  admin  : 'bg-red-50 text-red-600',
  teacher: 'bg-blue-50 text-blue-600',
  student: 'bg-green-50 text-green-600',
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
        <p className="text-gray-500 mt-1">Gestión de usuarios y bitácora de seguridad</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Usuarios registrados', value: users.length,       color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Eventos totales',       value: logs.length,        color: 'bg-gray-50 text-gray-600'    },
          { label: 'Eventos críticos',      value: stats.criticos,     color: 'bg-red-50 text-red-600'      },
          { label: 'Intentos fallidos',     value: attempts.length,    color: 'bg-orange-50 text-orange-600'},
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{loading ? '...' : s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['usuarios', 'logs', 'intentos'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'logs' ? 'Bitácora de seguridad' : t === 'intentos' ? 'Intentos fallidos' : 'Usuarios'}
          </button>
        ))}
      </div>

      {/* ── TAB USUARIOS ── */}
      {tab === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Usuarios registrados</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">ID</th>
                    <th className="px-5 py-3 text-left">Usuario</th>
                    <th className="px-5 py-3 text-left">Correo</th>
                    <th className="px-5 py-3 text-left">Rol</th>
                    <th className="px-5 py-3 text-left">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{u.id}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{u.username}</td>
                      <td className="px-5 py-3 text-gray-600">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${roleColor[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
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
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3">
            <input
              type="text" placeholder="Buscar por email, descripción o evento..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              {['todos', 'bajo', 'medio', 'alto', 'critico'].map(s => (
                <button key={s} onClick={() => setSeverityFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    severityFilter === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Fecha</th>
                    <th className="px-5 py-3 text-left">Usuario</th>
                    <th className="px-5 py-3 text-left">Evento</th>
                    <th className="px-5 py-3 text-left">Descripción</th>
                    <th className="px-5 py-3 text-left">IP</th>
                    <th className="px-5 py-3 text-left">Severidad</th>
                    <th className="px-5 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString('es-MX')}
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{l.email || '—'}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-700">
                          {eventTypeLabel[l.event_type] || l.event_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs max-w-xs truncate">{l.description}</td>
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{l.ip_address}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${severityColor[l.severity]}`}>
                          {l.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600 capitalize">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-10">No hay eventos que coincidan</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB INTENTOS FALLIDOS ── */}
      {tab === 'intentos' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Intentos fallidos de inicio de sesión</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Fecha</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">IP</th>
                    <th className="px-5 py-3 text-left">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attempts.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(a.attempted_at).toLocaleString('es-MX')}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{a.email}</td>
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{a.ip_address}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs truncate max-w-xs">{a.user_agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attempts.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-10">No hay intentos fallidos registrados</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}