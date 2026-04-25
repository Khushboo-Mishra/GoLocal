import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface DistanceLabelProps {
  label: string;
  surface?: 'dark' | 'light';
}

export function DistanceLabel({ label, surface = 'light' }: DistanceLabelProps) {
  const { tokens } = useTheme();
  const textColor = surface === 'dark' ? 'rgba(255,255,255,0.75)' : tokens.colors.textSecondary;

  return (
    <View style={styles.row}>
      <View style={styles.dotWrapper}>
        <View style={[styles.halo, { backgroundColor: 'rgba(129,195,201,0.15)' }]} />
        <View style={[styles.dot, { backgroundColor: tokens.colors.brand }]} />
      </View>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotWrapper: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
  },
});
