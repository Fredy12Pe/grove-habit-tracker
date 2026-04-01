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

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

/** Lets `expo-web-browser` close the auth session when returning via deep link. */
WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { initialized } = useAuth();

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

  if (!initialized) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding/choose-habits"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding/garden-intro"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="breathe"
          options={{ headerShown: false, animation: "slide_from_right" }}
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <OnboardingProvider>
            <RootLayoutContent />
          </OnboardingProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
