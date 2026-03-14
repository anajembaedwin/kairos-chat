import { useState, useEffect } from 'react'
import { Message } from '@/types'
import { getMessageTime, getRelativeTime } from '@/lib/dateUtils'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

const SWITCH_TO_ABSOLUTE_AFTER_MINUTES = 60

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const getDisplayTime = () => {
    const messageDate = new Date(message.created_at)
    const minutesAgo = (Date.now() - messageDate.getTime()) / 1000 / 60
    return minutesAgo < SWITCH_TO_ABSOLUTE_AFTER_MINUTES
      ? getRelativeTime(message.created_at)
      : getMessageTime(message.created_at)
  }

  const [displayTime, setDisplayTime] = useState(getDisplayTime)

  useEffect(() => {
    // Update every 30 seconds while message is recent
    const interval = setInterval(() => {
      setDisplayTime(getDisplayTime())
    }, 30000)

    return () => clearInterval(interval)
  }, [message.created_at])

  return (
    <div className={`flex flex-col gap-1 animate-slide-up ${isOwn ? 'items-end' : 'items-start'}`}>
      <span className="text-xs text-ink-faint px-1">{message.sender}</span>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isOwn
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-surface-overlay text-ink border border-surface-border rounded-bl-sm'
        }`}
      >
        {message.text}
      </div>
      <div className="flex items-center gap-1 px-1">
        <span className="text-xs text-ink-faint transition-all">
          {displayTime}
        </span>
        {isOwn && (
          <span className="text-xs">
            {message.status === 'sending' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a4a60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 28 17" fill="none" stroke="#7c6af7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 9 6 14 14 4" />
                <polyline points="10 9 15 14 26 4" />
              </svg>
            )}
          </span>
        )}
      </div>
    </div>
  )
}