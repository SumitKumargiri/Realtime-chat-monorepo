import dotenv from 'dotenv'
dotenv.config()
import WebSocket, { WebSocketServer } from 'ws'
import jwt from 'jsonwebtoken'
import prisma from '@chat/db'

const PORT = process.env.WS_PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

type Client = {
  userId: number
  ws: WebSocket
}

const wss = new WebSocketServer({ port: Number(PORT) })
const clients = new Map<number, WebSocket>()

console.log(`WS server running on ws://localhost:${PORT}`)

wss.on('connection', (socket, req) => {
  // Expect token in query: ?token=...
  try {
    const url = new URL(req.url || '', `http://localhost`)
    const token = url.searchParams.get('token')
    if (!token) {
      socket.close()
      return
    }
    const payload: any = jwt.verify(token, JWT_SECRET)
    const userId = payload.id
    clients.set(userId, socket)
    console.log('user connected', userId)

    socket.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'message') {
          // save to db
          const saved = await prisma.message.create({ data: { fromId: userId, toId: Number(msg.toId), body: msg.body } })
          const target = clients.get(Number(msg.toId))
          if (target && target.readyState === WebSocket.OPEN) {
            target.send(JSON.stringify({ type: 'message', message: saved }))
          }
        }
        if (msg.type === 'typing') {
          const target = clients.get(Number(msg.toId))
          if (target && target.readyState === WebSocket.OPEN) {
            target.send(JSON.stringify({ type: 'typing', from: userId }))
          }
        }
      } catch (err) {
        console.error('ws message error', err)
      }
    })

    socket.on('close', () => {
      clients.delete(userId)
      console.log('user disconnected', userId)
    })
  } catch (err) {
    socket.close()
  }
})
