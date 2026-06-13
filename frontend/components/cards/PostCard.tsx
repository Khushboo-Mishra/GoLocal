import React from 'react';
import type { Post } from '@/types';
import { EventCard } from './EventCard';
import { HangoutCard } from './HangoutCard';
import { DealCard } from './DealCard';

interface PostCardProps {
  post: Post;
  onCommentPress?: () => void;
}

export function PostCard({ post, onCommentPress }: PostCardProps) {
  switch (post.type) {
    case 'event':
      return <EventCard post={post} onCommentPress={onCommentPress} />;
    case 'hangout':
      return <HangoutCard post={post} onCommentPress={onCommentPress} />;
    case 'deal':
      return <DealCard post={post} onCommentPress={onCommentPress} />;
    default: {
      const _exhaustive: never = post.type;
      return null;
    }
  }
}
