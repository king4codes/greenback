'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import { useAchievements } from '@/hooks/use-achievements'
import { useCheckIns } from '@/hooks/use-check-ins'
import { Trophy, Calendar } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

// Define achievement ranks with their display properties
const RANKS = {
  basic: {
    name: 'Basic',
    color: 'from-zinc-700 to-zinc-600 text-zinc-300',
    borderColor: 'border-zinc-600',
    description: 'Fundamental achievements for getting started'
  },
  uncommon: {
    name: 'Uncommon',
    color: 'from-green-800 to-green-700 text-green-300',
    borderColor: 'border-green-600',
    description: 'Achievements that require some dedication'
  },
  rare: {
    name: 'Rare',
    color: 'from-blue-800 to-blue-700 text-blue-300',
    borderColor: 'border-blue-600',
    description: 'Challenging achievements for experienced users'
  },
  epic: {
    name: 'Epic',
    color: 'from-purple-800 to-purple-700 text-purple-300',
    borderColor: 'border-purple-600',
    description: 'Exceptional achievements that few will earn'
  },
  legendary: {
    name: 'Legendary',
    color: 'from-amber-900 to-amber-800 text-amber-300',
    borderColor: 'border-amber-600',
    description: 'The most prestigious and difficult achievements'
  }
} as const;

export default function AchievementsPage() {
  const { user } = useAuth()
  const { achievements, isLoading } = useAchievements()
  const { streak: dailyStreak, canCheckInToday, checkIn: performCheckIn, loading: checkInLoading } = useCheckIns()
  const [userLevel, setUserLevel] = useState(1)
  const [totalPoints, setTotalPoints] = useState(0)
  const [selectedRank, setSelectedRank] = useState<keyof typeof RANKS | 'all'>('all')

  // Calculate user level and total points from achievements
  useEffect(() => {
    const points = achievements
      .filter(a => a.earned)
      .reduce((total, achievement) => total + (achievement.points || 0), 0)
    
    setTotalPoints(points)
    setUserLevel(Math.max(1, Math.floor(points / 100)))
  }, [achievements])

  // Filter achievements by rank
  const filteredAchievements = achievements.filter(achievement => 
    selectedRank === 'all' || achievement.rank === selectedRank
  );

  // Handle daily check-in
  const handleDailyClaim = async () => {
    if (checkInLoading || !canCheckInToday || !user) return
    await performCheckIn()
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-6">
        {/* Daily Check-in Section */}
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-green-400" />
              <div>
                <h2 className="text-lg font-medium text-green-400">Daily Check-in</h2>
                <div className="text-sm text-zinc-400">Current Streak: {dailyStreak || 0} days</div>
              </div>
            </div>
            <button
              onClick={handleDailyClaim}
              disabled={checkInLoading || !canCheckInToday || !user}
              className={cn(
                "px-4 py-2 rounded font-medium transition-colors",
                canCheckInToday 
                  ? "bg-green-600 hover:bg-green-500 text-white cursor-pointer" 
                  : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              )}
            >
              {canCheckInToday ? "Claim Daily Reward" : "Already Claimed"}
            </button>
          </div>
          
          {/* Streak Progress */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "h-1.5 rounded-full",
                  i < (dailyStreak % 7)
                    ? "bg-green-400"
                    : "bg-zinc-700"
                )}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>Weekly Progress ({dailyStreak % 7}/7)</span>
            <span>Next Reward at 7 Days</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-green-400" />
            <h1 className="text-xl font-medium text-green-400">Achievements</h1>
          </div>
          <select 
            value={selectedRank}
            onChange={(e) => setSelectedRank(e.target.value as keyof typeof RANKS | 'all')}
            className="bg-zinc-800 text-sm text-zinc-300 rounded px-2 py-1 border border-zinc-700"
          >
            <option value="all">All Ranks</option>
            {Object.entries(RANKS).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-800/50 rounded p-3 text-center">
            <div className="text-xl font-medium text-green-400">{achievements.filter(a => a.earned).length}</div>
            <div className="text-sm text-zinc-400">Achievements</div>
          </div>
          <div className="bg-zinc-800/50 rounded p-3 text-center">
            <div className="text-xl font-medium text-amber-400">{userLevel}</div>
            <div className="text-sm text-zinc-400">Level</div>
          </div>
          <div className="bg-zinc-800/50 rounded p-3 text-center">
            <div className="text-xl font-medium text-blue-400">{totalPoints}</div>
            <div className="text-sm text-zinc-400">Points</div>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "relative group rounded border transition-all h-24",
                achievement.earned
                  ? `bg-gradient-to-br ${RANKS[achievement.rank].color} ${RANKS[achievement.rank].borderColor}`
                  : "bg-zinc-800/30 border-zinc-800 text-zinc-500"
              )}
            >
              <div className="flex flex-col items-center justify-center h-full p-2 text-center">
                <div className="text-2xl mb-1">{achievement.icon}</div>
                <div className="text-[11px] font-medium leading-tight truncate w-full">{achievement.name}</div>
                <div className="text-[9px] uppercase mt-1 px-1.5 py-0.5 rounded-sm bg-black/20">
                  {RANKS[achievement.rank].name}
                </div>
                {achievement.earned && (
                  <div className="text-[9px] mt-1">+{achievement.points} pts</div>
                )}
                {!achievement.earned && achievement.requires_progress && achievement.progress !== undefined && achievement.total_required !== undefined && (
                  <div className="mt-1 w-full px-2">
                    <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-current opacity-50"
                        style={{ width: `${(achievement.progress / achievement.total_required) * 100}%` }}
                      />
                    </div>
                    <div className="text-[9px] mt-0.5">{achievement.progress}/{achievement.total_required}</div>
                  </div>
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-800 rounded shadow-lg z-10 text-center pointer-events-none transition-opacity">
                <div className="text-xs text-zinc-300">{achievement.description}</div>
                {achievement.earned && achievement.earned_at && (
                  <div className="text-xs text-green-400 mt-1">
                    Earned {new Date(achievement.earned_at).toLocaleDateString()}
                  </div>
                )}
                {!achievement.earned && achievement.requires_progress && achievement.progress !== undefined && achievement.total_required !== undefined && (
                  <div className="mt-1">
                    <div className="h-1 w-full bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${(achievement.progress / achievement.total_required) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {Math.round((achievement.progress / achievement.total_required) * 100)}% complete
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  )
} 