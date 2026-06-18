'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Bell, Mail, Info, CheckCircle, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  _id: string
  title: string
  message: string
  type: 'invitation' | 'content' | 'system'
  related_id?: string
  is_read: boolean
  created_at: string
}

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications')
      setNotifications(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`)
      setNotifications(notifications.map(n => n._id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      console.error(err)
    }
  }

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all')
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-500" /> Notificaciones
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Mantente al tanto de tus invitaciones y novedades del sistema.
          </p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllRead}
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Todo al día</h2>
          <p className="text-slate-500 dark:text-slate-400">No tienes notificaciones nuevas por ahora.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`group bg-white dark:bg-slate-900 p-6 rounded-3xl border transition-all duration-300 flex gap-4 ${
                n.is_read 
                  ? 'border-slate-100 dark:border-slate-800 opacity-70' 
                  : 'border-indigo-100 dark:border-indigo-500/30 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/10'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                n.type === 'invitation' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                n.type === 'content' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500'
              }`}>
                {n.type === 'invitation' ? <Mail className="w-6 h-6" /> :
                 n.type === 'content' ? <CheckCircle className="w-6 h-6" /> :
                 <Info className="w-6 h-6" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-bold ${n.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                    {n.title}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  {n.message}
                </p>
                
                <div className="flex items-center gap-4">
                  {n.related_id && n.type === 'invitation' && (
                    <Link
                      href={`/contenidos/${n.related_id}`}
                      className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Ver Contenido <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n._id)}
                      className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      Marcar como leída
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
