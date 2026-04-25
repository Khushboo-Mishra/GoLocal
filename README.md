# GoLocal 🗺️

> **Hyperlocal social discovery** — see what's happening within 1 mile of you, right now.

GoLocal is a swipeable feed of events, hangouts, and deals posted by people and businesses nearby. Built for NYC, expanding city by city.

---

## Repo structure

```
golocal/
├── backend/          # Node.js + TypeScript + Fastify API
├── frontend/         # React Native + Expo app (iOS + Android)
├── docs/             # Architecture decisions, API contracts, DB schema
└── .github/          # CI/CD workflows
```

This is a **pnpm monorepo** — one repo, two workspaces. Backend and frontend are developed in parallel and share nothing except the docs folder.

---

## Quick links

| | |
|---|---|
| 📋 [Backend README](./backend/README.md) | API setup, env vars, running locally |
| 📱 [Frontend README](./frontend/README.md) | Expo setup, running on device |
| 🗄️ [DB Schema](./docs/schema.md) | All tables, columns, indexes |
| 🔌 [API Contract](./docs/api.md) | All endpoints, request/response shapes |
| 🏗️ [Architecture](./docs/architecture.md) | Tech stack decisions and rationale |
| 💰 [Infrastructure](./docs/infrastructure.md) | Services, costs, deployment |

---

## Team

| Who | Owns |
|---|---|
| Backend dev | `backend/` — API, DB, notifications, media pipeline |
| Frontend dev | `frontend/` — all screens, components, Expo config |
| Both | `docs/` — keep updated as you build |

---

## Prerequisites

- **Node.js** v20+
- **pnpm** v9+ — install with `npm i -g pnpm`
- **Expo Go** app on your phone (for frontend dev)
- Accounts on: Supabase, Railway, Cloudflare, Clerk, Upstash (see [infrastructure guide](./docs/infrastructure.md))

---

## Getting started

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_ORG/golocal.git
cd golocal

# 2. Install all dependencies (both workspaces)
pnpm install

# 3. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill in your keys — see each README for details

# 4. Start backend
pnpm dev:backend

# 5. Start frontend (separate terminal)
pnpm dev:frontend
```

---

## Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Production — auto-deploys to Railway |
| `dev` | Integration branch — merge feature branches here first |
| `feat/your-feature` | Individual feature work |

**Rule:** Never push directly to `main`. PRs only. CI must pass before merge.

---

## CI/CD

Every PR to `main` or `dev` runs:
1. TypeScript typecheck (backend + frontend)
2. ESLint
3. Backend tests

Railway auto-deploys on merge to `main`.

---

## Key decisions

- **Why pnpm monorepo?** One repo = one PR history, shared docs, easier onboarding. No code is actually shared between backend and frontend — they're independent workspaces.
- **Why Fastify over Express?** ~2x faster, schema-first validation, better TypeScript support.
- **Why Supabase over raw Postgres?** PostGIS built-in, row-level security, no DB admin overhead at our scale.
- **Why Cloudflare R2 over S3?** Zero egress fees — critical for a media-heavy social app.

Full rationale in [docs/architecture.md](./docs/architecture.md).
