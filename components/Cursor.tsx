'use client'

import { cn } from '@/lib/utils'
import { MousePointer2 } from 'lucide-react'

interface CursorProps {
  x: number
  y: number
  color: string
  name: string
}

export default function Cursor({ x, y, color, name }: CursorProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.2))`
        }}
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
          stroke="white"
        />
      </svg>
      
      <div
        className="absolute top-5 left-4 px-2 py-1 rounded whitespace-nowrap text-xs"
        style={{
          backgroundColor: color,
          color: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {name}
      </div>
    </div>
  )
} 