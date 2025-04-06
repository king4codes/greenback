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
    <div className="fixed top-0 left-0 w-screen h-screen bg-[#1A0F0A] flex items-center justify-center">
      <div className="w-[90vw] h-[90vh] rs-container flex relative overflow-hidden">
        {/* Floating Navigation */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rs-container z-50 px-4 py-2">
          <div className="relative z-10 flex gap-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <button
                  key={item.name}
                  onClick={async () => {
                    if (item.name === 'Logout') {
                      try {
                        await supabase.auth.signOut()
                        await fetch('/api/auth/signout', {
                          method: 'GET',
                          credentials: 'include'
                        })
                        window.location.href = '/login'
                      } catch (error) {
                        console.error('Error signing out:', error)
                      }
                    } else {
                      router.push(item.href)
                    }
                  }}
                  className={cn(
                    "transition-colors p-2 rounded-md relative group",
                    isActive
                      ? "text-[#FFD700]"
                      : "text-[#C0C0C0] hover:text-[#FFD700]"
                  )}
                  title={item.name}
                >
                  <Icon size={20} className="relative z-10" />
                  <div className="absolute inset-0 bg-black/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Left Column - Profile */}
        <div className="w-[300px] rs-container p-6 flex flex-col gap-6">
          <div className="aspect-square w-full rounded-lg overflow-hidden rs-container">
            <div className="relative z-10">
              <AvatarScene isProfileView={true} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="rs-title text-xl">{user?.display_name || 'Guest'}</h2>
            <p className="rs-text text-xs">Member since {new Date(user?.created_at || Date.now()).getFullYear()}</p>
          </div>
          <div className="space-y-4">
            <div className="rs-container p-4">
              <h3 className="rs-text text-sm mb-3">Achievements</h3>
              <div className="flex flex-wrap gap-2">
                {isLoading ? (
                  <div className="animate-pulse text-[#5C4A3D] text-sm">
                    Loading achievements...
                  </div>
                ) : error ? (
                  <div className="text-red-400 text-sm">
                    Failed to load achievements
                  </div>
                ) : achievements.filter(a => a.earned).length === 0 ? (
                  <div className="text-[#5C4A3D] text-sm">
                    No achievements yet
                  </div>
                ) : (
                  achievements
                    .filter(a => a.earned)
                    .sort((a, b) => {
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

            <div className="rs-container p-4">
              <h3 className="rs-text text-sm mb-3">Wallet</h3>
              {connected ? (
                <div className="space-y-2">
                  <WalletInfo />
                  <div className="flex items-center gap-1 text-[#C0C0C0]">
                    <span className="text-xs font-mono block truncate">
                      {formattedAddress}
                    </span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(address || '')}
                      className="p-1 rounded hover:bg-black/20"
                    >
                      <ClipboardCopy className="w-3 h-3" />
                    </button>
                    <a 
                      href={`https://solscan.io/account/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-black/20"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <span className="block text-sm rs-text mb-2">Connect your wallet</span>
                  <WalletConnect />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Column - Main Content */}
        <div className={cn(
          "flex-1 p-6 transition-all duration-300",
          isRightColumnExpanded ? "mr-[300px]" : ""
        )}>
          <div className="w-full h-full rs-container p-6">
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className={cn(
          "absolute top-0 right-0 w-[300px] h-full transition-transform duration-300",
          isRightColumnExpanded ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="h-full rs-container">
            <div className="relative z-10 h-full">
              <RealtimeChat
                roomName="main-lobby"
                username={user?.display_name || 'Guest'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 