import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/contexts/auth-context';
import { GroveBorderRadius, GroveColors, GroveSpacing } from '@/styles/theme';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginEmailScreen() {
  const router = useRouter();
  const { signIn, supabaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useCallback(async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Enter email and password.');
      return;
    }
    setSubmitting(true);
    const { error: err } = await signIn(trimmed, password);
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace('/');
  }, [email, password, signIn, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backRow}>
            <AppText variant="paragraph" style={styles.backText}>
              ← Back
            </AppText>
          </Pressable>

          <AppText variant="h1" style={styles.title}>
            Welcome back
          </AppText>
          <AppText variant="paragraph" style={styles.subtitle}>
            Sign in to continue growing your garden.
          </AppText>

          {!supabaseConfigured ? (
            <AppText variant="small" style={styles.configWarning}>
              Supabase env is missing. Add EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY to .env and restart the dev server.
            </AppText>
          ) : null}

          <View style={styles.field}>
            <AppText variant="small" style={styles.label}>
              Email
            </AppText>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={GroveColors.secondaryText}
            />
          </View>

          <View style={styles.field}>
            <AppText variant="small" style={styles.label}>
              Password
            </AppText>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
              placeholderTextColor={GroveColors.secondaryText}
            />
          </View>

          {error ? (
            <AppText variant="small" style={styles.error}>
              {error}
            </AppText>
          ) : null}

          <Pressable
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            onPress={onSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={GroveColors.primaryText} />
            ) : (
              <AppText variant="paragraph" style={styles.primaryBtnText}>
                Sign in
              </AppText>
            )}
          </Pressable>

          <View style={styles.footer}>
            <AppText variant="paragraph" style={styles.footerText}>
              No account?{' '}
            </AppText>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <AppText variant="paragraph" style={styles.link}>
                  Create one
                </AppText>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: GroveColors.background,
  },
  flex: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 8,
    justifyContent: 'center',
  },
  backRow: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backText: {
    color: GroveColors.primaryText,
    fontWeight: '600',
  },
  title: {
    color: GroveColors.primaryText,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: GroveColors.secondaryText,
    marginBottom: 28,
  },
  configWarning: {
    color: '#B3261E',
    marginBottom: 20,
    lineHeight: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: GroveColors.secondaryText,
    marginBottom: 6,
  },
  input: {
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GroveColors.inactive,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: GroveColors.primaryText,
  },
  error: {
    color: '#B3261E',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: GroveBorderRadius.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: GroveColors.primaryText,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  footerText: {
    color: GroveColors.secondaryText,
  },
  link: {
    color: GroveColors.primaryText,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
