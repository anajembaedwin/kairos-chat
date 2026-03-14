import crypto from 'crypto'

export type SessionUser = {
  email: string
  name: string
  socketId?: string
}

export type Session = {
  id: string
  users: SessionUser[]
  createdAt: number
  startedAt: number | null
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

const generateId = (length = 6) => {
  const bytes = crypto.randomBytes(length)
  let id = ''
  for (let i = 0; i < length; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return id
}

class InMemorySessionStore {
  private sessions = new Map<string, Session>()

  create() {
    let id = generateId()
    while (this.sessions.has(id)) id = generateId()
    const session: Session = { id, users: [], createdAt: Date.now(), startedAt: null }
    this.sessions.set(id, session)
    return session
  }

  get(sessionId: string) {
    return this.sessions.get(sessionId) || null
  }

  join(sessionId: string, user: Omit<SessionUser, 'socketId'>) {
    const session = this.sessions.get(sessionId)
    if (!session) return { ok: false as const, error: 'not_found' as const }

    const already = session.users.find((u) => u.email === user.email)
    if (already) return { ok: true as const, session }

    if (session.users.length >= 2) {
      return { ok: false as const, error: 'full' as const }
    }

    session.users.push({ ...user })
    if (session.users.length === 2 && !session.startedAt) {
      session.startedAt = Date.now()
    }
    return { ok: true as const, session }
  }

  attachSocket(sessionId: string, email: string, socketId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return null
    const found = session.users.find((u) => u.email === email)
    if (!found) return null
    found.socketId = socketId
    return session
  }

  leaveBySocket(socketId: string) {
    for (const session of this.sessions.values()) {
      const idx = session.users.findIndex((u) => u.socketId === socketId)
      if (idx !== -1) {
        session.users.splice(idx, 1)
        if (session.users.length < 2) session.startedAt = null
        return session
      }
    }
    return null
  }

  end(sessionId: string) {
    const session = this.sessions.get(sessionId) || null
    if (!session) return null
    this.sessions.delete(sessionId)
    return session
  }
}

export const sessionStore = new InMemorySessionStore()
