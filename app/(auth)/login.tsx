import { AuthWelcomeRiveBackground } from '@/components/auth/AuthWelcomeRiveBackground';
import { AuthWelcomeHeader } from '@/components/auth/AuthWelcomeHeader';
import { authWelcomeTheme } from '@/components/auth/auth-welcome-theme';
import { AppText } from '@/components/ui/AppText';
import { GroveSpacing } from '@/styles/theme';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { signInWithGoogle } from '@/lib/auth-google';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [googleBusy, setGoogleBusy] = useState(false);

  const onApple = useCallback(() => {
    Alert.alert(
      'Coming soon',
      'Sign in with Apple will be available in a future update.',
    );
  }, []);

  const onGoogle = useCallback(async () => {
    setGoogleBusy(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Sign in failed', error.message);
      }
    } finally {
      setGoogleBusy(false);
    }
  }, []);

  return (
    <View style={styles.root}>
      <AuthWelcomeRiveBackground style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.column}>
          <AuthWelcomeHeader />

          <View style={styles.middleSpacer} />

          <View style={styles.actions}>
            <AuthPillButton
              label="Sign in with Apple"
              icon={
                <FontAwesome5
                  name="apple"
                  size={22}
                  color={authWelcomeTheme.buttonText}
                />
              }
              onPress={onApple}
            />
            <AuthPillButton
              label="Sign in with Google"
              icon={
                googleBusy ? (
                  <ActivityIndicator color={authWelcomeTheme.buttonText} />
                ) : (
                  <FontAwesome5
                    name="google"
                    size={20}
                    color={authWelcomeTheme.buttonText}
                    brand
                  />
                )
              }
              onPress={onGoogle}
              disabled={googleBusy}
            />
            <AuthPillButton
              label="Sign in with Email"
              icon={
                <MaterialIcons
                  name="mail-outline"
                  size={22}
                  color={authWelcomeTheme.buttonText}
                />
              }
              onPress={() => router.push('/(auth)/login-email')}
            />

            <View style={styles.divider} />

            <Link href="/(auth)/sign-up" asChild>
              <Pressable style={styles.signUpHit}>
                <AppText variant="paragraph" style={styles.signUpText}>
                  Sign Up
                </AppText>
              </Pressable>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function AuthPillButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pill,
        pressed && !disabled && styles.pillPressed,
        disabled && styles.pillDisabled,
      ]}>
      <View style={styles.pillIcon}>{icon}</View>
      <AppText variant="paragraph" style={styles.pillLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: authWelcomeTheme.rootFallback,
  },
  safe: {
    flex: 1,
  },
  column: {
    flex: 1,
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
  },
  middleSpacer: {
    flex: 1,
    minHeight: 24,
  },
  actions: {
    paddingBottom: 8,
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authWelcomeTheme.buttonBg,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  pillPressed: {
    opacity: 0.88,
  },
  pillDisabled: {
    opacity: 0.65,
  },
  pillIcon: {
    width: 28,
    alignItems: 'center',
  },
  pillLabel: {
    color: authWelcomeTheme.buttonText,
    fontWeight: '700',
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: authWelcomeTheme.divider,
    marginVertical: 4,
  },
  signUpHit: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signUpText: {
    color: authWelcomeTheme.textForest,
    fontWeight: '700',
    fontSize: 17,
  },
});
