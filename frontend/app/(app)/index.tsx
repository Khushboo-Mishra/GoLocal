import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import type { Post, FeedFilter, FeedResponse } from '@/types';
import { feedApi } from '@/services/api/client';
import { useAuthStore } from '@/services/stores/authStore';
import { useLocation } from '@/hooks/useLocation';
import { PostCard } from '@/components/cards/PostCard';
import { FilterPills } from '@/components/feed/FilterPills';
import { Scrubber } from '@/components/feed/Scrubber';
import { WalkMarker } from '@/components/feed/WalkMarker';
import { RadarEnd } from '@/components/feed/RadarEnd';
import { formatWalkLabel } from '@/components/cards/shared/format';
import { useCommentSheet } from '@/components/sheets/CommentSheetProvider';
import { Svg, Path } from 'react-native-svg';

const DEFAULT_RADIUS_MILES = 3;
const LOAD_MORE_THRESHOLD = 400;

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
        label={formatWalkLabel(post.distanceMiles)}
        index={index}
        isClosest={index === 0}
      />
      <View style={{ marginTop }}>
        <PostCard post={post} onCommentPress={onCommentPress} />
      </View>
    </View>
  );
}

const EMPTY_MESSAGES: Record<FeedFilter, string> = {
  nearby: 'Nothing nearby yet — be the first to post!',
  trending: 'Nothing trending yet.',
  events: 'No events nearby yet.',
};

export default function HomeScreen() {
  const { tokens } = useTheme();
  const c = tokens.colors;
  const { openCommentSheet } = useCommentSheet();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const [filter, setFilter] = React.useState<FeedFilter>('nearby');

  const radiusMiles = user?.radiusMiles ?? DEFAULT_RADIUS_MILES;

  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(1);
  const containerHeight = useSharedValue(1);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed', filter, location.lat, location.lng, radiusMiles],
    queryFn: async ({ pageParam }): Promise<FeedResponse> => {
      const lat = location.lat as number;
      const lng = location.lng as number;

      if (filter === 'trending') {
        const res = await feedApi.getTrending({ lat, lng, radius: radiusMiles });
        return { posts: res.posts, nextCursor: null, hasMore: false };
      }

      return feedApi.getNearby({
        lat,
        lng,
        radius: radiusMiles,
        type: filter === 'events' ? 'event' : undefined,
        cursor: pageParam,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
    enabled: location.lat != null && location.lng != null,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const handleLoadMore = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
      contentHeight.value = event.contentSize.height;
      containerHeight.value = event.layoutMeasurement.height;

      const distanceFromBottom =
        event.contentSize.height - event.contentOffset.y - event.layoutMeasurement.height;
      if (distanceFromBottom < LOAD_MORE_THRESHOLD) {
        runOnJS(handleLoadMore)();
      }
    },
  });

  const renderFeedBody = () => {
    if (location.status === 'denied') {
      return (
        <View style={styles.centerState}>
          <Text style={[styles.stateTitle, { color: c.textPrimary }]}>Location needed</Text>
          <Text style={[styles.stateBody, { color: c.textSecondary }]}>
            GoLocal can't show you what's happening nearby without your location. Enable it in
            Settings to see the feed.
          </Text>
          <Pressable
            onPress={() => Linking.openSettings()}
            style={[styles.actionBtn, { backgroundColor: c.brand, shadowColor: c.brand }]}
          >
            <Text style={[styles.actionBtnText, { color: c.brandInk }]}>Open Settings</Text>
          </Pressable>
        </View>
      );
    }

    if (location.status === 'error') {
      return (
        <View style={styles.centerState}>
          <Text style={[styles.stateTitle, { color: c.textPrimary }]}>Couldn't get your location</Text>
          <Text style={[styles.stateBody, { color: c.textSecondary }]}>{location.error}</Text>
          <Pressable
            onPress={() => Linking.openSettings()}
            style={[styles.actionBtn, { backgroundColor: c.brand, shadowColor: c.brand }]}
          >
            <Text style={[styles.actionBtnText, { color: c.brandInk }]}>Open Settings</Text>
          </Pressable>
        </View>
      );
    }

    if (location.status === 'idle' || location.status === 'loading') {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator color={c.brand} />
          <Text style={[styles.stateBody, { color: c.textSecondary, marginTop: 12 }]}>
            Finding your location…
          </Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator color={c.brand} />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerState}>
          <Text style={[styles.stateTitle, { color: c.textPrimary }]}>Something went wrong</Text>
          <Text style={[styles.stateBody, { color: c.textSecondary }]}>
            We couldn't load the feed. Check your connection and try again.
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.actionBtn, { backgroundColor: c.brand, shadowColor: c.brand }]}
          >
            <Text style={[styles.actionBtnText, { color: c.brandInk }]}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={styles.centerState}>
          <Text style={[styles.stateBody, { color: c.textSecondary }]}>
            {EMPTY_MESSAGES[filter]}
          </Text>
        </View>
      );
    }

    return (
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
        {isFetchingNextPage && (
          <View style={styles.loadMore}>
            <ActivityIndicator color={c.brand} />
          </View>
        )}
        <RadarEnd />
      </Animated.ScrollView>
    );
  };

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
        {location.status === 'success' && !isLoading && !isError && posts.length > 0 && (
          <Scrubber
            scrollY={scrollY}
            contentHeight={contentHeight}
            containerHeight={containerHeight}
          />
        )}

        {renderFeedBody()}
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  stateTitle: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  stateBody: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  actionBtn: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  actionBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
  },
  loadMore: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});
