import { useState, useEffect, useCallback } from 'react'
import { socket } from '@/lib/socket'
import { Message } from '@/types'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

export const useChat = (user: string | null) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/messages`)
        if (!res.ok) throw new Error('Failed to load messages')
        const data: Message[] = await res.json()
        setMessages(data)
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

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setError('Connection failed. Retrying...'))

    socket.on('message', (message: Message) => {
      setMessages((prev) => [...prev, message])
      setError(null)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.off('message')
      socket.disconnect()
    }
  }, [user])

  const sendMessage = useCallback(
    (text: string) => {
      if (!user || !text.trim()) return
      socket.emit('sendMessage', { sender: user, text: text.trim() })
    },
    [user]
  )

  return { messages, loading, connected, error, sendMessage }
}