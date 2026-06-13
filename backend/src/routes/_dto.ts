// routes/_dto.ts — small shape mappers that translate
// snake_case Postgres rows into the camelCase shapes documented
// in docs/api.md. Keep this dumb and side-effect free.

export interface UserDto {
  id: string
  name: string
  avatarUrl: string | null
  radiusMiles: number
  createdAt: string
}

export function toUserDto(row: any): UserDto {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url ?? null,
    radiusMiles: row.radius_miles,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
  }
}

export interface PostDto {
  id: string
  type: 'event' | 'hangout' | 'deal'
  title: string
  description: string | null
  mediaUrl: string | null
  mediaType: 'image' | 'video' | null
  cfStreamId: string | null
  likeCount: number
  saveCount: number
  eventTime: string | null
  createdAt: string
  distanceMiles?: number
  lat?: number
  lng?: number
  userId: string
  userName: string
  avatarUrl: string | null
  liked?: boolean
  saved?: boolean
}

export function toPostDto(row: any): PostDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description ?? null,
    mediaUrl: row.media_url ?? null,
    mediaType: row.media_type ?? null,
    cfStreamId: row.cf_stream_id ?? null,
    likeCount: row.like_count,
    saveCount: row.save_count,
    eventTime:
      row.event_time instanceof Date
        ? row.event_time.toISOString()
        : row.event_time ?? null,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    distanceMiles: row.distance_miles != null ? Number(row.distance_miles) : undefined,
    lat: row.lat != null ? Number(row.lat) : undefined,
    lng: row.lng != null ? Number(row.lng) : undefined,
    userId: row.user_id,
    userName: row.user_name,
    avatarUrl: row.avatar_url ?? null,
    liked: typeof row.liked === 'boolean' ? row.liked : undefined,
    saved: typeof row.saved === 'boolean' ? row.saved : undefined,
  }
}
