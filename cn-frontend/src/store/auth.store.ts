import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  userId: number
  email: string
  role: string
}

interface AuthState {
  token: string | null
  user: User | null
  viewMode: string // 'default', 'student', 'teacher'
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  setViewMode: (mode: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      viewMode: 'default',
      setAuth: (token, user) => set({ token, user, viewMode: 'default' }),
      setUser: (user) => set({ user }),
      setViewMode: (viewMode) => set({ viewMode }),
      logout: () => set({ token: null, user: null, viewMode: 'default' }),
    }),
    { name: 'auth-storage' }
  )
)