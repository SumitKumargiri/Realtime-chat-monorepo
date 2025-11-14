"use client"
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatPage({ params }: any) {
  const { id } = params
  const [token, setToken] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [body, setBody] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    const ws = new WebSocket(`ws://localhost:5000/?token=${token}`)
    wsRef.current = ws
    ws.onmessage = (ev) => {
      const d = JSON.parse(ev.data)
      if (d.type === 'message') setMessages((m) => [...m, d.message])
    }
    return () => ws.close()
  }, [token])

  async function send() {
    if (!body) return
    // send via ws
    wsRef.current?.send(JSON.stringify({ type: 'message', toId: id, body }))
    setBody('')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-2">Chat with {id}</h2>
      <div className="border p-4 h-96 overflow-auto bg-white">
        {messages.map((m) => (
          <div key={m.id} className="mb-2"><strong>{m.fromId}:</strong> {m.body}</div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input className="flex-1 p-2 border" value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="px-4 py-2 bg-blue-600 text-white" onClick={send}>Send</button>
      </div>
    </div>
  )
}
