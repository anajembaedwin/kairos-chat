import { useState, useEffect, useRef, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { MessageBubble } from '@/components/MessageBubble'
import { DateDivider } from '@/components/DateDivider'
import { useChat } from '@/hooks/useChat'
import { User } from '@/types'
import { getDateLabel, isSameDay } from '@/lib/dateUtils'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import { AnimatedMessage } from '@/components/AnimatedMessage'

interface ChatScreenProps {
  user: User
  onLogout: () => void
}

export const ChatScreen = ({ user, onLogout }: ChatScreenProps) => {
  const [input, setInput] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number>(0)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
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
  } = useChat(user)

  const otherUser = user === 'User A' ? 'User B' : 'User A'
  const isOtherOnline = onlineUsers.includes(otherUser)
  const charLimit = 500

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

  // Preserve scroll position when older messages are prepended
  useEffect(() => {
    if (!loadingMore && scrollAreaRef.current) {
      const newScrollHeight = scrollAreaRef.current.scrollHeight
      const diff = newScrollHeight - prevScrollHeightRef.current
      scrollAreaRef.current.scrollTop = diff
    }
  }, [loadingMore])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        !target.closest('.epr-main') &&
        !target.closest('[data-emoji-btn]')
      ) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target.scrollTop < 50 && hasMore && !loadingMore) {
      prevScrollHeightRef.current = target.scrollHeight
      loadMoreMessages()
    }
  }, [hasMore, loadingMore, loadMoreMessages])

  const handleSend = useCallback(() => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
    emitTyping(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, sendMessage, emitTyping])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      setInput('')
      emitTyping(false)
      setShowEmojiPicker(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length > charLimit) return
    setInput(value)

    emitTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false)
    }, 1500)
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (input.length >= charLimit) return
    setInput(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">

      {/* Header */}
      <div className="flex-shrink-0 border-b border-surface-border bg-surface-raised px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-white">
            {user.split(' ')[1]}
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{user}</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-ink-faint'}`} />
              <span className="text-xs text-ink-muted">
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Other user presence + Leave button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOtherOnline ? 'bg-green-400' : 'bg-ink-faint'}`} />
            <span className="text-xs text-ink-muted">
              {otherUser} {isOtherOnline ? 'online' : 'offline'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            aria-label="Leave chat"
          >
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
        <ScrollArea className="h-full">
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className="h-full px-4 py-4 overflow-y-auto"
          >
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
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4a4a60"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div className="text-center">
                  <p className="text-ink-muted text-sm font-medium">No messages yet</p>
                  <p className="text-ink-faint text-xs mt-1">Be the first to say hello 👋</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Loading more indicator at top */}
                {loadingMore && (
                  <div className="flex justify-center py-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full bg-ink-faint animate-pulse-dot ${
                            i === 0 ? 'delay-0' : i === 1 ? 'delay-[160ms]' : 'delay-[320ms]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Load older messages button */}
                {hasMore && !loadingMore && (
                  <div className="flex justify-center py-2">
                    <button
                      aria-label="Load older messages"
                      onClick={() => {
                        if (scrollAreaRef.current) {
                          prevScrollHeightRef.current = scrollAreaRef.current.scrollHeight
                        }
                        loadMoreMessages()
                      }}
                      className="text-xs text-accent hover:text-accent-hover transition-colors px-3 py-1 rounded-full border border-surface-border hover:border-accent/50"
                    >
                      Load older messages
                    </button>
                  </div>
                )}

                {/* Message list */}
                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1]
                  const showDateDivider =
                    !prevMessage ||
                    !isSameDay(prevMessage.created_at, message.created_at)
                  const isNew = index === messages.length - 1

                  return (
                    <AnimatedMessage key={message.id} isNew={isNew}>
                      {showDateDivider && (
                        <DateDivider label={getDateLabel(message.created_at)} />
                      )}
                      <MessageBubble
                        message={message}
                        isOwn={message.sender === user}
                      />
                    </AnimatedMessage>
                  )
                })}

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
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-surface-border bg-surface-raised px-4 py-3">
        <div className="flex gap-2 max-w-3xl mx-auto items-end relative">

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={Theme.DARK}
                width={300}
                height={380}
              />
            </div>
          )}

          {/* Emoji button */}
          <button
            data-emoji-btn="true"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            disabled={!connected}
            aria-label="Open emoji picker"
            className="flex-shrink-0 mb-1 w-9 h-9 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-overlay transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 13s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>

          {/* Text input */}
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
            {input.length > 400 && (
              <span
                className={`absolute bottom-2 right-2 text-xs ${
                  input.length >= charLimit ? 'text-red-400' : 'text-ink-faint'
                }`}
              >
                {charLimit - input.length}
              </span>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            size="icon"
            aria-label="Send message"
            className="flex-shrink-0 mb-0.5"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </Button>
        </div>
      </div>

    </div>
  )
}