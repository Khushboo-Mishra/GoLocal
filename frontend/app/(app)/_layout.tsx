import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { RadialNav } from '@/components/nav/RadialNav';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="rooms" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="settings" />
      </Tabs>
      <RadialNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
