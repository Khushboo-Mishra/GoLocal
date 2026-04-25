import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isLoaded: boolean
  setUser: (user: User | null) => void
  setLoaded: () => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoaded: false,
  setUser: (user) => set({ user }),
  setLoaded: () => set({ isLoaded: true }),
  clearUser: () => set({ user: null }),
}))
