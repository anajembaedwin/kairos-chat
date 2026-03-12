import { render, screen, fireEvent } from '@testing-library/react'
import { UserProvider, useUser } from '@/context/UserContext'

const ShowUser = () => {
  const { user, setUser } = useUser()
  return (
    <div>
      <div>user:{user ?? 'none'}</div>
      <button type="button" onClick={() => setUser('User B')}>
        set-b
      </button>
    </div>
  )
}

describe('UserContext', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it('throws when used outside provider', () => {
    expect(() => render(<ShowUser />)).toThrow('useUser must be used within UserProvider')
  })

  it('stores and updates user', () => {
    render(
      <UserProvider>
        <ShowUser />
      </UserProvider>
    )
    expect(screen.getByText('user:none')).toBeInTheDocument()
    fireEvent.click(screen.getByText('set-b'))
    expect(screen.getByText('user:User B')).toBeInTheDocument()
  })
})
