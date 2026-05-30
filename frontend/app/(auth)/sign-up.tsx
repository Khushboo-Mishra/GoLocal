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
import { useSignUp } from '@clerk/clerk-expo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/theme'

type Step = 'form' | 'verify'

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const { tokens } = useTheme()
  const c = tokens.colors

  const [step, setStep] = useState<Step>('form')

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Verification
  const [code, setCode] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    if (!isLoaded) return
    setError(null)
    setLoading(true)
    try {
      await signUp.create({
        firstName: name.trim(),
        emailAddress: email.trim().toLowerCase(),
        password,
      })

      // Always send a verification code — Clerk requires it by default.
      // If your Clerk dashboard has email verification disabled, this will
      // succeed and signUp.status will be 'complete', so we setActive there.
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStep('verify')
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.longMessage ??
        e?.errors?.[0]?.message ??
        'Sign-up failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!isLoaded) return
    setError(null)
    setLoading(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        // (app)/_layout.tsx detects isSignedIn and calls usersApi.sync
        // using the name from the Clerk user object.
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.longMessage ??
        e?.errors?.[0]?.message ??
        'Invalid code. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const isFormReady = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8

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

          {step === 'form' ? (
            <>
              <Text style={[styles.tagline, { color: c.textSecondary }]}>
                Join your neighborhood.
              </Text>

              <View style={styles.form}>
                <TextInput
                  style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }]}
                  placeholder="Your name"
                  placeholderTextColor={c.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                />
                <TextInput
                  style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }]}
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
                  style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }]}
                  placeholder="Password (8+ characters)"
                  placeholderTextColor={c.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType="newPassword"
                />

                {error && (
                  <Text style={[styles.errorText, { color: '#e05252' }]}>{error}</Text>
                )}

                <Pressable
                  style={[
                    styles.button,
                    { backgroundColor: c.brand },
                    tokens.shadows.button,
                    !isFormReady && { opacity: 0.5 },
                  ]}
                  onPress={handleSignUp}
                  disabled={loading || !isFormReady}
                >
                  {loading ? (
                    <ActivityIndicator color={c.brandInk} />
                  ) : (
                    <Text style={[styles.buttonText, { color: c.brandInk }]}>
                      Create account
                    </Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: c.textSecondary }]}>
                  Already have an account?{' '}
                </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable>
                    <Text style={[styles.footerLink, { color: c.brandDeep }]}>
                      Sign in
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.tagline, { color: c.textSecondary }]}>
                Check {email} for a 6-digit code.
              </Text>

              <View style={styles.form}>
                <TextInput
                  style={[
                    styles.input,
                    styles.codeInput,
                    { backgroundColor: c.surface, borderColor: c.brand, color: c.textPrimary },
                  ]}
                  placeholder="_ _ _ _ _ _"
                  placeholderTextColor={c.textTertiary}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoFocus
                />

                {error && (
                  <Text style={[styles.errorText, { color: '#e05252' }]}>{error}</Text>
                )}

                <Pressable
                  style={[
                    styles.button,
                    { backgroundColor: c.brand },
                    tokens.shadows.button,
                    code.length < 6 && { opacity: 0.5 },
                  ]}
                  onPress={handleVerify}
                  disabled={loading || code.length < 6}
                >
                  {loading ? (
                    <ActivityIndicator color={c.brandInk} />
                  ) : (
                    <Text style={[styles.buttonText, { color: c.brandInk }]}>
                      Verify email
                    </Text>
                  )}
                </Pressable>

                <Pressable onPress={() => { setStep('form'); setError(null); setCode('') }}>
                  <Text style={[styles.backLink, { color: c.textSecondary }]}>
                    ← Back
                  </Text>
                </Pressable>
              </View>
            </>
          )}
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
  codeInput: {
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 8,
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
  backLink: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
})
