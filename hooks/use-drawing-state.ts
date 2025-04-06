import { useState } from 'react'

interface DrawingTools {
  color: string
  size: number
  opacity: number
  tool: 'brush' | 'eraser' | 'text' | 'spray'
  text?: string
}

export function useDrawingState() {
  const [tools, setTools] = useState<DrawingTools>({
    color: '#000000',
    size: 5,
    opacity: 1,
    tool: 'brush',
    text: ''
  })

  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const updateTool = (tool: 'brush' | 'eraser' | 'text' | 'spray') => {
    setTools(prev => ({ ...prev, tool }))
  }

  const updateColor = (color: string) => {
    setTools(prev => ({ ...prev, color }))
  }

  const updateSize = (size: number) => {
    setTools(prev => ({ ...prev, size }))
  }

  const updateOpacity = (opacity: number) => {
    setTools(prev => ({ ...prev, opacity }))
  }

  const updateText = (text: string) => {
    setTools(prev => ({ ...prev, text }))
  }

  const resetText = () => {
    setTools(prev => ({ ...prev, text: '' }))
    setTextPosition(null)
  }

  return {
    tools,
    textPosition,
    isDrawing,
    setTextPosition,
    setIsDrawing,
    updateTool,
    updateColor,
    updateSize,
    updateOpacity,
    updateText,
    resetText
  }
} 