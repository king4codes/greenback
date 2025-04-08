import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { UserState } from './types'

const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        loading: false,
        error: null,
        setUser: (user) => set({ user }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ user: state.user }),
      }
    )
  )
)

// Selector hooks for optimized re-renders
export const useUser = () => useUserStore((state) => state.user)
export const useUserLoading = () => useUserStore((state) => state.loading)
export const useUserError = () => useUserStore((state) => state.error)

export default useUserStore 