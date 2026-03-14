import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { VerifyPage } from '@/pages/VerifyPage'
import { AuthProvider } from '@/context/AuthContext'
import { apiPost } from '@/lib/api'

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api')
  return {
    ...actual,
    apiPost: jest.fn(),
    getApiBase: jest.fn(() => 'http://localhost:3001'),
  }
})

describe('VerifyPage', () => {
  it('reads token from URL hash and calls verify endpoint', async () => {
    const token = 'x'.repeat(22)
    ;(apiPost as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      sessionToken: 'session-token',
      user: { email: 'user@example.com', name: 'user' },
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={[`/verify#token=${token}`]}>
          <Routes>
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith(`/api/auth/verify`, { token })
    })
  })
})
