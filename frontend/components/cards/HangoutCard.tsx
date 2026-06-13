import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import type { Post } from '@/types';
import { Avatar } from './shared/Avatar';
import { ActionRow } from './shared/ActionRow';
import { DistanceLabel } from './shared/DistanceLabel';
import { NeighborhoodLabel } from './shared/NeighborhoodLabel';
import { formatDistanceLabel } from './shared/format';
import { getNeighborhood } from '@/lib/neighborhoods';

interface HangoutCardProps {
  post: Post;
  onCommentPress?: () => void;
}

const OVERLAY = {
  colors: ['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.92)'] as const,
  locations: [0, 0.45, 0.75, 1] as const,
};

export function HangoutCard({ post, onCommentPress }: HangoutCardProps) {
  const { tokens } = useTheme();
  const c = tokens.colors;

  if (post.mediaUrl) {
    return (
      <Pressable style={styles.imageCard}>
        <Image source={{ uri: post.mediaUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <LinearGradient
          colors={OVERLAY.colors}
          locations={OVERLAY.locations}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.cardBottom}>
          <Text style={styles.username}>{post.userName}</Text>
          <Text style={styles.caption}>{post.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <DistanceLabel label={formatDistanceLabel(post.distanceMiles)} surface="dark" />
              <NeighborhoodLabel name={getNeighborhood(post.lat, post.lng)} surface="dark" />
            </View>
            <ActionRow
              postId={post.id}
              liked={!!post.liked}
              likeCount={post.likeCount}
              surface="dark"
              onCommentPress={onCommentPress}
            />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[
      styles.textCard,
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
      {/* User row */}
      <View style={styles.userRow}>
        <View style={styles.userLeft}>
          <Avatar
            initial={post.userName.charAt(0).toUpperCase()}
            gradient={[c.brand, c.brandDeep]}
            size={32}
          />
          <Text style={[styles.usernameInline, { color: c.textPrimary }]}>
            {post.userName}
          </Text>
        </View>
      </View>

      {/* Body */}
      <Text style={[styles.textTitle, { color: c.textPrimary }]}>{post.title}</Text>
      {!!post.description && (
        <Text style={[styles.textBody, { color: c.textSecondary }]} numberOfLines={4}>
          {post.description}
        </Text>
      )}

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <DistanceLabel label={formatDistanceLabel(post.distanceMiles)} surface="light" />
          <NeighborhoodLabel name={getNeighborhood(post.lat, post.lng)} surface="light" />
        </View>
        <ActionRow
          postId={post.id}
          liked={!!post.liked}
          likeCount={post.likeCount}
          surface="light"
          onCommentPress={onCommentPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Image variant
  imageCard: {
    height: 340,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
  },
  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    paddingBottom: 16,
  },
  username: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 20,
    lineHeight: 24.4,
    color: '#fff',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  // Text variant
  textCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  usernameInline: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    lineHeight: 15.6,
  },
  textTitle: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  textBody: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13.5,
    lineHeight: 19.5,
    marginBottom: 12,
  },
  // Shared
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
