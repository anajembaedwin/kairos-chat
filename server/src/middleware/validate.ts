import { Request, Response, NextFunction } from 'express'
import { CreateMessageBody } from '../types'

export const validateMessage = (
  req: Request<object, object, CreateMessageBody>,
  res: Response,
  next: NextFunction
) => {
  const { sender, text } = req.body

  if (!sender || typeof sender !== 'string' || sender.trim() === '') {
    res.status(400).json({ error: 'sender is required and must be a non-empty string' })
    return
  }

  if (!text || typeof text !== 'string' || text.trim() === '') {
    res.status(400).json({ error: 'text is required and must be a non-empty string' })
    return
  }

  next()
}