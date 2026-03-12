const queryMock = jest.fn().mockResolvedValue(undefined)
const poolInstance = { query: (...args: unknown[]) => queryMock(...args) }
const PoolMock = jest.fn((...args: unknown[]) => {
  void args
  return poolInstance
})

jest.mock('pg', () => ({
  Pool: function Pool(this: unknown, ...args: unknown[]) {
    return PoolMock(...args)
  },
}))

describe('db', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('creates pool from DATABASE_URL and initializes schema', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/test'

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const { initDB } = await import('../db')

    await initDB()
    expect(PoolMock).toHaveBeenCalledWith({
      connectionString: 'postgres://user:pass@localhost:5432/test',
    })
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS messages')
    )

    logSpy.mockRestore()
  })
})
