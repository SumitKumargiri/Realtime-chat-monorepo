"use client"
import { useState } from 'react'

export default function Page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')

  async function signup() {
    const res = await fetch('http://localhost:4000/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (data.token) setToken(data.token)
  }

  async function login() {
    const res = await fetch('http://localhost:4000/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (data.token) setToken(data.token)
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Chat App — Login / Signup</h1>
      <input className="w-full p-2 border mb-2" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full p-2 border mb-2" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white" onClick={login}>Login</button>
        <button className="px-4 py-2 bg-green-600 text-white" onClick={signup}>Signup</button>
      </div>

      {token && <div className="mt-4 p-2 bg-gray-100">Logged in. Token: <code className="break-all">{token}</code></div>}
    </div>
  )
}
