import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import type { LocalSpotPost } from '@/types';
import { DistanceLabel } from './shared/DistanceLabel';
import { Svg, Path, Polyline } from 'react-native-svg';

interface LocalSpotCardProps {
  post: LocalSpotPost;
}

export function LocalSpotCard({ post }: LocalSpotCardProps) {
  const { tokens, scheme } = useTheme();
  const c = tokens.colors;
  const [saved, setSaved] = useState(post.saved);

  function handleSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaved((s) => !s);
  }

  const badgeBg = scheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.92)';
  const badgeColor = scheme === 'dark' ? '#fff' : c.textPrimary;
  const badgeBorder = scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';

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
        <LinearGradient
          colors={[
            'rgba(245,195,140,0.5)',
            'transparent',
          ]}
          start={{ x: 0.72, y: 0.38 }}
          end={{ x: 0.22, y: 0.7 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={['rgba(139,90,53,0.35)', 'transparent']}
          start={{ x: 0.3, y: 0.8 }}
          end={{ x: 0.7, y: 0.2 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[post.heroGradient[0], post.heroGradient[1], post.heroGradient[2]]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Kicker row */}
        <View style={styles.kickerRow}>
          <View style={[styles.kickerBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            <Text style={[styles.kickerText, { color: badgeColor }]}>LOCAL SPOT</Text>
          </View>
          {post.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: c.brand }]}>
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none"
                stroke={c.brandInk} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="20 6 9 17 4 12" />
              </Svg>
            </View>
          )}
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={[styles.name, { color: c.textPrimary }]}>{post.name}</Text>
        <Text style={[styles.detail, { color: c.textSecondary }]}>{post.detail}</Text>
        <View style={styles.metaRow}>
          <DistanceLabel label={post.distance.label} />
          <Pressable
            onPress={handleSave}
            style={[
              styles.saveBtn,
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
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none"
              stroke={saved ? c.brandDeep : c.brandInk}
              strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </Svg>
            <Text style={[styles.saveBtnText, { color: saved ? c.brandDeep : c.brandInk }]}>
              {saved ? 'Saved' : 'Save Spot'}
            </Text>
          </Pressable>
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
    height: 120,
    position: 'relative',
  },
  kickerRow: {
    position: 'absolute',
    top: 12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kickerBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  kickerText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
    letterSpacing: 1.4,
  },
  verifiedBadge: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  body: {
    padding: 14,
    paddingHorizontal: 18,
  },
  name: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 21,
    lineHeight: 23.5,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  detail: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    lineHeight: 18.5,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
  },
  saveBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11.5,
  },
});
