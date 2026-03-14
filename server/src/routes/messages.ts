import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { validateMessage } from '../middleware/validate'
import { CreateMessageBody, Message } from '../types'

const router = Router()

// GET /api/messages - paginated, cursor-based
// Query params: limit (default 20), before (message id cursor)
router.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
  const before = req.query.before ? parseInt(req.query.before as string) : null

  try {
    let query: string
    let params: (number | null)[]

    if (before) {
      query = `
        SELECT * FROM (
          SELECT * FROM messages
          WHERE id < $1
          ORDER BY created_at DESC
          LIMIT $2
        ) sub
        ORDER BY created_at ASC
      `
      params = [before, limit]
    } else {
      query = `
        SELECT * FROM (
          SELECT * FROM messages
          ORDER BY created_at DESC
          LIMIT $1
        ) sub
        ORDER BY created_at ASC
      `
      params = [limit]
    }

    const result = await pool.query<Message>(query, params)
    const hasMore = result.rows.length === limit

    res.json({
      messages: result.rows,
      hasMore,
      nextCursor: result.rows.length > 0 ? result.rows[0].id : null,
    })
  } catch (error) {
    console.error('GET /api/messages error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/messages - create a new message
router.post(
  '/',
  validateMessage,
  async (req: Request<object, object, CreateMessageBody>, res: Response) => {
    const { sender, text } = req.body
    try {
      const result = await pool.query<Message>(
        'INSERT INTO messages (sender, text) VALUES ($1, $2) RETURNING *',
        [sender.trim(), text.trim()]
      )
      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('POST /api/messages error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router