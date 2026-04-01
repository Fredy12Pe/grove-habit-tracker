import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "expo-router";
import React from "react";

export default function OnboardingIndex() {
  const { initialized, session, needsOnboarding } = useAuth();

  if (!initialized) return null;

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!needsOnboarding) {
    return <Redirect href="/(tabs)/garden" />;
  }

  return <Redirect href="/onboarding/choose-habits" />;
}
