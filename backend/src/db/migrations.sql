-- GoLocal schema. Run in order; each block is a migration.
--
-- This file is fully IDEMPOTENT — every statement is safe to re-run on an
-- existing database. Tables/indexes use IF NOT EXISTS, enum types are wrapped
-- in a DO/EXCEPTION guard, the trigger is dropped-then-created, and the room
-- seed is guarded by NOT EXISTS. So `pnpm db:migrate` (which runs the whole
-- file) no longer dies on "relation already exists" / "type already exists".

-- ─────────────────────────────────────────────────────────────
-- 0. Enable PostGIS (run first, once per project)
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────────────────────────
-- 1. Users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id      TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  avatar_url    TEXT,
  location      GEOMETRY(Point, 4326),      -- PostGIS point: longitude, latitude
  radius_miles  INTEGER NOT NULL DEFAULT 3,  -- 1 | 3 | 5
  is_banned     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_clerk_id_idx ON users(clerk_id);
CREATE INDEX IF NOT EXISTS users_location_idx ON users USING GIST(location);

-- ─────────────────────────────────────────────────────────────
-- 2. Posts
-- ─────────────────────────────────────────────────────────────
-- Postgres has no CREATE TYPE IF NOT EXISTS, so guard each enum.
DO $$ BEGIN
  CREATE TYPE post_type AS ENUM ('event', 'hangout', 'deal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('image', 'video');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          post_type NOT NULL,
  title         TEXT NOT NULL CHECK (char_length(title) <= 80),
  description   TEXT CHECK (char_length(description) <= 300),
  media_url     TEXT,
  media_type    media_type,
  cf_stream_id  TEXT,                        -- Cloudflare Stream video ID (video only)
  location      GEOMETRY(Point, 4326) NOT NULL,
  event_time    TIMESTAMPTZ,                 -- For type='event' only
  like_count    INTEGER NOT NULL DEFAULT 0,
  save_count    INTEGER NOT NULL DEFAULT 0,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  is_flagged    BOOLEAN NOT NULL DEFAULT FALSE,  -- auto-flagged after 5 reports
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Critical indexes for geo feed queries
CREATE INDEX IF NOT EXISTS posts_location_idx  ON posts USING GIST(location);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS posts_user_id_idx   ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_type_idx      ON posts(type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS posts_event_time_idx ON posts(event_time) WHERE type = 'event' AND is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────
-- 3. Post interactions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  liked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS saved_posts (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ─────────────────────────────────────────────────────────────
-- 4. Push notification tokens
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE device_platform AS ENUM ('ios', 'android');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS push_tokens (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   device_platform NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, token)
);

-- ─────────────────────────────────────────────────────────────
-- 5. Reports (safety)
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE report_target AS ENUM ('post', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM ('spam', 'fake', 'inappropriate', 'safety', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type report_target NOT NULL,
  target_id   UUID NOT NULL,
  reason      report_reason NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-flag a post when it hits 5 reports
CREATE OR REPLACE FUNCTION check_post_report_threshold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_type = 'post' THEN
    UPDATE posts
    SET is_flagged = TRUE
    WHERE id = NEW.target_id
      AND (SELECT COUNT(*) FROM reports WHERE target_id = NEW.target_id AND target_type = 'post') >= 5;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DROP-then-CREATE so the trigger is re-runnable (no CREATE TRIGGER IF NOT EXISTS).
DROP TRIGGER IF EXISTS post_report_threshold_trigger ON reports;
CREATE TRIGGER post_report_threshold_trigger
AFTER INSERT ON reports
FOR EACH ROW EXECUTE FUNCTION check_post_report_threshold();

-- ─────────────────────────────────────────────────────────────
-- 6. Blocked users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- ─────────────────────────────────────────────────────────────
-- 7. Rooms
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  neighborhood     TEXT,
  location         GEOMETRY(Point, 4326),
  created_by_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed system rooms for NYC launch (with coordinates so /rooms/:id/posts works).
-- PostGIS point is (longitude, latitude). Guarded by NOT EXISTS so re-runs
-- never duplicate a room.
INSERT INTO rooms (name, neighborhood, location)
SELECT v.name, v.neighborhood, v.location
FROM (VALUES
  ('East Village',    'East Village',      ST_SetSRID(ST_MakePoint(-73.9815, 40.7265), 4326)),
  ('NYU',             'Greenwich Village', ST_SetSRID(ST_MakePoint(-73.9973, 40.7308), 4326)),
  ('Lower East Side', 'Lower East Side',   ST_SetSRID(ST_MakePoint(-73.9843, 40.7150), 4326))
) AS v(name, neighborhood, location)
WHERE NOT EXISTS (SELECT 1 FROM rooms r WHERE r.name = v.name);

-- ─────────────────────────────────────────────────────────────
-- 8. Notification preferences
--    Stored as columns on users so we can filter in the same
--    geo query the worker already runs (no extra join).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_nearby BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_event_soon BOOLEAN NOT NULL DEFAULT TRUE;

-- ─────────────────────────────────────────────────────────────
-- 9. Allow text-only posts (no media attached)
--    media_url/media_type are now optional so POST /posts can
--    accept fileless submissions without an R2/Stream upload.
--    (posts above is already created nullable; this keeps existing
--    databases in sync and is a no-op on a fresh one.)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE posts
  ALTER COLUMN media_url DROP NOT NULL,
  ALTER COLUMN media_type DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 10. Comments (V1)
--     One row per comment. Counts are derived on read for now
--     (no denormalized comment_count column yet).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fetch a post's comments newest-first in one index scan.
CREATE INDEX IF NOT EXISTS comments_post_id_created_idx
  ON comments(post_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 11. Backfill room coordinates (idempotent)
--     The original seed inserted rooms with NULL location, so
--     /rooms/:id/posts returned empty. Set real NYC coords. Only
--     touches rows still missing a location, so it's safe to re-run.
-- ─────────────────────────────────────────────────────────────
UPDATE rooms SET location = ST_SetSRID(ST_MakePoint(-73.9815, 40.7265), 4326)
  WHERE name = 'East Village'    AND location IS NULL;
UPDATE rooms SET location = ST_SetSRID(ST_MakePoint(-73.9973, 40.7308), 4326)
  WHERE name = 'NYU'             AND location IS NULL;
UPDATE rooms SET location = ST_SetSRID(ST_MakePoint(-73.9843, 40.7150), 4326)
  WHERE name = 'Lower East Side' AND location IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 12. Stored neighborhood label on posts
--     Computed coarsely from lat/lng at insert time (server-side,
--     see backend/src/utils/neighborhoods.ts) and read directly by
--     the feed. Nullable: older rows stay NULL and the frontend
--     falls back to its client-side helper for them.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE posts ADD COLUMN IF NOT EXISTS neighborhood TEXT;
