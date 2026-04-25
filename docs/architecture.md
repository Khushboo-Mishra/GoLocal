# GoLocal Architecture

## Overview

```
Mobile app (React Native + Expo)
        ↓ HTTPS
API gateway (Railway — Fastify)
        ↓
   ┌────┴─────────────┐
   │                  │
PostgreSQL          Redis
(Supabase)       (Upstash)
+ PostGIS           ↓
   │            BullMQ jobs
   │                  ↓
   └──────────→ Expo Push API
                      │
              iOS / Android
                  devices

Media: Cloudflare R2 → Cloudflare CDN → clients
Video: Cloudflare Stream (transcoding + delivery)
Auth:  Clerk (JWT issued to app, verified by API)
```

---

## Key decisions

### Why Node.js + Fastify over Python/Django or Java?
The entire feed is I/O-bound — reading from DB, serving from Redis cache, writing to R2. Node handles thousands of concurrent connections on a single thread efficiently. Fastify is ~2x faster than Express and has schema-first validation. TypeScript gives us type safety without compilation overhead in dev.

### Why PostgreSQL + PostGIS over MongoDB or a geo-specific DB?
PostGIS turns Postgres into a world-class geospatial database. `ST_DWithin` with a GIST index handles "posts within X miles" queries in under 10ms at our scale. We also need relational data (users, follows, saves) — a document DB would require expensive application-level joins.

### Why Supabase over raw RDS?
Zero DB admin overhead. PostGIS is one SQL command. Row-Level Security (RLS) as a secondary safety layer. Real-time subscriptions available for V2 (Happening Now). Free tier for local dev. Migrate to RDS when we need read replicas or custom Postgres extensions.

### Why Cloudflare R2 over AWS S3?
**Zero egress fees.** For a feed-heavy social app where every scroll loads 10-20 images, S3 egress would become a significant cost at scale. R2 stores at the same price as S3 but serves for free. Combined with Cloudflare CDN (image resizing on edge), it's the right call for media-heavy apps.

### Why Railway over AWS ECS from day one?
At launch we need to ship, not manage infrastructure. Railway is Docker-based (same containers we'd run on ECS), auto-deploys from GitHub, and costs $20/month vs hours of DevOps setup. When we hit scale that requires ECS features (multi-region, complex networking, fine-grained IAM), we migrate — the Docker image is the same.

### Why Clerk over Auth0 or building our own auth?
Phone number OTP + Google OAuth + Apple Sign-in + JWT out of the box. Free up to 10k MAU. The alternative is 2 weeks of auth plumbing. That time is better spent on the feed.

### Why Upstash Redis over Redis Cloud or ElastiCache?
Pay-per-request (no idle cost), serverless, same Redis API. At V1 scale the free tier (10k commands/day) is enough. Upgrade to Pro at growth. If we ever need ElastiCache for performance, the ioredis client code stays the same.

---

## Scaling path

| Phase | Users | Infrastructure |
|---|---|---|
| V1 launch | 0–5k MAU | Railway + Supabase + Upstash |
| Growth | 5k–50k MAU | Railway Pro + Supabase Pro + Upstash Pro |
| Scale | 50k–500k MAU | AWS ECS Fargate + RDS PostgreSQL + ElastiCache |
| City scale | 500k+ MAU | Multi-region ECS, one cluster per metro |

GoLocal's hyperlocal model actually helps at city scale — NYC users only hit the NYC cluster, LA users hit the LA cluster. Data isolation is natural.

---

## Security

- All API routes require Clerk JWT (except `/health`)
- JWTs verified server-side on every request — never trust the client
- Row-Level Security (RLS) in Supabase as a secondary layer
- Rate limiting on all endpoints (most critical: post creation)
- Media uploads: validate file type and size before streaming to R2
- Soft deletes only — never hard delete user data (needed for abuse investigation)
- Blocked users: filter at query level, not application level
- Auto-flag posts at 5 reports — human review weekly
