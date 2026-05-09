import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/auth-context";

/**
 * Entry redirect: loading → sign-in (or guest) → onboarding → main tabs.
 */
export default function Index() {
  const { initialized, session, isGuest, needsOnboarding } = useAuth();

  if (!initialized) return null;

  // No account and not a guest — go to login
  if (!session && !isGuest) {
    return <Redirect href="/(auth)/login" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding/choose-habits" />;
  }

  return <Redirect href="/(tabs)/garden" />;
}
