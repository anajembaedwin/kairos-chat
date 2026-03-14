import { useEffect, useState } from 'react'

interface ScrollToBottomProps {
  scrollRef: React.RefObject<HTMLDivElement>
  bottomRef: React.RefObject<HTMLDivElement>
}

export const ScrollToBottom = ({ scrollRef, bottomRef }: ScrollToBottomProps) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setVisible(distanceFromBottom > 200)
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [scrollRef])

  const handleClick = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      onClick={handleClick}
      aria-label="Scroll to latest message"
      className="absolute bottom-6 right-6 z-40 w-9 h-9 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-lg transition-all animate-slide-up"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  )
}