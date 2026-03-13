import { useState, useEffect, useRef, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { MessageBubble } from '@/components/MessageBubble'
import { useChat } from '@/hooks/useChat'
import { User } from '@/types'

interface ChatScreenProps {
  user: User
  onLogout: () => void
}

export const ChatScreen = ({ user, onLogout }: ChatScreenProps) => {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { messages, loading, connected, error, onlineUsers, typingUser, sendMessage, emitTyping } = useChat(user)

  const otherUser = user === 'User A' ? 'User B' : 'User A'
  const isOtherOnline = onlineUsers.includes(otherUser)

  // Auto-scroll to latest message
  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, typingUser])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSend = useCallback(() => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
    emitTyping(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, sendMessage, emitTyping])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Clear input on Escape
    if (e.key === 'Escape') {
      setInput('')
      emitTyping(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length > 500) return
    setInput(value)

    // Emit typing indicator
    emitTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false)
    }, 1500)
  }

  const charCount = input.length
  const charLimit = 500

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">

      {/* Header */}
      <div className="flex-shrink-0 border-b border-surface-border bg-surface-raised px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-white">
              {user.split(' ')[1]}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{user}</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-ink-faint'}`} />
              <span className="text-xs text-ink-muted">{connected ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Other user presence */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOtherOnline ? 'bg-green-400' : 'bg-ink-faint'}`} />
            <span className="text-xs text-ink-muted">
              {otherUser} {isOtherOnline ? 'online' : 'offline'}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Leave
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full bg-accent animate-pulse-dot ${
                      i === 0 ? 'delay-0' : i === 1 ? 'delay-[160ms]' : 'delay-[320ms]'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a4a60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div className="text-center">
                <p className="text-ink-muted text-sm font-medium">No messages yet</p>
                <p className="text-ink-faint text-xs mt-1">Be the first to say hello 👋</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender === user}
                />
              ))}

              {/* Typing indicator */}
              {typingUser && (
                <div className="flex flex-col gap-1 items-start animate-slide-up">
                  <span className="text-xs text-ink-faint px-1">{typingUser}</span>
                  <div className="bg-surface-overlay border border-surface-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full bg-ink-muted animate-pulse-dot ${
                          i === 0 ? 'delay-0' : i === 1 ? 'delay-[160ms]' : 'delay-[320ms]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-surface-border bg-surface-raised px-4 py-3">
        <div className="flex gap-2 max-w-3xl mx-auto items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              disabled={!connected}
              rows={1}
              className="w-full rounded-lg border border-surface-border bg-surface-overlay px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none overflow-hidden"
            />
            {/* Character counter */}
            {input.length > 400 && (
              <span className={`absolute bottom-2 right-2 text-xs ${charCount >= charLimit ? 'text-red-400' : 'text-ink-faint'}`}>
                {charLimit - charCount}
              </span>
            )}
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            size="icon"
            className="flex-shrink-0 mb-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </Button>
        </div>
      </div>

    </div>
  )
}