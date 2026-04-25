import React from 'react';
import type { Post } from '@/types';
import { ImageCard } from './ImageCard';
import { TextCard } from './TextCard';
import { EventCard } from './EventCard';
import { LocalSpotCard } from './LocalSpotCard';
import { RoomCard } from './RoomCard';

interface PostCardProps {
  post: Post;
  onCommentPress?: () => void;
}

export function PostCard({ post, onCommentPress }: PostCardProps) {
  switch (post.kind) {
    case 'image':
      return <ImageCard post={post} onCommentPress={onCommentPress} />;
    case 'text':
      return <TextCard post={post} onCommentPress={onCommentPress} />;
    case 'event':
      return <EventCard post={post} />;
    case 'spot':
      return <LocalSpotCard post={post} />;
    case 'room':
      return <RoomCard post={post} />;
    default: {
      const _exhaustive: never = post;
      return null;
    }
  }
}
