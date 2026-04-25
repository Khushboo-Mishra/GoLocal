# GoLocal Database Schema

PostgreSQL + PostGIS hosted on Supabase.

**Run migrations:** Open Supabase Dashboard → SQL Editor → paste `backend/src/db/migrations.sql` and run.

---

## Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | Auto-generated |
| clerk_id | TEXT UNIQUE | From Clerk auth |
| name | TEXT | Display name |
| avatar_url | TEXT | Cloudflare R2 URL |
| location | GEOMETRY(Point, 4326) | PostGIS point |
| radius_miles | INTEGER | 1, 3, or 5 |
| is_banned | BOOLEAN | Admin moderation |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

Indexes: `clerk_id`, `location (GIST)`

---

### `posts`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| type | ENUM | event \| hangout \| deal |
| title | TEXT | Max 80 chars |
| description | TEXT | Max 300 chars, nullable |
| media_url | TEXT | Cloudflare R2 / CDN URL |
| media_type | ENUM | image \| video |
| cf_stream_id | TEXT | Cloudflare Stream ID (video only) |
| location | GEOMETRY(Point, 4326) | Required |
| event_time | TIMESTAMPTZ | Events only |
| like_count | INTEGER | Denormalized counter |
| save_count | INTEGER | Denormalized counter |
| is_deleted | BOOLEAN | Soft delete |
| is_flagged | BOOLEAN | Auto-set after 5 reports |
| created_at | TIMESTAMPTZ | |

Indexes: `location (GIST)`, `created_at DESC`, `user_id`, `type`, `event_time`

---

### `post_likes`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID FK → users | |
| post_id | UUID FK → posts | |
| liked_at | TIMESTAMPTZ | |

PK: `(user_id, post_id)`

---

### `saved_posts`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID FK → users | |
| post_id | UUID FK → posts | |
| saved_at | TIMESTAMPTZ | |

PK: `(user_id, post_id)`

---

### `push_tokens`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID FK → users | |
| token | TEXT | Expo push token |
| platform | ENUM | ios \| android |
| updated_at | TIMESTAMPTZ | |

PK: `(user_id, token)`

---

### `reports`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| reporter_id | UUID FK → users | |
| target_type | ENUM | post \| user |
| target_id | UUID | ID of reported entity |
| reason | ENUM | spam \| fake \| inappropriate \| safety \| other |
| created_at | TIMESTAMPTZ | |

Trigger: auto-sets `posts.is_flagged = TRUE` when a post gets 5+ reports.

---

### `blocked_users`
| Column | Type | Notes |
|---|---|---|
| blocker_id | UUID FK → users | |
| blocked_id | UUID FK → users | |
| blocked_at | TIMESTAMPTZ | |

PK: `(blocker_id, blocked_id)`

---

### `rooms`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | "East Village", "NYU", etc. |
| neighborhood | TEXT | |
| location | GEOMETRY(Point, 4326) | Optional center point |
| created_by_system | BOOLEAN | True for launch rooms |
| created_at | TIMESTAMPTZ | |

Seeded at launch: East Village, NYU, Lower East Side.

---

## Key queries

### Geo feed (the most important query in the app)
```sql
SELECT p.*, ST_Distance(p.location::geography, ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography) / 1609.34 AS distance_miles
FROM posts p
WHERE ST_DWithin(
  p.location::geography,
  ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography,
  $radius_meters
)
AND p.is_deleted = FALSE
ORDER BY p.created_at DESC
LIMIT 20;
```

### Check PostGIS is working
```sql
SELECT ST_Distance(
  ST_SetSRID(ST_MakePoint(-73.981, 40.726), 4326)::geography,
  ST_SetSRID(ST_MakePoint(-74.006, 40.712), 4326)::geography
) / 1609.34 AS distance_miles;
-- Should return ~2.0 miles (NYU → WTC)
```
