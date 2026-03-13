import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDB, pool } from './db'
import messagesRouter from './routes/messages'
import { Message, CreateMessageBody } from './types'

dotenv.config()

const app = express()
const httpServer = http.createServer(app)

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')

const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST'],
  },
})

app.use(cors({ origin: clientUrl }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/messages', messagesRouter)

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('sendMessage', async (data: CreateMessageBody) => {
    const { sender, text } = data

    // Validate
    if (!sender || sender.trim() === '' || !text || text.trim() === '') {
      socket.emit('error', { error: 'sender and text are required' })
      return
    }

    try {
      // Save to DB
      const result = await pool.query<Message>(
        'INSERT INTO messages (sender, text) VALUES ($1, $2) RETURNING *',
        [sender.trim(), text.trim()]
      )
      const message = result.rows[0]

      // Broadcast to ALL connected clients including sender
      io.emit('message', message)
    } catch (error) {
      console.error('Socket sendMessage error:', error)
      socket.emit('error', { error: 'Failed to save message' })
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001

export const start = async () => {
  await initDB()
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export const autoStart = (options: {
  mainModule?: NodeModule | null
  currentModule?: NodeModule
  startFn?: () => unknown
} = {}) => {
  const mainModule = options.mainModule ?? require.main
  const currentModule = options.currentModule ?? module
  const startFn = options.startFn ?? start

  if (mainModule === currentModule) {
    void startFn()
  }
}

autoStart()

export { app, httpServer, io }
