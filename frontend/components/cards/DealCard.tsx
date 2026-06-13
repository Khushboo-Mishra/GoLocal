import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';
import type { Post } from '@/types';
import { ActionRow } from './shared/ActionRow';
import { DistanceLabel } from './shared/DistanceLabel';
import { formatDistanceLabel } from './shared/format';

interface DealCardProps {
  post: Post;
  onCommentPress?: () => void;
}

export function DealCard({ post, onCommentPress }: DealCardProps) {
  const { tokens, scheme } = useTheme();
  const c = tokens.colors;
  const kickerColor = scheme === 'dark' ? c.brand : c.brandDeep;

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: c.surface,
        borderColor: c.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 3,
      },
    ]}>
      {!!post.mediaUrl && (
        <View style={styles.hero}>
          <Image source={{ uri: post.mediaUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        </View>
      )}

      <View style={styles.body}>
        <Text style={[styles.kicker, { color: kickerColor }]}>DEAL</Text>
        <Text style={[styles.title, { color: c.textPrimary }]}>{post.title}</Text>
        {!!post.description && (
          <Text style={[styles.description, { color: c.textSecondary }]} numberOfLines={2}>
            {post.description}
          </Text>
        )}

        <View style={styles.metaRow}>
          <DistanceLabel label={formatDistanceLabel(post.distanceMiles)} />
          <ActionRow
            postId={post.id}
            liked={!!post.liked}
            likeCount={post.likeCount}
            onCommentPress={onCommentPress}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  hero: {
    height: 160,
    position: 'relative',
  },
  body: {
    padding: 14,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  kicker: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    lineHeight: 25.6,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  description: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    lineHeight: 18.5,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
