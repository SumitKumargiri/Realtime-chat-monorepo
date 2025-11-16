# Chat App Monorepo

This repo contains a minimal full-stack real-time chat application scaffolded as a Turborepo monorepo.

Apps:
- `apps/frontend` — Next.js (App Router) + Tailwind
- `apps/backend` — Express API (JWT auth, Prisma)
- `apps/ws` — WebSocket server (ws)
- `packages/db` — Prisma schema & client (SQLite by default for dev)

Quick start (Windows PowerShell):

1. Install dependencies (pnpm is recommended):

```powershell
npm install -g pnpm
pnpm install
```

2. Generate Prisma client and migrate (dev uses SQLite):

```powershell
cd packages/db
pnpm prisma:generate
pnpm prisma migrate dev --name init --preview-feature
cd ../../
```

3. Run apps in development (from repo root):

```powershell
pnpm dev
```

Environment variables:
- `DATABASE_URL` (optional — defaults to SQLite at `file:./dev.db` if not set)
- `JWT_SECRET` (optional — defaults to `dev_secret`)

Notes:
- The Prisma schema defaults to SQLite for easier local dev. To use PostgreSQL, update `packages/db/prisma/schema.prisma` provider to `postgresql` and set `DATABASE_URL` to a Postgres connection string.
- The frontend assumes the backend runs at `http://localhost:4000` and the ws server at `ws://localhost:5000`.
