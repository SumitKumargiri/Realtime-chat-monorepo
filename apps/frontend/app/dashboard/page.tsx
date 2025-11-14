"use client"
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [friends, setFriends] = useState<any[]>([])
  const [token, setToken] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) setToken(t)
  }, [])

  async function load() {
    const res = await fetch('http://localhost:4000/friends', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setFriends(data)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <div className="mb-4">
        <button className="px-3 py-2 bg-blue-600 text-white" onClick={load}>Load Friends</button>
      </div>
      <ul>
        {friends.map((f) => (
          <li key={f.id} className="p-2 border-b">{f.name || f.email}</li>
        ))}
      </ul>
    </div>
  )
}
