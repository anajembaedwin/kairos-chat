import { render, screen, act, fireEvent } from '@testing-library/react'
import { useChat } from '@/hooks/useChat'
import { Message } from '@/types'
import { socket } from '@/lib/socket'

type SocketHandler = (...args: unknown[]) => void

const handlers = new Map<string, SocketHandler>()

jest.mock('@/lib/socket', () => ({
  socket: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn((event: string, cb: SocketHandler) => {
      handlers.set(event, cb)
    }),
    off: jest.fn((event: string) => {
      handlers.delete(event)
    }),
    emit: jest.fn(),
  },
}))

const TestHarness = ({ user }: { user: string | null }) => {
  const { connected, error, messages, sendMessage } = useChat(user)
  return (
    <div>
      <div>connected:{connected ? 'yes' : 'no'}</div>
      <div>error:{error ?? 'none'}</div>
      <div>count:{messages.length}</div>
      <button type="button" onClick={() => sendMessage('  hi  ')}>
        send
      </button>
    </div>
  )
}

describe('useChat', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  beforeEach(() => {
    handlers.clear()
    jest.clearAllMocks()
    Object.defineProperty(globalThis, 'fetch', {
      value: jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              messages: [] as Message[],
              hasMore: false,
              nextCursor: null,
            }),
        })
      ),
      writable: true,
    })
  })

  it('connects when user is set and updates connected state', async () => {
    render(<TestHarness user="User A" />)

    await act(async () => {
      handlers.get('connect')?.()
    })
    expect(screen.getByText('connected:yes')).toBeInTheDocument()

    await act(async () => {
      handlers.get('disconnect')?.()
    })
    expect(screen.getByText('connected:no')).toBeInTheDocument()
  })

  it('adds incoming messages and clears error', async () => {
    render(<TestHarness user="User A" />)

    await act(async () => {
      handlers.get('connect_error')?.()
    })
    expect(screen.getByText('error:Connection failed. Retrying...')).toBeInTheDocument()

    const msg: Message = {
      id: 1,
      sender: 'User A',
      text: 'hello',
      created_at: new Date().toISOString(),
    }

    await act(async () => {
      handlers.get('message')?.(msg)
    })
    expect(screen.getByText('count:1')).toBeInTheDocument()
    expect(screen.getByText('error:none')).toBeInTheDocument()
  })

  it('emits trimmed messages', async () => {
    render(<TestHarness user="User A" />)
    fireEvent.click(screen.getByText('send'))
    expect(socket.emit).toHaveBeenCalledWith('sendMessage', { sender: 'User A', text: 'hi' })
  })

  it('sets error when history fetch fails', async () => {
    Object.defineProperty(globalThis, 'fetch', {
      value: jest.fn(() => Promise.resolve({ ok: false })),
      writable: true,
    })

    await act(async () => {
      render(<TestHarness user="User A" />)
    })

    expect(await screen.findByText('error:Could not load message history')).toBeInTheDocument()
  })
})
