import { AppText } from "@/components/ui/AppText";
import { GroveColors, GroveSpacing } from "@/styles/theme";
import {
  exchangeCodeForSessionWithRetry,
  getPostAuthCallbackHref,
  setSessionFromTokensWithRetry,
} from "@/lib/auth-callback-session";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { getSupabase } from "@/lib/supabase";
import { mergeSupabaseAuthParams } from "@/lib/parse-supabase-auth-callback-url";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Handles `grove://auth/callback` from Supabase email confirmation (PKCE) and
 * token-in-fragment flows. This route must exist or Expo Router shows Not Found.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const deepLinkUrl = Linking.useURL();
  /** Safari → app can deliver the URL via event after first paint; keep in sync with getInitialURL. */
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    let alive = true;
    void Linking.getInitialURL().then((u) => {
      if (alive && u) setLinkUrl((prev) => prev ?? u);
    });
    const sub = Linking.addEventListener("url", ({ url }) => {
      setLinkUrl(url);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setErrorMessage(null);

    const run = async () => {
      if (!isSupabaseConfigured) {
        if (!cancelled) {
          setBusy(false);
          setErrorMessage(
            "This build is missing Supabase configuration. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart the app.",
          );
        }
        return;
      }

      const url =
        deepLinkUrl ?? linkUrl ?? (await Linking.getInitialURL());
      const merged = mergeSupabaseAuthParams(params, url);

      if (cancelled) return;

      if (merged.error) {
        setBusy(false);
        setErrorMessage(
          merged.error_description?.replace(/\+/g, " ") ?? merged.error,
        );
        return;
      }

      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => resolve());
      });
      if (cancelled) return;

      const supabase = getSupabase();

      if (merged.code) {
        const result = await exchangeCodeForSessionWithRetry(
          supabase,
          merged.code,
        );
        if (cancelled) return;
        if (!result.ok) {
          setBusy(false);
          if (result.verifierMismatch) {
            setErrorMessage(
              "This confirmation link must be opened on the same device you used to sign up (or sign in with email after confirming).",
            );
            return;
          }
          setErrorMessage(result.errorMessage);
          return;
        }
        router.replace(getPostAuthCallbackHref(result.session));
        return;
      }

      if (merged.access_token && merged.refresh_token) {
        const result = await setSessionFromTokensWithRetry(
          supabase,
          merged.access_token,
          merged.refresh_token,
        );
        if (cancelled) return;
        if (!result.ok) {
          setBusy(false);
          setErrorMessage(result.errorMessage);
          return;
        }
        router.replace(getPostAuthCallbackHref(result.session));
        return;
      }

      setBusy(false);
      setErrorMessage(
        "Open the confirmation link from your email, or sign in with email and password.",
      );
    };

    void run();
    return () => {
      cancelled = true;
    };
    // paramsKey serializes `params` for a stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params covered by paramsKey
  }, [deepLinkUrl, linkUrl, paramsKey, router]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.center}>
        {errorMessage ? (
          <>
            <AppText variant="paragraph" style={styles.errorText}>
              {errorMessage}
            </AppText>
            <Pressable
              style={styles.btn}
              onPress={() => router.replace("/(auth)/login-email")}
            >
              <AppText variant="paragraph" style={styles.btnText}>
                Go to sign in
              </AppText>
            </Pressable>
          </>
        ) : busy ? (
          <>
            <ActivityIndicator size="large" color={GroveColors.primaryGreen} />
            <AppText variant="paragraph" style={styles.hint}>
              Finishing sign-in…
            </AppText>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: GroveColors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    gap: 20,
  },
  hint: {
    color: GroveColors.secondaryText,
    textAlign: "center",
    marginTop: 8,
  },
  errorText: {
    color: GroveColors.primaryText,
    textAlign: "center",
    lineHeight: 22,
  },
  btn: {
    backgroundColor: GroveColors.primaryGreen,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  btnText: {
    fontWeight: "600",
    color: GroveColors.primaryText,
  },
});
