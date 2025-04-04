'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Achievement } from '@/hooks/use-achievements'

interface AchievementBadgeProps extends Partial<Achievement> {
  showProgress?: boolean
  progressPercent?: number
}

export default function AchievementBadge({ 
  name, 
  icon, 
  earned, 
  description, 
  earnedAt,
  showProgress = false,
  progressPercent = 0
}: AchievementBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center relative text-lg",
        earned 
          ? "bg-green-900/30 text-green-400 ring-2 ring-green-500/50"
          : "bg-zinc-800/70 text-zinc-400 ring-1 ring-zinc-700"
      )}>
        <span>{icon}</span>
        
        {showProgress && !earned && progressPercent > 0 && progressPercent < 100 && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div 
              className="absolute bottom-0 left-0 right-0 bg-green-800/30" 
              style={{ height: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-800 rounded shadow-lg z-10 text-center">
          <div className="text-sm font-mono">{name}</div>
          <div className="text-xs text-zinc-400 mt-1">{description}</div>
          
          {earned && earnedAt && (
            <div className="text-xs text-green-400 mt-1">
              Earned on {earnedAt.toLocaleDateString()}
            </div>
          )}
          
          {showProgress && !earned && progressPercent > 0 && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {Math.round(progressPercent)}% complete
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 