import { useEffect } from 'react'
import { Stack } from 'expo-router'
// import { ClerkProvider } from '@clerk/clerk-expo'
// import * as SecureStore from 'expo-secure-store'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif'
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
} from '@expo-google-fonts/sora'
import { ThemeProvider } from '@/theme'
import { CommentSheetProvider } from '@/components/sheets/CommentSheetProvider'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

// const tokenCache = {
//   async getToken(key: string) {
//     return SecureStore.getItemAsync(key)
//   },
//   async saveToken(key: string, value: string) {
//     return SecureStore.setItemAsync(key, value)
//   },
// }

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* ClerkProvider removed temporarily — re-add when backend is ready */}
        {/* <ClerkProvider
          publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? 'placeholder_for_dev'}
          tokenCache={tokenCache}
        > */}
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CommentSheetProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
              </Stack>
            </CommentSheetProvider>
          </ThemeProvider>
        </QueryClientProvider>
        {/* </ClerkProvider> */}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
