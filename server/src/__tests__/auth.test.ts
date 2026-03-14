import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../index'
import { pool } from '../db'
import { sendMagicLinkEmail } from '../services/email'

jest.mock('../db', () => ({
  pool: { query: jest.fn() },
  initDB: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../services/email', () => ({
  sendMagicLinkEmail: jest.fn().mockResolvedValue(undefined),
}))

const queryMock = pool.query as unknown as jest.Mock
const sendEmailMock = sendMagicLinkEmail as unknown as jest.Mock

describe('auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
    process.env.RETURN_MAGIC_LINK = 'true'
    process.env.NODE_ENV = 'test'
    process.env.APP_URL = 'http://localhost:5173'
  })

  it('POST /api/auth/magic-link validates email', async () => {
    const res = await request(app).post('/api/auth/magic-link').send({ email: 'not-an-email' })
    expect(res.status).toBe(400)
  })

  it('POST /api/auth/magic-link stores token and sends email', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    const res = await request(app).post('/api/auth/magic-link').send({ email: 'user@example.com' })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.link).toContain('/verify?token=')
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO magic_tokens'),
      expect.arrayContaining(['user@example.com', expect.any(String), expect.any(Date)])
    )
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com', link: expect.any(String) })
    )
  })

  it('GET /api/auth/verify issues a session token', async () => {
    const magicToken = jwt.sign({ email: 'user@example.com', typ: 'magic' }, process.env.JWT_SECRET as string, {
      expiresIn: '15m',
    })

    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 1, email: 'user@example.com', expires_at: new Date(Date.now() + 60_000), used: false }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 42, email: 'user@example.com', name: 'user' }] })

    const res = await request(app).get('/api/auth/verify').query({ token: magicToken })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.sessionToken).toEqual(expect.any(String))
    expect(res.body.user).toEqual({ email: 'user@example.com', name: 'user' })
  })
})

