import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

function RadarRing({ delay }: { delay: number }) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const startAnimation = () => {
      scale.value = withRepeat(
        withTiming(3.4, {
          duration: 2600,
          easing: Easing.bezier(0.2, 0.6, 0.4, 1),
        }),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withTiming(0, {
          duration: 2600,
          easing: Easing.bezier(0.2, 0.6, 0.4, 1),
        }),
        -1,
        false,
      );
    };

    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    } else {
      startAnimation();
    }
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.ring, style]} />
  );
}

export function RadarEnd() {
  const { tokens } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.ripple}>
        <View style={[styles.dot, { backgroundColor: tokens.colors.brand }]} />
        <RadarRing delay={0} />
        <RadarRing delay={1300} />
      </View>
      <Text style={[styles.label, { color: tokens.colors.textTertiary }]}>
        edge of your radius
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 34,
    marginLeft: -40,
    paddingBottom: 20,
    gap: 12,
    alignItems: 'flex-start',
  },
  ripple: {
    width: 12,
    height: 12,
    marginLeft: -2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#81c3c9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(129,195,201,0.55)',
  },
  label: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: 'lowercase',
  },
});
