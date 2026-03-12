import { render, screen, fireEvent } from '@testing-library/react'
import { LoginScreen } from '@/components/LoginScreen'

describe('LoginScreen', () => {
  it('renders the title', () => {
    render(<LoginScreen onLogin={jest.fn()} />)
    expect(screen.getByText('Kairos Chat')).toBeInTheDocument()
  })

  it('renders User A and User B options', () => {
    render(<LoginScreen onLogin={jest.fn()} />)
    expect(screen.getByText('User A')).toBeInTheDocument()
    expect(screen.getByText('User B')).toBeInTheDocument()
  })

  it('Enter Chat button is disabled by default', () => {
    render(<LoginScreen onLogin={jest.fn()} />)
    expect(screen.getByText('Enter Chat')).toBeDisabled()
  })

  it('enables Enter Chat button after selecting a user', () => {
    render(<LoginScreen onLogin={jest.fn()} />)
    fireEvent.click(screen.getByText('User A'))
    expect(screen.getByText('Enter Chat')).not.toBeDisabled()
  })

  it('calls onLogin with correct user when submitted', () => {
    const onLogin = jest.fn()
    render(<LoginScreen onLogin={onLogin} />)
    fireEvent.click(screen.getByText('User A'))
    fireEvent.click(screen.getByText('Enter Chat'))
    expect(onLogin).toHaveBeenCalledWith('User A')
  })

  it('calls onLogin with User B when User B is selected', () => {
    const onLogin = jest.fn()
    render(<LoginScreen onLogin={onLogin} />)
    fireEvent.click(screen.getByText('User B'))
    fireEvent.click(screen.getByText('Enter Chat'))
    expect(onLogin).toHaveBeenCalledWith('User B')
  })
})