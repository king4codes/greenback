'use client'

import MainLayout from '@/components/MainLayout'

export default function Community() {
  return (
    <MainLayout username="Terry">
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-garamond text-4xl text-green-400">Community</h1>
          <p className="font-mono text-zinc-400">
            Connect with other PrintGreen™ members<br />
            and share your sustainable trading strategies.
          </p>
        </div>
      </div>
    </MainLayout>
  )
} 