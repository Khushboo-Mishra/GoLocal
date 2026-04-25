import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';

interface ScrubberProps {
  scrollY: SharedValue<number>;
  contentHeight: SharedValue<number>;
  containerHeight: SharedValue<number>;
}

export function Scrubber({ scrollY, contentHeight, containerHeight }: ScrubberProps) {
  const { tokens } = useTheme();
  const ringScale = useSharedValue(0.4);
  const ringOpacity = useSharedValue(0.95);

  useEffect(() => {
    ringScale.value = withRepeat(
      withTiming(3.6, {
        duration: 2200,
        easing: Easing.bezier(0.2, 0.6, 0.4, 1),
      }),
      -1,
      false,
    );
    ringOpacity.value = withRepeat(
      withTiming(0, {
        duration: 2200,
        easing: Easing.bezier(0.2, 0.6, 0.4, 1),
      }),
      -1,
      false,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const pulseDotStyle = useAnimatedStyle(() => {
    const maxScroll = Math.max(1, contentHeight.value - containerHeight.value);
    const progress = Math.min(1, Math.max(0, scrollY.value / maxScroll));
    const minY = 28;
    const maxY = containerHeight.value - 155;
    const y = minY + progress * Math.max(0, maxY - minY);
    return {
      transform: [{ translateY: y }],
    };
  });

  return (
    <>
      {/* Scrubber line */}
      <View style={styles.scrubberContainer} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(129,195,201,0.9)',
            'rgba(129,195,201,0.55)',
            'rgba(129,195,201,0.25)',
            'rgba(129,195,201,0)',
          ]}
          locations={[0, 0.25, 0.6, 0.92]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Static top dot */}
        <View style={styles.topDotHalo} />
        <View style={[styles.topDot, { backgroundColor: tokens.colors.brand }]} />
      </View>

      {/* Traveling pulse dot */}
      <Animated.View style={[styles.pulseContainer, pulseDotStyle]} pointerEvents="none">
        <View style={[styles.pulseCore, { backgroundColor: tokens.colors.brand }]}>
          <Animated.View style={[styles.pulseRing, ringStyle]} />
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  scrubberContainer: {
    position: 'absolute',
    left: 32,
    top: 16,
    bottom: 0,
    width: 1.5,
  },
  topDotHalo: {
    position: 'absolute',
    left: -3.25,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(129,195,201,0.18)',
    // halo is slightly larger
    shadowColor: '#81c3c9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  topDot: {
    position: 'absolute',
    left: -3.25,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseContainer: {
    position: 'absolute',
    left: 28.5,
    top: 0,
    width: 8,
    height: 8,
  },
  pulseCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#81c3c9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#81c3c9',
  },
});
