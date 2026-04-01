import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import {
  isSupabaseConfigured,
  rawSupabaseUrl,
} from '@/lib/supabase-env';
import { getSupabase } from '@/lib/supabase';

/** Stable OAuth callback — must match Supabase Auth → Redirect URLs (e.g. `grove://auth/callback`). */
function getOAuthRedirectUrl(): string {
  // Prefer Expo Linking helpers so the returned scheme matches the *current build*.
  // (Using a hardcoded scheme can fail if the app was built with a different scheme,
  // and Safari shows "network connection was lost" when it can't open the callback.)
  const created = Linking.createURL('auth/callback');
  if (!created.startsWith('exp://') && !created.startsWith('exps://')) {
    return created;
  }

  // Fallback: build a custom-scheme URL (works for standalone/dev-client builds).
  const raw = Constants.expoConfig?.scheme;
  const scheme =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw) && raw[0]
        ? raw[0]
        : 'grove';
  return `${scheme}://auth/callback`;
}

function queryParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  if (!params) return undefined;
  const v = params[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

/**
 * Google OAuth via Supabase (PKCE). Opens the system browser; returns when the user
 * finishes or cancels. On success, session is persisted via the Supabase client.
 */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      error: new Error(
        'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.',
      ),
    };
  }

  const lower = rawSupabaseUrl.toLowerCase();
  if (
    lower.includes('your_project_ref') ||
    lower.includes('placeholder') ||
    lower.endsWith('example.supabase.co')
  ) {
    return {
      error: new Error(
        'EXPO_PUBLIC_SUPABASE_URL in .env must be your real project URL (e.g. https://ajdwibzeu.supabase.co), then restart Metro and rebuild.',
      ),
    };
  }

  const supabase = getSupabase();
  /** Do not use `Linking.createURL` alone — in dev it can produce `exp://…` URLs Safari mishandles. */
  const redirectTo = getOAuthRedirectUrl();

  let data: { url?: string } | null = null;
  try {
    const res = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    data = res.data;
    if (res.error) {
      return { error: new Error(res.error.message) };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network request failed';
    return {
      error: new Error(
        `Could not start Google sign-in: ${msg}. Check your internet/VPN/DNS and try again.`,
      ),
    };
  }

  if (!data?.url) {
    return { error: new Error('Could not start Google sign-in') };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    preferEphemeralSession: true,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { error: null };
  }

  if (result.type !== 'success' || !('url' in result) || !result.url) {
    return { error: new Error('Sign in was not completed') };
  }

  const parsed = Linking.parse(result.url);
  const qp = parsed.queryParams ?? undefined;
  const oauthError = queryParam(qp, 'error');
  const errorDescription = queryParam(qp, 'error_description');
  if (oauthError) {
    return {
      error: new Error(
        errorDescription?.replace(/\+/g, ' ') ?? oauthError,
      ),
    };
  }

  const code = queryParam(qp, 'code');
  if (!code) {
    return { error: new Error('No authorization code returned from Google') };
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return { error: new Error(exchangeError.message) };
  }

  return { error: null };
}
