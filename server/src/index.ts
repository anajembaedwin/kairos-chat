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

app.use(cors({
  origin: clientUrl,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/messages', messagesRouter)

// Track online users: socketId -> username
const onlineUsers = new Map<string, string>()

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // User comes online
  socket.on('userOnline', (username: string) => {
    onlineUsers.set(socket.id, username)
    // Broadcast updated online users list to all clients
    io.emit('onlineUsers', Array.from(onlineUsers.values()))
    console.log(`${username} is online`)
  })

  // Typing indicator
  socket.on('typing', (data: { sender: string; isTyping: boolean }) => {
    // Broadcast to everyone except the sender
    socket.broadcast.emit('userTyping', data)
  })

  // Send message
  socket.on('sendMessage', async (data: CreateMessageBody) => {
    const { sender, text } = data

    if (!sender || sender.trim() === '' || !text || text.trim() === '') {
      socket.emit('error', { error: 'sender and text are required' })
      return
    }

    try {
      const result = await pool.query<Message>(
        'INSERT INTO messages (sender, text) VALUES ($1, $2) RETURNING *',
        [sender.trim(), text.trim()]
      )
      const message = result.rows[0]

      // Broadcast to ALL connected clients including sender
      io.emit('message', message)

      // Send delivery confirmation back to sender
      socket.emit('messageDelivered', { id: message.id })
    } catch (error) {
      console.error('Socket sendMessage error:', error)
      socket.emit('error', { error: 'Failed to save message' })
    }
  })

  // User disconnects
  socket.on('disconnect', () => {
    const username = onlineUsers.get(socket.id)
    onlineUsers.delete(socket.id)
    // Broadcast updated online users list
    io.emit('onlineUsers', Array.from(onlineUsers.values()))
    console.log(`${username || socket.id} disconnected`)
  })
})

const PORT = process.env.PORT || 3001

const start = async () => {
  await initDB()
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start()

export { app, httpServer, io }