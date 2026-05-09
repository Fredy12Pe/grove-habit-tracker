import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import {
  isSupabaseConfigured,
  rawSupabaseAnonKey,
  rawSupabaseUrl,
} from './supabase-env';
import { supabaseAuthStorage } from './supabase-storage';

/** Valid-looking placeholders so `createClient` never throws when env is missing. */
const PLACEHOLDER_URL = 'https://example.supabase.co';
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDIwMzIwMDAsImV4cCI6MTk1NzYwODAwMH0.invalid-placeholder';

let client: SupabaseClient | null = null;

/**
 * Lazy singleton — avoids Metro evaluating `createClient` while the module graph
 * is still wiring (fixes partial/undefined exports during init).
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const nativeFetch: typeof fetch = (...args) => globalThis.fetch(...args);
    client = createClient(
      isSupabaseConfigured ? rawSupabaseUrl : PLACEHOLDER_URL,
      isSupabaseConfigured ? rawSupabaseAnonKey : PLACEHOLDER_KEY,
      {
        // Force Supabase to use React Native's native fetch implementation.
        // This avoids occasional XHR-based polyfill failures that surface as
        // "TypeError: Network request failed" in iOS simulator/dev-client.
        global: { fetch: nativeFetch },
        auth: {
          storage: supabaseAuthStorage,
          /** On native, auth-js refreshes continuously in the background; offline / bad DNS causes infinite retries and Metro log spam (#_handleRequest does console.error on every failure). Expo web keeps token refresh tied to browser tab visibility internally. Native refresh is gated on AppState in `AuthProvider`. */
          autoRefreshToken: Platform.OS === 'web',
          persistSession: true,
          detectSessionInUrl: false,
          /** Required for `signInWithOAuth` + `exchangeCodeForSession` on native. */
          flowType: 'pkce',
        },
      }
    );
  }
  return client;
}
