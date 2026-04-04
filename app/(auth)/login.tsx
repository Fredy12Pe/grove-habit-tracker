import { AuthWelcomeHeader } from "@/components/auth/AuthWelcomeHeader";
import { AuthWelcomeRiveBackground } from "@/components/auth/AuthWelcomeRiveBackground";
import { authWelcomeTheme } from "@/components/auth/auth-welcome-theme";
import { AppText } from "@/components/ui/AppText";
import { signInWithApple } from "@/lib/auth-apple";
import { signInWithGoogle } from "@/lib/auth-google";
import { GroveSpacing } from "@/styles/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ auto?: string | string[] }>();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const autoOAuthTriggered = useRef(false);

  const onApple = useCallback(async () => {
    if (Platform.OS !== "ios") {
      return;
    }
    setAppleBusy(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        Alert.alert("Sign in failed", error.message);
      }
    } finally {
      setAppleBusy(false);
    }
  }, []);

  const onGoogle = useCallback(async () => {
    setGoogleBusy(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert("Sign in failed", error.message);
      }
    } finally {
      setGoogleBusy(false);
    }
  }, []);

  useEffect(() => {
    const raw = params.auto;
    const auto =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw)
          ? raw[0]
          : undefined;
    if (!auto) {
      autoOAuthTriggered.current = false;
      return;
    }
    if (autoOAuthTriggered.current) {
      return;
    }
    if (auto === "apple" && Platform.OS !== "ios") {
      autoOAuthTriggered.current = true;
      return;
    }
    if (auto !== "apple" && auto !== "google") {
      return;
    }

    autoOAuthTriggered.current = true;
    const t = setTimeout(() => {
      if (auto === "apple") {
        void onApple();
      } else {
        void onGoogle();
      }
    }, 450);
    return () => clearTimeout(t);
  }, [params.auto, onApple, onGoogle]);

  return (
    <View style={styles.root}>
      <AuthWelcomeRiveBackground style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.column}>
          <AuthWelcomeHeader />

          <View style={styles.middleSpacer} />

          <View style={styles.actions}>
            {Platform.OS === "ios" ? (
              <AuthPillButton
                label="Sign in with Apple"
                icon={
                  appleBusy ? (
                    <ActivityIndicator color={authWelcomeTheme.buttonText} />
                  ) : (
                    <FontAwesome5
                      name="apple"
                      size={22}
                      color={authWelcomeTheme.buttonText}
                    />
                  )
                }
                onPress={onApple}
                disabled={appleBusy}
              />
            ) : null}
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
              onPress={() => router.push("/(auth)/login-email")}
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
      ]}
    >
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
  },
  pillLabel: {
    color: authWelcomeTheme.buttonText,
    fontWeight: "700",
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: authWelcomeTheme.divider,
    marginVertical: 4,
  },
  signUpHit: {
    alignItems: "center",
    paddingVertical: 12,
  },
  signUpText: {
    color: authWelcomeTheme.textForest,
    fontWeight: "700",
    fontSize: 17,
  },
});
