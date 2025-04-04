'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Camera, ImageIcon } from 'lucide-react'

interface AvatarSceneProps {
  isProfileView: boolean
}

const scenes = [
  {
    type: 'image',
    url: 'https://aupfufxxvbwmdiewjeka.supabase.co/storage/v1/object/public/avatars//4.png',
    alt: 'Nature Scene 1'
  },
  {
    type: 'video',
    url: 'https://aupfufxxvbwmdiewjeka.supabase.co/storage/v1/object/public/avatars//3.webm',
    alt: 'Nature Scene 2'
  },
  {
    type: 'video',
    url: 'https://aupfufxxvbwmdiewjeka.supabase.co/storage/v1/object/public/avatars//2.webm',
    alt: 'Nature Scene 3'
  },
  {
    type: 'video',
    url: 'https://aupfufxxvbwmdiewjeka.supabase.co/storage/v1/object/public/avatars//1.webm',
    alt: 'Nature Scene 4'
  }
]

export default function AvatarScene({ isProfileView }: AvatarSceneProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [flicker, setFlicker] = useState(0)
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const flickerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Add subtle flicker effect
    const interval = setInterval(() => {
      setFlicker(Math.random() * 0.02) // Random flicker between 0 and 2%
    }, 100)
    flickerIntervalRef.current = interval

    return () => {
      if (flickerIntervalRef.current) {
        clearInterval(flickerIntervalRef.current)
        flickerIntervalRef.current = null
      }
    }
  }, [])

  const handleMouseDown = () => {
    const timeout = setTimeout(() => {
      setIsLocked(true)
    }, 700)
    holdTimeoutRef.current = timeout
  }

  const handleMouseUp = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
  }

  const handleClick = () => {
    if (isLocked) {
      setIsLocked(false)
    } else {
      setCurrentSceneIndex((prev) => (prev + 1) % scenes.length)
    }
  }

  // Auto-rotate scene if not locked
  useEffect(() => {
    if (!isLocked) {
      const interval = setInterval(() => {
        setCurrentSceneIndex((prev) => (prev + 1) % scenes.length)
      }, 10000) // Change scene every 10 seconds
      return () => clearInterval(interval)
    }
  }, [isLocked])

  return (
    <div
      className={cn(
        "relative w-full h-full rounded-lg overflow-hidden",
        !isProfileView && "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        handleMouseUp()
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-transparent opacity-50 pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          )`,
          opacity: 0.3
        }}
      />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 150px rgba(0, 0, 0, 0.5)',
          opacity: 0.5
        }}
      />
      
      <div 
        className="absolute inset-0"
        style={{
          transform: `translateY(${flicker}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        {scenes[currentSceneIndex].type === 'video' ? (
          <video
            src={scenes[currentSceneIndex].url}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={scenes[currentSceneIndex].url}
            alt={scenes[currentSceneIndex].alt}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center"
        >
          <span className="text-white text-sm font-mono">
            {isLocked ? 'Scene locked - Click to unlock' : 'Click to change scene'}
          </span>
        </motion.div>
      )}

      {/* Scene indicator dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {scenes.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              currentSceneIndex === index ? "bg-white" : "bg-white/30"
            )}
          />
        ))}
      </div>
    </div>
  );
} 