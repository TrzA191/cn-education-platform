'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard,
  BookOpen,
  Map as MapIcon,
  User,
  Upload,
  Shield,
  LogOut,
  Bell,
  GraduationCap
} from 'lucide-react'

const getNavItems = (role: string) => {
  const base = [
    {
      href: '/dashboard',
      label: 'Inicio',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      href: '/dashboard/contenidos',
      label: 'Contenidos',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      href: '/dashboard/rutas',
      label: 'Rutas de aprendizaje',
      icon: <MapIcon className="w-5 h-5" />,
    },
    {
      href: '/dashboard/perfil',
      label: 'Mi perfil',
      icon: <User className="w-5 h-5" />,
    },
  ]

  const teacherItems = [
    {
      href: '/subir',
      label: 'Subir contenido',
      icon: <Upload className="w-5 h-5" />,
    },
  ]

  const adminItems = [
    {
      href: '/admin',
      label: 'Panel admin',
      icon: <Shield className="w-5 h-5" />,
    },
    ...teacherItems,
  ]

  if (role === 'admin') return [...base, ...adminItems]
  if (role === 'teacher') return [...base, ...teacherItems]
  return base
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, token, logout } = useAuthStore()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !token) {
      router.push('/login')
    }
  }, [mounted, token])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Mientras no está hidratado, no renderiza nada (evita el flash y el redirect falso)
  if (!mounted) return null

  const navItems = getNavItems(user?.role || 'student')

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex flex-col md:flex-row">
      {/* 
        Sidebar (Dark mode style as requested) 
        - bg-indigo-950 for a premium dark blue/indigo feel over plain black/gray900
      */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white tracking-tight">Pathly</p>
              <p className="text-xs text-indigo-300 font-medium tracking-wide">CN Education</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-2">Menu Principal</p>
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${active
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                  }`}
              >
                <div className={active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800">
              Welcome back, {mounted ? (user?.email?.split('@')[0] || 'User') : ''} 👋
            </h2>
            <p className="text-sm text-gray-500">Ready to learn something new today?</p>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-gray-400 hover:text-indigo-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">
                  {mounted ? (user?.email || '') : ''}
                </p>
                <p className={`text-xs font-medium capitalize ${
                  user?.role === 'admin' ? 'text-red-600' :
                  user?.role === 'teacher' ? 'text-blue-600' :
                  'text-emerald-600'
                }`}>
                  {mounted ? (user?.role || 'student') : ''}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold">
                {user?.email?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}