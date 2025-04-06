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
  const [currentPath, setCurrentPath] = useState<DrawPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const [userColor] = useState(() => `hsl(${Math.random() * 360}, 70%, 50%)`)
  const [savedDrawings, setSavedDrawings] = useState<Array<{ points: DrawPoint[] }>>([])
  const [isInitialized, setIsInitialized] = useState(false)

  const { cursors, updateCursor, broadcastDrawing, clearCanvas, isConnected } = useRealtimeDrawing(roomName, username)

  const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean
    return function(...args: any[]) {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
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
      if (!Array.isArray(points) || points.length < 1) return

      if (points[0].tool === 'spray') {
        points.forEach(point => {
          ctx.globalAlpha = point.opacity * 0.4
          ctx.fillStyle = point.color
          const density = point.size * 2
          const radius = point.size

          for (let i = 0; i < density; i++) {
            const offsetX = (Math.random() * 2 - 1) * radius
            const offsetY = (Math.random() * 2 - 1) * radius
            const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY)
            
            if (distance <= radius) {
              ctx.beginPath()
              ctx.arc(point.x + offsetX, point.y + offsetY, 0.5, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        })
      } else {
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
    })
  }, [savedDrawings])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = canvas.parentElement
    if (!container) return

    const rect = container.getBoundingClientRect()
    const scale = window.devicePixelRatio || 1

    // Set canvas size to match container
    canvas.width = rect.width * scale
    canvas.height = rect.height * scale
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    // Scale context
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(scale, scale)
      redrawCanvas()
    }
  }, [redrawCanvas])

  // Initialize canvas once
  useEffect(() => {
    resizeCanvas()
    const debouncedResize = throttle(resizeCanvas, 250)
    window.addEventListener('resize', debouncedResize)

    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [resizeCanvas])

  // Load drawings once
  useEffect(() => {
    const loadDrawings = async () => {
      try {
        setIsLoading(true)
        
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
        }
      } catch (error) {
        console.error('Error loading drawings:', error)
        setError(error instanceof Error ? error.message : 'Failed to load drawings')
      } finally {
        setIsLoading(false)
      }
    }

    loadDrawings()
  }, [roomName])

  const clearCanvasCompletely = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = window.devicePixelRatio || 1
    ctx.fillStyle = '#e8f5e9'
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale)
    
    setSavedDrawings([])
    // Broadcast clear event to all users
    clearCanvas()
  }, [clearCanvas])

  const sprayEffect = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const density = tools.size * 2 // More particles for larger sizes
    const radius = tools.size
    
    ctx.fillStyle = tools.tool === 'eraser' ? '#e8f5e9' : tools.color
    ctx.globalAlpha = (tools.opacity * 0.4) // Reduce opacity for spray effect

    for (let i = 0; i < density; i++) {
      const offsetX = (Math.random() * 2 - 1) * radius
      const offsetY = (Math.random() * 2 - 1) * radius
      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY)
      
      if (distance <= radius) {
        ctx.beginPath()
        ctx.arc(x + offsetX, y + offsetY, 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [tools])

  const drawPath = useCallback((ctx: CanvasRenderingContext2D, points: DrawPoint[]) => {
    if (!points.length) return;
    
    ctx.globalAlpha = points[0].opacity;
    ctx.strokeStyle = points[0].tool === 'eraser' ? '#e8f5e9' : points[0].color;
    ctx.lineWidth = points[0].size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }

    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    ctx.stroke();
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPath([{
      x,
      y,
      ...tools,
      timestamp: Date.now()
    }]);

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
  }, [tools, earnAchievement, sprayEffect, user]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoint = {
      x,
      y,
      ...tools,
      timestamp: Date.now()
    };

    if (tools.tool === 'spray') {
      sprayEffect(ctx, x, y);
    }

    setCurrentPath(prev => {
      const updatedPath = [...prev, newPoint];
      if (updatedPath.length > 1 && tools.tool !== 'spray') {
        drawPath(ctx, [updatedPath[updatedPath.length - 2], updatedPath[updatedPath.length - 1]]);
      }
      return updatedPath;
    });

    updateCursor(x, y);
  }, [isDrawing, tools, drawPath, updateCursor, sprayEffect]);

  const finishDrawing = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    
    // Save the completed path
    if (currentPath.length > 1) {
      setSavedDrawings(prev => [...prev, { points: currentPath }]);
      broadcastDrawing(currentPath);
      
      if (onDraw) {
        onDraw(currentPath);
      }
    }
    
    setCurrentPath([]);
  }, [isDrawing, currentPath, broadcastDrawing, onDraw]);

  // Add window-level mouse event handlers for continuous drawing
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newPoint = {
        x,
        y,
        ...tools,
        timestamp: Date.now()
      };

      setCurrentPath(prev => {
        const updatedPath = [...prev, newPoint];
        if (updatedPath.length > 1) {
          drawPath(ctx, [updatedPath[updatedPath.length - 2], updatedPath[updatedPath.length - 1]]);
        }
        return updatedPath;
      });

      updateCursor(x, y);
    };

    const handleWindowMouseUp = () => {
      if (isDrawing) {
        finishDrawing();
      }
    };

    if (isDrawing) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDrawing, tools, drawPath, updateCursor, finishDrawing]);

  // Listen for real-time drawing updates
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const channel = supabase.channel(`drawing:${roomName}`)
    
    channel.on('broadcast', { event: 'draw' }, ({ payload }) => {
      if (payload.points) {
        const points = payload.points
        if (!Array.isArray(points) || points.length < 1) return

        if (points[0].tool === 'spray') {
          points.forEach(point => {
            ctx.globalAlpha = point.opacity * 0.4
            ctx.fillStyle = point.color
            const density = point.size * 2
            const radius = point.size

            for (let i = 0; i < density; i++) {
              const offsetX = (Math.random() * 2 - 1) * radius
              const offsetY = (Math.random() * 2 - 1) * radius
              const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY)
              
              if (distance <= radius) {
                ctx.beginPath()
                ctx.arc(point.x + offsetX, point.y + offsetY, 0.5, 0, Math.PI * 2)
                ctx.fill()
              }
            }
          })
        } else {
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

        // Update state
        setSavedDrawings(prev => [...prev, { points: [...points] }])
      }
    }).on('broadcast', { event: 'clear' }, () => {
      // Clear canvas for all users
      setSavedDrawings([])
      const scale = window.devicePixelRatio || 1
      ctx.fillStyle = '#e8f5e9'
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale)
    }).subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomName])

  // Redraw canvas when savedDrawings changes or canvas is resized
  useEffect(() => {
    redrawCanvas()
  }, [savedDrawings, redrawCanvas])

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top

    // Constrain coordinates to canvas boundaries
    x = Math.max(0, Math.min(x, rect.width))
    y = Math.max(0, Math.min(y, rect.height))

    return { x, y }
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

  // Add touch support
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPath([{
      x,
      y,
      ...tools,
      timestamp: Date.now()
    }]);
  }, [tools]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const newPoint = {
      x,
      y,
      ...tools,
      timestamp: Date.now()
    };

    if (tools.tool === 'spray') {
      sprayEffect(ctx, x, y);
    }

    setCurrentPath(prev => {
      const updatedPath = [...prev, newPoint];
      if (updatedPath.length > 1 && tools.tool !== 'spray') {
        drawPath(ctx, [updatedPath[updatedPath.length - 2], updatedPath[updatedPath.length - 1]]);
      }
      return updatedPath;
    });

    updateCursor(x, y);
  }, [isDrawing, tools, drawPath, updateCursor, sprayEffect]);

  return (
    <div className="flex flex-col h-[800px] bg-zinc-900 border border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
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

        {/* Connection status and active users */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-400" : "bg-yellow-400"
            )} />
            <span className="text-xs font-mono text-zinc-400">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800">
            <Users className="w-3 h-3 text-zinc-400" />
            <div className="flex -space-x-2">
              {cursors.map(([key, cursor]) => (
                <div
                  key={key}
                  className="w-6 h-6 rounded-full border-2 border-zinc-800 flex items-center justify-center"
                  style={{ backgroundColor: cursor.color }}
                >
                  <span className="text-[10px] font-medium text-white">
                    {cursor.name[0].toUpperCase()}
                  </span>
                </div>
              ))}
              <div
                className="w-6 h-6 rounded-full border-2 border-zinc-800 flex items-center justify-center"
                style={{ backgroundColor: userColor }}
              >
                <span className="text-[10px] font-medium text-white">
                  {username[0].toUpperCase()}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {cursors.length + 1}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        {error && (
          <div className="absolute inset-x-0 top-4 mx-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm z-50">
            {error}
          </div>
        )}
        
        {isLoading && (
          <div className="absolute top-4 right-4 px-4 py-2 bg-zinc-800/90 backdrop-blur-sm rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-zinc-400">Loading drawings...</span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 m-8">
          <div 
            className="h-full rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(45deg, #8B4513, #A0522D, #6B4423)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.2)',
              border: '2px solid #4A2810'
            }}
          >
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

            {/* Canvas container */}
            <div className="absolute inset-6 bg-[#e8f5e9] rounded-lg overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onClick={handleCanvasClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={finishDrawing}
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

              {/* Text input */}
              {tools.tool === 'text' && textPosition && (
                <div 
                  className="absolute"
                  style={{
                    left: textPosition.x,
                    top: textPosition.y - 30
                  }}
                >
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
                    className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded border border-zinc-700 focus:outline-none focus:border-green-400"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 