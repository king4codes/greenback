import { User } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
  reactions: {
    count: number
    hasReacted: boolean
  }
}

export interface UserState {
  user: User | null
  loading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  activeRoom: string | null
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setActiveRoom: (roomId: string | null) => void
}

export interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  chatOpen: boolean
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
  toggleChat: () => void
}

export interface WalletState {
  connected: boolean
  address: string | null
  balance: number
  loading: boolean
  error: string | null
  setConnected: (connected: boolean) => void
  setAddress: (address: string | null) => void
  setBalance: (balance: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
} 