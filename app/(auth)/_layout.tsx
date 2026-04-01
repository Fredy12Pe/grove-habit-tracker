import { Redirect, Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/contexts/auth-context';

export default function AuthGroupLayout() {
  const { initialized, session, needsOnboarding } = useAuth();

  if (!initialized) {
    return null;
  }

  if (session && needsOnboarding) {
    return <Redirect href="/onboarding/choose-habits" />;
  }

  if (session && !needsOnboarding) {
    return <Redirect href="/(tabs)/garden" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="login-email" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
