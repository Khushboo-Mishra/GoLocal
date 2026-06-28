export type User = {
  id: string
  name: string
  avatarUrl: string | null
  radiusMiles: number
  createdAt: string
}

// ── Posts (matches backend PostDto — backend/src/routes/_dto.ts) ──
export type PostType = 'event' | 'hangout' | 'deal'
export type MediaType = 'image' | 'video'

export type Post = {
  id: string
  type: PostType
  title: string
  description: string | null
  mediaUrl: string | null
  mediaType: MediaType | null
  cfStreamId: string | null
  likeCount: number
  saveCount: number
  eventTime: string | null
  createdAt: string
  neighborhood: string | null
  distanceMiles?: number
  lat?: number
  lng?: number
  userId: string
  userName: string
  avatarUrl: string | null
  liked?: boolean
  saved?: boolean
}

export type FeedResponse = {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}

export type TrendingResponse = {
  posts: Post[]
}

export type FeedFilter = 'nearby' | 'trending' | 'events'

// ── Comments (matches backend CommentDto — backend/src/routes/_dto.ts) ──
export type Comment = {
  id: string
  postId: string
  body: string
  createdAt: string
  userId: string
  userName: string
  avatarUrl: string | null
}

export type CommentsResponse = {
  comments: Comment[]
  nextCursor: string | null
  hasMore: boolean
}
