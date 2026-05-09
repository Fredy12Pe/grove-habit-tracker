import { authWelcomeTheme } from "@/components/auth/auth-welcome-theme";
import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/auth-context";
import {
  existingAccountAlertBody,
  fetchSignInHintForEmail,
  signInHintToNavigation,
} from "@/lib/auth-signin-hint";
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
  const { signUp, signIn, supabaseConfigured, waitForGuestMigrationIfAny } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

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
    const { error: err, sessionCreated, accountAlreadyExists } =
      await signUp(trimmed, password);
    if (accountAlreadyExists) {
      const { error: signInErr } = await signIn(trimmed, password);
      if (!signInErr) {
        setSubmitting(false);
        await waitForGuestMigrationIfAny();
        router.replace("/");
        return;
      }
      const hint = await fetchSignInHintForEmail(trimmed);
      const nav = signInHintToNavigation(hint, trimmed);
      setSubmitting(false);
      Alert.alert("Account already exists", existingAccountAlertBody(hint), [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign In",
          onPress: () => {
            if (nav.params) {
              router.replace({
                pathname: nav.pathname,
                params: nav.params,
              });
            } else {
              router.replace(nav.pathname);
            }
          },
        },
      ]);
      return;
    }
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
    // Let `AuthProvider` finish guest→account migration (onboarding_completed + name) before routing.
    await waitForGuestMigrationIfAny();
    router.replace("/");
  }, [email, password, signUp, signIn, router, waitForGuestMigrationIfAny]);

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/login");
    }
  }, [router]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <View style={styles.column}>
            <View style={styles.formPanel}>
              <Pressable
                onPress={onBack}
                hitSlop={12}
                style={styles.backRow}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <AppText variant="paragraph" style={styles.backText}>
                  ← Back
                </AppText>
              </Pressable>

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
                <View style={styles.passwordOuter}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!passwordVisible}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    placeholderTextColor={authWelcomeTheme.textMuted}
                  />
                  <Pressable
                    onPress={() => setPasswordVisible((v) => !v)}
                    hitSlop={10}
                    style={styles.passwordReveal}
                    accessibilityRole="button"
                    accessibilityLabel={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                  >
                    <IconSymbol
                      name={passwordVisible ? "eye.slash.fill" : "eye.fill"}
                      size={22}
                      color={authWelcomeTheme.textMuted}
                    />
                  </Pressable>
                </View>
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
    backgroundColor: "#F2FBDB",
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
    justifyContent: "flex-start",
  },
  formPanel: {
    paddingTop: 56,
    paddingBottom: 8,
  },
  backRow: {
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  backText: {
    color: authWelcomeTheme.textForest,
    fontWeight: "600",
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
  passwordOuter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: GroveBorderRadius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(47, 74, 47, 0.12)",
  },
  passwordInput: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 16,
    color: authWelcomeTheme.textForest,
  },
  passwordReveal: {
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    justifyContent: "center",
    alignItems: "center",
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
