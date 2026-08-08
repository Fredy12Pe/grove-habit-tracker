import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fetch as expoFetch } from 'expo/fetch';
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

/** Hard ceiling on any single Supabase request, native only (see below). */
const SUPABASE_FETCH_TIMEOUT_MS = 10000;

/**
 * On native, RN's default `fetch` is whatwg-fetch (XHR). That path often throws
 * opaque "Network request failed" on device. `expo/fetch` uses URLSession/OkHttp.
 *
 * Occasionally a `expo/fetch` request on the simulator stalls and never settles
 * (neither resolves nor rejects) — e.g. a dropped connection mid-response. Because
 * auth-js serializes session/user calls behind an internal lock, one stuck request
 * wedges every future auth call (including reads that should be instant) until the
 * whole JS context is restarted. Force every request to abort after a timeout so the
 * promise always settles and that lock always gets released.
 */
function createSupabaseFetch(): typeof globalThis.fetch {
  if (Platform.OS === 'web') {
    return globalThis.fetch.bind(globalThis);
  }

  return (async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      SUPABASE_FETCH_TIMEOUT_MS,
    );
    const externalSignal = init?.signal ?? undefined;
    const onExternalAbort = () => controller.abort();
    externalSignal?.addEventListener('abort', onExternalAbort);

    try {
      const response = await expoFetch(url, {
        ...(init as Parameters<typeof expoFetch>[1]),
        signal: controller.signal,
      });
      return response as unknown as Response;
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }) as typeof globalThis.fetch;
}

/**
 * Lazy singleton — avoids Metro evaluating `createClient` while the module graph
 * is still wiring (fixes partial/undefined exports during init).
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      isSupabaseConfigured ? rawSupabaseUrl : PLACEHOLDER_URL,
      isSupabaseConfigured ? rawSupabaseAnonKey : PLACEHOLDER_KEY,
      {
        global: { fetch: createSupabaseFetch() },
        auth: {
          storage: supabaseAuthStorage,
          /** On native, auth-js refreshes continuously in the background; offline / bad DNS causes infinite retries and Metro log spam (#_handleRequest does console.error on every failure). Expo web keeps token refresh tied to browser tab visibility internally. Native refresh is gated on AppState in `AuthProvider`. */
          autoRefreshToken: Platform.OS === 'web',
          persistSession: true,
          detectSessionInUrl: false,
          /** Required for `signInWithOAuth` + `exchangeCodeForSession` on native. */
          flowType: 'pkce',
        },
      },
    );
  }
  return client;
}
