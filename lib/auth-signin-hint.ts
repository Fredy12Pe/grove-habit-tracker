import { getSupabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase-env';

export type SignInHintResult = {
  found: boolean;
  /** First identity by `created_at` — how the user originally signed up. */
  firstProvider?: string;
  providers?: string[];
};

type RpcRow = {
  found?: boolean;
  first_provider?: string;
  providers?: unknown;
};

/**
 * Looks up the user's first auth identity provider (email, apple, google, …).
 * Requires DB function `public.sign_in_hint_for_email` (see supabase/migrations).
 */
export async function fetchSignInHintForEmail(
  email: string,
): Promise<SignInHintResult> {
  if (!isSupabaseConfigured) {
    return { found: false };
  }
  const { data, error } = await getSupabase().rpc('sign_in_hint_for_email', {
    p_email: email.trim(),
  });
  if (error) {
    console.warn('[auth] sign_in_hint_for_email:', error.message);
    return { found: false };
  }
  const row = data as RpcRow | null | undefined;
  if (!row || row.found !== true) {
    return { found: false };
  }
  const rawList = row.providers;
  const providers = Array.isArray(rawList)
    ? rawList.map((x) => String(x).toLowerCase())
    : undefined;
  return {
    found: true,
    firstProvider: (row.first_provider ?? 'email').toLowerCase(),
    providers,
  };
}

export type SignInHintNavigation =
  | { pathname: '/(auth)/login'; params?: { auto: string } }
  | { pathname: '/(auth)/login-email'; params: { prefillEmail: string } };

/** Map first provider → Expo route (no user picker). */
export function signInHintToNavigation(
  hint: SignInHintResult,
  email: string,
): SignInHintNavigation {
  const trimmed = email.trim();
  if (!hint.found || !hint.firstProvider) {
    return { pathname: '/(auth)/login' };
  }
  const p = hint.firstProvider.toLowerCase();
  if (p === 'email') {
    return {
      pathname: '/(auth)/login-email',
      params: { prefillEmail: trimmed },
    };
  }
  if (p === 'apple') {
    return { pathname: '/(auth)/login', params: { auto: 'apple' } };
  }
  if (p === 'google') {
    return { pathname: '/(auth)/login', params: { auto: 'google' } };
  }
  return { pathname: '/(auth)/login' };
}

/** Copy for the “account already exists” alert (matches where Sign In will go). */
export function existingAccountAlertBody(hint: SignInHintResult): string {
  if (!hint.found || !hint.firstProvider) {
    return 'An account with this email already exists. Tap Sign In to open the sign-in screen and use the same method as before.';
  }
  switch (hint.firstProvider.toLowerCase()) {
    case 'email':
      return 'An account with this email already exists. Tap Sign In to enter your password on the email sign-in screen.';
    case 'apple':
      return 'An account with this email already exists. Tap Sign In to continue with Sign in with Apple.';
    case 'google':
      return 'An account with this email already exists. Tap Sign In to continue with Google.';
    default:
      return 'An account with this email already exists. Tap Sign In to open the sign-in screen.';
  }
}
