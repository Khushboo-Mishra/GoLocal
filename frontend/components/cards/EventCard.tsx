import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import type { EventPost } from '@/types';
import { Svg, Polyline } from 'react-native-svg';

interface EventCardProps {
  post: EventPost;
}

export function EventCard({ post }: EventCardProps) {
  const { tokens, scheme } = useTheme();
  const c = tokens.colors;
  const kickerColor = scheme === 'dark' ? c.brand : c.brandDeep;
  const dayColor = scheme === 'dark' ? c.brand : c.brandDeep;

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
      {/* Date badge — absolute top-right */}
      <View style={[styles.dateBadge, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Text style={[styles.dateMonth, { color: c.textSecondary }]}>{post.dateMonth}</Text>
        <Text style={[styles.dateDay, { color: dayColor }]}>{post.dateDay}</Text>
      </View>

      {/* Kicker */}
      <Text style={[styles.kicker, { color: kickerColor }]}>{post.kicker}</Text>

      {/* Title */}
      <Text style={[styles.title, { color: c.textPrimary }]}>{post.title}</Text>

      {/* Venue */}
      <Text style={[styles.venue, { color: c.textSecondary }]}>{post.venue}</Text>

      {/* CTA row */}
      <View style={styles.ctaRow}>
        <Pressable style={[
          styles.goingBtn,
          {
            backgroundColor: c.brand,
            shadowColor: c.brand,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 4,
          },
        ]}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none"
            stroke={c.brandInk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20 6 9 17 4 12" />
          </Svg>
          <Text style={[styles.goingBtnText, { color: c.brandInk }]}>Going</Text>
        </Pressable>
        <Text style={[styles.goingCount, { color: c.textSecondary }]}>
          {post.goingCount} going · {post.friendsGoing} friends
        </Text>
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
    paddingBottom: 22,
    position: 'relative',
  },
  dateBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
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
  kicker: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 24,
    lineHeight: 27.6,
    letterSpacing: -0.3,
    marginBottom: 4,
    paddingRight: 68,
  },
  venue: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    marginBottom: 14,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  goingBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
  },
  goingCount: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
  },
});
