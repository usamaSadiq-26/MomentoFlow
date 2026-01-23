import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = 3003
const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// Store connected users and their socket IDs
const connectedUsers = new Map<string, string>() // userId -> socketId

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // User joins (register their userId)
  socket.on('user:join', (userId: string) => {
    connectedUsers.set(userId, socket.id)
    console.log(`User ${userId} joined with socket ${socket.id}`)
  })

  // Listen for task updates
  socket.on('task:updated', (data: { taskId: string; userId: string; type: string }) => {
    // Broadcast to all connected users except the sender
    socket.broadcast.emit('task:updated', data)
  })

  // Listen for task moves
  socket.on('task:moved', (data: { taskId: string; fromStatus: string; toStatus: string; userId: string }) => {
    socket.broadcast.emit('task:moved', data)
  })

  // Listen for new comments
  socket.on('task:commented', (data: { taskId: string; commentId: string; userId: string }) => {
    socket.broadcast.emit('task:commented', data)
  })

  // Listen for task assignments
  socket.on('task:assigned', (data: { taskId: string; assigneeId: string; userId: string }) => {
    // Send notification to the assigned user
    const assigneeSocketId = connectedUsers.get(data.assigneeId)
    if (assigneeSocketId) {
      io.to(assigneeSocketId).emit('notification:new', {
        type: 'card_assigned',
        message: `You have been assigned to a task`,
        taskId: data.taskId,
      })
    }
  })

  // Listen for notification requests
  socket.on('notification:send', (data: { userId: string; notification: any }) => {
    const userSocketId = connectedUsers.get(data.userId)
    if (userSocketId) {
      io.to(userSocketId).emit('notification:new', data.notification)
    }
  })

  // User leaves
  socket.on('user:leave', (userId: string) => {
    connectedUsers.delete(userId)
    console.log(`User ${userId} left`)
  })

  // Disconnect
  socket.on('disconnect', () => {
    // Find and remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId)
        console.log(`User ${userId} disconnected`)
        break
      }
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`)
})
