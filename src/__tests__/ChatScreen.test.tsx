import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ChatScreen } from '@/components/ChatScreen'
import { Message } from '@/types'
import { socket } from '@/lib/socket'

// Mock socket
jest.mock('@/lib/socket', () => ({
  socket: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}))

const mockedSocket = socket as jest.Mocked<typeof socket>

// Mock scrollIntoView — jsdom does not implement it
window.HTMLElement.prototype.scrollIntoView = jest.fn()

const mockMessages: Message[] = [
  { id: 1, sender: 'User A', text: 'Hey!', created_at: new Date().toISOString() },
  { id: 2, sender: 'User B', text: 'Hello back!', created_at: new Date().toISOString() },
]

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            messages: mockMessages,
            hasMore: false,
            nextCursor: null,
          }),
      })
    )
    Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true })
  })

  it('renders the user name in the header', async () => {
    render(<ChatScreen user="User A" onLogout={jest.fn()} />)
    await waitFor(() => expect(screen.getByText('Hey!')).toBeInTheDocument())
    expect(screen.getByText('User A', { selector: 'p' })).toBeInTheDocument()
  })

  it('renders the Leave button', async () => {
    render(<ChatScreen user="User A" onLogout={jest.fn()} />)
    await waitFor(() => expect(screen.getByText('Hey!')).toBeInTheDocument())
    expect(screen.getByText('Leave')).toBeInTheDocument()
  })

  it('calls onLogout when Leave is clicked', async () => {
    const onLogout = jest.fn()
    render(<ChatScreen user="User A" onLogout={onLogout} />)
    await waitFor(() => expect(screen.getByText('Hey!')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Leave'))
    expect(onLogout).toHaveBeenCalled()
  })

  it('loads and displays message history', async () => {
    await act(async () => {
      render(<ChatScreen user="User A" onLogout={jest.fn()} />)
    })
    await waitFor(() => {
      expect(screen.getByText('Hey!')).toBeInTheDocument()
      expect(screen.getByText('Hello back!')).toBeInTheDocument()
    })
  })

  it('renders message input placeholder', async () => {
    render(<ChatScreen user="User A" onLogout={jest.fn()} />)
    await waitFor(() => expect(screen.getByText('Hey!')).toBeInTheDocument())
    expect(screen.getByPlaceholderText(/^Type a message/)).toBeInTheDocument()
  })

  it('emits sendMessage when Enter is pressed', async () => {
    await act(async () => {
      render(<ChatScreen user="User A" onLogout={jest.fn()} />)
    })

    await waitFor(() => expect(screen.getByText('Hey!')).toBeInTheDocument())

    // Simulate connected state
    const connectCall = mockedSocket.on.mock.calls.find((call) => call[0] === 'connect')
    const connectHandler = connectCall?.[1] as (() => void) | undefined
    await act(async () => {
      connectHandler?.()
    })

    const input = screen.getByPlaceholderText(/^Type a message/)
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    expect(mockedSocket.emit).toHaveBeenCalledWith('sendMessage', {
      sender: 'User A',
      text: 'Test message',
    })
  })

  it('shows empty state when no messages', async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            messages: [],
            hasMore: false,
            nextCursor: null,
          }),
      })
    )
    Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true })

    await act(async () => {
      render(<ChatScreen user="User A" onLogout={jest.fn()} />)
    })

    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeInTheDocument()
    })
  })
})
