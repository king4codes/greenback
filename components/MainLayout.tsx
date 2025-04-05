'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Settings, Users, MessageSquare, Paintbrush, Wallet, ImageIcon, ClipboardCopy, ExternalLink, LogOut, BarChart2, Building2, Trophy, RefreshCw } from 'lucide-react'
import AvatarScene from './AvatarScene'
import AchievementBadge from './AchievementBadge'
import WalletInfo from './WalletInfo'
import { RealtimeChat } from './realtime-chat'
import { useWalletStatus, useSolanaBalance } from '@/lib/solana/hooks'
import WalletConnect from './WalletConnect'
import { useAchievements } from '@/hooks/use-achievements'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase-browser'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isRightColumnExpanded, setIsRightColumnExpanded] = useState(true)
  const { user } = useAuth()
  
  const { 
    address, 
    formattedAddress,
    connected,
    disconnect
  } = useWalletStatus()
  
  const { balance } = useSolanaBalance()
  const { achievements, isLoading, error } = useAchievements()

  const navigation = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Community', icon: Users, href: '/community' },
    { name: 'Draw', icon: Paintbrush, href: '/draw' },
    { name: 'Markets', icon: BarChart2, href: '/markets' },
    { name: 'Trading', icon: RefreshCw, href: '/trading' },
    { name: 'NFT Collection', icon: ImageIcon, href: '/nft' },
    { name: 'Banking', icon: Building2, href: '/banking' },
    { name: 'Achievements', icon: Trophy, href: '/achievements' },
    { name: 'Wallet', icon: Wallet, href: '/wallet' },
    { name: 'Settings', icon: Settings, href: '/settings' },
    { 
      name: user ? 'Logout' : 'Login', 
      icon: LogOut, 
      href: '/login'
    }
  ]

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black/95 flex items-center justify-center">
      <div className="w-[90vw] h-[90vh] bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800 shadow-2xl flex relative overflow-hidden">
        {/* Floating Dock */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-800/90 backdrop-blur-sm px-4 py-2 rounded-full border border-zinc-700 flex gap-4 z-50">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <button
                key={item.name}
                onClick={async () => {
                  if (item.name === 'Logout') {
                    try {
                      // First sign out from Supabase client
                      await supabase.auth.signOut()
                      
                      // Then call our API to clear cookies
                      await fetch('/api/auth/signout', {
                        method: 'GET',
                        credentials: 'include'
                      })

                      // Redirect to login
                      window.location.href = '/login'
                    } catch (error) {
                      console.error('Error signing out:', error)
                    }
                  } else {
                    router.push(item.href)
                  }
                }}
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-green-400"
                    : "text-zinc-400 hover:text-green-300"
                )}
                title={item.name}
              >
                <Icon size={20} />
              </button>
            )
          })}
        </div>

        {/* Left Column - Profile */}
        <div className="w-[300px] border-r border-zinc-800 p-6 flex flex-col gap-6">
          <div className="aspect-square w-full rounded-lg overflow-hidden">
            <AvatarScene isProfileView={true} />
          </div>
          <div className="space-y-2">
            <h2 className="font-garamond text-xl text-green-400">{user?.display_name || 'Guest'}</h2>
            <p className="font-mono text-xs text-zinc-400">Member since {new Date(user?.created_at || Date.now()).getFullYear()}</p>
          </div>
          <div className="space-y-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h3 className="font-mono text-sm text-zinc-400 mb-3">Achievements</h3>
              <div className="flex flex-wrap gap-2">
                {isLoading ? (
                  <div className="animate-pulse text-zinc-500 text-sm">
                    Loading achievements...
                  </div>
                ) : error ? (
                  <div className="text-red-400 text-sm">
                    Failed to load achievements
                  </div>
                ) : achievements.filter(a => a.earned).length === 0 ? (
                  <div className="text-zinc-500 text-sm">
                    No achievements yet
                  </div>
                ) : (
                  achievements
                    .filter(a => a.earned)
                    .sort((a, b) => {
                      // Sort by rank (legendary first)
                      const rankOrder = {
                        legendary: 0,
                        epic: 1,
                        rare: 2,
                        uncommon: 3,
                        basic: 4
                      };
                      return rankOrder[a.rank] - rankOrder[b.rank];
                    })
                    .map((achievement) => (
                      <AchievementBadge 
                        key={achievement.id} 
                        {...achievement} 
                        showProgress={false}
                      />
                    ))
                )}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h3 className="font-mono text-sm text-zinc-400 mb-3">Wallet</h3>
              <div className="mt-2">
                {address ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        ◎ Solana
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-mono text-green-400">
                        {balance?.toFixed(4) || '0.0000'} SOL
                      </span>
                      {address && (
                        <button
                          onClick={() => {
                            if (typeof disconnect === 'function') {
                              disconnect();
                            }
                          }}
                          className="p-1.5 bg-red-900/30 text-red-400 hover:bg-red-800/40 rounded-md"
                          title="Disconnect wallet"
                        >
                          <LogOut className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400">
                      <span className="text-xs font-mono block truncate">
                        {formattedAddress}
                      </span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(address || '')}
                        className="p-1 rounded hover:bg-zinc-700"
                      >
                        <ClipboardCopy className="w-3 h-3" />
                      </button>
                      <a 
                        href={`https://solscan.io/account/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-zinc-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="block text-sm font-mono text-zinc-400 mb-2">Connect your wallet</span>
                    <WalletConnect />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Main Content */}
        <div className={cn(
          "flex-1 p-6 transition-all duration-300",
          isRightColumnExpanded ? "mr-[300px]" : ""
        )}>
          <div className="w-full h-full bg-zinc-800/30 rounded-lg p-6">
            {children}
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className={cn(
          "fixed top-0 right-0 w-[300px] h-full border-l border-zinc-800 transition-all duration-300 bg-zinc-900/80",
          isRightColumnExpanded ? "translate-x-0" : "translate-x-full"
        )}>
          <button 
            onClick={() => setIsRightColumnExpanded(!isRightColumnExpanded)}
            className="absolute -left-4 top-1/2 -translate-y-1/2 bg-zinc-800 text-green-400 p-1 rounded-full hover:text-green-300"
          >
            <MessageSquare size={16} />
          </button>
          <div className="h-full">
            <RealtimeChat
              roomName="main-lobby"
              username={user?.display_name || 'Guest'}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 