import request from 'supertest'
import { app, httpServer } from '../index'
import { pool } from '../db/index'

jest.mock('../db/index', () => ({
  pool: {
    query: jest.fn(),
  },
  initDB: jest.fn().mockResolvedValue(undefined),
}))

const mockQuery = pool.query as jest.Mock

afterAll((done) => {
  httpServer.close(done)
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/messages', () => {
  it('returns all messages', async () => {
    const mockMessages = [
      { id: 1, sender: 'User A', text: 'Hello', created_at: new Date().toISOString() },
      { id: 2, sender: 'User B', text: 'Hi!', created_at: new Date().toISOString() },
    ]

    mockQuery.mockResolvedValueOnce({ rows: mockMessages })

    const res = await request(app).get('/api/messages')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].sender).toBe('User A')
    expect(res.body[1].text).toBe('Hi!')
  })

  it('returns empty array when no messages', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const res = await request(app).get('/api/messages')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'))

    const res = await request(app).get('/api/messages')

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Internal server error')
  })
})

describe('POST /api/messages', () => {
  it('creates a new message and returns it', async () => {
    const newMessage = {
      id: 1,
      sender: 'User A',
      text: 'Hello!',
      created_at: new Date().toISOString(),
    }

    mockQuery.mockResolvedValueOnce({ rows: [newMessage] })

    const res = await request(app)
      .post('/api/messages')
      .send({ sender: 'User A', text: 'Hello!' })

    expect(res.status).toBe(201)
    expect(res.body.sender).toBe('User A')
    expect(res.body.text).toBe('Hello!')
    expect(res.body.id).toBeDefined()
  })

  it('returns 400 when sender is missing', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ text: 'Hello!' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('sender')
  })

  it('returns 400 when text is missing', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ sender: 'User A' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('text')
  })

  it('returns 400 when sender is empty string', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ sender: '   ', text: 'Hello!' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('sender')
  })

  it('returns 400 when text is empty string', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ sender: 'User A', text: '   ' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('text')
  })

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'))

    const res = await request(app)
      .post('/api/messages')
      .send({ sender: 'User A', text: 'Hello!' })

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Internal server error')
  })
})

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})