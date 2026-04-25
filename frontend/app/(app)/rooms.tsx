import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';

export default function RoomsScreen() {
  const { tokens } = useTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.colors.bg }]}>
      <View style={styles.center}>
        <Text variant="display" color={tokens.colors.textPrimary}>
          Rooms
        </Text>
        <Link href="/(app)" style={[styles.back, { color: tokens.colors.brand }]}>
          ← Home
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  back: { fontFamily: 'Sora_400Regular', fontSize: 15 },
});
