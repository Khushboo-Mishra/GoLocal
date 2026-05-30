export type User = {
  id: string
  name: string
  avatarUrl: string | null
  radiusMiles: number
  createdAt: string
}

export type Neighborhood = string;

export type Distance = {
  walkMinutes: number;
  label: string;
};

export type Author = {
  handle: string;
  initial: string;
  avatarGradient: [string, string];
  neighborhood: Neighborhood;
};

export type FireState = {
  count: number;
  active: boolean;
};

export type CommentCount = {
  count: number;
  hasReplyActivity?: boolean;
};

type BasePost = {
  id: string;
  author?: Author;
  distance: Distance;
  neighborhood: Neighborhood;
  fire: FireState;
  comments: CommentCount;
};

export type ImagePost = BasePost & {
  kind: 'image';
  caption: string;
  gradientStops: string;
  variant?: 'sunset' | 'astoria' | string;
};

export type TextPost = BasePost & {
  kind: 'text';
  body: string;
  author: Author;
};

export type EventPost = BasePost & {
  kind: 'event';
  title: string;
  venue: string;
  dateMonth: string;
  dateDay: number;
  kicker: string;
  goingCount: number;
  friendsGoing: number;
  isGoing: boolean;
};

export type LocalSpotPost = BasePost & {
  kind: 'spot';
  name: string;
  detail: string;
  verified: boolean;
  saved: boolean;
  heroGradient: [string, string, string];
};

export type RoomPost = BasePost & {
  kind: 'room';
  name: string;
  isLive: boolean;
  peopleTalking: number;
  preview: { user: string; text: string };
  attendees: { initial: string; gradient: [string, string] }[];
  extraCount: number;
  joined: boolean;
};

export type Post = ImagePost | TextPost | EventPost | LocalSpotPost | RoomPost;

export type FeedFilter = 'nearby' | 'trending' | 'events';

export type Comment = {
  id: string;
  author: Author;
  body: string;
  timeAgo: string;
  fireCount: number;
};
