import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiPost, ApiError, getApiBase } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

type VerifyResponse = {
  ok: true
  sessionToken: string
  user: { email: string; name: string }
}

export const VerifyPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const hashParams = new URLSearchParams(location.hash.startsWith('#') ? location.hash.slice(1) : location.hash)
  const { setAuth } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<
    'idle' | 'requesting' | 'received' | 'stored' | 'navigated' | 'failed'
  >('idle')
  const [attempt, setAttempt] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const didRunRef = useRef(false)

  const rawHashToken = hashParams.get('token')
  const rawQueryToken = query.get('token')
  const rawToken = rawHashToken || rawQueryToken
  const tokenSource = rawHashToken ? 'hash' : rawQueryToken ? 'query' : 'missing'
  const token = rawToken ? rawToken.replace(/[<>\s'"]/g, '') : null
  const tokenSummary = token ? `${token.slice(0, 8)}...(${token.length})` : '(missing)'
  const apiBase = getApiBase()

  const guardKey = token ? `kairos.verify.v1:${token}` : null

  useEffect(() => {
    if (stage !== 'requesting') return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [stage])

  useEffect(() => {
    if (didRunRef.current) return
    didRunRef.current = true

    if (!token) {
      setError('Missing token')
      setStage('failed')
      return
    }

    const tokenValue = token
    let isMounted = true

    setError(null)
    setStage('requesting')
    setStartedAt(Date.now())
    setShowDebug(false)

    // React 18 StrictMode in dev will mount/unmount and re-mount components to detect unsafe effects.
    // Guard against double-verification so we don't consume a one-time token twice.
    try {
      if (guardKey) {
        const current = sessionStorage.getItem(guardKey)
        if (current === 'done') {
          navigate('/dashboard', { replace: true })
          return
        }
        if (current === 'in_progress') {
          // Another render/mount is already verifying this token; don't start a second request.
          return
        }
        sessionStorage.setItem(guardKey, 'in_progress')
      }
    } catch {
      // ignore
    }

    const debugTimer = setTimeout(() => {
      if (isMounted) setShowDebug(true)
    }, 2500)
    ;(async () => {
      try {
        console.debug('[verify] start', { apiBase: apiBase || '(same-origin)', token: tokenSummary, tokenSource })
        const res = await apiPost<VerifyResponse>(`/api/auth/verify`, { token: tokenValue })
        if (isMounted) setStage('received')
        console.debug('[verify] received', {
          ok: res.ok,
          user: res.user,
          sessionToken: `${res.sessionToken.slice(0, 8)}...(${res.sessionToken.length})`,
        })
        const auth = { sessionToken: res.sessionToken, user: res.user }

        // Persist directly so this still works even if StrictMode unmounts/remounts before state updates land.
        try {
          localStorage.setItem('kairos.auth.v1', JSON.stringify(auth))
        } catch {
          // ignore
        }

        if (isMounted) {
          setAuth(auth)
          setStage('stored')
        }
        console.debug('[verify] stored, navigating to /dashboard')
        try {
          if (guardKey) sessionStorage.setItem(guardKey, 'done')
        } catch {
          // ignore
        }

        // Navigate in-app, then also hard-navigate (best-effort) to avoid being stuck on /verify in dev StrictMode.
        if (isMounted) navigate('/dashboard', { replace: true })
        const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
        if (!isJsdom) {
          try {
            window.location.assign('/dashboard')
          } catch {
            // ignore
          }
        }
        if (isMounted) setStage('navigated')

      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : `Verification failed: ${String(err)}`
        console.debug('[verify] failed', message)
        if (isMounted) {
          setError(message)
          setStage('failed')
          setShowDebug(true)
        }
        try {
          if (guardKey) sessionStorage.removeItem(guardKey)
        } catch {
          // ignore
        }
      }
    })()

    return () => {
      isMounted = false
      clearTimeout(debugTimer)
    }
  }, [attempt, navigate, setAuth, token])

  const elapsedSec = startedAt ? Math.floor((now - startedAt) / 1000) : 0

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-5 shadow-xl">
        {!error ? (
          <>
            <div className="text-sm font-semibold">Verifying...</div>
            <p className="text-sm text-ink-muted mt-1">
              {stage === 'received' || stage === 'stored' || stage === 'navigated'
                ? 'Signed in. Redirecting...'
                : 'Please wait while we sign you in.'}
            </p>
            {startedAt && (
              <p className="text-xs text-ink-faint mt-2">
                Stage: {stage} • Elapsed: {elapsedSec}s
              </p>
            )}
          </>
        ) : (
          <>
            <div className="text-sm font-semibold">Couldn't verify</div>
            <p className="text-sm text-ink-muted mt-1">{error}</p>
            <div className="mt-4">
              <Link to="/login" className="text-sm text-accent hover:text-accent-hover transition-colors">
                Back to login
              </Link>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  didRunRef.current = false
                  setAttempt((n) => n + 1)
                }}
                className="text-sm text-ink hover:text-ink-muted transition-colors"
              >
                Retry verification
              </button>
            </div>
          </>
        )}

        {showDebug && (
          <div className="mt-5 rounded-xl border border-surface-border bg-surface p-3">
            <div className="text-xs text-ink-muted font-medium">Debug</div>
            <div className="mt-2 space-y-1 text-xs text-ink-faint">
              <div>stage: {stage}</div>
              <div>attempt: {attempt}</div>
              <div>apiBase: {apiBase || '(same-origin)'}</div>
              <div>tokenSource: {tokenSource}</div>
              <div>token: {tokenSummary}</div>
              <div>path: /api/auth/verify</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
