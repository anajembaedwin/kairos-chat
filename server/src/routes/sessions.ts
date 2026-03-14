import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { sessionStore } from '../services/sessionStore'

const getAppUrl = () => (process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')

export const sessionsRouter = Router()

sessionsRouter.post('/', requireAuth, (req, res) => {
  const session = sessionStore.create()
  res.status(201).json({
    id: session.id,
    url: `${getAppUrl()}/session/${session.id}`,
  })
})

sessionsRouter.get('/:id', (req, res) => {
  const session = sessionStore.get(req.params.id)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  res.json({ id: session.id, users: session.users, startedAt: session.startedAt })
})

sessionsRouter.post('/:id/join', requireAuth, (req, res) => {
  const user = req.user
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const joined = sessionStore.join(req.params.id, { email: user.email, name: user.name })
  if (!joined.ok) {
    res.status(joined.error === 'not_found' ? 404 : 409).json({
      error: joined.error === 'full' ? 'Session is full' : 'Session not found',
    })
    return
  }

  res.json({ ok: true, session: joined.session })
})

sessionsRouter.post('/:id/end', requireAuth, (req, res) => {
  const user = req.user
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const session = sessionStore.get(req.params.id)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }

  const isMember = session.users.some((u) => u.email === user.email)
  if (!isMember) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  sessionStore.end(req.params.id)
  res.json({ ok: true })
})
