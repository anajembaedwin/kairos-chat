import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'

describe('App', () => {
  it('shows login route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Continue with email')).toBeInTheDocument()
  })

  it('unknown route redirects to landing', () => {
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Real-time chat, built for short private sessions.')).toBeInTheDocument()
  })
})
