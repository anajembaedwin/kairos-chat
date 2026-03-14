import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDB, pool } from './db'
import messagesRouter from './routes/messages'
import { authRouter } from './routes/auth'
import { sessionsRouter } from './routes/sessions'
import { sessionStore } from './services/sessionStore'
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

app.use('/api/auth', authRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/messages', messagesRouter)

// Track online users: socketId -> username
const onlineUsers = new Map<string, string>()

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('joinSession', (data: { sessionId: string; email: string; name: string }) => {
    const sessionId = String(data?.sessionId || '').trim()
    const email = String(data?.email || '').trim().toLowerCase()
    const name = String(data?.name || '').trim() || email.split('@')[0]

    if (!sessionId || !email) {
      socket.emit('sessionError', { error: 'sessionId and email are required' })
      return
    }

    const joined = sessionStore.join(sessionId, { email, name })
    if (!joined.ok) {
      socket.emit('sessionError', { error: joined.error === 'full' ? 'Session is full' : 'Session not found' })
      return
    }

    sessionStore.attachSocket(sessionId, email, socket.id)
    socket.join(sessionId)
    io.to(sessionId).emit('sessionUsers', joined.session.users)
    if (joined.session.users.length === 2) {
      io.to(sessionId).emit('sessionStarted', { startedAt: joined.session.startedAt })
    }
  })

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
    const updatedSession = sessionStore.leaveBySocket(socket.id)
    if (updatedSession) {
      io.to(updatedSession.id).emit('sessionUsers', updatedSession.users)
    }
    const username = onlineUsers.get(socket.id)
    onlineUsers.delete(socket.id)
    // Broadcast updated online users list
    io.emit('onlineUsers', Array.from(onlineUsers.values()))
    console.log(`${username || socket.id} disconnected`)
  })
})

const PORT = process.env.PORT || 3001

const start = async (port: number | string = PORT) => {
  await initDB()
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

type AutoStartArgs = {
  mainModule?: NodeModule | null
  currentModule?: NodeModule
  startFn?: () => unknown
  env?: NodeJS.ProcessEnv
}

const autoStart = (args: AutoStartArgs = {}) => {
  const env = args.env ?? process.env
  const isUnitTestInvocation = Boolean(args.mainModule && args.currentModule && args.startFn)
  if (!isUnitTestInvocation) {
    const isJest = typeof env.JEST_WORKER_ID !== 'undefined'
    if (env.NODE_ENV === 'test' || isJest) return
    if (env.AUTO_START === 'false') return
  }

  const mainModule = args.mainModule ?? require.main
  const currentModule = args.currentModule ?? module
  if (mainModule === currentModule) {
    const startFn = args.startFn ?? (() => start())
    void startFn()
  }
}

autoStart()

export { app, httpServer, io, start, autoStart }
