import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import type { RoomPost } from '@/types';
import { Svg, Line, Polyline } from 'react-native-svg';

interface RoomCardProps {
  post: RoomPost;
}

function LiveDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.liveDot, style]} />
  );
}

function TypingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-2, { duration: 650 }),
          withTiming(0, { duration: 650 }),
        ),
        -1,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 650 }),
          withTiming(0.3, { duration: 650 }),
        ),
        -1,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.typingDot, style]} />;
}

export function RoomCard({ post }: RoomCardProps) {
  const { tokens, scheme } = useTheme();
  const c = tokens.colors;
  const [joined, setJoined] = useState(post.joined);
  const kickerColor = scheme === 'dark' ? c.brand : c.brandDeep;

  function handleJoin() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJoined((j) => !j);
  }

  const previewBg = scheme === 'dark' ? 'rgba(255,255,255,0.035)' : 'rgba(129,195,201,0.08)';
  const previewBorder = scheme === 'dark' ? 'rgba(129,195,201,0.55)' : c.brand;
  const previewTextColor = scheme === 'dark' ? 'rgba(255,255,255,0.78)' : '#333';

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
      {/* Radial corner tint */}
      <LinearGradient
        colors={['rgba(129,195,201,0.12)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.45, y: 0.55 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Live kicker */}
      <View style={styles.kicker}>
        <LiveDot />
        <Text style={[styles.kickerText, { color: kickerColor }]}>Room · Live</Text>
      </View>

      {/* Room name */}
      <Text style={[styles.roomName, { color: c.textPrimary }]}>{post.name}</Text>

      {/* Talking row */}
      <View style={styles.talkingRow}>
        <Text style={[styles.talkingText, { color: c.textSecondary }]}>
          {post.peopleTalking} people talking
        </Text>
        <View style={styles.typingDots}>
          <TypingDot delay={0} />
          <TypingDot delay={180} />
          <TypingDot delay={360} />
        </View>
      </View>

      {/* Preview */}
      <View style={[styles.preview, { backgroundColor: previewBg, borderLeftColor: previewBorder }]}>
        <Text>
          <Text style={[styles.previewUser, { color: kickerColor }]}>{post.preview.user} </Text>
          <Text style={[styles.previewText, { color: previewTextColor }]}>{post.preview.text}</Text>
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.avatars}>
          {post.attendees.map((a, i) => (
            <LinearGradient
              key={i}
              colors={a.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.avatar,
                { borderColor: c.surface, marginLeft: i === 0 ? 0 : -6 },
              ]}
            >
              <Text style={styles.avatarInitial}>{a.initial}</Text>
            </LinearGradient>
          ))}
          <View style={[
            styles.avatar,
            styles.avatarMore,
            { borderColor: c.surface, marginLeft: -6, backgroundColor: 'rgba(129,195,201,0.18)' },
          ]}>
            <Text style={[styles.avatarMoreText, { color: c.brandDeep }]}>+{post.extraCount}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleJoin}
          style={[
            styles.joinBtn,
            joined
              ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.brand }
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
          <Text style={[styles.joinBtnText, { color: joined ? c.brandDeep : c.brandInk }]}>
            {joined ? 'Joined' : 'Join'}
          </Text>
          {!joined && (
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none"
              stroke={c.brandInk} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Line x1="5" y1="12" x2="19" y2="12" />
              <Polyline points="12 5 19 12 12 19" />
            </Svg>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingHorizontal: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#81c3c9',
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  kickerText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  roomName: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    lineHeight: 24.6,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  talkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  talkingText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  typingDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#81c3c9',
  },
  preview: {
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderLeftWidth: 2,
    marginBottom: 14,
  },
  previewUser: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12.5,
  },
  previewText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12.5,
    lineHeight: 17.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: '#fff',
  },
  avatarMore: {},
  avatarMoreText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  joinBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11.5,
  },
});
