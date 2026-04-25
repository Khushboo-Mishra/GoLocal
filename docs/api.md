# GoLocal API Contract

All endpoints require `Authorization: Bearer <clerk_jwt>` unless marked **Public**.

Base URL: `https://api.golocal.app` (prod) / `http://localhost:3000` (dev)

---

## Health

### `GET /health` — Public
```json
{ "status": "ok", "timestamp": "2026-04-20T00:00:00Z", "version": "0.1.0" }
```

---

## Auth

### `POST /auth/sync`
Called immediately after Clerk sign-in. Creates user if new, updates if returning.

**Body:**
```json
{ "name": "Jordan", "avatarUrl": "https://..." }
```
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Jordan",
    "avatarUrl": "https://...",
    "radiusMiles": 3,
    "createdAt": "2026-04-20T00:00:00Z"
  }
}
```

---

## Users

### `GET /users/me`
**Response:** User object (same shape as above)

### `PATCH /users/me`
**Body:** `{ "name": "Jordan", "radiusMiles": 1 }` (all optional)
**Response:** Updated user object

### `POST /users/me/location`
**Body:** `{ "lat": 40.726, "lng": -73.981 }`
**Response:** `{ "ok": true }`

### `POST /users/me/push-token`
**Body:** `{ "token": "ExponentPushToken[...]", "platform": "ios" }`
**Response:** `{ "ok": true }`

### `POST /users/me/avatar`
**Body:** multipart/form-data with field `file`
**Response:** `{ "avatarUrl": "https://media.golocal.app/avatars/uuid/profile.webp" }`

### `POST /users/:id/block`
**Response:** `{ "ok": true }`

### `POST /users/:id/report`
**Body:** `{ "reason": "spam" | "fake" | "inappropriate" | "safety" | "other" }`
**Response:** `{ "ok": true }`

---

## Feed

### `GET /feed`
**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| lat | number | Yes | User latitude |
| lng | number | Yes | User longitude |
| radius | number | No | Miles, default 3, max 10 |
| type | string | No | event \| hangout \| deal |
| cursor | string | No | ISO timestamp for pagination |
| limit | number | No | Default 20, max 50 |

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "type": "event",
      "title": "Free Jazz Night",
      "description": "Come hang at the park",
      "mediaUrl": "https://media.golocal.app/posts/uuid/full.webp",
      "mediaType": "image",
      "cfStreamId": null,
      "likeCount": 12,
      "saveCount": 4,
      "eventTime": "2026-04-20T20:00:00Z",
      "createdAt": "2026-04-20T14:00:00Z",
      "distanceMiles": 0.4,
      "lat": 40.726,
      "lng": -73.981,
      "userId": "uuid",
      "userName": "Jordan",
      "avatarUrl": "https://...",
      "liked": false,
      "saved": true
    }
  ],
  "nextCursor": "2026-04-20T13:55:00Z",
  "hasMore": true
}
```

### `GET /feed/trending`
Same params as `/feed` (minus cursor). Returns posts ordered by `likeCount DESC` in last 24h.

### `GET /feed/going`
Returns current user's saved posts. Params: `cursor`, `limit`.

---

## Posts

### `POST /posts`
**Body:** multipart/form-data
| Field | Type | Required | Description |
|---|---|---|---|
| file | file | Yes | Image (max 10MB) or video (max 50MB) |
| type | string | Yes | event \| hangout \| deal |
| title | string | Yes | Max 80 chars |
| description | string | No | Max 300 chars |
| lat | number | Yes | Post location latitude |
| lng | number | Yes | Post location longitude |
| eventTime | string | No | ISO timestamp (events only) |

**Response:** Post object

### `GET /posts/:id`
**Response:** Post object with full detail

### `DELETE /posts/:id`
Soft delete. Must be post owner.
**Response:** `{ "ok": true }`

### `POST /posts/:id/like`
Toggles like. Returns new state.
**Response:** `{ "liked": true, "likeCount": 13 }`

### `POST /posts/:id/save`
Toggles save. Returns new state.
**Response:** `{ "saved": true, "saveCount": 5 }`

### `POST /posts/:id/report`
**Body:** `{ "reason": "spam" | "fake" | "inappropriate" | "safety" | "other" }`
**Response:** `{ "ok": true }`

---

## Rooms

### `GET /rooms`
**Response:** `{ "rooms": [{ "id": "uuid", "name": "East Village", "neighborhood": "East Village" }] }`

### `GET /rooms/:id/posts`
Same pagination as feed. Returns posts tagged to this room.

---

## Error responses

All errors follow this shape:
```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|---|---|
| 400 | Bad request — check your params |
| 401 | Missing or invalid auth token |
| 403 | Forbidden — you don't own this resource |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Server error — check Sentry |

---

## Rate limits

| Endpoint | Limit |
|---|---|
| `POST /posts` | 10 per hour per user |
| `GET /feed` | 120 per minute per IP |
| All others | 200 per minute global |
