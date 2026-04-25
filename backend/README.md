# GoLocal — Backend

Node.js + TypeScript + Fastify API powering the GoLocal app.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v20 + TypeScript |
| Framework | Fastify v4 |
| Database | PostgreSQL + PostGIS (via Supabase) |
| Cache | Redis (via Upstash) |
| Media storage | Cloudflare R2 |
| Video | Cloudflare Stream |
| Auth | Clerk (JWT verification) |
| Notifications | BullMQ + Expo Push API |
| Error tracking | Sentry |
| Deployment | Railway (Docker) |

## Local setup

### 1. Prerequisites
- Node.js v20+
- pnpm v9+ (`npm i -g pnpm`)
- A Supabase project (free tier OK for local dev)
- Other service accounts (see `.env.example`)

### 2. Install dependencies
```bash
# From repo root
pnpm install

# Or from backend/ folder
pnpm install
```

### 3. Environment variables
```bash
cp .env.example .env
```
Fill in every variable. See comments in `.env.example` for where to find each value.

### 4. Run database migrations
Open your Supabase project → SQL Editor → paste and run `src/db/migrations.sql` in order.

### 5. Start the dev server
```bash
pnpm dev
```
The API runs at `http://localhost:3000`.

Test it:
```bash
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"..."}
```

## Project structure

```
backend/
├── src/
│   ├── index.ts          # Server entry point, plugin registration
│   ├── db/
│   │   ├── client.ts     # Postgres connection pool
│   │   └── migrations.sql # Run in Supabase SQL Editor
│   ├── routes/
│   │   ├── auth.ts       # POST /auth/sync
│   │   ├── feed.ts       # GET /feed, /feed/trending, /feed/going
│   │   ├── posts.ts      # CRUD + like/save/report
│   │   ├── users.ts      # Profile, location, push token, block
│   │   └── rooms.ts      # GET /rooms, /rooms/:id/posts
│   ├── middleware/
│   │   └── requireAuth.ts # Clerk JWT verification
│   ├── services/
│   │   ├── cache.ts      # Redis get/set helpers
│   │   ├── media.ts      # R2 upload + Cloudflare Stream (TODO)
│   │   └── notifications.ts # Expo push + BullMQ jobs (TODO)
│   ├── jobs/
│   │   └── worker.ts     # BullMQ worker (TODO)
│   └── utils/
│       └── geo.ts        # Geo helper functions (TODO)
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

## API reference

All endpoints documented in [docs/api.md](../docs/api.md).

**Quick reference:**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /health | No | Health check |
| POST | /auth/sync | Yes | Upsert user after Clerk sign-in |
| GET | /users/me | Yes | Get current user profile |
| PATCH | /users/me | Yes | Update name / radius |
| POST | /users/me/location | Yes | Update GPS location |
| POST | /users/me/push-token | Yes | Register push token |
| POST | /users/me/avatar | Yes | Upload profile photo |
| GET | /feed | Yes | Nearby posts (geo-filtered) |
| GET | /feed/trending | Yes | Most liked in 24h |
| GET | /feed/going | Yes | User's saved posts |
| POST | /posts | Yes | Create a post |
| GET | /posts/:id | Yes | Post detail |
| DELETE | /posts/:id | Yes | Soft delete (owner only) |
| POST | /posts/:id/like | Yes | Toggle like |
| POST | /posts/:id/save | Yes | Toggle save |
| POST | /posts/:id/report | Yes | Report a post |
| GET | /rooms | Yes | List system rooms |

## Adding a new endpoint

1. Create or open the relevant route file in `src/routes/`
2. Add your handler with `requireAuth` preHandler
3. Add Zod validation on request body/query
4. Update `docs/api.md` with request/response shape
5. Write a test in `src/routes/__tests__/`

## Environment variables

See `.env.example` — every variable is documented with where to find it.

**Never commit `.env` to git.** It's in `.gitignore`.

## Deployment

Railway auto-deploys on every merge to `main`.

Manual deploy:
```bash
railway up
```

Check logs:
```bash
railway logs
```

## Testing

```bash
pnpm test        # Run all tests once
pnpm test:watch  # Watch mode
```

## Common issues

**`DATABASE_URL` connection refused locally** → Make sure you're using the Supabase transaction pooler URL (port 6543), not the direct connection (port 5432). Direct connections don't work from Railway.

**PostGIS extension errors** → Run `CREATE EXTENSION IF NOT EXISTS postgis;` in Supabase SQL editor first.

**Clerk token invalid** → Make sure `CLERK_SECRET_KEY` matches the environment (test keys start with `sk_test_`, live keys with `sk_live_`).
