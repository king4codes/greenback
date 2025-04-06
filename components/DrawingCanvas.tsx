'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Eraser, Paintbrush, Trash2, Users, Type } from 'lucide-react'
import { useRealtimeDrawing } from '@/hooks/use-realtime-drawing'
import { useAuth } from '@/lib/auth'
import { useAchievements } from '@/hooks/use-achievements'
import Cursor from './Cursor'
import { supabase } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'

interface DrawingCanvasProps {
  roomName: string
  username: string
  onDraw?: (points: Array<{
    x: number
    y: number
    color: string
    size: number
    opacity: number
    tool: 'brush' | 'eraser' | 'text' | 'spray'
    timestamp: number
  }>) => void
}

interface DrawingTools {
  color: string
  size: number
  opacity: number
  tool: 'brush' | 'eraser' | 'text' | 'spray'
  text?: string
}

interface DrawPoint {
  x: number
  y: number
  color: string
  size: number
  opacity: number
  tool: 'brush' | 'eraser' | 'text' | 'spray'
  timestamp: number
}

export default function DrawingCanvas({ roomName, username, onDraw }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)
  const { user } = useAuth()
  const { earnAchievement } = useAchievements()
  const [tools, setTools] = useState<DrawingTools>({
    color: '#000000',
    size: 5,
    opacity: 1,
    tool: 'brush',
    text: ''
  })
  const pointsRef = useRef<Array<{
    x: number
    y: number
    color: string
    size: number
    opacity: number
    tool: 'brush' | 'eraser' | 'text' | 'spray'
    timestamp: number
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const [userColor] = useState(() => `hsl(${Math.random() * 360}, 70%, 50%)`)
  const [savedDrawings, setSavedDrawings] = useState<Array<{ points: DrawPoint[] }>>([])
  const [isInitialized, setIsInitialized] = useState(false)

  const { cursors, updateCursor, broadcastDrawing, clearCanvas, isConnected } = useRealtimeDrawing(roomName, username)

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = window.devicePixelRatio || 1
    const width = canvas.width / scale
    const height = canvas.height / scale

    // Clear canvas with background
    ctx.fillStyle = '#e8f5e9'
    ctx.fillRect(0, 0, width, height)

    // Redraw all saved drawings
    savedDrawings.forEach(drawing => {
      const points = drawing.points
      if (!Array.isArray(points) || points.length < 2) return

      ctx.globalAlpha = points[0].opacity
      ctx.strokeStyle = points[0].tool === 'eraser' ? '#e8f5e9' : points[0].color
      ctx.lineWidth = points[0].size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(points[0].x * (width / 1200), points[0].y * (height / 800))

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * (width / 1200), points[i].y * (height / 800))
      }
      ctx.stroke()
    })
  }, [savedDrawings])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = canvas.parentElement
    if (!container) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const maxWidth = 1200
    const maxHeight = 800
    const scale = window.devicePixelRatio || 1

    let width = Math.min(containerWidth, maxWidth)
    let height = Math.min(containerHeight, maxHeight)

    canvas.width = width * scale
    canvas.height = height * scale
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(scale, scale)
      redrawCanvas()
    }
  }, [redrawCanvas])

  // Update loadDrawings effect to store drawings in state
  useEffect(() => {
    const loadDrawings = async () => {
      if (!canvasRef.current) return

      try {
        setIsLoading(true)
        setError(null)
        
        const { data, error: supabaseError } = await supabase
          .from('drawing_data')
          .select('points')
          .eq('room_name', roomName)
          .order('created_at', { ascending: true });

        if (supabaseError) {
          throw new Error(supabaseError.message)
        }

        if (data) {
          setSavedDrawings(data)
          redrawCanvas()
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load drawings')
        console.error('Error loading drawings:', error)
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    loadDrawings()
  }, [roomName, redrawCanvas])

  // Initialize canvas size and setup
  useEffect(() => {
    if (!isInitialized) return
    resizeCanvas()
    const debouncedResize = debounce(resizeCanvas, 250)
    window.addEventListener('resize', debouncedResize)

    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [resizeCanvas, isInitialized])

  // Listen for real-time drawing updates
  useEffect(() => {
    const channel = supabase.channel(`drawing:${roomName}`)
    
    channel.on('broadcast', { event: 'draw' }, ({ payload }) => {
      if (payload.points) {
        setSavedDrawings(prev => [...prev, { points: payload.points }])
        redrawCanvas()
      }
    }).on('broadcast', { event: 'clear' }, () => {
      setSavedDrawings([])
      redrawCanvas()
    }).subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomName, redrawCanvas])

  const clearCanvasCompletely = useCallback(() => {
    setSavedDrawings([])
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = window.devicePixelRatio || 1
    const width = canvas.width / scale
    const height = canvas.height / scale

    ctx.fillStyle = '#e8f5e9'
    ctx.fillRect(0, 0, width, height)
    
    clearCanvas()
  }, [clearCanvas])

  const sprayEffect = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const density = tools.size * 2; // More particles for larger sizes
    const radius = tools.size;
    
    ctx.fillStyle = tools.tool === 'eraser' ? '#e8f5e9' : tools.color;
    ctx.globalAlpha = (tools.opacity * 0.4); // Reduce opacity for spray effect

    for (let i = 0; i < density; i++) {
      const offsetX = (Math.random() * 2 - 1) * radius;
      const offsetY = (Math.random() * 2 - 1) * radius;
      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
      
      if (distance <= radius) {
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width // Account for device pixel ratio
    
    let x = (e.clientX - rect.left) * scale
    let y = (e.clientY - rect.top) * scale

    // Constrain coordinates to canvas boundaries
    x = Math.max(0, Math.min(x, canvas.width))
    y = Math.max(0, Math.min(y, canvas.height))

    return { x: x / scale, y: y / scale } // Convert back to display coordinates
  }

  const startDrawing = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    pointsRef.current = [{
      x,
      y,
      color: tools.color,
      size: tools.size,
      opacity: tools.opacity,
      tool: tools.tool,
      timestamp: Date.now()
    }]

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.globalAlpha = tools.opacity
      ctx.strokeStyle = tools.tool === 'eraser' ? '#e8f5e9' : tools.color
      ctx.lineWidth = tools.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const draw = (e: { clientX: number; clientY: number }) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    pointsRef.current.push({
      x,
      y,
      color: tools.color,
      size: tools.size,
      opacity: tools.opacity,
      tool: tools.tool,
      timestamp: Date.now()
    })

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (pointsRef.current.length > 0) {
      broadcastDrawing(pointsRef.current)
      setSavedDrawings(prev => [...prev, { points: pointsRef.current }])
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tools.tool === 'text') {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setTextPosition({ x, y })
    }
  }

  const addTextToCanvas = (text: string) => {
    if (!textPosition || !text) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.globalAlpha = tools.opacity
    ctx.fillStyle = tools.color
    ctx.font = `${tools.size}px Arial`
    ctx.fillText(text, textPosition.x, textPosition.y)

    setTextPosition(null)
    setTools(prev => ({ ...prev, text: '' }))
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    startDrawing(e)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    draw(e)
    updateCursor(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    stopDrawing()
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    startDrawing(touch)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    draw(touch)
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    stopDrawing()
  }

  return (
    <div className="relative w-full h-full min-h-[500px] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Loading overlay */}
      {isLoading && !isInitialized && (
        <div className="absolute top-4 left-4 z-50 bg-white/80 px-4 py-2 rounded-md shadow-sm">
          <p className="text-sm text-gray-600">Loading drawings...</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-4 z-50 bg-red-50 px-4 py-2 rounded-md shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Connection status */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-red-500"
        )} />
        <span className="text-sm text-gray-600">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Active users */}
      <div className="absolute top-16 right-4 z-50">
        {cursors.map(([key, cursor]) => (
          <Cursor
            key={key}
            x={cursor.x}
            y={cursor.y}
            color={cursor.color}
            name={cursor.name}
          />
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className="touch-none w-full h-full bg-[#e8f5e9]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Drawing tools */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 p-4 bg-white rounded-lg shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`px-3 py-1 rounded ${
              tools.tool === 'brush'
                ? 'bg-green-400 text-zinc-900' 
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            onClick={() => setTools(prev => ({ ...prev, tool: 'brush' }))}
          >
            <Paintbrush size={16} className="inline-block mr-1" />
            Brush
          </button>
          <button
            className={`px-3 py-1 rounded ${
              tools.tool === 'spray' 
                ? 'bg-green-400 text-zinc-900' 
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            onClick={() => setTools(prev => ({ ...prev, tool: 'spray' }))}
          >
            <Paintbrush size={16} className="inline-block mr-1" />
            Spray
          </button>
          <button
            className={`px-3 py-1 rounded ${
              tools.tool === 'eraser'
                ? 'bg-green-400 text-zinc-900' 
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            onClick={() => setTools(prev => ({ ...prev, tool: 'eraser' }))}
          >
            <Eraser size={16} className="inline-block mr-1" />
            Eraser
          </button>
          <button
            className={`px-3 py-1 rounded ${
              tools.tool === 'text' 
                ? 'bg-green-400 text-zinc-900' 
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            onClick={() => setTools(prev => ({ ...prev, tool: 'text' }))}
          >
            <Type size={16} className="inline-block mr-1" />
            Text
          </button>

          <input
            type="color"
            value={tools.color}
            onChange={(e) => setTools(prev => ({ ...prev, color: e.target.value }))}
            className="w-8 h-8 rounded cursor-pointer bg-zinc-800 border border-zinc-700"
          />

          <div className="flex items-center gap-2 min-w-[150px]">
            <span className="text-sm text-zinc-400 whitespace-nowrap">Size:</span>
            <input
              type="range"
              min="1"
              max={tools.tool === 'text' ? 72 : tools.tool === 'spray' ? 50 : 150}
              value={tools.size}
              onChange={(e) => setTools(prev => ({ ...prev, size: parseInt(e.target.value) }))}
              className="w-24 accent-green-400"
            />
          </div>

          <div className="flex items-center gap-2 min-w-[150px]">
            <span className="text-sm text-zinc-400 whitespace-nowrap">Opacity:</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={tools.opacity}
              onChange={(e) => setTools(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
              className="w-24 accent-green-400"
            />
          </div>

          <button
            className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
            onClick={clearCanvasCompletely}
          >
            <Trash2 size={16} className="inline-block mr-1" />
            Clear
          </button>
        </div>

        {tools.tool === 'text' && textPosition && (
          <div className="flex items-center gap-2 mt-2 w-full">
            <input
              type="text"
              value={tools.text}
              onChange={(e) => setTools(prev => ({ ...prev, text: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTextToCanvas(tools.text || '')
                }
              }}
              placeholder="Type text and press Enter"
              className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded border border-zinc-700 focus:outline-none focus:border-green-400 flex-1"
            />
          </div>
        )}
      </div>
    </div>
  )
} 