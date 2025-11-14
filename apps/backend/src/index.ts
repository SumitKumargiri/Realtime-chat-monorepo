import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '@chat/db'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

function signToken(user: { id: number; email: string }) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

app.post('/auth/signup', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(400).json({ error: 'User exists' })
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, password: hashed, name } })
  const token = signToken(user)
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(400).json({ error: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' })
  const token = signToken(user)
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

// middleware
async function auth(req: any, res: any, next: any) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Unauthorized' })
  const token = header.split(' ')[1]
  try {
    const payload: any = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

app.post('/friend-request', auth, async (req, res) => {
  const { toEmail } = req.body
  if (!toEmail) return res.status(400).json({ error: 'Missing toEmail' })
  const to = await prisma.user.findUnique({ where: { email: toEmail } })
  if (!to) return res.status(404).json({ error: 'Recipient not found' })
  const existing = await prisma.friendRequest.findFirst({ where: { fromId: req.user.id, toId: to.id, status: 'pending' } })
  if (existing) return res.status(400).json({ error: 'Request already sent' })
  const fr = await prisma.friendRequest.create({ data: { fromId: req.user.id, toId: to.id } })
  res.json(fr)
})

app.post('/friend-request/respond', auth, async (req, res) => {
  const { requestId, accept } = req.body
  const fr = await prisma.friendRequest.findUnique({ where: { id: Number(requestId) } })
  if (!fr || fr.toId !== req.user.id) return res.status(404).json({ error: 'Request not found' })
  const status = accept ? 'accepted' : 'rejected'
  await prisma.friendRequest.update({ where: { id: fr.id }, data: { status } })
  if (accept) {
    await prisma.friendship.create({ data: { userAId: fr.fromId, userBId: fr.toId } })
  }
  res.json({ ok: true })
})

app.get('/friends', auth, async (req, res) => {
  const friendships = await prisma.friendship.findMany({ where: { OR: [{ userAId: req.user.id }, { userBId: req.user.id }] } })
  const friendIds = friendships.map((f) => (f.userAId === req.user.id ? f.userBId : f.userAId))
  const friends = await prisma.user.findMany({ where: { id: { in: friendIds } }, select: { id: true, email: true, name: true } })
  res.json(friends)
})

app.get('/messages/:friendId', auth, async (req, res) => {
  const friendId = Number(req.params.friendId)
  const msgs = await prisma.message.findMany({ where: { OR: [ { fromId: req.user.id, toId: friendId }, { fromId: friendId, toId: req.user.id } ] }, orderBy: { createdAt: 'asc' } })
  res.json(msgs)
})

app.post('/messages', auth, async (req, res) => {
  const { toId, body } = req.body
  if (!toId || !body) return res.status(400).json({ error: 'Missing fields' })
  const msg = await prisma.message.create({ data: { fromId: req.user.id, toId: Number(toId), body } })
  // NOTE: Real-time delivery occurs via the ws server; this saves message to DB
  res.json(msg)
})

app.get('/friend-requests', auth, async (req, res) => {
  const r = await prisma.friendRequest.findMany({ where: { toId: req.user.id, status: 'pending' }, include: { from: true } })
  res.json(r)
})

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
