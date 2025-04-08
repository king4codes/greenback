import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { UIState } from './types'

const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'dark',
        sidebarOpen: true,
        chatOpen: true,
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({ theme: state.theme }),
      }
    )
  )
)

// Selector hooks for optimized re-renders
export const useTheme = () => useUIStore((state) => state.theme)
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen)
export const useChatOpen = () => useUIStore((state) => state.chatOpen)

export default useUIStore 