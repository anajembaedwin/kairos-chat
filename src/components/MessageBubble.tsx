import { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

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
        <span className="text-xs text-ink-faint">{time}</span>
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