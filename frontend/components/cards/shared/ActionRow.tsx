import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import type { FireState, CommentCount } from '@/types';
import { Svg, Path, Polyline, Line } from 'react-native-svg';

interface ActionRowProps {
  fire: FireState;
  comments: CommentCount;
  surface?: 'dark' | 'light';
  onCommentPress?: () => void;
  onSharePress?: () => void;
}

export function ActionRow({
  fire: initialFire,
  comments,
  surface = 'light',
  onCommentPress,
  onSharePress,
}: ActionRowProps) {
  const { tokens, scheme } = useTheme();
  const [fireActive, setFireActive] = useState(initialFire.active);
  const [fireCount, setFireCount] = useState(initialFire.count);
  const fireScale = useSharedValue(1);

  const isDark = surface === 'dark';
  const baseColor = isDark ? 'rgba(255,255,255,0.7)' : tokens.colors.textTertiary;
  const activeFireColor = isDark ? tokens.colors.brand : tokens.colors.brandDeep;
  const replyActiveColor = scheme === 'dark' ? tokens.colors.brand : tokens.colors.brandDeep;

  const fireAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  function handleFire() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !fireActive;
    setFireActive(next);
    setFireCount((c) => c + (next ? 1 : -1));
    fireScale.value = withSpring(1.3, { damping: 6, stiffness: 400 }, () => {
      fireScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
  }

  const fireColor = fireActive ? activeFireColor : baseColor;

  return (
    <View style={styles.actions}>
      <Pressable onPress={handleFire} style={styles.action}>
        <Animated.View style={fireAnimStyle}>
          {fireActive ? (
            <Svg width={16} height={16} viewBox="0 0 24 24" fill={fireColor}>
              <Path d="M12 2.5C9.5 5.5 8 8.5 8 11.5c0 0-1.5-1-2-2.5C4.5 11.5 4 13.5 4 15c0 4.4 3.6 7.5 8 7.5s8-3.1 8-7.5c0-5-3.5-8.5-8-12.5z" />
            </Svg>
          ) : (
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={fireColor} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 2.5C9.5 5.5 8 8.5 8 11.5c0 0-1.5-1-2-2.5C4.5 11.5 4 13.5 4 15c0 4.4 3.6 7.5 8 7.5s8-3.1 8-7.5c0-5-3.5-8.5-8-12.5z" />
            </Svg>
          )}
        </Animated.View>
        <Text style={[styles.actionText, { color: fireColor }]}>{fireCount}</Text>
      </Pressable>

      <Pressable onPress={onCommentPress} style={styles.action}>
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
          stroke={comments.hasReplyActivity ? replyActiveColor : baseColor}
          strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </Svg>
        <Text style={[
          styles.actionText,
          { color: comments.hasReplyActivity ? replyActiveColor : baseColor },
        ]}>
          {comments.hasReplyActivity ? `${comments.count} replies` : comments.count}
        </Text>
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
