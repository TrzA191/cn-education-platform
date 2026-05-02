'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import {
  Shield,
  Activity,
  AlertOctagon,
  Search,
  FileJson,
  ShieldAlert,
  Clock,
  User,
  Globe,
  Database,
  ArrowLeft,
  Filter,
  RefreshCw,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'

// --- Interfaces ---
interface SecurityLog {
  id: number
  email: string | null
  event_type: string
  description: string
  ip_address: string
  severity: 'bajo' | 'medio' | 'alto' | 'critico'
  created_at: string
}

interface AuditLog {
  id: number
  email: string | null
  table_name: string
  record_id: number
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values: string | null
  new_values: string | null
  ip_address: string
  created_at: string
}

const severityStyles: Record<string, string> = {
  bajo: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  medio: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  alto: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critico: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
}

const actionStyles: Record<string, string> = {
  INSERT: 'bg-emerald-500 text-white',
  UPDATE: 'bg-amber-500 text-white',
  DELETE: 'bg-rose-500 text-white',
}

export default function SecurityDashboardPage() {
  const { user: currentUser } = useAuthStore()
  const router = useRouter()

  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [auditTrail, setAuditTrail] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'logs' | 'audit'>('logs')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchSecurityData()
  }, [currentUser])

  const fetchSecurityData = async () => {
    setLoading(true)
    try {
      const [logsRes, auditRes] = await Promise.all([
        api.get('/api/users/security-logs'),
        api.get('/api/users/audit-trail')
      ])
      setLogs(logsRes.data || [])
      setAuditTrail(auditRes.data || [])
    } catch (err) {
      console.error('[SecurityDashboard] Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(l => 
    l.description.toLowerCase().includes(filter.toLowerCase()) ||
    l.email?.toLowerCase().includes(filter.toLowerCase()) ||
    l.event_type.toLowerCase().includes(filter.toLowerCase())
  )

  const filteredAudit = auditTrail.filter(a =>
    a.table_name.toLowerCase().includes(filter.toLowerCase()) ||
    a.email?.toLowerCase().includes(filter.toLowerCase()) ||
    a.action.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => router.push('/admin')}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              Auditoría Forense <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Monitoreo en tiempo real de la integridad del sistema</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Logs de Seguridad
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'audit' ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Caja Negra (DB)
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{logs.length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Eventos Totales</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{logs.filter(l => l.severity === 'critico' || l.severity === 'alto').length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alertas Críticas</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{auditTrail.length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cambios en DB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder={`Buscar en ${activeTab === 'logs' ? 'eventos de seguridad' : 'la caja negra'}...`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white"
            />
          </div>
          <button 
            onClick={fetchSecurityData}
            className="flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'logs' ? (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-5 text-left">Momento</th>
                  <th className="px-8 py-5 text-left">Evento / Descripción</th>
                  <th className="px-8 py-5 text-left">Origen (IP)</th>
                  <th className="px-8 py-5 text-left">Severidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{new Date(log.created_at).toLocaleTimeString()}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${severityStyles[log.severity]}`}>
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white capitalize">{log.event_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-md truncate">{log.description}</p>
                          {log.email && <p className="text-[10px] text-indigo-500 font-bold mt-1">{log.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Globe className="w-3.5 h-3.5 opacity-50" />
                        <span className="text-xs font-mono font-medium">{log.ip_address}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${severityStyles[log.severity]}`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-5 text-left">Momento</th>
                  <th className="px-8 py-5 text-left">Acción / Entidad</th>
                  <th className="px-8 py-5 text-left">Detalle Forense (JSON)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredAudit.map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-8 align-top whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{new Date(audit.created_at).toLocaleTimeString()}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(audit.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1.5 mt-3 text-slate-400">
                           <User className="w-3 h-3" />
                           <span className="text-[10px] font-bold">{audit.email || 'SYSTEM'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8 align-top">
                      <div className="flex flex-col gap-2">
                        <span className={`px-2 py-1 rounded text-[9px] font-black w-fit uppercase ${actionStyles[audit.action]}`}>
                          {audit.action}
                        </span>
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">{audit.table_name} <span className="text-indigo-500">#{audit.record_id}</span></span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-1 italic">IP: {audit.ip_address}</p>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {audit.old_values && (
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Estado Anterior
                            </p>
                            <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {JSON.stringify(JSON.parse(audit.old_values), null, 2)}
                            </pre>
                          </div>
                        )}
                        {audit.new_values && (
                          <div className="bg-emerald-50/30 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Nuevo Estado
                            </p>
                            <pre className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {JSON.stringify(JSON.parse(audit.new_values), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && (activeTab === 'logs' ? filteredLogs.length === 0 : filteredAudit.length === 0) && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium italic">No se encontraron registros que coincidan con la búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
