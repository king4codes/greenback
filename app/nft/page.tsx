'use client'

import { useState } from 'react'
import MainLayout from '@/components/MainLayout'
import WalletConnect from '@/components/WalletConnect'
import { useNFTCollection } from '@/hooks/use-nft-collection'
import { useWallet } from '@solana/wallet-adapter-react'
import { Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Trait {
  name: string
  values: string[]
}

const traits: Trait[] = [
  { name: 'Background', values: ['Blue', 'Red', 'Green', 'Purple'] },
  { name: 'Eyes', values: ['Normal', 'Laser', 'Glowing', 'Rainbow'] },
  { name: 'Mouth', values: ['Smile', 'Frown', 'Laugh', 'Tongue'] },
  { name: 'Accessories', values: ['None', 'Glasses', 'Hat', 'Necklace'] }
]

export default function NFTCollection() {
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string[]>>({})
  const [searchNumber, setSearchNumber] = useState('')
  const [mintAmount, setMintAmount] = useState(1)
  const { connected } = useWallet()
  const { nfts, loading, error, fetchNFTs, filterNFTsByTraits } = useNFTCollection()

  const filteredNFTs = filterNFTsByTraits(selectedTraits)

  const handleTraitToggle = (traitName: string, value: string) => {
    setSelectedTraits(prev => {
      const currentValues = prev[traitName] || []
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      
      return {
        ...prev,
        [traitName]: newValues
      }
    })
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="font-garamond text-3xl text-green-400">Compute Quants Collective</h1>
          <WalletConnect />
        </div>

        {/* Collection Info and Minting Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* NFT Image */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="w-full aspect-square rounded-lg overflow-hidden">
              <img
                src="https://aupfufxxvbwmdiewjeka.supabase.co/storage/v1/object/public/avatars//nft.gif"
                alt="NFT Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Mint UI */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="space-y-4 font-garamond text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-zinc-400 text-xl">Price</span>
                <span className="text-3xl text-green-400">1 SOL</span>
              </div>
              
              <div className="space-y-2.5 text-lg">
                <div className="text-zinc-300">Supply: <span className="text-green-400">3,000</span></div>
                <div className="text-zinc-300">Points: <span className="text-green-400">10,000</span></div>
                <div className="text-zinc-300">Current: <span className="text-green-400">0</span></div>
                <div className="text-zinc-300">Status: <span className="text-yellow-400">Coming Soon</span></div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="text-zinc-400 text-lg">Amount:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20 px-3 py-2 bg-zinc-800 rounded text-lg text-zinc-300 text-center"
                  />
                </div>
                <button 
                  className={cn(
                    "w-full px-4 py-2.5 rounded text-lg font-medium",
                    connected 
                      ? "bg-green-600 text-white hover:bg-green-500" 
                      : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  )}
                  disabled={!connected}
                >
                  {connected ? 'Mint NFT' : 'Connect Wallet'}
                </button>
              </div>
            </div>
          </div>

          {/* Rewards Calculator */}
          <div className="bg-zinc-800/50 rounded-lg p-4 md:col-span-2">
            <h2 className="font-garamond text-2xl text-green-400 mb-4 text-center">Rewards Calculator</h2>
            
            <div className="space-y-4">
              {/* NFT Holdings Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 rounded-lg">
                  <span className="font-garamond text-xl text-zinc-300">Your NFTs</span>
                  <span className="font-garamond text-xl text-green-400">{filteredNFTs.length}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 rounded-lg">
                  <span className="font-garamond text-xl text-zinc-300">Multiplier</span>
                  <span className="font-garamond text-xl text-green-400">
                    +{Math.floor(filteredNFTs.length / 5) * 10}%
                  </span>
                </div>
              </div>

              {/* Token Generation Breakdown */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 rounded-lg">
                  <span className="font-garamond text-lg text-zinc-300">Base Rate</span>
                  <span className="font-garamond text-lg text-green-400">100 / day</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 rounded-lg">
                  <span className="font-garamond text-lg text-zinc-300">Mint Bonus</span>
                  <span className="font-garamond text-lg text-green-400">+50 / day</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 rounded-lg">
                  <span className="font-garamond text-lg text-zinc-300">Secondary</span>
                  <span className="font-garamond text-lg text-green-400">+10 / day</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 rounded-lg">
                  <span className="font-garamond text-lg text-zinc-300">30-Day Hold</span>
                  <span className="font-garamond text-lg text-green-400">+25 / day</span>
                </div>
              </div>

              {/* Total Rewards and Timer */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                  <div className="space-y-1">
                    <div className="font-garamond text-3xl text-green-400">
                      1,234 Tokens
                    </div>
                    <div className="font-garamond text-lg text-zinc-400">
                      Available to Claim
                    </div>
                  </div>
                  <button 
                    className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 font-garamond text-lg font-medium disabled:bg-zinc-700 disabled:text-zinc-400 disabled:cursor-not-allowed"
                    disabled={!connected}
                  >
                    {connected ? 'Claim Rewards' : 'Connect Wallet'}
                  </button>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4 text-center flex flex-col justify-center">
                  <div className="font-garamond text-lg text-zinc-300">Next Reward In</div>
                  <div className="font-garamond text-2xl text-yellow-400">23:45:12</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Membership Perks Card */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <h2 className="font-garamond text-2xl text-green-400 mb-4 text-center">Membership Perks</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 justify-center">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                <span className="font-garamond text-lg text-zinc-300">Executive Lounge Access</span>
              </li>
              <li className="flex items-center gap-3 justify-center">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                <span className="font-garamond text-lg text-zinc-300">Highest Tier Eco-System Benefits</span>
              </li>
              <li className="flex items-center gap-3 justify-center">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                <span className="font-garamond text-lg text-zinc-300">Bonus Points & Point Multiplier</span>
              </li>
            </ul>
          </div>

          {/* Additional Benefits Card */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <h2 className="font-garamond text-2xl text-green-400 mb-4 text-center">Additional Benefits</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 justify-center">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                <span className="font-garamond text-lg text-zinc-300">Access More Site Features</span>
              </li>
              <li className="flex items-center gap-3 justify-center">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                <span className="font-garamond text-lg text-zinc-300">Get Whitelisted for Early Access</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 