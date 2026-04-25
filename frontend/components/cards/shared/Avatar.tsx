import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AvatarProps {
  initial: string;
  gradient: [string, string];
  size?: number;
}

export function Avatar({ initial, gradient, size = 32 }: AvatarProps) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.375 }]}>{initial}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#fff',
    fontFamily: 'Sora_600SemiBold',
    lineHeight: undefined,
  },
});
