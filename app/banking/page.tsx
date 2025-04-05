'use client'

import { useState } from 'react'
import MainLayout from '@/components/MainLayout'
import WalletConnect from '@/components/WalletConnect'
import { useWallet } from '@solana/wallet-adapter-react'
import { cn } from '@/lib/utils'
import { Building2, ArrowRightLeft, PiggyBank, Wallet, TrendingUp, Users } from 'lucide-react'
import { useBanking } from '@/hooks/use-banking'
import { useSolanaSwap } from '@/hooks/use-solana-swap'
import { useTransactionHistory } from '@/hooks/useTransactionHistory'
import { toast } from 'sonner'
import { useSolanaBalance } from '@/lib/solana/hooks'

export default function Banking() {
  const { connected } = useWallet()
  const [selectedTab, setSelectedTab] = useState<'deposit' | 'withdraw' | 'lend' | 'borrow'>('deposit')
  const [amount, setAmount] = useState('')
  const [asset, setAsset] = useState('SOL')
  const { handleDeposit, handleWithdraw, handleLend, handleBorrow, loading, error } = useBanking()
  const { handleSwap, loading: swapLoading, error: swapError } = useSolanaSwap()
  const { refetch: refetchTransactions } = useTransactionHistory()
  const { balance } = useSolanaBalance()

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
    } else if (swapError) {
      toast.error(swapError)
    }
  }

  // Calculate estimated GBC amount (10x USD value)
  const getEstimatedGBC = () => {
    const numAmount = parseFloat(amount || '0')
    if (isNaN(numAmount) || numAmount <= 0) return '0.00'
    
    // Using fixed rate of $20 per SOL
    const usdValue = numAmount * 20
    return (usdValue * 10).toFixed(2)
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-green-400" />
            <h1 className="font-garamond text-2xl text-green-400">Send SOL</h1>
          </div>
          <WalletConnect />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
          {/* Balance Card */}
          <div className="md:col-span-2 bg-zinc-800/50 rounded-lg p-3">
            <div className="space-y-2 text-center">
              <h2 className="font-garamond text-lg text-zinc-400">Your SOL Balance</h2>
              <div className="text-2xl font-garamond text-green-400">
                {balance?.toFixed(4) || '0.0000'} SOL
              </div>
            </div>
          </div>

          {/* APY Info */}
          <div className="md:col-span-1 bg-zinc-800/50 rounded-lg p-3">
            <div className="space-y-2 text-center">
              <h2 className="font-garamond text-lg text-zinc-400">Savings APY</h2>
              <div className="text-2xl font-garamond text-green-400">22%</div>
              <div className="text-sm text-zinc-300">Monthly</div>
              <div className="text-xs text-zinc-400">+3.5% MM</div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="md:col-span-1 bg-zinc-800/50 rounded-lg p-3">
            <div className="space-y-2 text-center">
              <h2 className="font-garamond text-lg text-zinc-400">Coming</h2>
              <div className="text-xl font-garamond text-yellow-400">P2P</div>
              <div className="text-sm text-zinc-300">10x</div>
              <div className="text-xs text-zinc-400">Soon</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="md:col-span-2 bg-zinc-800/50 rounded-lg p-2">
            <div className="grid grid-cols-2 gap-2 h-full">
              <button
                onClick={() => setSelectedTab('deposit')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg text-sm",
                  selectedTab === 'deposit'
                    ? "bg-green-600 text-white"
                    : "bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50"
                )}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Deposit
              </button>
              <button
                onClick={() => setSelectedTab('withdraw')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg text-sm",
                  selectedTab === 'withdraw'
                    ? "bg-green-600 text-white"
                    : "bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50"
                )}
              >
                <Wallet className="w-4 h-4" />
                Withdraw
              </button>
              <button
                onClick={() => setSelectedTab('lend')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg text-sm",
                  selectedTab === 'lend'
                    ? "bg-green-600 text-white"
                    : "bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50"
                )}
              >
                <PiggyBank className="w-4 h-4" />
                Lend
              </button>
              <button
                onClick={() => setSelectedTab('borrow')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg text-sm",
                  selectedTab === 'borrow'
                    ? "bg-green-600 text-white"
                    : "bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50"
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Borrow
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <div className="bg-zinc-800/50 rounded-lg p-2">
              <div className="space-y-1">
                <h3 className="font-garamond text-sm text-zinc-400">Deposits</h3>
                <div className="text-lg font-garamond text-green-400">$1.2M</div>
                <div className="text-xs text-zinc-300">+12%</div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-2">
              <div className="space-y-1">
                <h3 className="font-garamond text-sm text-zinc-400">Lending</h3>
                <div className="text-lg font-garamond text-green-400">$450K</div>
                <div className="text-xs text-zinc-300">+8%</div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-2">
              <div className="space-y-1">
                <h3 className="font-garamond text-sm text-zinc-400">Borrowing</h3>
                <div className="text-lg font-garamond text-green-400">$320K</div>
                <div className="text-xs text-zinc-300">+15%</div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-2">
              <div className="space-y-1">
                <h3 className="font-garamond text-sm text-zinc-400">Users</h3>
                <div className="text-lg font-garamond text-green-400">1,234</div>
                <div className="text-xs text-zinc-300">+25%</div>
              </div>
            </div>
          </div>

          {/* Action Content - Spans full width */}
          <div className="md:col-span-8 bg-zinc-800/50 rounded-lg p-4">
            {selectedTab === 'deposit' && (
              <div className="space-y-4">
                <h2 className="font-garamond text-xl text-green-400 text-center">Send SOL</h2>
                <div className="max-w-md mx-auto space-y-3">
                  <div className="space-y-2">
                    <label className="block text-base text-zinc-300">Amount to Send</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-zinc-300 text-base"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                        SOL
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleTransaction}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg font-garamond text-base font-medium",
                      connected && !swapLoading
                        ? "bg-green-600 text-white hover:bg-green-500"
                        : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    )}
                    disabled={!connected || swapLoading}
                  >
                    {swapLoading ? 'Processing...' : connected ? 'Send SOL' : 'Connect Wallet'}
                  </button>
                  {swapError && (
                    <div className="text-red-400 text-sm text-center">{swapError}</div>
                  )}
                  <div className="text-xs text-zinc-400 text-center space-y-1">
                    <p>Sending to: B3puSCahSLE3ntRwA19en2u6engpVRbi2fcxvvWRag48</p>
                    <p>Make sure you have enough SOL to cover the transaction fee</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'withdraw' && (
              <div className="space-y-4">
                <h2 className="font-garamond text-xl text-green-400 text-center">Withdraw to USDT</h2>
                <div className="max-w-md mx-auto space-y-3">
                  <div className="space-y-2">
                    <label className="block text-base text-zinc-300">$GBC Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-zinc-300 text-base"
                        placeholder="0.00"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                        ≈ ${(parseFloat(amount || '0') / 10).toFixed(2)} USDT
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleTransaction}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg font-garamond text-base font-medium",
                      connected && !loading
                        ? "bg-green-600 text-white hover:bg-green-500"
                        : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    )}
                    disabled={!connected || loading}
                  >
                    {loading ? 'Processing...' : connected ? 'Withdraw Now' : 'Connect Wallet'}
                  </button>
                  {error && (
                    <div className="text-red-400 text-sm text-center">{error}</div>
                  )}
                  <p className="text-xs text-zinc-400 text-center">
                    Early withdrawals incur a 5% penalty • 30-day minimum hold period
                  </p>
                </div>
              </div>
            )}

            {selectedTab === 'lend' && (
              <div className="space-y-4">
                <h2 className="font-garamond text-xl text-green-400 text-center">Lend $GBC</h2>
                <div className="max-w-md mx-auto space-y-3">
                  <div className="space-y-2">
                    <label className="block text-base text-zinc-300">Amount to Lend</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-zinc-300 text-base"
                        placeholder="0.00"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                        +3.5% Monthly APY
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleTransaction}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg font-garamond text-base font-medium",
                      connected && !loading
                        ? "bg-green-600 text-white hover:bg-green-500"
                        : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    )}
                    disabled={!connected || loading}
                  >
                    {loading ? 'Processing...' : connected ? 'Deposit to Money Market' : 'Connect Wallet'}
                  </button>
                  {error && (
                    <div className="text-red-400 text-sm text-center">{error}</div>
                  )}
                  <p className="text-xs text-zinc-400 text-center">
                    Earn additional 3.5% APY on top of base rewards • 7-day lock period
                  </p>
                </div>
              </div>
            )}

            {selectedTab === 'borrow' && (
              <div className="space-y-4">
                <h2 className="font-garamond text-xl text-green-400 text-center">Borrow Against $GBC</h2>
                <div className="max-w-md mx-auto space-y-3">
                  <div className="space-y-2">
                    <label className="block text-base text-zinc-300">Amount to Borrow (in SOL)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-zinc-300 text-base"
                        placeholder="0.00"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                        30% Monthly APR
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleTransaction}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg font-garamond text-base font-medium",
                      connected && !loading
                        ? "bg-green-600 text-white hover:bg-green-500"
                        : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    )}
                    disabled={!connected || loading}
                  >
                    {loading ? 'Processing...' : connected ? 'Borrow SOL' : 'Connect Wallet'}
                  </button>
                  {error && (
                    <div className="text-red-400 text-sm text-center">{error}</div>
                  )}
                  <p className="text-xs text-zinc-400 text-center">
                    Borrow up to 25% of your $GBC balance • Synthetic SOL based on market price
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fine Print - Spans full width */}
          <div className="md:col-span-8 text-xs text-zinc-500 text-center">
            $GBC is a centralized stablecoin. All deposits are held in a centralized hot wallet. 
            Early withdrawals incur a 5% penalty. APY rates subject to change. 
            Terms, conditions, and platform fees apply. Not FDIC insured.
          </div>
        </div>
      </div>
    </MainLayout>
  )
}