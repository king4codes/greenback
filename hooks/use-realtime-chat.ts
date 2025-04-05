'use client'

import { supabase } from '@/lib/supabase-browser'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseRealtimeChatProps {
  roomName: string
  username: string
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
  reactions: {
    count: number
    hasReacted: boolean
  }
}

interface DbChatMessage {
  id: string
  content: string
  display_name: string
  created_at: string
  room_name: string
  user_id: string
}

interface DbMessageReaction {
  message_id: string
  user_id: string
  reaction: string
}

const MESSAGES_PER_PAGE = 50

export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null)

  const formatMessage = useCallback(async (dbMessage: DbChatMessage): Promise<ChatMessage> => {
    // Get reaction count for this message
    const { data: reactions } = await supabase
      .from('chat_message_reactions')
      .select('user_id, reaction')
      .eq('message_id', dbMessage.id)
      .eq('reaction', '❤️')

    // Check if current user has reacted
    const hasReacted = reactions?.some(r => r.user_id === user?.id) || false
    
    return {
      id: dbMessage.id,
      content: dbMessage.content,
      user: { name: dbMessage.display_name },
      createdAt: dbMessage.created_at,
      reactions: {
        count: reactions?.length || 0,
        hasReacted
      }
    }
  }, [user?.id])

  // Initialize chat table if it doesn't exist
  const initializeChatTable = useCallback(async () => {
    try {
      const { error: initError } = await supabase.rpc('initialize_chat_table')
      if (initError) {
        console.error('Failed to initialize chat table:', initError)
        throw new Error(`Failed to initialize chat: ${initError.message}`)
      }
    } catch (err) {
      console.error('Error initializing chat table:', err)
      throw new Error('Failed to initialize chat system')
    }
  }, [])

  // Fetch initial messages
  const fetchMessages = useCallback(async (timestamp?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // First try to initialize the table
      try {
        await initializeChatTable()
      } catch (initErr) {
        console.warn('Chat table initialization warning:', initErr)
        // Continue even if initialization fails - table might already exist
      }
      
      let query = supabase
        .from('chat_messages')
        .select('id, content, display_name, created_at, room_name, user_id')
        .eq('room_name', roomName)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE)

      // If timestamp is provided, get messages before that timestamp
      if (timestamp) {
        query = query.lt('created_at', timestamp)
      }
      
      const { data, error: fetchError } = await query
      
      if (fetchError) {
        console.error('Error fetching chat messages:', fetchError)
        throw new Error(`Failed to load messages: ${fetchError.message}`)
      }
      
      if (data) {
        const formattedMessages = await Promise.all(data.map(async (msg) => formatMessage(msg as DbChatMessage)))
        
        // Update last message timestamp for pagination
        if (data.length > 0) {
          const oldestMessage = data[data.length - 1]
          setLastMessageTimestamp(oldestMessage.created_at)
        }

        // If this is a pagination request, append to existing messages
        if (timestamp) {
          setMessages(current => [...current, ...formattedMessages.reverse()])
        } else {
          // Initial load, set messages directly
          setMessages(formattedMessages.reverse())
        }
      }
    } catch (err) {
      console.error('Error in fetchMessages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load chat messages')
    } finally {
      setIsLoading(false)
    }
  }, [roomName, initializeChatTable, formatMessage])

  const loadMoreMessages = useCallback(() => {
    if (lastMessageTimestamp) {
      fetchMessages(lastMessageTimestamp)
    }
  }, [lastMessageTimestamp, fetchMessages])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) {
        throw new Error('Chat is not connected')
      }

      if (!user) {
        throw new Error('You must be signed in to send messages')
      }

      try {
        setError(null)
        
        const messageData = {
          room_name: roomName,
          content: content.trim(),
          user_id: user.id,
          display_name: username
        }

        const { data, error: insertError } = await supabase
          .from('chat_messages')
          .insert([messageData])
          .select('id, content, display_name, created_at, room_name, user_id')
          .single()

        if (insertError) {
          console.error('Error sending message:', insertError)
          throw new Error(`Failed to send message: ${insertError.message}`)
        }

        if (!data) {
          throw new Error('Failed to send message - no response from server')
        }

        const formattedMessage = await formatMessage(data as DbChatMessage)
        setMessages((current) => [...current, formattedMessage])
        return formattedMessage
      } catch (err) {
        console.error('Error in sendMessage:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [channel, isConnected, user, roomName, username, formatMessage]
  )

  const toggleReaction = async (messageId: string) => {
    if (!user) return

    try {
      setError(null)
      
      // Check if user has already reacted
      const { data: existingReaction } = await supabase
        .from('chat_message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction', '❤️')
        .single()

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('chat_message_reactions')
          .delete()
          .eq('id', existingReaction.id)
      } else {
        // Add reaction
        await supabase
          .from('chat_message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction: '❤️'
          })
      }

      // Update local state
      setMessages(current =>
        current.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: {
                  count: msg.reactions.count + (existingReaction ? -1 : 1),
                  hasReacted: !msg.reactions.hasReacted
                }
              }
            : msg
        )
      )
    } catch (err) {
      console.error('Error toggling reaction:', err)
      setError('Failed to update reaction')
    }
  }

  // Subscribe to new messages and reactions
  useEffect(() => {
    let mounted = true
    
    const setupRealtimeSubscription = async () => {
      try {
        if (!mounted) return
        
        const channel = supabase.channel(roomName)
        
        channel
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `room_name=eq.${roomName}`
          }, async (payload: RealtimePostgresChangesPayload<DbChatMessage>) => {
            if (!mounted) return
            
            const newMessage = payload.new as DbChatMessage
            if (newMessage && newMessage.id && newMessage.content) {
              const formattedMessage = await formatMessage(newMessage)
              setMessages((current) => [...current, formattedMessage])
            }
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'chat_message_reactions'
          }, async (payload) => {
            if (!mounted) return

            const reaction = payload.new as DbMessageReaction
            if (!reaction) return

            // Update message reactions
            const updatedMessages = await Promise.all(
              messages.map(async (msg) => {
                if (msg.id === reaction.message_id) {
                  return await formatMessage({
                    id: msg.id,
                    content: msg.content,
                    display_name: msg.user.name,
                    created_at: msg.createdAt,
                    room_name: roomName,
                    user_id: ''
                  })
                }
                return msg
              })
            )
            setMessages(updatedMessages)
          })
          .subscribe((status) => {
            if (!mounted) return
            
            if (status === 'SUBSCRIBED') {
              setIsConnected(true)
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Chat channel error')
              setError('Failed to connect to chat')
              setIsConnected(false)
            }
          })

        setChannel(channel)
        
        // Initial message fetch
        await fetchMessages()
      } catch (err) {
        console.error('Error setting up chat subscription:', err)
        if (mounted) {
          setError('Failed to initialize chat')
          setIsConnected(false)
        }
      }
    }

    setupRealtimeSubscription()

    return () => {
      mounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [roomName, username, fetchMessages, formatMessage])

  return { 
    messages, 
    sendMessage, 
    isConnected,
    isLoading,
    error,
    fetchMessages,
    loadMoreMessages,
    hasMoreMessages: messages.length >= MESSAGES_PER_PAGE,
    toggleReaction
  }
} 