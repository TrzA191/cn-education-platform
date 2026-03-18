'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'

interface Profile {
  bio: string
  country: string
  timezone: string
  language: string
  avatar_url: string
}

export default function PerfilPage() {
  const { user, loadFromStorage } = useAuthStore()
  const [profile, setProfile] = useState<Profile>({
    bio: '', country: '', timezone: '', language: 'es', avatar_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadFromStorage()
    if (user?.userId) {
      api.get(`/api/users/${user.userId}/profile`)
        .then(res => {
          const data = res.data?.profile || res.data || {}
          setProfile({
            bio:        data.bio        || '',
            country:    data.country    || '',
            timezone:   data.timezone   || '',
            language:   data.language   || 'es',
            avatar_url: data.avatar_url || '',
          })
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [user?.userId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      await api.patch(`/api/users/${user?.userId}/profile`, profile)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <p className="text-gray-500 mt-1">Actualiza tu información personal</p>
      </div>

      {/* Avatar + info básica */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-600">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.email}</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
              user?.role === 'admin'   ? 'bg-red-50 text-red-700' :
              user?.role === 'teacher' ? 'bg-blue-50 text-blue-700' :
              'bg-green-50 text-green-700'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Información del perfil</h2>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Cuéntanos sobre ti..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <input
                  type="text"
                  value={profile.country}
                  onChange={e => setProfile({ ...profile, country: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="México"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                <select
                  value={profile.language}
                  onChange={e => setProfile({ ...profile, language: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
              <input
                type="text"
                value={profile.timezone}
                onChange={e => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="America/Mexico_City"
              />
            </div>

            {success && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                <p className="text-sm text-green-700">✓ Perfil actualizado correctamente</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}