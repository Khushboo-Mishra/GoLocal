import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

interface WalkMarkerProps {
  label: string;
  index: number;
  isClosest?: boolean;
}

export function WalkMarker({ label, index, isClosest = false }: WalkMarkerProps) {
  const { tokens } = useTheme();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-10);

  useEffect(() => {
    const delay = index * 120;
    opacity.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.ease) }));
    translateX.value = withDelay(
      delay,
      withTiming(0, { duration: 520, easing: Easing.bezier(0.2, 0.8, 0.3, 1) }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const color = isClosest ? tokens.colors.brandDeep : tokens.colors.textTertiary;
  const fontFamily = isClosest
    ? tokens.typography.fonts.bodySemibold
    : tokens.typography.fonts.bodyMedium;

  return (
    <Animated.Text
      style={[
        styles.marker,
        animStyle,
        { color, fontFamily },
      ]}
    >
      {label}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    top: 10,
    left: 44,
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
