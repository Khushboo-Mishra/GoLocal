import type { Comment, FeedFilter } from '@/types';

const COMMENTS_POST_1: Comment[] = [
  {
    id: 'c1',
    author: {
      handle: '@sofia.h',
      initial: 'SH',
      avatarGradient: ['#f5a27e', '#d85e3c'],
      neighborhood: 'Williamsburg',
    },
    body: "ok that sky tho 😭 was this from the top of the Wythe? i've been trying to find a spot like this",
    timeAgo: '5m ago',
    fireCount: 12,
  },
  {
    id: 'c2',
    author: {
      handle: '@brooklynbruce',
      initial: 'BB',
      avatarGradient: ['#81c3c9', '#3d7e83'],
      neighborhood: 'Brooklyn',
    },
    body: 'caught this exact view last thursday. best free thing about living here honestly',
    timeAgo: '12m ago',
    fireCount: 8,
  },
  {
    id: 'c3',
    author: {
      handle: '@jayden_bk',
      initial: 'JB',
      avatarGradient: ['#a88bd9', '#5a3d8a'],
      neighborhood: 'Bushwick',
    },
    body: "third rooftop this week?? pls let me come next time 🙏 i'm on domino st if u ever need a +1",
    timeAgo: '28m ago',
    fireCount: 4,
  },
];

export async function getComments(postId: string): Promise<Comment[]> {
  if (postId === 'post-1') return COMMENTS_POST_1;
  return [];
}

export type { FeedFilter };
