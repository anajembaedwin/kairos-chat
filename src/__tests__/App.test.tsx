import { render, screen, fireEvent } from '@testing-library/react'
import App from '@/App'

jest.mock('@/components/LoginScreen', () => ({
  LoginScreen: ({ onLogin }: { onLogin: (user: 'User A' | 'User B') => void }) => (
    <button type="button" onClick={() => onLogin('User A')}>
      mock-login
    </button>
  ),
}))

jest.mock('@/components/ChatScreen', () => ({
  ChatScreen: ({ user, onLogout }: { user: string; onLogout: () => void }) => (
    <div>
      <div>mock-chat:{user}</div>
      <button type="button" onClick={onLogout}>
        mock-leave
      </button>
    </div>
  ),
}))

describe('App', () => {
  it('shows login first then chat after login', () => {
    render(<App />)
    fireEvent.click(screen.getByText('mock-login'))
    expect(screen.getByText('mock-chat:User A')).toBeInTheDocument()
  })

  it('logout triggers page reload', () => {
    const reloadMock = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    })

    render(<App />)
    fireEvent.click(screen.getByText('mock-login'))
    fireEvent.click(screen.getByText('mock-leave'))
    expect(reloadMock).toHaveBeenCalled()
  })
})

