-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Run in order. Each block is a separate migration.

-- ─────────────────────────────────────────────────────────────
-- 0. Enable PostGIS (run first, once per project)
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────────────────────────
-- 1. Users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
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

CREATE INDEX users_clerk_id_idx ON users(clerk_id);
CREATE INDEX users_location_idx ON users USING GIST(location);

-- ─────────────────────────────────────────────────────────────
-- 2. Posts
-- ─────────────────────────────────────────────────────────────
CREATE TYPE post_type AS ENUM ('event', 'hangout', 'deal');
CREATE TYPE media_type AS ENUM ('image', 'video');

CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          post_type NOT NULL,
  title         TEXT NOT NULL CHECK (char_length(title) <= 80),
  description   TEXT CHECK (char_length(description) <= 300),
  media_url     TEXT NOT NULL,
  media_type    media_type NOT NULL DEFAULT 'image',
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
CREATE INDEX posts_location_idx  ON posts USING GIST(location);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX posts_user_id_idx   ON posts(user_id);
CREATE INDEX posts_type_idx      ON posts(type) WHERE is_deleted = FALSE;
CREATE INDEX posts_event_time_idx ON posts(event_time) WHERE type = 'event' AND is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────
-- 3. Post interactions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE post_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  liked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE saved_posts (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ─────────────────────────────────────────────────────────────
-- 4. Push notification tokens
-- ─────────────────────────────────────────────────────────────
CREATE TYPE device_platform AS ENUM ('ios', 'android');

CREATE TABLE push_tokens (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   device_platform NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, token)
);

-- ─────────────────────────────────────────────────────────────
-- 5. Reports (safety)
-- ─────────────────────────────────────────────────────────────
CREATE TYPE report_target AS ENUM ('post', 'user');
CREATE TYPE report_reason AS ENUM ('spam', 'fake', 'inappropriate', 'safety', 'other');

CREATE TABLE reports (
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

CREATE TRIGGER post_report_threshold_trigger
AFTER INSERT ON reports
FOR EACH ROW EXECUTE FUNCTION check_post_report_threshold();

-- ─────────────────────────────────────────────────────────────
-- 6. Blocked users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE blocked_users (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- ─────────────────────────────────────────────────────────────
-- 7. Rooms
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  neighborhood     TEXT,
  location         GEOMETRY(Point, 4326),
  created_by_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed system rooms for NYC launch
INSERT INTO rooms (name, neighborhood) VALUES
  ('East Village', 'East Village'),
  ('NYU', 'Greenwich Village'),
  ('Lower East Side', 'Lower East Side');

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
-- ─────────────────────────────────────────────────────────────
ALTER TABLE posts
  ALTER COLUMN media_url DROP NOT NULL,
  ALTER COLUMN media_type DROP NOT NULL;
