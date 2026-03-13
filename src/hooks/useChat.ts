import { useState, useEffect, useCallback, useRef } from 'react'
import { socket } from '@/lib/socket'
import { Message, User } from '@/types'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

export const useChat = (user: User | null) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/messages`)
        if (!res.ok) throw new Error('Failed to load messages')
        const data: Message[] = await res.json()
        setMessages(data.map(m => ({ ...m, status: 'delivered' })))
      } catch {
        setError('Could not load message history')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [])

  // Socket connection
  useEffect(() => {
    if (!user) return

    socket.connect()

    socket.on('connect', () => {
      setConnected(true)
      // Announce presence
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

      // Auto-clear typing indicator after 3 seconds
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (data.isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null)
        }, 3000)
      }
    })

    socket.on('message', (message: Message) => {
      setMessages((prev) => {
        // Replace optimistic message if exists, otherwise append
        const exists = prev.find(m => m.id === message.id)
        if (exists) return prev
        return [...prev, { ...message, status: 'delivered' }]
      })
      setError(null)
    })

    socket.on('messageDelivered', ({ id }: { id: number }) => {
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, status: 'delivered' } : m)
      )
    })

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
    }
  }, [user])

  const sendMessage = useCallback(
    (text: string) => {
      if (!user || !text.trim()) return

      // Add optimistic message immediately
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
    connected,
    error,
    onlineUsers,
    typingUser,
    sendMessage,
    emitTyping,
  }
} 