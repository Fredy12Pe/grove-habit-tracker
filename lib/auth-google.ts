import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { getAuthOAuthRedirectUrl } from '@/lib/auth-redirect-url';
import {
  isSupabaseConfigured,
  rawSupabaseUrl,
} from '@/lib/supabase-env';
import { getSupabase } from '@/lib/supabase';

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
  const redirectTo = getAuthOAuthRedirectUrl();

  let authUrl: string | undefined;
  try {
    const res = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (res.error) {
      return { error: new Error(res.error.message) };
    }
    const u = res.data?.url;
    authUrl = typeof u === 'string' && u.length > 0 ? u : undefined;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network request failed';
    return {
      error: new Error(
        `Could not start Google sign-in: ${msg}. Check your internet/VPN/DNS and try again.`,
      ),
    };
  }

  if (!authUrl) {
    return { error: new Error('Could not start Google sign-in') };
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo, {
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
