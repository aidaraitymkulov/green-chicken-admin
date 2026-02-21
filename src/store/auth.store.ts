import { create } from 'zustand'
import { authApi, type Admin } from '@/api/auth'

interface AuthState {
  admin: Admin | null
  checked: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  check: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  checked: false,

  check: async () => {
    try {
      const { data } = await authApi.me()
      set({ admin: data, checked: true })
    } catch {
      set({ admin: null, checked: true })
    }
  },

  login: async (email, password) => {
    await authApi.login(email, password)
    const { data } = await authApi.me()
    set({ admin: data })
  },

  logout: async () => {
    await authApi.logout()
    set({ admin: null })
  },
}))
