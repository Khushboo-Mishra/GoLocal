import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import type { FeedFilter } from '@/types';

interface FilterPillsProps {
  active: FeedFilter;
  onChange: (filter: FeedFilter) => void;
}

const PILLS: { key: FeedFilter; label: string }[] = [
  { key: 'nearby', label: 'Nearby' },
  { key: 'trending', label: 'Trending' },
  { key: 'events', label: 'Events' },
];

export function FilterPills({ active, onChange }: FilterPillsProps) {
  const { tokens } = useTheme();
  const c = tokens.colors;

  return (
    <View style={styles.row}>
      {PILLS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[
              styles.pill,
              isActive
                ? {
                    backgroundColor: c.brand,
                    borderColor: 'transparent',
                    shadowColor: c.brand,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.45,
                    shadowRadius: 14,
                    elevation: 4,
                  }
                : {
                    backgroundColor: c.surface,
                    borderColor: c.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 3,
                    elevation: 1,
                  },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? c.brandInk : c.textSecondary,
                  fontFamily: isActive
                    ? tokens.typography.fonts.bodySemibold
                    : tokens.typography.fonts.bodyMedium,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 12.5,
  },
});
