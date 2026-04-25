import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import type { Post, FeedFilter } from '@/types';
import { getFeed } from '@/services/fixtures/feed';
import { PostCard } from '@/components/cards/PostCard';
import { FilterPills } from '@/components/feed/FilterPills';
import { Scrubber } from '@/components/feed/Scrubber';
import { WalkMarker } from '@/components/feed/WalkMarker';
import { RadarEnd } from '@/components/feed/RadarEnd';
import { useCommentSheet } from '@/components/sheets/CommentSheetProvider';
import { Svg, Path } from 'react-native-svg';

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

function FeedEntry({
  post,
  index,
  onCommentPress,
}: {
  post: Post;
  index: number;
  onCommentPress: () => void;
}) {
  const marginTop = index === 0 ? 32 : 30;
  return (
    <View style={styles.feedEntry}>
      <WalkMarker
        label={`~${post.distance.walkMinutes} min walk`}
        index={index}
        isClosest={index === 0}
      />
      <View style={{ marginTop }}>
        <PostCard post={post} onCommentPress={onCommentPress} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { tokens } = useTheme();
  const c = tokens.colors;
  const { openCommentSheet } = useCommentSheet();

  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('nearby');

  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(1);
  const containerHeight = useSharedValue(1);

  useEffect(() => {
    getFeed(filter).then(setPosts);
  }, [filter]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
      contentHeight.value = event.contentSize.height;
      containerHeight.value = event.layoutMeasurement.height;
    },
  });

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: c.textPrimary }]}>
            G<Text style={[styles.logoAccent, { color: c.brandDeep }]}>o</Text>Local
          </Text>
          <Pressable style={[
            styles.bellBtn,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            },
          ]}>
            <BellIcon color={c.textSecondary} />
            <View style={[styles.bellDot, { backgroundColor: c.brand, borderColor: c.bg }]} />
          </Pressable>
        </View>

        {/* Filter pills */}
        <FilterPills active={filter} onChange={setFilter} />
      </SafeAreaView>

      {/* Feed area */}
      <View style={styles.feedArea}>
        <Scrubber
          scrollY={scrollY}
          contentHeight={contentHeight}
          containerHeight={containerHeight}
        />

        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {posts.map((post, index) => (
            <FeedEntry
              key={post.id}
              post={post}
              index={index}
              onCommentPress={() => openCommentSheet(post.id)}
            />
          ))}
          <RadarEnd />
        </Animated.ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    zIndex: 3,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 30,
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  logoAccent: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 2,
  },
  feedArea: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingTop: 8,
    paddingRight: 18,
    paddingBottom: 220,
    paddingLeft: 72,
  },
  feedEntry: {
    position: 'relative',
    marginBottom: 14,
  },
});
