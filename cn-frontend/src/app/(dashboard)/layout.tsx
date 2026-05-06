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
  GraduationCap,
  FileText,
  BarChart3
} from 'lucide-react'

const getNavSections = (role: string) => {
  const sections = [
    {
      title: 'Aprendizaje',
      items: [
        {
          href: '/dashboard',
          label: 'Inicio',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          href: '/contenidos',
          label: 'Catálogo',
          icon: <BookOpen className="w-5 h-5" />,
        },
        {
          href: '/rutas',
          label: 'Rutas',
          icon: <MapIcon className="w-5 h-5" />,
        },
        {
          href: '/mis-cursos',
          label: 'Mi Estudio',
          icon: <GraduationCap className="w-5 h-5" />,
        },
        {
          href: '/notificaciones',
          label: 'Notificaciones',
          icon: <Bell className="w-5 h-5" />,
        },
      ]
    },
    {
      title: 'Cuenta',
      items: [
        {
          href: '/perfil',
          label: 'Mi Perfil',
          icon: <User className="w-5 h-5" />,
        },
      ]
    }
  ];

  if (role === 'teacher' || role === 'admin') {
    sections.splice(1, 0, {
      title: 'Instructor',
      items: [
        {
          href: '/subir',
          label: 'Subir Clase',
          icon: <Upload className="w-5 h-5" />,
        },
        {
          href: '/mis-contenidos',
          label: 'Mis Contenidos',
          icon: <FileText className="w-5 h-5" />,
        },
        {
          href: '/metricas',
          label: 'Métricas',
          icon: <BarChart3 className="w-5 h-5" />,
        },
      ]
    });
  }

  if (role === 'admin') {
    sections.push({
      title: 'Sistema',
      items: [
        {
          href: '/admin',
          label: 'Panel Admin',
          icon: <Shield className="w-5 h-5" />,
        },
      ]
    });
  }

  return sections;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, token, logout, viewMode } = useAuthStore()

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

  if (!mounted) return null

  const sections = getNavSections(user?.role || 'student')

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 dark:bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-20">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/30">
              <span className="text-white font-bold text-xl drop-shadow-sm">C</span>
            </div>
            <div>
              <p className="text-base font-bold text-white tracking-wide">Pathly</p>
              <p className="text-xs text-indigo-200 dark:text-indigo-300">CN Education</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                        active
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                    >
                      <div className={`transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                        {item.icon}
                      </div>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900 dark:bg-slate-900">
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
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">
              Welcome back, {mounted ? (user?.email?.split('@')[0] || 'User') : ''} 👋
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Ready to learn something new today?</p>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {mounted ? (user?.email || '') : ''}
                </p>
                <p className={`text-[10px] font-black uppercase tracking-tighter ${user?.role === 'admin' ? 'text-rose-600 dark:text-rose-400' :
                    user?.role === 'teacher' ? 'text-indigo-600 dark:text-indigo-400' :
                      'text-emerald-600 dark:text-emerald-400'
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