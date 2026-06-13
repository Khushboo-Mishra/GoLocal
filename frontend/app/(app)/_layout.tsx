import { useEffect, useRef } from 'react'
import { Redirect, Tabs } from 'expo-router'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { RadialNav } from '@/components/nav/RadialNav'
import { usersApi } from '@/services/api/client'
import { useAuthStore } from '@/services/stores/authStore'

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user: clerkUser } = useUser()
  const setUser = useAuthStore((s) => s.setUser)
  const setLoaded = useAuthStore((s) => s.setLoaded)

  // Track the last Clerk user ID we synced so we don't fire on every render.
  const syncedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!isSignedIn || !clerkUser) return
    if (syncedUserId.current === clerkUser.id) return
    syncedUserId.current = clerkUser.id

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      'GoLocal User'
    const avatarUrl = clerkUser.imageUrl ?? undefined

    usersApi
      .sync(name, avatarUrl)
      .then(({ user }) => {
        setUser(user)
        setLoaded()
      })
      .catch((err) => {
        // Non-fatal — the user is still signed in; we just don't have
        // the backend profile yet. Will retry on next mount.
        console.warn('[sync] usersApi.sync failed:', err?.response?.data ?? err.message)
        syncedUserId.current = null
      })
  }, [isSignedIn, clerkUser?.id])

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }

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
        <Tabs.Screen name="create" options={{ href: null }} />
      </Tabs>
      <RadialNav />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
