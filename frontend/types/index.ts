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
  mediaUrl: string
  mediaType: MediaType
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

export type FeedResponse = {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}

export type TrendingResponse = {
  posts: Post[]
}

export type FeedFilter = 'nearby' | 'trending' | 'events'

// ── Comments — V2, still fixture-backed (services/fixtures/comments.ts) ──
export type Neighborhood = string;

export type Author = {
  handle: string;
  initial: string;
  avatarGradient: [string, string];
  neighborhood: Neighborhood;
};

export type Comment = {
  id: string;
  author: Author;
  body: string;
  timeAgo: string;
  fireCount: number;
};
