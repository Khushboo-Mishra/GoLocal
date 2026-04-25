// All shared TypeScript types for the frontend

export type PostType = 'event' | 'hangout' | 'deal'
export type MediaType = 'image' | 'video'

export interface User {
  id: string
  name: string
  avatarUrl: string | null
  radiusMiles: 1 | 3 | 5
  createdAt: string
}

export interface Post {
  id: string
  type: PostType
  title: string
  description: string | null
  mediaUrl: string
  mediaType: MediaType
  cfStreamId: string | null       // Cloudflare Stream video ID
  likeCount: number
  saveCount: number
  eventTime: string | null        // ISO timestamp, events only
  createdAt: string
  distanceMiles: number           // Computed by API
  lat: number
  lng: number
  userId: string
  userName: string
  avatarUrl: string | null
  liked: boolean                  // Has current user liked this?
  saved: boolean                  // Has current user saved this?
}

export interface FeedResponse {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}

export interface Room {
  id: string
  name: string
  neighborhood: string | null
}

export type ReportReason = 'spam' | 'fake' | 'inappropriate' | 'safety' | 'other'

// Feed tab type
export type FeedTab = 'nearby' | 'trending' | 'going'

// Location type
export interface Coords {
  lat: number
  lng: number
}
