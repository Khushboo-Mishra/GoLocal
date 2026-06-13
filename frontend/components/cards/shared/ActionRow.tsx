import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { postsApi } from '@/services/api/client';
import { Svg, Path, Polyline, Line } from 'react-native-svg';

interface ActionRowProps {
  postId: string;
  liked: boolean;
  likeCount: number;
  surface?: 'dark' | 'light';
  onCommentPress?: () => void;
  onSharePress?: () => void;
}

export function ActionRow({
  postId,
  liked: initialLiked,
  likeCount: initialLikeCount,
  surface = 'light',
  onCommentPress,
  onSharePress,
}: ActionRowProps) {
  const { tokens } = useTheme();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const fireScale = useSharedValue(1);

  const isDark = surface === 'dark';
  const baseColor = isDark ? 'rgba(255,255,255,0.7)' : tokens.colors.textTertiary;
  const activeFireColor = isDark ? tokens.colors.brand : tokens.colors.brandDeep;

  const fireAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  async function handleFire() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !liked;

    // Optimistic update.
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    fireScale.value = withSpring(1.3, { damping: 6, stiffness: 400 }, () => {
      fireScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });

    try {
      const result = await postsApi.like(postId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // Roll back on failure.
      setLiked(previousLiked);
      setLikeCount(previousCount);
    }
  }

  const fireColor = liked ? activeFireColor : baseColor;

  return (
    <View style={styles.actions}>
      <Pressable onPress={handleFire} style={styles.action}>
        <Animated.View style={fireAnimStyle}>
          {liked ? (
            <Svg width={16} height={16} viewBox="0 0 24 24" fill={fireColor}>
              <Path d="M12 2.5C9.5 5.5 8 8.5 8 11.5c0 0-1.5-1-2-2.5C4.5 11.5 4 13.5 4 15c0 4.4 3.6 7.5 8 7.5s8-3.1 8-7.5c0-5-3.5-8.5-8-12.5z" />
            </Svg>
          ) : (
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={fireColor} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 2.5C9.5 5.5 8 8.5 8 11.5c0 0-1.5-1-2-2.5C4.5 11.5 4 13.5 4 15c0 4.4 3.6 7.5 8 7.5s8-3.1 8-7.5c0-5-3.5-8.5-8-12.5z" />
            </Svg>
          )}
        </Animated.View>
        <Text style={[styles.actionText, { color: fireColor }]}>{likeCount}</Text>
      </Pressable>

      <Pressable onPress={onCommentPress} style={styles.action}>
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
          stroke={baseColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </Svg>
      </Pressable>

      <Pressable onPress={onSharePress} style={styles.action}>
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
          stroke={baseColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <Polyline points="16 6 12 2 8 6" />
          <Line x1="12" y1="2" x2="12" y2="15" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
  },
});
