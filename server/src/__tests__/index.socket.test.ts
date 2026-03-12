import type { CreateMessageBody, Message } from '../types'

const initDBMock = jest.fn().mockResolvedValue(undefined)
const queryMock = jest.fn()

jest.mock('../db', () => ({
  initDB: (...args: unknown[]) => initDBMock(...args),
  pool: { query: (...args: unknown[]) => queryMock(...args) },
}))

const ioOnMock = jest.fn()
const ioEmitMock = jest.fn()

jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: (...args: unknown[]) => ioOnMock(...args),
    emit: (...args: unknown[]) => ioEmitMock(...args),
  })),
}))

type SocketLike = {
  id: string
  on: (event: string, cb: (...args: unknown[]) => void) => void
  emit: (...args: unknown[]) => void
}

type ConnectionHandler = (socket: SocketLike) => void

describe('server socket handlers', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleLogSpy: jest.SpyInstance

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('validates sendMessage payload and emits error', async () => {
    await import('../index')

    const connectionCall = ioOnMock.mock.calls.find((c) => c[0] === 'connection')
    const onConnection = connectionCall?.[1] as ConnectionHandler | undefined
    expect(onConnection).toBeDefined()

    const socketOnMock = jest.fn()
    const socketEmitMock = jest.fn()

    const socketHandlers = new Map<string, (...args: unknown[]) => void>()
    socketOnMock.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      socketHandlers.set(event, cb)
    })

    onConnection?.({ id: 's1', on: socketOnMock, emit: socketEmitMock })

    const sendHandler = socketHandlers.get('sendMessage') as ((body: CreateMessageBody) => Promise<void>) | undefined
    expect(sendHandler).toBeDefined()

    socketHandlers.get('disconnect')?.()

    await sendHandler?.({ sender: '', text: 'hi' })
    expect(socketEmitMock).toHaveBeenCalledWith('error', { error: 'sender and text are required' })
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('saves valid messages and broadcasts them', async () => {
    await import('../index')

    const connectionCall = ioOnMock.mock.calls.find((c) => c[0] === 'connection')
    const onConnection = connectionCall?.[1] as ConnectionHandler | undefined

    const socketOnMock = jest.fn()
    const socketEmitMock = jest.fn()
    const socketHandlers = new Map<string, (...args: unknown[]) => void>()
    socketOnMock.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      socketHandlers.set(event, cb)
    })

    onConnection?.({ id: 's2', on: socketOnMock, emit: socketEmitMock })

    const saved: Message = {
      id: 1,
      sender: 'User A',
      text: 'hi',
      created_at: new Date().toISOString(),
    }
    queryMock.mockResolvedValueOnce({ rows: [saved] })

    const sendHandler = socketHandlers.get('sendMessage') as ((body: CreateMessageBody) => Promise<void>) | undefined
    await sendHandler?.({ sender: '  User A  ', text: '  hi  ' })

    expect(queryMock).toHaveBeenCalled()
    expect(ioEmitMock).toHaveBeenCalledWith('message', saved)
    expect(socketEmitMock).not.toHaveBeenCalledWith('error', expect.anything())
  })

  it('handles db errors when sending messages', async () => {
    await import('../index')

    const connectionCall = ioOnMock.mock.calls.find((c) => c[0] === 'connection')
    const onConnection = connectionCall?.[1] as ConnectionHandler | undefined

    const socketOnMock = jest.fn()
    const socketEmitMock = jest.fn()
    const socketHandlers = new Map<string, (...args: unknown[]) => void>()
    socketOnMock.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      socketHandlers.set(event, cb)
    })

    onConnection?.({ id: 's3', on: socketOnMock, emit: socketEmitMock })
    queryMock.mockRejectedValueOnce(new Error('DB down'))

    const sendHandler = socketHandlers.get('sendMessage') as ((body: CreateMessageBody) => Promise<void>) | undefined
    await sendHandler?.({ sender: 'User A', text: 'hi' })

    expect(socketEmitMock).toHaveBeenCalledWith('error', { error: 'Failed to save message' })
  })
})
