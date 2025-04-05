'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Wallet, 
  LineChart, 
  Paintbrush, 
  Building2, 
  MessageSquare,
  RefreshCw,
  Settings
} from 'lucide-react'

export default function FloatingDock() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm rounded-2xl p-2 border border-zinc-800 shadow-xl">
      <div className="flex items-center gap-1">
        <Link href="/" className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
          pathname === '/'
            ? "text-green-400 bg-zinc-800"
            : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800/50"
        )}>
          <Home className="w-5 h-5" />
          <span className="text-xs">Home</span>
        </Link>

        <Link href="/wallet" className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
          pathname === '/wallet'
            ? "text-green-400 bg-zinc-800"
            : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800/50"
        )}>
          <Wallet className="w-5 h-5" />
          <span className="text-xs">Wallet</span>
        </Link>

        <Link href="/markets" className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
          pathname === '/markets'
            ? "text-green-400 bg-zinc-800"
            : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800/50"
        )}>
          <LineChart className="w-5 h-5" />
          <span className="text-xs">Markets</span>
        </Link>

        <Link href="/trading" className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
          pathname === '/trading'
            ? "text-green-400 bg-zinc-800"
            : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800/50"
        )}>
          <RefreshCw className="w-5 h-5" />
          <span className="text-xs">Trading</span>
        </Link>

        <Link href="/draw" className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
          pathname === '/draw'
            ? "text-green-400 bg-zinc-800"
            : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800/50"
        )}>
          <Paintbrush className="w-5 h-5" />
          <span className="text-xs">Draw</span>
        </Link>

        <Link href="/banking" className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
          pathname === '/banking'
            ? "text-green-400 bg-zinc-800"
            : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800/50"
        )}>
          <Building2 className="w-5 h-5" />
          <span className="text-xs">Banking</span>
        </Link>

        <Link href="/chat" className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
          pathname === '/chat'
            ? "text-green-400 bg-zinc-800"
            : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800/50"
        )}>
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs">Chat</span>
        </Link>

        <Link href="/settings" className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
          pathname === '/settings'
            ? "text-green-400 bg-zinc-800"
            : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800/50"
        )}>
          <Settings className="w-5 h-5" />
          <span className="text-xs">Settings</span>
        </Link>
      </div>
    </div>
  )
} 