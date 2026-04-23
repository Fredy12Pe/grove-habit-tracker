import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppState, View } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { syncWidgets } from "@/lib/widgets/syncWidgets";

/** Lets `expo-web-browser` close the auth session when returning via deep link. */
WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();
const SPLASH_MIN_MS = 700;
const splashShownAt = Date.now();
/** Matches native splash + `expo.splash` background so RN never flashes black while auth loads. */
const SPLASH_BACKGROUND = "#F3FBDE";

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { initialized } = useAuth();

  useEffect(() => {
    if (initialized) {
      const elapsed = Date.now() - splashShownAt;
      const waitMs = Math.max(0, SPLASH_MIN_MS - elapsed);
      const timeoutId = setTimeout(() => {
        void SplashScreen.hideAsync();
      }, waitMs);
      syncWidgets();
      return () => clearTimeout(timeoutId);
    }
  }, [initialized]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncWidgets();
      }
    });
    return () => sub.remove();
  }, []);

  if (!initialized) {
    return <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND }} />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/callback"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="onboarding/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding/choose-habits"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding/widgets"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding/profile-setup"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding/garden-intro"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="breathe"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="gratitude"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="puzzles"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="house-desk"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="house-bed"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="add-custom-habit"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="habit-settings/[habitId]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND }}
      >
        <AuthProvider>
          <OnboardingProvider>
            <RootLayoutContent />
          </OnboardingProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
