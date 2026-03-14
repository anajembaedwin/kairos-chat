import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../index'

jest.mock('../db', () => ({
  pool: { query: jest.fn() },
  initDB: jest.fn().mockResolvedValue(undefined),
}))

const signSession = (email: string, name: string) => {
  process.env.JWT_SECRET = 'test-secret'
  return jwt.sign({ sub: '1', email, name }, process.env.JWT_SECRET as string, { expiresIn: '7d' })
}

describe('sessions', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    process.env.APP_URL = 'http://localhost:5173'
  })

  it('POST /api/sessions creates a new session', async () => {
    const token = signSession('a@example.com', 'a')
    const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(201)
    expect(res.body.id).toMatch(/^[a-z0-9]{6}$/)
    expect(res.body.url).toContain(`/session/${res.body.id}`)
  })

  it('POST /api/sessions/:id/join allows up to two users', async () => {
    const a = signSession('a@example.com', 'a')
    const b = signSession('b@example.com', 'b')
    const c = signSession('c@example.com', 'c')

    const created = await request(app).post('/api/sessions').set('Authorization', `Bearer ${a}`)
    const id = created.body.id as string

    const joinA = await request(app).post(`/api/sessions/${id}/join`).set('Authorization', `Bearer ${a}`)
    expect(joinA.status).toBe(200)
    expect(joinA.body.session.users).toHaveLength(1)

    const joinB = await request(app).post(`/api/sessions/${id}/join`).set('Authorization', `Bearer ${b}`)
    expect(joinB.status).toBe(200)
    expect(joinB.body.session.users).toHaveLength(2)
    expect(joinB.body.session.startedAt).toEqual(expect.any(Number))

    const joinC = await request(app).post(`/api/sessions/${id}/join`).set('Authorization', `Bearer ${c}`)
    expect(joinC.status).toBe(409)
  })

  it('POST /api/sessions/:id/end ends an active session for a member', async () => {
    const a = signSession('a@example.com', 'a')
    const b = signSession('b@example.com', 'b')

    const created = await request(app).post('/api/sessions').set('Authorization', `Bearer ${a}`)
    const id = created.body.id as string

    await request(app).post(`/api/sessions/${id}/join`).set('Authorization', `Bearer ${a}`)
    await request(app).post(`/api/sessions/${id}/join`).set('Authorization', `Bearer ${b}`)

    const ended = await request(app).post(`/api/sessions/${id}/end`).set('Authorization', `Bearer ${a}`)
    expect(ended.status).toBe(200)
    expect(ended.body.ok).toBe(true)

    const after = await request(app).get(`/api/sessions/${id}`)
    expect(after.status).toBe(404)
  })
})
