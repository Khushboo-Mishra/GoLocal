# GoLocal Infrastructure Setup

Step-by-step guide to set up every service. Do this before writing any code.

---

## 1. Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → New project
2. Name: `golocal-prod`, region: `us-east-1`, strong password (save it!)
3. Once created: **SQL Editor** → New query → paste and run `backend/src/db/migrations.sql`
4. Settings → Database → **Connection string** → copy the **Transaction pooler** URL (port 6543)
5. Settings → API → copy `Project URL`, `anon key`, `service_role key`

Cost: **$25/month** (Pro plan required — free tier pauses after 1 week)

---

## 2. Railway (Backend hosting)

1. Go to [railway.app](https://railway.app) → New project → Deploy from GitHub repo
2. Select the `golocal` repo → Railway auto-detects the `backend/Dockerfile`
3. Add all environment variables from `backend/.env.example`
4. Settings → Networking → Generate domain (e.g., `golocal-api.railway.app`)
5. Eventually point `api.golocal.app` here via Cloudflare DNS

Cost: **$5–20/month** (Starter plan)

---

## 3. Cloudflare (R2 + CDN + Stream)

### R2 (image storage)
1. Cloudflare Dashboard → R2 → Create bucket: `golocal-media`
2. R2 → Manage R2 API Tokens → Create token with `golocal-media` read+write
3. R2 → `golocal-media` → Settings → Custom domain: `media.golocal.app`
4. Copy: Account ID, Access Key ID, Secret Access Key

### Image Resizing
1. Dashboard → Speed → Optimization → Image Resizing → Enable
2. This allows `?width=400&fit=cover` params on R2 image URLs

### Stream (video)
1. Dashboard → Stream → Enable
2. Stream → API Tokens → Create token
3. Note the Account ID (same as R2)

Cost: **$0–15/month** (R2 free up to 10GB, Stream $5/1000 min)

---

## 4. Upstash (Redis)

1. Go to [upstash.com](https://upstash.com) → Create Database
2. Name: `golocal-redis`, region: `us-east-1`, type: Regional
3. Copy: REST URL, REST Token

Cost: **$0–10/month** (free up to 10k commands/day)

---

## 5. Clerk (Auth)

1. Go to [clerk.com](https://clerk.com) → Create application: `GoLocal`
2. Enable: Phone number (with OTP), Google OAuth
3. Configure → Paths → Set redirect URL to `golocal://` (matches `app.json` scheme)
4. API Keys → copy Publishable Key (frontend) and Secret Key (backend)
5. Later: Add Apple Sign-in (requires Apple Developer account)

Cost: **Free** up to 10,000 MAU

---

## 6. Expo + EAS

1. `npm i -g eas-cli`
2. `eas login` with your Expo account
3. In `frontend/`: `eas build:configure` → generates `eas.json`
4. Update `app.json` → `extra.eas.projectId` with the generated project ID

Cost: **Free** up to 30 builds/month

---

## 7. Apple Developer Account

1. [developer.apple.com](https://developer.apple.com) → Enroll ($99/year)
2. Create App ID: `com.golocal.app`
3. EAS will handle provisioning profiles automatically

Cost: **$99/year** — required to ship iOS

---

## 8. Google Play Console

1. [play.google.com/console](https://play.google.com/console) → Create account ($25 one-time)
2. Create app: `GoLocal`

Cost: **$25 one-time**

---

## 9. Sentry (Error tracking)

1. [sentry.io](https://sentry.io) → Create two projects: `golocal-api` and `golocal-mobile`
2. Copy DSN for each into the respective `.env`
3. Set up Slack alert for new error types (Settings → Alerts)

Cost: **Free** up to 5k errors/month

---

## 10. Domain

1. Register `golocal.app` on [Cloudflare Registrar](https://cloudflare.com/products/registrar/) (~$12/year)
2. DNS records to add:
   - `api.golocal.app` → CNAME → your Railway domain
   - `media.golocal.app` → already handled by R2 custom domain step

---

## Monthly cost summary

| Service | V1 cost |
|---|---|
| Supabase Pro | $25 |
| Railway Starter | $5–20 |
| Cloudflare R2 | $0–5 |
| Cloudflare Stream | $5–15 |
| Upstash Redis | $0–10 |
| Clerk | $0 |
| Sentry | $0 |
| **Total** | **$35–75/mo** |

One-time: Apple ($99/yr) + Google ($25) + Domain ($12/yr)
