import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import type { TextPost } from '@/types';
import { Avatar } from './shared/Avatar';
import { ActionRow } from './shared/ActionRow';
import { DistanceLabel } from './shared/DistanceLabel';

interface TextCardProps {
  post: TextPost;
  onCommentPress?: () => void;
}

export function TextCard({ post, onCommentPress }: TextCardProps) {
  const { tokens } = useTheme();
  const c = tokens.colors;

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
      {/* User row */}
      <View style={styles.userRow}>
        <View style={styles.userLeft}>
          <Avatar
            initial={post.author.initial}
            gradient={post.author.avatarGradient}
            size={32}
          />
          <View>
            <Text style={[styles.usernameInline, { color: c.textPrimary }]}>
              {post.author.handle}
            </Text>
            <Text style={[styles.nbhInline, { color: c.textSecondary }]}>
              {post.author.neighborhood}
            </Text>
          </View>
        </View>
        <Text style={[styles.moreDots, { color: c.textTertiary }]}>•••</Text>
      </View>

      {/* Body */}
      <Text style={[styles.textBody, { color: c.textPrimary }]}>{post.body}</Text>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <DistanceLabel label={post.distance.label} surface="light" />
        <ActionRow
          fire={post.fire}
          comments={post.comments}
          surface="light"
          onCommentPress={onCommentPress}
        />
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
  nbhInline: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    marginTop: 1,
  },
  moreDots: {
    fontSize: 16,
    letterSpacing: 1,
  },
  textBody: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 18,
    lineHeight: 25.6,
    letterSpacing: -0.1,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
