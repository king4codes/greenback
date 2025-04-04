'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { RealtimePresenceJoinPayload, RealtimePresenceState } from '@supabase/supabase-js'
import { useAuth } from '@/lib/auth'

interface DrawPoint {
  x: number
  y: number
  color: string
  size: number
  opacity: number
  tool: 'brush' | 'eraser' | 'text' | 'spray'
  timestamp: number
}

interface CursorPosition {
  x: number
  y: number
  name: string
  color: string
}

type PresenceState = { [key: string]: CursorPosition[] }

export function useRealtimeDrawing(roomName: string, username: string) {
  const [cursors, setCursors] = useState<{ [key: string]: CursorPosition }>({})
  const [isConnected, setIsConnected] = useState(false)
  const [userColor] = useState(() => `hsl(${Math.random() * 360}, 70%, 50%)`)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const { user } = useAuth()

  // Load existing drawings when component mounts
  useEffect(() => {
    const loadExistingDrawings = async () => {
      try {
        const { data, error } = await supabase
          .from('drawing_data')
          .select('points')
          .eq('room_name', roomName)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading drawings:', error);
          return;
        }

        return data;
      } catch (err) {
        console.error('Error loading drawings:', err);
      }
    };

    loadExistingDrawings();
  }, [roomName]);

  useEffect(() => {
    const channel = supabase.channel(`drawing:${roomName}`)
    channelRef.current = channel

    // Handle cursor updates
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<CursorPosition>()
        const typedState: { [key: string]: CursorPosition } = {}
        
        Object.entries(state).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0 && 
              'x' in value[0] && 'y' in value[0] && 
              'name' in value[0] && 'color' in value[0]) {
            typedState[key] = value[0]
          }
        })
        
        setCursors(typedState)
      })
      .on('presence', { event: 'join' }, ({ newPresences }: RealtimePresenceJoinPayload<CursorPosition>) => {
        if (newPresences && newPresences.length > 0) {
          const presence = newPresences[0]
          if ('x' in presence && 'y' in presence &&
              'name' in presence && 'color' in presence) {
            setCursors(prev => ({
              ...prev,
              [presence.name]: presence
            }))
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setCursors(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            x: 0,
            y: 0,
            name: username,
            color: userColor,
          })
          setIsConnected(true)
        }
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomName, username, userColor])

  const updateCursor = async (x: number, y: number) => {
    if (!isConnected || !channelRef.current) return

    await channelRef.current.track({
      x,
      y,
      name: username,
      color: userColor,
    })
  }

  const broadcastDrawing = async (points: DrawPoint[]) => {
    if (!channelRef.current) return

    // Broadcast to real-time channel
    await channelRef.current.send({
      type: 'broadcast',
      event: 'draw',
      payload: { points },
    })

    // Store in database for persistence
    if (user) {
      try {
        const { error } = await supabase
          .from('drawing_data')
          .insert({
            room_name: roomName,
            points: points,
            created_by: user.id
          })

        if (error) {
          console.error('Error storing drawing:', error)
        }
      } catch (err) {
        console.error('Error storing drawing:', err)
      }
    }
  }

  const clearCanvas = async () => {
    if (!channelRef.current) return

    // Broadcast clear event
    await channelRef.current.send({
      type: 'broadcast',
      event: 'clear',
      payload: { cleared_by: username },
    })

    // Remove all drawings for this room
    if (user) {
      try {
        const { error } = await supabase
          .from('drawing_data')
          .delete()
          .eq('room_name', roomName)

        if (error) {
          console.error('Error clearing drawings:', error)
        }
      } catch (err) {
        console.error('Error clearing drawings:', err)
      }
    }
  }

  return {
    cursors: Object.entries(cursors).filter(([key]) => key !== username),
    updateCursor,
    broadcastDrawing,
    clearCanvas,
    isConnected,
  }
} 