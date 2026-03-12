import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { validateMessage } from '../middleware/validate'
import { CreateMessageBody, Message } from '../types'

const router = Router()

// GET /api/messages - return all messages
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<Message>(
      'SELECT * FROM messages ORDER BY created_at ASC'
    )
    res.json(result.rows)
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