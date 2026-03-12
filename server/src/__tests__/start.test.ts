const initDBMock = jest.fn().mockResolvedValue(undefined)

jest.mock('../db', () => ({
  initDB: (...args: unknown[]) => initDBMock(...args),
  pool: { query: jest.fn() },
}))

jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
  })),
}))

describe('start', () => {
  let consoleLogSpy: jest.SpyInstance

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleLogSpy.mockRestore()
  })

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('initializes db and listens', async () => {
    process.env.PORT = '0'
    const { start, httpServer } = await import('../index')

    await start()
    await new Promise((resolve) => setImmediate(resolve))

    expect(initDBMock).toHaveBeenCalled()
    expect(httpServer.listening).toBe(true)

    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
  })

  it('autoStart triggers start when main module matches', async () => {
    const { autoStart } = await import('../index')
    const startFn = jest.fn()
    autoStart({ mainModule: module, currentModule: module, startFn })
    expect(startFn).toHaveBeenCalled()
  })
})
