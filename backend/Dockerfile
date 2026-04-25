FROM node:20-alpine AS base
RUN npm i -g pnpm

# ── Dependencies ─────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile --filter backend

# ── Build ────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
WORKDIR /app/backend
RUN pnpm build

# ── Production image ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./

RUN npm i -g pnpm && pnpm install --prod --ignore-scripts

EXPOSE 3000

CMD ["node", "dist/index.js"]
