import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { apiPost, ApiError } from '@/lib/api'
import { extractSessionId } from '@/lib/sessionId'

type CreateSessionResponse = { id: string; url: string }
type JoinSessionResponse = { ok: true; session: { id: string } }

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { auth, logout } = useAuth()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionUrl, setSessionUrl] = useState<string | null>(null)
  const [joinId, setJoinId] = useState('')

  const nameInitial = useMemo(() => (auth?.user?.name?.[0] || 'U').toUpperCase(), [auth])

  if (!auth) return <Navigate to="/login" replace />

  const handleCreate = async () => {
    setError(null)
    setSessionUrl(null)
    setCreating(true)
    try {
      const res = await apiPost<CreateSessionResponse>('/api/sessions', undefined, { token: auth.sessionToken })
      setSessionUrl(res.url)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!sessionUrl) return
    try {
      await navigator.clipboard.writeText(sessionUrl)
    } catch {
      // ignore
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const sessionId = extractSessionId(joinId)
    if (!sessionId) {
      setError('Enter a session ID (e.g. abc123) or a full session link.')
      return
    }

    try {
      await apiPost<JoinSessionResponse>(`/api/sessions/${encodeURIComponent(sessionId)}/join`, undefined, {
        token: auth.sessionToken,
      })
      navigate(`/session/${sessionId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to join session')
    }
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="border-b border-surface-border bg-surface-raised">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center font-semibold">
              {nameInitial}
            </div>
            <div className="leading-tight">
              <div className="font-semibold">{auth.user.name}</div>
              <div className="text-xs text-ink-muted">{auth.user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-ink-muted hover:text-ink transition-colors">
              Landing
            </Link>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
              className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface hover:bg-surface-overlay text-sm font-medium h-9 px-3 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-surface-border bg-surface-raised p-5">
          <div className="text-sm font-semibold">Create a new session</div>
          <p className="text-sm text-ink-muted mt-1">
            Generate a unique session link and share it. Maximum 2 users per session.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-white font-medium h-10 px-4 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create session'}
            </button>

            {sessionUrl && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface hover:bg-surface-overlay text-ink font-medium h-10 px-4 transition-colors"
              >
                Copy link
              </button>
            )}
          </div>

          {sessionUrl && (
            <div className="mt-4 rounded-xl border border-surface-border bg-surface p-3">
              <div className="text-xs text-ink-muted">Session link</div>
              <div className="text-xs break-all text-ink mt-1">{sessionUrl}</div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-surface-border bg-surface-raised p-5">
          <div className="text-sm font-semibold">Join a session</div>
          <p className="text-sm text-ink-muted mt-1">
            Paste a full session link (…/session/abc123) or just the session ID.
          </p>

          <form onSubmit={handleJoin} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="abc123 or https://yourapp.com/session/abc123"
              className="flex-1 h-10 rounded-lg border border-surface-border bg-surface-overlay px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface hover:bg-surface-overlay text-ink font-medium h-10 px-4 transition-colors"
            >
              Join
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
