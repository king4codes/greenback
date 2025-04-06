'use client'

import { useEffect, useRef, useState } from 'react'
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

  const { cursors, updateCursor, broadcastDrawing, clearCanvas, isConnected } = useRealtimeDrawing(roomName, username)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return

      // Get the actual container dimensions
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // Set canvas size to match container while maintaining aspect ratio
      const scale = window.devicePixelRatio || 1
      canvas.width = containerWidth * scale
      canvas.height = containerHeight * scale

      // Set display size
      canvas.style.width = `${containerWidth}px`
      canvas.style.height = `${containerHeight}px`

      // Scale the context to account for device pixel ratio
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(scale, scale)
        ctx.fillStyle = '#e8f5e9'
        ctx.fillRect(0, 0, containerWidth, containerHeight)
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  // Load and render existing drawings
  useEffect(() => {
    const loadDrawings = async () => {
      const canvas = canvasRef.current
      if (!canvas) return

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

        if (data) {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          // Clear canvas before rendering saved drawings
          ctx.fillStyle = '#e8f5e9'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Render each saved drawing
          data.forEach(drawing => {
            const points = drawing.points
            if (!Array.isArray(points) || points.length < 2) return

            ctx.globalAlpha = points[0].opacity
            ctx.strokeStyle = points[0].tool === 'eraser' ? '#e8f5e9' : points[0].color
            ctx.lineWidth = points[0].size
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            ctx.beginPath()
            ctx.moveTo(points[0].x, points[0].y)

            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y)
            }
            ctx.stroke()
          })
        }
      } catch (err) {
        console.error('Error loading drawings:', err)
      }
    }

    loadDrawings()
  }, [roomName])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleDrawEvent = (points: Array<{
      x: number
      y: number
      color: string
      size: number
      opacity: number
      tool: 'brush' | 'eraser' | 'text' | 'spray'
      timestamp: number
    }>) => {
      const ctx = canvas.getContext('2d')
      if (!ctx || points.length < 2) return

      ctx.globalAlpha = points[0].opacity
      ctx.strokeStyle = points[0].tool === 'eraser' ? '#e8f5e9' : points[0].color
      ctx.lineWidth = points[0].size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.stroke()
    }

    const handleClearEvent = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#e8f5e9'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const channel = supabase.channel(`drawing:${roomName}`)
    channel
      .on('broadcast', { event: 'draw' }, (payload: { payload: { points: Array<{
        x: number
        y: number
        color: string
        size: number
        opacity: number
        tool: 'brush' | 'eraser' | 'text' | 'spray'
        timestamp: number
      }> } }) => {
        if (payload.payload.points) {
          handleDrawEvent(payload.payload.points)
        }
      })
      .on('broadcast', { event: 'clear' }, () => {
        handleClearEvent()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomName])

  const handleClearCanvas = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#e8f5e9'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    await clearCanvas()
  }

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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { x, y } = getCanvasCoordinates(e)
    setIsDrawing(true)
    
    pointsRef.current = [{
      x,
      y,
      ...tools,
      timestamp: Date.now()
    }]

    // Draw initial mark
    const ctx = canvas.getContext('2d')
    if (ctx) {
      if (tools.tool === 'spray') {
        sprayEffect(ctx, x, y)
      } else {
        ctx.globalAlpha = tools.opacity
        ctx.fillStyle = tools.tool === 'eraser' ? '#e8f5e9' : tools.color
        ctx.beginPath()
        ctx.arc(x, y, tools.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Track achievement when user starts drawing
      if (user?.id) {
        earnAchievement('artist').catch(err => {
          console.error('Error earning artist achievement:', err)
        })
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoordinates(e)

    if (tools.tool === 'spray') {
      sprayEffect(ctx, x, y)
    } else {
      ctx.globalAlpha = tools.opacity
      ctx.strokeStyle = tools.tool === 'eraser' ? '#e8f5e9' : tools.color
      ctx.lineWidth = tools.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const lastPoint = pointsRef.current[pointsRef.current.length - 1]
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    pointsRef.current.push({
      x,
      y,
      ...tools,
      timestamp: Date.now()
    })
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      onDraw?.(pointsRef.current)
      pointsRef.current = []
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

  // Add global mouse event handlers
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDrawing) {
        const fakeEvent = {
          clientX: e.clientX,
          clientY: e.clientY
        } as React.MouseEvent<HTMLCanvasElement>
        draw(fakeEvent)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        stopDrawing()
      }
    }

    // Add global event listeners
    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDrawing]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-[750px] bg-zinc-900 border border-zinc-800">
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
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
            onClick={handleClearCanvas}
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

        {/* Connection Status */}
        <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800 ml-auto">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-400" : "bg-yellow-400"
          )} />
          <span className="text-xs font-mono text-zinc-400">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            <Users className="w-3 h-3 text-zinc-400" />
            <span className="text-xs font-mono text-zinc-400">
              {cursors.length + 1}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 p-8">
        <div 
          className="absolute inset-0 m-8 rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(45deg, #8B4513, #A0522D, #6B4423)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.2)',
            border: '2px solid #4A2810'
          }}
        >
          <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          />

          {/* Corner screws */}
          <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-zinc-700 shadow-inner flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-600 shadow-sm" style={{ transform: 'rotate(45deg)' }}>
              <div className="w-full h-0.5 bg-zinc-800 absolute top-1/2 -translate-y-1/2" />
              <div className="h-full w-0.5 bg-zinc-800 absolute left-1/2 -translate-x-1/2" />
            </div>
          </div>
          <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-zinc-700 shadow-inner flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-600 shadow-sm" style={{ transform: 'rotate(45deg)' }}>
              <div className="w-full h-0.5 bg-zinc-800 absolute top-1/2 -translate-y-1/2" />
              <div className="h-full w-0.5 bg-zinc-800 absolute left-1/2 -translate-x-1/2" />
            </div>
          </div>
          <div className="absolute bottom-3 left-3 w-4 h-4 rounded-full bg-zinc-700 shadow-inner flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-600 shadow-sm" style={{ transform: 'rotate(45deg)' }}>
              <div className="w-full h-0.5 bg-zinc-800 absolute top-1/2 -translate-y-1/2" />
              <div className="h-full w-0.5 bg-zinc-800 absolute left-1/2 -translate-x-1/2" />
            </div>
          </div>
          <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-zinc-700 shadow-inner flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-600 shadow-sm" style={{ transform: 'rotate(45deg)' }}>
              <div className="w-full h-0.5 bg-zinc-800 absolute top-1/2 -translate-y-1/2" />
              <div className="h-full w-0.5 bg-zinc-800 absolute left-1/2 -translate-x-1/2" />
            </div>
          </div>

          {/* Inner shadow */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)'
            }}
          />
        </div>

        {/* Canvas container */}
        <div className="relative h-full mx-12 my-12">
          <div className="absolute inset-0 bg-[#e8f5e9] rounded-lg overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onClick={handleCanvasClick}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            />

            {/* Cursors */}
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
        </div>
      </div>
    </div>
  )
} 