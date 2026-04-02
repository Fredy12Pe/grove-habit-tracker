import '@/crypto-polyfill';
import * as AppleAuthentication from 'expo-apple-authentication';
import { sha256 } from 'js-sha256';
import { Platform } from 'react-native';

import {
  isSupabaseConfigured,
  rawSupabaseUrl,
} from '@/lib/supabase-env';
import { getSupabase } from '@/lib/supabase';

function randomRawNonce(length = 32): string {
  const charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._';
  const bytes = new Uint8Array(length);
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error(
      'Secure random is unavailable. Rebuild the iOS app: npx expo run:ios --device',
    );
  }
  cryptoObj.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < length; i++) {
    s += charset[bytes[i]! % charset.length];
  }
  return s;
}

function isUserCanceled(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: string }).code === 'ERR_REQUEST_CANCELED'
  );
}

/**
 * Native Sign in with Apple → Supabase session (`signInWithIdToken`).
 * iOS only; requires a dev/production build with the Sign In with Apple capability.
 *
 * Apple expects a SHA-256 hex digest on the request; the ID token `nonce` matches that digest.
 * Supabase compares `hex(sha256(utf8(rawNonce)))` to the token — same as Flutter in Supabase docs.
 */
export async function signInWithApple(): Promise<{ error: Error | null }> {
  if (Platform.OS !== 'ios') {
    return {
      error: new Error('Sign in with Apple is only available on iOS.'),
    };
  }

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
        'EXPO_PUBLIC_SUPABASE_URL in .env must be your real project URL, then restart Metro and rebuild.',
      ),
    };
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    return {
      error: new Error(
        'Sign in with Apple is not available on this device. Use a physical device or an iOS simulator with Apple ID signed in.',
      ),
    };
  }

  const rawNonce = randomRawNonce();
  const hashedNonce = sha256(rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (e: unknown) {
    if (isUserCanceled(e)) {
      return { error: null };
    }
    const msg = e instanceof Error ? e.message : 'Sign in with Apple failed';
    return { error: new Error(msg) };
  }

  const token = credential.identityToken;
  if (!token) {
    return {
      error: new Error(
        'Apple did not return an identity token. Rebuild the app with Sign In with Apple enabled.',
      ),
    };
  }

  const { error } = await getSupabase().auth.signInWithIdToken({
    provider: 'apple',
    token,
    nonce: rawNonce,
  });

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}
