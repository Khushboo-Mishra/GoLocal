import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';

type ThemeMode = 'system' | 'light' | 'dark';

const SEGMENTS: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

const STUB_ROWS = ['Notifications', 'Privacy', 'About'];

import { Pressable } from 'react-native';

export default function SettingsScreen() {
  const { tokens, mode, setMode } = useTheme();
  const c = tokens.colors;

  function handleSegment(key: ThemeMode) {
    Haptics.selectionAsync();
    setMode(key);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            variant="display"
            color={c.textPrimary}
            style={styles.headerTitle}
          >
            Settings
          </Text>
        </View>

        {/* Theme section */}
        <View style={styles.section}>
          <Text
            variant="label"
            color={c.textSecondary}
            style={styles.sectionLabel}
          >
            Theme
          </Text>

          {/* Segmented control */}
          <View
            style={[
              styles.segmentedControl,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
              },
            ]}
          >
            {SEGMENTS.map(({ key, label }) => {
              const isActive = mode === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleSegment(key)}
                  style={[
                    styles.segment,
                    isActive && {
                      backgroundColor: c.brand,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        fontFamily: isActive
                          ? tokens.typography.fonts.bodySemibold
                          : tokens.typography.fonts.bodyMedium,
                        color: isActive ? c.brandInk : c.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Stub sections */}
        <View style={styles.section}>
          {STUB_ROWS.map((label) => (
            <View
              key={label}
              style={[
                styles.stubRow,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                  opacity: 0.4,
                },
              ]}
            >
              <Text
                style={[
                  styles.stubLabel,
                  {
                    fontFamily: tokens.typography.fonts.bodyMedium,
                    color: c.textPrimary,
                  },
                ]}
              >
                {label}
              </Text>
              <Text
                style={{
                  color: c.textTertiary,
                  fontSize: 18,
                }}
              >
                ›
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 40 },

  header: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {},

  section: {
    paddingHorizontal: 22,
    marginBottom: 28,
  },
  sectionLabel: {
    marginBottom: 10,
  },

  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
  },

  stubRow: {
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stubLabel: {
    fontSize: 15,
  },
});
