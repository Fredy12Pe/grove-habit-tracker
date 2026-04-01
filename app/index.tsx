import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/auth-context";

/**
 * Entry redirect: loading → sign-in → onboarding → main tabs.
 */
export default function Index() {
  // DEV: bypass auth so you can iterate on onboarding quickly.
  // Set to `false` to restore normal gating.
  const DEV_SKIP_SIGN_IN = false;
  const { initialized, session, needsOnboarding } = useAuth();

  if (!initialized) return null;

  if (DEV_SKIP_SIGN_IN) {
    return <Redirect href="/onboarding/choose-habits" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding/choose-habits" />;
  }

  return <Redirect href="/(tabs)/garden" />;
}
