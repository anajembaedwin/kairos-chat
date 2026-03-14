import { Router } from 'express'
import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { pool } from '../db'
import { sendMagicLinkEmail } from '../services/email'
import { getJwtSecretForSigning } from '../middleware/auth'

const MAGIC_LINK_TTL_MINUTES = 15
const SESSION_TTL_DAYS = 7

type MagicClaims = {
  email: string
  typ: 'magic'
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const getAppUrl = () => (process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')

export const authRouter = Router()

const normalizeToken = (value: string) => value.trim().replace(/[<>\s'"]/g, '')

const sha256Hex = (value: string) => crypto.createHash('sha256').update(value).digest('hex')
const summarizeToken = (value: string) => (value ? `${value.slice(0, 8)}...(${value.length})` : '(missing)')
const summarizeHash = (value: string) => (value ? `${value.slice(0, 12)}...` : '(missing)')
const pickFirstQueryValue = (value: unknown) => (Array.isArray(value) ? value[0] : value)

authRouter.post('/magic-link', async (req, res) => {
  const includeReason = process.env.NODE_ENV !== 'production'
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'email must be a valid email address' })
    return
  }

  // Opaque, URL-safe token (no '.' segments) to avoid JWT parsing issues in email clients/link scanners.
  // 256-bit entropy is a common best-practice for one-time login codes.
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = sha256Hex(token)
  if (includeReason) {
    console.log('[auth] magic-link issued', {
      email,
      token: summarizeToken(token),
      tokenHash: summarizeHash(tokenHash),
    })
  }

  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000)
  await pool.query(
    `INSERT INTO magic_tokens (email, token, expires_at) VALUES ($1, $2, $3)`,
    [email, tokenHash, expiresAt]
  )

  // Put the token in the URL fragment so link scanners/prefetchers don't accidentally "consume" it
  // and so clients that strip querystrings still work. The frontend reads the fragment and calls the API.
  const link = `${getAppUrl()}/verify#token=${encodeURIComponent(token)}`
  await sendMagicLinkEmail({ to: email, link })

  // Always return the link outside production to make debugging/dev environments usable without email setup.
  const includeLink = process.env.NODE_ENV !== 'production'
  res.json(includeLink ? { ok: true, link } : { ok: true })
})

// Some email providers/security products prefetch links with HEAD requests.
// Treat HEAD as a no-op so it won't consume the one-time token.
authRouter.head('/verify', (_req, res) => {
  res.status(204).end()
})

