import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { apiGet, apiPost, ApiError } from '@/lib/api'
import { SessionTimer } from '@/components/SessionTimer'

type SessionState = { id: string; users: { email: string; name: string }[]; startedAt: number | null }

export const SessionPage = () => {
  const { id } = useParams()
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<SessionState | null>(null)
  const [joining, setJoining] = useState(false)
  const didJoinRef = useRef(false)

  if (!auth) return <Navigate to="/login" replace />
  if (!id) return <Navigate to="/dashboard" replace />

  const isStarted = Boolean(session?.startedAt && (session?.users?.length || 0) >= 2)
  const startedAt = session?.startedAt || null

  const refresh = useCallback(async () => {
    const res = await apiGet<SessionState>(`/api/sessions/${encodeURIComponent(id)}`)
    setSession(res)
  }, [id])

  const join = useCallback(async () => {
    setError(null)
    setJoining(true)
    try {
      await apiPost(`/api/sessions/${encodeURIComponent(id)}/join`, undefined, { token: auth.sessionToken })
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to join session')
    } finally {
      setJoining(false)
    }
  }, [auth.sessionToken, id, refresh])

  useEffect(() => {
    if (didJoinRef.current) return
    didJoinRef.current = true
    void join()
  }, [join])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        await refresh()
      } catch {
        // ignore transient errors during polling
      }
    }
    const t = setInterval(() => {
      if (!cancelled) void tick()
    }, 1500)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [refresh])

  const you = useMemo(() => auth.user.email, [auth.user.email])
  const otherUser = useMemo(() => {
    const users = session?.users || []
    return users.find((u) => u.email !== you) || null
  }, [session?.users, you])

  const endSession = useCallback(async () => {
    try {
      await apiPost(`/api/sessions/${encodeURIComponent(id)}/end`, undefined, { token: auth.sessionToken })
    } catch {
      // ignore
    } finally {
      navigate('/dashboard', { replace: true })
    }
  }, [auth.sessionToken, id, navigate])

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="border-b border-surface-border bg-surface-raised">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="leading-tight">
            <div className="font-semibold">Session {id}</div>
            <div className="text-xs text-ink-muted">
              {isStarted ? 'Session started' : 'Waiting for the second user to join'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-sm text-ink-muted hover:text-ink transition-colors">
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => void endSession()}
              className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface hover:bg-surface-overlay text-sm font-medium h-9 px-3 transition-colors"
            >
              End session
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 grid gap-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-surface-border bg-surface-raised p-5">
          <div className="text-sm font-semibold">Participants</div>
          <div className="mt-3 grid gap-2">
            <div className="rounded-xl border border-surface-border bg-surface p-3">
              <div className="text-xs text-ink-muted">You</div>
              <div className="text-sm">{auth.user.name}</div>
              <div className="text-xs text-ink-faint">{auth.user.email}</div>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface p-3">
              <div className="text-xs text-ink-muted">Other user</div>
              {otherUser ? (
                <>
                  <div className="text-sm">{otherUser.name}</div>
                  <div className="text-xs text-ink-faint">{otherUser.email}</div>
                </>
              ) : (
                <div className="text-sm text-ink-muted">Not joined yet</div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => void join()}
              disabled={joining}
              className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface hover:bg-surface-overlay text-sm font-medium h-9 px-3 transition-colors disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Re-join'}
            </button>
          </div>
        </div>

        {startedAt && (
          <SessionTimer startedAt={startedAt} onExpire={endSession} />
        )}

        <div className="rounded-2xl border border-surface-border bg-surface-raised p-5">
          <div className="text-sm font-semibold">Chat</div>
          <p className="text-sm text-ink-muted mt-1">
            Chat interface stays unchanged; we’ll wire it into sessions after the timer + encryption pieces are stable.
          </p>
        </div>
      </main>
    </div>
  )
}
