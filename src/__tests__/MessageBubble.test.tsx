import { render, screen } from '@testing-library/react'
import { MessageBubble } from '@/components/MessageBubble'
import { Message } from '@/types'

const mockMessage: Message = {
  id: 1,
  sender: 'User A',
  text: 'Hello there!',
  created_at: new Date().toISOString(),
}

describe('MessageBubble', () => {
  it('renders the message text', () => {
    render(<MessageBubble message={mockMessage} isOwn={false} />)
    expect(screen.getByText('Hello there!')).toBeInTheDocument()
  })

  it('renders the sender name', () => {
    render(<MessageBubble message={mockMessage} isOwn={false} />)
    expect(screen.getByText('User A')).toBeInTheDocument()
  })

  it('renders the timestamp', () => {
    render(<MessageBubble message={mockMessage} isOwn={false} />)
    const time = new Date(mockMessage.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    expect(screen.getByText(time)).toBeInTheDocument()
  })

  it('applies own message styles when isOwn is true', () => {
    const { container } = render(<MessageBubble message={mockMessage} isOwn={true} />)
    const bubble = container.querySelector('.bg-accent')
    expect(bubble).toBeInTheDocument()
  })

  it('applies other message styles when isOwn is false', () => {
    const { container } = render(<MessageBubble message={mockMessage} isOwn={false} />)
    const bubble = container.querySelector('.bg-surface-overlay')
    expect(bubble).toBeInTheDocument()
  })
})