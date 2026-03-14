import { useEffect, useRef } from 'react'

interface AnimatedMessageProps {
  children: React.ReactNode
  isNew?: boolean
}

export const AnimatedMessage = ({ children, isNew = false }: AnimatedMessageProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isNew && ref.current) {
      ref.current.classList.remove('animate-slide-up')
      // Force reflow so the browser registers the removal
      void ref.current.offsetHeight
      ref.current.classList.add('animate-slide-up')
    }
  }, [isNew])

  return (
    <div ref={ref} className={isNew ? 'animate-slide-up' : ''}>
      {children}
    </div>
  )
}