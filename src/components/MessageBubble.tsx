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
      <span className="text-xs text-ink-faint px-1">{time}</span>
    </div>
  )
}