describe('socket', () => {
  it('initializes socket.io client with autoConnect disabled', async () => {
    process.env.VITE_SERVER_URL = 'http://example.test'
    jest.resetModules()

    const ioMock = jest.fn(() => ({}))
    jest.doMock('socket.io-client', () => ({ io: ioMock }))

    const mod = await import('@/lib/socket')
    expect(mod.socket).toBeDefined()
    expect(ioMock).toHaveBeenCalledWith('http://example.test', { autoConnect: false })
  })
})

