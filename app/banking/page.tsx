'use client'

import { useState } from 'react'
import MainLayout from '@/components/MainLayout'
import WalletConnect from '@/components/WalletConnect'
import { useWallet } from '@solana/wallet-adapter-react'
import { cn } from '@/lib/utils'
import { ArrowRightLeft } from 'lucide-react'
import { useSolanaSwap } from '@/hooks/use-solana-swap'
import { useTransactionHistory } from '@/hooks/useTransactionHistory'
import { toast } from 'sonner'
import { useSolanaBalance } from '@/lib/solana/hooks'

export default function Banking() {
  const { connected } = useWallet()
  const [amount, setAmount] = useState('')
  const { handleSwap, loading, error } = useSolanaSwap()
  const { balance } = useSolanaBalance()
  const { refetch: refetchTransactions } = useTransactionHistory()

  const handleTransaction = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (balance && numAmount > balance) {
      toast.error('Insufficient SOL balance')
      return
    }

    const result = await handleSwap(numAmount)
    if (result) {
      toast.success(`Successfully sent ${numAmount} SOL`)
      setAmount('')
      refetchTransactions()
    } else if (error) {
      toast.error(error)
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-green-400" />
              <h1 className="text-xl font-medium text-green-400">Send SOL</h1>
            </div>
            <WalletConnect />
          </div>

          {/* Balance */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <div className="text-sm text-zinc-400">Your Balance</div>
            <div className="text-2xl font-medium text-green-400">
              {balance?.toFixed(4) || '0.0000'} SOL
            </div>
          </div>

          {/* Send Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm text-zinc-300">Amount to Send</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 rounded-lg text-zinc-100 text-lg"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
                  SOL
                </div>
              </div>
            </div>

            <button
              onClick={handleTransaction}
              disabled={!connected || loading}
              className={cn(
                "w-full py-3 rounded-lg text-base font-medium transition",
                connected && !loading
                  ? "bg-green-600 text-white hover:bg-green-500"
                  : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              )}
            >
              {loading ? 'Sending...' : connected ? 'Send SOL' : 'Connect Wallet'}
            </button>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            {/* Recipient Info */}
            <div className="bg-zinc-800/30 rounded-lg p-4 space-y-2">
              <div className="text-sm text-zinc-400">Sending to:</div>
              <div className="font-mono text-xs text-zinc-300 break-all">
                B3puSCahSLE3ntRwA19en2u6engpVRbi2fcxvvWRag48
              </div>
              <div className="text-xs text-zinc-500">
                Make sure you have enough SOL to cover the network fee
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}