const handleVerify = async (req: Request, res: Response, tokenInput: unknown) => {
  const includeReason = process.env.NODE_ENV !== 'production'
  const token = normalizeToken(String(tokenInput || ''))
  if (includeReason) {
    console.log('[auth] verify request', {
      method: req.method,
      url: req.originalUrl,
      ua: req.headers['user-agent'],
      referer: req.headers.referer,
      tokenSummary: summarizeToken(token),
      tokenLength: token.length,
    })
  }
  if (!token) {
    if (includeReason) console.log('[auth] verify result', { ok: false, reason: 'missing_token' })
    res.status(400).json(includeReason ? { error: 'token is required', reason: 'missing_token' } : { error: 'token is required' })
    return
  }
  if (token.length < 16) {
    if (includeReason) console.log('[auth] verify result', { ok: false, reason: 'token_too_short', tokenLength: token.length })
    res.status(400).json(
      includeReason
        ? {
            error: 'Token appears truncated',
            reason: 'token_too_short',
            tokenSummary: summarizeToken(token),
            tokenLength: token.length,
            hint: 'Do not paste a shortened/ellipsis token. Click the email button/link, or copy the full URL.',
          }
        : { error: 'Invalid token' }
    )
    return
  }

  // Primary path: opaque token hashed in DB.
  const tokenHash = sha256Hex(token)
  const row = await pool.query<{ id: number; email: string; expires_at: Date; used: boolean }>(
    `SELECT id, email, expires_at, used FROM magic_tokens WHERE token = $1 ORDER BY id DESC LIMIT 1`,
    [tokenHash]
  )

  let record = row.rows[0]
  let email: string | null = record?.email || null

  // Legacy fallback: older magic links were JWTs stored directly in DB.
  // If the opaque lookup fails and the token looks like a JWT, try verifying it.
  if (!record && token.split('.').length === 3) {
    let claims: MagicClaims
    try {
      claims = jwt.verify(token, getJwtSecretForSigning()) as MagicClaims
    } catch (err) {
      let reason = 'jwt_verify_failed'
      let jwtError: { name?: string; message?: string } | undefined

      if (err && typeof err === 'object') {
        const name = (err as { name?: string }).name
        const message = (err as { message?: string }).message
        jwtError = { name, message }

        if (name === 'TokenExpiredError') reason = 'jwt_expired'
        else if (name === 'NotBeforeError') reason = 'jwt_not_active'
        else if (name === 'JsonWebTokenError') {
          if (message === 'invalid signature') reason = 'jwt_invalid_signature'
          else if (message === 'jwt malformed') reason = 'jwt_malformed'
          else reason = 'jwt_invalid'
        }
      }

      res.status(401).json(
        includeReason
          ? { error: 'Invalid or expired token', reason, jwtError }
          : { error: 'Invalid or expired token' }
      )
      return
    }

    if (claims.typ !== 'magic' || !claims.email) {
      res.status(401).json(includeReason ? { error: 'Invalid or expired token', reason: 'claims_invalid' } : { error: 'Invalid or expired token' })
      return
    }

    const legacyRow = await pool.query<{ id: number; email: string; expires_at: Date; used: boolean }>(
      `SELECT id, email, expires_at, used FROM magic_tokens WHERE token = $1 ORDER BY id DESC LIMIT 1`,
      [token]
    )
    record = legacyRow.rows[0]
    email = record?.email || claims.email
  }

  const expiresAtMs = new Date(record?.expires_at as unknown as string | number | Date).getTime()
  if (!record || Number.isNaN(expiresAtMs) || expiresAtMs < Date.now() || !email) {
    let reason = 'token_invalid'
    if (!record) reason = 'token_not_found'
    else if (Number.isNaN(expiresAtMs)) reason = 'expires_at_invalid'
    else if (expiresAtMs < Date.now()) reason = 'token_expired'
    if (includeReason) console.log('[auth] verify result', { ok: false, reason })
    res.status(401).json(
      includeReason
        ? {
            error: 'Invalid or expired token',
            reason,
            tokenSummary: summarizeToken(token),
            tokenLength: token.length,
            tokenHashSummary: summarizeHash(tokenHash),
          }
        : { error: 'Invalid or expired token' }
    )
    return
  }

  if (record.used) {
    if (includeReason) console.log('[auth] verify result', { ok: false, reason: 'token_used' })
    res.status(401).json(
      includeReason
        ? {
            error: 'Magic link already used',
            reason: 'token_used',
            tokenSummary: summarizeToken(token),
            tokenLength: token.length,
          }
        : { error: 'Magic link already used' }
    )
    return
  }

  if (!record.used) {
    await pool.query(`UPDATE magic_tokens SET used = TRUE WHERE id = $1`, [record.id])
  }

  const name = email.split('@')[0]
  const userRow = await pool.query<{ id: number; email: string; name: string | null }>(
    `
      INSERT INTO users (email, name)
      VALUES ($1, $2)
      ON CONFLICT (email) DO UPDATE SET name = COALESCE(users.name, EXCLUDED.name)
      RETURNING id, email, name
    `,
    [email, name]
  )

  const user = userRow.rows[0]
  const sessionToken = jwt.sign(
    { sub: String(user.id), email: user.email, name: user.name || name },
    getJwtSecretForSigning(),
    { expiresIn: `${SESSION_TTL_DAYS}d` }
  )

  if (includeReason) console.log('[auth] verify result', { ok: true, userId: user.id, email: user.email })
  res.json({ ok: true, sessionToken, user: { email: user.email, name: user.name || name } })
}

authRouter.get('/verify', async (req, res) => {
  const rawQueryToken = pickFirstQueryValue((req.query as Record<string, unknown>)?.token)
  await handleVerify(req, res, rawQueryToken)
})

// Prefer POST verification in the client so tokens never appear in URLs (reduces proxy/link rewriting issues).
authRouter.post('/verify', async (req, res) => {
  await handleVerify(req, res, req.body?.token)
})
