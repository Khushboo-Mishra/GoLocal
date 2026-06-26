import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Link } from 'expo-router'
import { useSignIn } from '@clerk/clerk-expo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/theme'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const { tokens } = useTheme()
  const c = tokens.colors

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    if (!isLoaded) return
    setError(null)
    setLoading(true)
    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      })

      console.log('SIGN-IN STATUS:', result?.status)
      console.error('SIGN-IN RESULT:', JSON.stringify(result, null, 2))

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        // Navigation to (app) is handled automatically by the auth guard
        // in (app)/_layout.tsx once isSignedIn flips to true.
      } else {
        // Unexpected: multi-factor or other step required.
        setError('Sign-in incomplete. Please check your credentials.')
      }
    } catch (e: any) {
      console.error('SIGN-IN ERROR:', JSON.stringify(e, null, 2))
      const msg =
        e?.errors?.[0]?.longMessage ??
        e?.errors?.[0]?.message ??
        'Sign-in failed. Check your email and password.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          {/* Logo */}
          <Text style={[styles.logo, { color: c.textPrimary }]}>
            G<Text style={[styles.logoAccent, { color: c.brandDeep }]}>o</Text>Local
          </Text>
          <Text style={[styles.tagline, { color: c.textSecondary }]}>
            See what's happening nearby.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                  color: c.textPrimary,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={c.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                  color: c.textPrimary,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={c.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            {error && (
              <Text style={[styles.errorText, { color: '#e05252' }]}>{error}</Text>
            )}

            <Pressable
              style={[
                styles.button,
                { backgroundColor: c.brand },
                tokens.shadows.button,
              ]}
              onPress={handleSignIn}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <ActivityIndicator color={c.brandInk} />
              ) : (
                <Text style={[styles.buttonText, { color: c.brandInk }]}>Sign in</Text>
              )}
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textSecondary }]}>
              No account?{' '}
            </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text style={[styles.footerLink, { color: c.brandDeep }]}>
                  Sign up
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 42,
    letterSpacing: -1,
    marginBottom: 4,
  },
  logoAccent: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
  },
  tagline: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    marginBottom: 32,
  },
  form: {
    gap: 12,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
  },
  errorText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  button: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
  },
  footerLink: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
  },
})
