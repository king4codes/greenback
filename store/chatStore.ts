import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { produce } from 'immer'
import { ChatState, ChatMessage } from './types'

const useChatStore = create<ChatState>()(
  devtools((set) => ({
    messages: [],
    loading: false,
    error: null,
    activeRoom: null,

    setMessages: (messages) => set({ messages }),

    addMessage: (message) =>
      set(
        produce((state: ChatState) => {
          state.messages.push(message)
        })
      ),

    updateMessage: (messageId, updates) =>
      set(
        produce((state: ChatState) => {
          const messageIndex = state.messages.findIndex((m) => m.id === messageId)
          if (messageIndex !== -1) {
            state.messages[messageIndex] = {
              ...state.messages[messageIndex],
              ...updates,
            }
          }
        })
      ),

    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setActiveRoom: (roomId) => set({ activeRoom: roomId }),
  }))
)

// Selector hooks for optimized re-renders
export const useMessages = () => useChatStore((state) => state.messages)
export const useChatLoading = () => useChatStore((state) => state.loading)
export const useChatError = () => useChatStore((state) => state.error)
export const useActiveRoom = () => useChatStore((state) => state.activeRoom)

export default useChatStore 