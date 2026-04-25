import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import type { ImagePost } from '@/types';
import { ActionRow } from './shared/ActionRow';
import { DistanceLabel } from './shared/DistanceLabel';

interface ImageCardProps {
  post: ImagePost;
  onCommentPress?: () => void;
}

const SUNSET_BASE = {
  colors: ['#2d1658', '#5a1e65', '#a83358', '#d85e3c', '#f39050', '#4d1c50', '#160824'] as const,
  locations: [0, 0.14, 0.32, 0.52, 0.66, 0.86, 1] as const,
  start: { x: 0, y: 0 },
  end: { x: 0.05, y: 1 },
};

const ASTORIA_BASE = {
  colors: ['#1a2f5c', '#2d4d8c', '#7a6a80', '#d8a854', '#e8844a', '#5a2f25', '#160a18'] as const,
  locations: [0, 0.18, 0.38, 0.54, 0.70, 0.86, 1] as const,
  start: { x: 0, y: 0 },
  end: { x: 0.14, y: 1 },
};

const OVERLAY = {
  colors: ['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.92)'] as const,
  locations: [0, 0.45, 0.75, 1] as const,
};

export function ImageCard({ post, onCommentPress }: ImageCardProps) {
  const { tokens } = useTheme();
  const base = post.variant === 'astoria' ? ASTORIA_BASE : SUNSET_BASE;

  return (
    <Pressable style={styles.card} onPress={() => console.log('open post', post.id)}>
      <LinearGradient
        colors={base.colors}
        locations={base.locations}
        start={base.start}
        end={base.end}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={OVERLAY.colors}
        locations={OVERLAY.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Neighborhood tag */}
      <View style={styles.nbhTag}>
        <Text style={styles.nbhTagText}>{post.neighborhood}</Text>
      </View>

      {/* Bottom content */}
      <View style={styles.cardBottom}>
        <Text style={styles.username}>{post.author?.handle}</Text>
        <Text style={styles.caption}>{post.caption}</Text>
        <View style={styles.metaRow}>
          <DistanceLabel label={post.distance.label} surface="dark" />
          <ActionRow
            fire={post.fire}
            comments={post.comments}
            surface="dark"
            onCommentPress={onCommentPress}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
  nbhTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 13,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 999,
  },
  nbhTagText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: '#3d7e83',
    letterSpacing: 0.2,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
