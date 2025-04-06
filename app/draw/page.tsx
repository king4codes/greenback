'use client'

import { useEffect, useRef } from 'react'
import MainLayout from '@/components/MainLayout'
import DrawingCanvas from '@/components/DrawingCanvas'
import { useAuth } from '@/lib/auth'

export default function Draw() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const username = user?.display_name || 'Guest'

  return (
    <MainLayout>
      <div className="flex-1 relative flex justify-center" ref={containerRef}>
        <div className="w-full max-w-[1200px]">
          <DrawingCanvas
            roomName="main-room"
            username={username}
          />
        </div>
      </div>
    </MainLayout>
  )
} 