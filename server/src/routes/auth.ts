import { Router } from 'express'
import jwt from 'jsonwebtoken'
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

authRouter.post('/magic-link', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'email must be a valid email address' })
    return
  }

  const secret = getJwtSecretForSigning()
  const token = jwt.sign({ email, typ: 'magic' } satisfies MagicClaims, secret, {
    expiresIn: `${MAGIC_LINK_TTL_MINUTES}m`,
  })

  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000)
  await pool.query(
    `INSERT INTO magic_tokens (email, token, expires_at) VALUES ($1, $2, $3)`,
    [email, token, expiresAt]
  )

  const link = `${getAppUrl()}/verify?token=${encodeURIComponent(token)}`
  await sendMagicLinkEmail({ to: email, link })

  const includeLink = process.env.RETURN_MAGIC_LINK === 'true' && process.env.NODE_ENV !== 'production'
  res.json(includeLink ? { ok: true, link } : { ok: true })
})

authRouter.get('/verify', async (req, res) => {
  const token = String(req.query.token || '')
  if (!token) {
    res.status(400).json({ error: 'token is required' })
    return
  }

  let claims: MagicClaims
  try {
    claims = jwt.verify(token, getJwtSecretForSigning()) as MagicClaims
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  if (claims.typ !== 'magic' || !claims.email) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  const row = await pool.query<{
    id: number
    email: string
    expires_at: Date
    used: boolean
  }>(
    `SELECT id, email, expires_at, used FROM magic_tokens WHERE token = $1 ORDER BY id DESC LIMIT 1`,
    [token]
  )

  const record = row.rows[0]
  if (!record || record.used || record.expires_at.getTime() < Date.now() || record.email !== claims.email) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  await pool.query(`UPDATE magic_tokens SET used = TRUE WHERE id = $1`, [record.id])

  const name = claims.email.split('@')[0]
  const userRow = await pool.query<{ id: number; email: string; name: string | null }>(
    `
      INSERT INTO users (email, name)
      VALUES ($1, $2)
      ON CONFLICT (email) DO UPDATE SET name = COALESCE(users.name, EXCLUDED.name)
      RETURNING id, email, name
    `,
    [claims.email, name]
  )

  const user = userRow.rows[0]
  const sessionToken = jwt.sign(
    { sub: String(user.id), email: user.email, name: user.name || name },
    getJwtSecretForSigning(),
    { expiresIn: `${SESSION_TTL_DAYS}d` }
  )

  res.json({ ok: true, sessionToken, user: { email: user.email, name: user.name || name } })
})

