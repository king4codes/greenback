import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { WalletState } from './types'

const useWalletStore = create<WalletState>()(
  devtools(
    persist(
      (set) => ({
        connected: false,
        address: null,
        balance: 0,
        loading: false,
        error: null,
        setConnected: (connected) => set({ connected }),
        setAddress: (address) => set({ address }),
        setBalance: (balance) => set({ balance }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'wallet-storage',
        partialize: (state) => ({
          connected: state.connected,
          address: state.address,
          balance: state.balance,
        }),
      }
    )
  )
)

// Selector hooks for optimized re-renders
export const useWalletConnected = () => useWalletStore((state) => state.connected)
export const useWalletAddress = () => useWalletStore((state) => state.address)
export const useWalletBalance = () => useWalletStore((state) => state.balance)
export const useWalletLoading = () => useWalletStore((state) => state.loading)
export const useWalletError = () => useWalletStore((state) => state.error)

export default useWalletStore 