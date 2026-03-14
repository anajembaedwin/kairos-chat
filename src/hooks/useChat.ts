import { useState, useEffect, useCallback, useRef } from 'react'
import { socket } from '@/lib/socket'
import { Message, User } from '@/types'
import { playMessageSound } from '@/lib/sound'
import { setUnreadBadge, clearUnreadBadge, getUnreadCount } from '@/lib/tabNotification'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

interface MessagesResponse {
  messages: Message[]
  hasMore: boolean
  nextCursor: number | null
}

export const useChat = (user: User | null) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load initial messages (most recent 20)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/messages?limit=20`)
        if (!res.ok) throw new Error('Failed to load messages')
        const data: MessagesResponse = await res.json()
        setMessages(data.messages.map(m => ({ ...m, status: 'delivered' })))
        setHasMore(data.hasMore)
        setNextCursor(data.nextCursor)
      } catch {
        setError('Could not load message history')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [])

  // Load older messages
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return

    setLoadingMore(true)
    try {
      const res = await fetch(
        `${SERVER_URL}/api/messages?limit=20&before=${nextCursor}`
      )
      if (!res.ok) throw new Error('Failed to load messages')
      const data: MessagesResponse = await res.json()

      setMessages(prev => [
        ...data.messages.map(m => ({ ...m, status: 'delivered' as const })),
        ...prev,
      ])
      setHasMore(data.hasMore)
      setNextCursor(data.nextCursor)
    } catch {
      setError('Could not load older messages')
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  // Socket connection
  useEffect(() => {
    if (!user) return

    socket.connect()

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('userOnline', user)
    })

    socket.on('disconnect', () => {
      setConnected(false)
      setOnlineUsers([])
    })

    socket.on('connect_error', () => {
      setError('Connection failed. Retrying...')
    })

    socket.on('onlineUsers', (users: string[]) => {
      setOnlineUsers(users)
    })

    socket.on('userTyping', (data: { sender: string; isTyping: boolean }) => {
      if (data.sender === user) return
      setTypingUser(data.isTyping ? data.sender : null)

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (data.isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null)
        }, 3000)
      }
    })

    socket.on('message', (message: Message) => {
      setMessages((prev) => {
        const withoutOptimistic = prev.filter(m =>
          !(m.status === 'sending' && m.sender === message.sender && m.text === message.text)
        )
        const alreadyExists = withoutOptimistic.find(m => m.id === message.id)
        if (alreadyExists) return withoutOptimistic
        return [...withoutOptimistic, { ...message, status: 'delivered' }]
      })
      setError(null)

      if (message.sender !== user) {
        playMessageSound()
        if (document.hidden) {
          setUnreadBadge(getUnreadCount() + 1)
        }
      }
    })

    socket.on('messageDelivered', ({ id }: { id: number }) => {
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, status: 'delivered' } : m)
      )
    })

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearUnreadBadge()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.off('onlineUsers')
      socket.off('userTyping')
      socket.off('message')
      socket.off('messageDelivered')
      socket.disconnect()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearUnreadBadge()
    }
  }, [user])

  const sendMessage = useCallback(
    (text: string) => {
      if (!user || !text.trim()) return

      const optimisticMessage: Message = {
        id: Date.now(),
        sender: user,
        text: text.trim(),
        created_at: new Date().toISOString(),
        status: 'sending',
      }
      setMessages(prev => [...prev, optimisticMessage])
      socket.emit('sendMessage', { sender: user, text: text.trim() })
    },
    [user]
  )

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!user) return
      socket.emit('typing', { sender: user, isTyping })
    },
    [user]
  )

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    connected,
    error,
    onlineUsers,
    typingUser,
    sendMessage,
    emitTyping,
    loadMoreMessages,
  }
}