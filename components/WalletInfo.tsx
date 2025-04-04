'use client'

import { useWalletStatus, useSolanaBalance } from '@/lib/solana/hooks'
import { Wallet, CircleAlert, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export default function WalletInfo() {
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
    error: balanceError
  } = useSolanaBalance()
  
  const [copied, setCopied] = useState(false)
  
  const copyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const getExplorerUrl = () => {
    if (!address) return '#'
    return `https://solscan.io/account/${address}`
  }
  
  if (!connected) {
    return (
      <div className="p-4 border border-zinc-800 rounded-lg text-center">
        <Wallet className="w-10 h-10 text-zinc-500 mx-auto mb-2" />
        <p className="text-zinc-400">Connect your wallet to view details</p>
      </div>
    )
  }
  
  if (connecting) {
    return (
      <div className="p-4 border border-zinc-800 rounded-lg text-center">
        <div className="animate-pulse">
          <Wallet className="w-10 h-10 text-zinc-500 mx-auto mb-2" />
          <p className="text-zinc-400">Connecting wallet...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 border border-zinc-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Wallet Details</h3>
        <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs">Connected</span>
      </div>
      
      {(connectionError || balanceError) && (
        <div className="mb-4 p-2 bg-red-900/20 border border-red-900/30 rounded flex items-start">
          <CircleAlert className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-400">{connectionError || balanceError}</p>
        </div>
      )}
      
      <div className="space-y-3">
        <div>
          <div className="text-xs text-zinc-500 mb-1">Wallet Provider</div>
          <div className="font-medium">{walletName || 'Unknown'}</div>
        </div>
        
        <div>
          <div className="text-xs text-zinc-500 mb-1">SOL Balance</div>
          <div className="font-medium">
            {balanceLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>{balance?.toFixed(6) || '0.000000'} SOL</>
            )}
          </div>
        </div>
        
        <div>
          <div className="text-xs text-zinc-500 mb-1">Wallet Address</div>
          <div className="font-mono text-sm truncate">{address}</div>
          <div className="mt-2 flex space-x-2">
            <button
              onClick={copyAddress}
              className="flex items-center text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded"
            >
              <Copy className="w-3 h-3 mr-1" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Explorer
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 