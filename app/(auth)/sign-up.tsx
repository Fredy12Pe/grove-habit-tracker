import { AuthWelcomeHeader } from "@/components/auth/AuthWelcomeHeader";
import { AuthWelcomeRiveBackground } from "@/components/auth/AuthWelcomeRiveBackground";
import { authWelcomeTheme } from "@/components/auth/auth-welcome-theme";
import { AppText } from "@/components/ui/AppText";
import { useAuth } from "@/contexts/auth-context";
import { GroveBorderRadius, GroveSpacing } from "@/styles/theme";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, supabaseConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useCallback(async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("Enter email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const { error: err, sessionCreated } = await signUp(trimmed, password);
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (!sessionCreated) {
      Alert.alert(
        "Check your email",
        "We sent you a confirmation link. After confirming, come back and sign in.",
      );
      router.replace("/(auth)/login-email");
      return;
    }
    router.replace("/onboarding");
  }, [email, password, signUp, router]);

  return (
    <View style={styles.root}>
      <AuthWelcomeRiveBackground style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <View style={styles.column}>
            <AuthWelcomeHeader />

            <View style={styles.spacer} />

            <View style={styles.formPanel}>
              <AppText variant="h1" style={styles.screenTitle}>
                Create account
              </AppText>

              {!supabaseConfigured ? (
                <AppText variant="small" style={styles.configWarning}>
                  Supabase env is missing. Add EXPO_PUBLIC_SUPABASE_URL and
                  EXPO_PUBLIC_SUPABASE_ANON_KEY to .env and restart the dev
                  server.
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
                  placeholderTextColor={authWelcomeTheme.textMuted}
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
                  autoComplete="new-password"
                  placeholder="••••••••"
                  placeholderTextColor={authWelcomeTheme.textMuted}
                />
              </View>

              {error ? (
                <AppText variant="small" style={styles.error}>
                  {error}
                </AppText>
              ) : null}

              <Pressable
                style={[
                  styles.primaryBtn,
                  submitting && styles.primaryBtnDisabled,
                ]}
                onPress={onSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={authWelcomeTheme.buttonText} />
                ) : (
                  <AppText variant="paragraph" style={styles.primaryBtnText}>
                    Create account
                  </AppText>
                )}
              </Pressable>

              <View style={styles.divider} />

              <View style={styles.footer}>
                <AppText variant="paragraph" style={styles.footerText}>
                  Already have an account?{" "}
                </AppText>
                <Link href="/(auth)/login" asChild>
                  <Pressable>
                    <AppText variant="paragraph" style={styles.footerLink}>
                      Sign in
                    </AppText>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
  flex: {
    flex: 1,
  },
  column: {
    flex: 1,
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
  },
  spacer: {
    flex: 1,
    minHeight: 16,
  },
  formPanel: {
    paddingBottom: 8,
  },
  screenTitle: {
    color: authWelcomeTheme.textForest,
    fontWeight: "700",
    marginBottom: 24,
  },
  configWarning: {
    color: "#B3261E",
    marginBottom: 20,
    lineHeight: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: authWelcomeTheme.textMuted,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: GroveBorderRadius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(47, 74, 47, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 16,
    color: authWelcomeTheme.textForest,
  },
  error: {
    color: "#B3261E",
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: authWelcomeTheme.buttonBg,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: authWelcomeTheme.buttonText,
    fontWeight: "700",
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: authWelcomeTheme.divider,
    marginVertical: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerText: {
    color: authWelcomeTheme.textMuted,
  },
  footerLink: {
    color: authWelcomeTheme.textForest,
    fontWeight: "700",
    fontSize: 17,
  },
});
