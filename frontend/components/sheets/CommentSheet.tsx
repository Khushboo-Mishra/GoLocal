import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import type { Comment } from '@/types';
import { getComments } from '@/services/fixtures/comments';
import { Avatar } from '@/components/cards/shared/Avatar';
import { Svg, Path, Line, Polygon } from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.74;

interface CommentSheetProps {
  postId: string | null;
  onClose: () => void;
}

function CommentItem({ comment }: { comment: Comment }) {
  const { tokens } = useTheme();
  const c = tokens.colors;

  return (
    <View style={styles.commentItem}>
      <Avatar
        initial={comment.author.initial}
        gradient={comment.author.avatarGradient}
        size={36}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHead}>
          <Text style={[styles.commentUser, { color: c.textPrimary }]}>
            {comment.author.handle}
          </Text>
          <Text style={[styles.commentTime, { color: c.textTertiary }]}>
            {comment.timeAgo}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: c.textPrimary }]}>
          {comment.body}
        </Text>
        <View style={styles.commentMeta}>
          <Pressable style={styles.commentAction}>
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none"
              stroke={c.textSecondary} strokeWidth={2} strokeLinecap="round">
              <Path d="M12 2.5C9.5 5.5 8 8.5 8 11.5c0 0-1.5-1-2-2.5C4.5 11.5 4 13.5 4 15c0 4.4 3.6 7.5 8 7.5s8-3.1 8-7.5c0-5-3.5-8.5-8-12.5z" />
            </Svg>
            <Text style={[styles.commentActionText, { color: c.textSecondary }]}>
              {comment.fireCount}
            </Text>
          </Pressable>
          <Pressable style={styles.commentAction}>
            <Text style={[styles.commentActionText, { color: c.textSecondary }]}>Reply</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function CommentSheet({ postId, onClose }: CommentSheetProps) {
  const { tokens } = useTheme();
  const c = tokens.colors;
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');

  const sheetTranslateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(false);

  const isOpen = postId !== null;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      sheetTranslateY.value = withTiming(0, {
        duration: 350,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      });
      backdropOpacity.value = withTiming(0.35, { duration: 300 });
      getComments(postId!).then(setComments);
    } else {
      sheetTranslateY.value = withTiming(SHEET_HEIGHT, {
        duration: 350,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      });
      backdropOpacity.value = withTiming(0, { duration: 300 });
      const t = setTimeout(() => {
        setIsVisible(false);
        setComments([]);
      }, 360);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isVisible) return null;

  const sheetBg = c.surface;
  const handleBg = 'rgba(0,0,0,0.14)';
  const borderColor = c.border;
  const inputBg = c.bg;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents={isOpen ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { backgroundColor: sheetBg, borderColor }, sheetStyle]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Handle */}
          <View style={styles.handleZone}>
            <View style={[styles.handle, { backgroundColor: handleBg }]} />
          </View>

          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.sheetTitle, { color: c.textPrimary }]}>Comments</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: c.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          {/* Body */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CommentItem comment={item} />}
            style={styles.body}
            showsVerticalScrollIndicator={false}
          />

          {/* Input */}
          <View style={[styles.inputRow, { borderTopColor: c.border, backgroundColor: sheetBg }]}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBg,
                  borderColor: c.border,
                  color: c.textPrimary,
                  fontFamily: tokens.typography.fonts.body,
                },
              ]}
              placeholder="Add a comment..."
              placeholderTextColor={c.textTertiary}
              value={inputText}
              onChangeText={setInputText}
            />
            <Pressable
              style={[
                styles.sendBtn,
                {
                  backgroundColor: c.brand,
                  shadowColor: c.brand,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 4,
                },
              ]}
              onPress={() => {
                console.log('send comment:', inputText);
                setInputText('');
              }}
            >
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                stroke={c.brandInk} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Line x1="22" y1="2" x2="11" y2="13" />
                <Polygon points="22 2 15 22 11 13 2 9 22 2" />
              </Svg>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 35,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 20,
  },
  handleZone: {
    paddingTop: 6,
    paddingBottom: 4,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 14,
  },
  sheetTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 4,
    paddingHorizontal: 8,
  },
  closeBtnText: {
    fontSize: 18,
    lineHeight: 18,
  },
  body: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  commentContent: {
    flex: 1,
    minWidth: 0,
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUser: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
  },
  commentTime: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
  },
  commentText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13.5,
    lineHeight: 19.5,
    marginBottom: 8,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
