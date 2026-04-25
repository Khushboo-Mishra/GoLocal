import React, { useCallback } from 'react';
import {
  Pressable as RNPressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface ThemedPressableProps extends PressableProps {
  haptic?: boolean;
  hapticStyle?: 'selection' | 'light' | 'medium' | 'heavy';
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
}

export function Pressable({
  haptic = false,
  hapticStyle = 'selection',
  onPress,
  style,
  ...props
}: ThemedPressableProps) {
  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      if (haptic) {
        if (hapticStyle === 'selection') {
          Haptics.selectionAsync();
        } else {
          Haptics.impactAsync(
            hapticStyle === 'light'
              ? Haptics.ImpactFeedbackStyle.Light
              : hapticStyle === 'medium'
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Heavy,
          );
        }
      }
      onPress?.(event);
    },
    [haptic, hapticStyle, onPress],
  );

  return (
    <RNPressable
      onPress={handlePress}
      style={({ pressed }) => {
        const baseStyle = typeof style === 'function' ? style({ pressed }) : style;
        return [baseStyle, { opacity: pressed ? 0.85 : 1 }];
      }}
      {...props}
    />
  );
}
