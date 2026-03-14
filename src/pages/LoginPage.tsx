import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPost, ApiError, getApiBase } from '@/lib/api'

type MagicLinkResponse = { ok: true; link?: string }

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [devLink, setDevLink] = useState<string | null>(null)
  const [lastAttemptUrl, setLastAttemptUrl] = useState<string | null>(null)

  const isValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDevLink(null)
    if (!isValid) return

    setStatus('loading')
    try {
      const apiBase = getApiBase()
      const url = `${apiBase}/api/auth/magic-link`
      setLastAttemptUrl(url || '/api/auth/magic-link')
      const res = await apiPost<MagicLinkResponse>('/api/auth/magic-link', { email })
      setDevLink(res.link ?? null)
      setStatus('sent')
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to send magic link'
      setError(message)
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-ink">Kairos Chat</h1>
          <p className="text-ink-muted text-sm mt-1">Sign in with a magic link</p>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-raised p-5 shadow-xl">
          {status !== 'sent' ? (
            <>
              <div className="text-sm font-semibold">Continue with email</div>
              <p className="text-sm text-ink-muted mt-1">
                We'll email you a secure link to sign in. No passwords.
              </p>

              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-ink-muted" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="mt-1 w-full h-11 rounded-lg border border-surface-border bg-surface-overlay px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    autoComplete="email"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    <div>{error}</div>
                    {lastAttemptUrl && (
                      <div className="mt-1 text-[11px] text-red-300/80 break-all">
                        Request: {lastAttemptUrl}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isValid || status === 'loading'}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium h-11 px-4 transition-colors"
                >
                  {status === 'loading' ? 'Sending...' : 'Send magic link'}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs text-ink-faint">
                <Link to="/" className="hover:text-ink transition-colors">
                  Back to landing
                </Link>
                <span>By continuing you agree to the rules of the session timer.</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold">Check your email</div>
              <p className="text-sm text-ink-muted mt-1">
                We sent a sign-in link to <span className="text-ink">{email.trim()}</span>.
              </p>

              {devLink && (
                <div className="mt-4 rounded-xl border border-surface-border bg-surface p-3">
                  <div className="text-xs text-ink-muted">Dev link</div>
                  <a className="text-xs text-accent break-all" href={devLink}>
                    {devLink}
                  </a>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="flex-1 inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface-raised hover:bg-surface-overlay text-ink font-medium h-10 px-4 transition-colors"
                >
                  Use a different email
                </button>
                <Link
                  to="/"
                  className="flex-1 inline-flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-white font-medium h-10 px-4 transition-colors"
                >
                  Done
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
