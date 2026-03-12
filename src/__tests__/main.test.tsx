import React from 'react'

const renderMock = jest.fn()
const createRootMock = jest.fn(() => ({ render: renderMock }))

jest.mock('react-dom/client', () => ({
  createRoot: (...args: unknown[]) => createRootMock(...args),
}))

jest.mock('@/App', () => ({
  __esModule: true,
  default: () => <div>mock-app</div>,
}))

describe('main', () => {
  beforeEach(() => {
    jest.resetModules()
    renderMock.mockClear()
    createRootMock.mockClear()
    document.body.innerHTML = '<div id="root"></div>'
  })

  it('boots React into #root', async () => {
    await import('@/main')

    expect(createRootMock).toHaveBeenCalledTimes(1)
    expect(renderMock).toHaveBeenCalledTimes(1)

    const rootArg = createRootMock.mock.calls[0]?.[0] as HTMLElement
    expect(rootArg?.id).toBe('root')

    const renderedElement = renderMock.mock.calls[0]?.[0] as React.ReactElement
    expect(renderedElement.type).toBe(React.StrictMode)
  })
})

