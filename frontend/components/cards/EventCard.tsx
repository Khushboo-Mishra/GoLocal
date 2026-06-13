import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import type { Post } from '@/types';
import { postsApi } from '@/services/api/client';
import { ActionRow } from './shared/ActionRow';
import { DistanceLabel } from './shared/DistanceLabel';
import { formatDistanceLabel, formatEventDate } from './shared/format';
import { Svg, Polyline } from 'react-native-svg';

interface EventCardProps {
  post: Post;
  onCommentPress?: () => void;
}

export function EventCard({ post, onCommentPress }: EventCardProps) {
  const { tokens, scheme } = useTheme();
  const c = tokens.colors;
  const [saved, setSaved] = useState(!!post.saved);
  const kickerColor = scheme === 'dark' ? c.brand : c.brandDeep;
  const eventDate = formatEventDate(post.eventTime);

  async function handleGoing() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const previous = saved;
    setSaved((s) => !s);
    try {
      const result = await postsApi.save(post.id);
      setSaved(result.saved);
    } catch {
      setSaved(previous);
    }
  }

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
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: post.mediaUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />

        {eventDate && (
          <View style={[styles.dateBadge, { backgroundColor: c.bg, borderColor: c.border }]}>
            <Text style={[styles.dateMonth, { color: c.textSecondary }]}>{eventDate.month}</Text>
            <Text style={[styles.dateDay, { color: kickerColor }]}>{eventDate.day}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.kicker, { color: kickerColor }]}>
            EVENT{eventDate ? ` · ${eventDate.time}` : ''}
          </Text>
          <Pressable
            onPress={handleGoing}
            style={[
              styles.goingBtn,
              saved
                ? {
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: c.brand,
                  }
                : {
                    backgroundColor: c.brand,
                    shadowColor: c.brand,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 4,
                  },
            ]}
          >
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none"
              stroke={saved ? c.brandDeep : c.brandInk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="20 6 9 17 4 12" />
            </Svg>
            <Text style={[styles.goingBtnText, { color: saved ? c.brandDeep : c.brandInk }]}>
              {saved ? 'Going' : 'I\'m going'}
            </Text>
          </Pressable>
        </View>

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
  dateBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 48,
  },
  dateMonth: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 20,
    lineHeight: 20,
    marginTop: 3,
  },
  body: {
    padding: 14,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 10,
  },
  kicker: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    flexShrink: 1,
  },
  goingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  goingBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
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
