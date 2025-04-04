'use client'

import { useState } from 'react'
import MainLayout from '@/components/MainLayout'
import WalletConnect from '@/components/WalletConnect'
import TransactionHistory from '@/components/TransactionHistory'
import { useWalletStatus, useSolanaBalance } from '@/lib/solana/hooks'
import { RefreshCw, Copy, ExternalLink, Coins, Send, QrCode, Download } from 'lucide-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

export default function WalletPage() {
  const { 
    address, 
    formattedAddress,
    connected,
    connecting,
    walletName,
    error: connectionError
  } = useWalletStatus()
  
  const {
    balance,
    loading: balanceLoading,
    error: balanceError,
    refetch: refreshBalance
  } = useSolanaBalance()
  
  const { setVisible } = useWalletModal()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshBalance = async () => {
    setIsRefreshing(true)
    await refreshBalance()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  const getExplorerUrl = () => {
    if (!address) return '#'
    return `https://solscan.io/account/${address}`
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="font-garamond text-2xl text-green-400">Wallet</h1>
          {!connected && <WalletConnect />}
        </div>

        {connected ? (
          <>
            {/* Wallet Overview Card */}
            <div className="bg-zinc-800/50 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-zinc-500 font-mono mb-1">Connected with {walletName}</div>
                  <div className="font-mono text-2xl text-green-400 flex items-center">
                    <Coins className="w-5 h-5 mr-2" />
                    {balanceLoading ? 'Loading...' : `${balance?.toFixed(4) || '0.0000'} SOL`}
                    <button 
                      onClick={handleRefreshBalance} 
                      className={`ml-2 p-1 rounded hover:bg-zinc-700 ${isRefreshing ? 'animate-spin' : ''}`}
                      disabled={balanceLoading}
                    >
                      <RefreshCw className="h-4 w-4 text-zinc-400" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button className="p-2 bg-zinc-700 rounded hover:bg-zinc-600 text-zinc-200">
                    <Send className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-zinc-700 rounded hover:bg-zinc-600 text-zinc-200">
                    <QrCode className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-zinc-700 rounded hover:bg-zinc-600 text-zinc-200">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-zinc-700/50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-zinc-500 font-mono">Address</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyAddress}
                      className="p-1 rounded hover:bg-zinc-700 text-zinc-400"
                      title="Copy address"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <a 
                      href={getExplorerUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-zinc-700 text-zinc-400"
                      title="View on explorer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-sm mt-1 break-all">{address}</div>
              </div>
              
              {(connectionError || balanceError) && (
                <div className="mt-4 p-2 bg-red-900/20 border border-red-900/30 rounded text-xs text-red-400">
                  {connectionError || balanceError}
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div className="bg-zinc-800/50 rounded-lg p-6">
              <TransactionHistory />
            </div>
          </>
        ) : (
          <div className="bg-zinc-800/30 rounded-lg p-16 text-center">
            <h2 className="font-garamond text-xl text-green-400 mb-4">Connect Your Wallet</h2>
            <p className="text-zinc-400 font-mono text-sm mb-6">Connect your wallet to view your balance and transactions</p>
            <button
              onClick={() => setVisible(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-mono text-white bg-green-800 rounded hover:bg-green-700"
            >
              <Coins className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  )
} 