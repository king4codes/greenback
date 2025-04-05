'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, RefreshCw, Heart } from 'lucide-react'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'

interface RealtimeChatProps {
  roomName: string
  username: string
}

export function RealtimeChat({ roomName, username }: RealtimeChatProps) {
  const { 
    messages, 
    sendMessage, 
    isConnected,
    isLoading,
    error,
    fetchMessages,
    loadMoreMessages,
    hasMoreMessages,
    toggleReaction
  } = useRealtimeChat({ roomName, username })
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle clicking outside of messages
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.message-content')) {
        setActiveMessageId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Handle scroll for loading more messages
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = async () => {
      if (
        container.scrollTop === 0 &&
        !isLoadingMore &&
        hasMoreMessages
      ) {
        setIsLoadingMore(true)
        await loadMoreMessages()
        setIsLoadingMore(false)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [loadMoreMessages, isLoadingMore, hasMoreMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    try {
      setIsSending(true)
      setSendError(null)
      await sendMessage(newMessage)
      setNewMessage('')
      // Focus immediately and after a short delay to ensure it works
      inputRef.current?.focus()
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
      // Focus one more time after all operations are complete
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm text-zinc-400">Chat Room</h3>
          {error && (
            <button
              onClick={() => fetchMessages()}
              className="p-1.5 text-zinc-400 hover:text-green-400 transition-colors"
              title="Retry loading messages"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
        {!isConnected && (
          <p className="text-xs text-yellow-500 mt-1">Connecting to chat...</p>
        )}
        {sendError && (
          <p className="text-xs text-red-400 mt-1">{sendError}</p>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading && !messages.length ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-zinc-500">Loading messages...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button
              onClick={() => fetchMessages()}
              className="text-xs text-zinc-400 hover:text-green-400 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-zinc-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {isLoadingMore && (
              <div className="text-center py-2">
                <div className="animate-pulse text-zinc-500">Loading more messages...</div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.user.name === username ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>{message.user.name}</span>
                  <span>•</span>
                  <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                </div>
                <div 
                  className="flex items-end gap-2 relative group w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveMessageId(message.id)
                  }}
                >
                  <div
                    className={`message-content mt-1 px-4 py-2 rounded-lg max-w-[80%] break-words whitespace-pre-wrap overflow-hidden ${
                      message.user.name === username
                        ? 'bg-green-400/20 text-green-400 ml-auto'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {message.content}
                  </div>
                  
                  {/* Reaction button - only visible on hover or when there are reactions */}
                  <div className={`flex items-center transition-opacity ${
                    activeMessageId === message.id || message.reactions.count > 0 || message.reactions.hasReacted
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleReaction(message.id)
                      }}
                      className={`flex items-center justify-center p-1.5 rounded-full transition-all ${
                        message.reactions.hasReacted
                          ? 'bg-red-400/20 text-red-400'
                          : 'hover:bg-zinc-800 text-zinc-500 hover:text-red-400'
                      }`}
                    >
                      <Heart size={14} className={message.reactions.hasReacted ? 'fill-current' : ''} />
                      {message.reactions.count > 0 && (
                        <span className="ml-1 text-xs">{message.reactions.count}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e as any)
              }
            }}
            placeholder={isSending ? 'Sending...' : 'Type a message...'}
            disabled={isSending}
            className="flex-1 bg-zinc-800 text-zinc-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/20 disabled:opacity-50"
            autoFocus
          />
          {newMessage.trim() && !isSending && (
            <button
              type="submit"
              className="p-2 bg-green-400 text-zinc-900 rounded-full hover:bg-green-300 transition-colors flex-shrink-0"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
