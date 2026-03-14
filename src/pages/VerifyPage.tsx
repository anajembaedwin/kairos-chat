import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiGet, ApiError } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

type VerifyResponse = {
  ok: true
  sessionToken: string
  user: { email: string; name: string }
}

const useQuery = () => new URLSearchParams(useLocation().search)

export const VerifyPage = () => {
  const navigate = useNavigate()
  const query = useQuery()
  const { setAuth } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = query.get('token')
    if (!token) {
      setError('Missing token')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await apiGet<VerifyResponse>(`/api/auth/verify?token=${encodeURIComponent(token)}`)
        if (cancelled) return
        setAuth({ sessionToken: res.sessionToken, user: res.user })
        navigate('/dashboard', { replace: true })
      } catch (err) {
        if (cancelled) return
        const message = err instanceof ApiError ? err.message : 'Verification failed'
        setError(message)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [query, navigate, setAuth])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-5 shadow-xl">
        {!error ? (
          <>
            <div className="text-sm font-semibold">Verifying…</div>
            <p className="text-sm text-ink-muted mt-1">Please wait while we sign you in.</p>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold">Couldn’t verify</div>
            <p className="text-sm text-ink-muted mt-1">{error}</p>
            <div className="mt-4">
              <Link to="/login" className="text-sm text-accent hover:text-accent-hover transition-colors">
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

