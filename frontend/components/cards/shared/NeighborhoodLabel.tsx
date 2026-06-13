import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface NeighborhoodLabelProps {
  name: string;
  surface?: 'dark' | 'light';
}

export function NeighborhoodLabel({ name, surface = 'light' }: NeighborhoodLabelProps) {
  const { tokens } = useTheme();
  const color = surface === 'dark' ? 'rgba(129,195,201,0.85)' : tokens.colors.brand;

  return <Text style={[styles.label, { color }]}>· {name}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
});
