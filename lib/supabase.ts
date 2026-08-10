import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';

import { isTransientNetworkError } from './auth-invalid-session';
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
const SUPABASE_FETCH_TIMEOUT_MS = 12000;
const SUPABASE_FETCH_RETRIES = 2;
const SUPABASE_FETCH_RETRY_DELAY_MS = 350;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err ?? '');
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>;

async function fetchWithTimeout(
  fetchImpl: FetchImpl,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    SUPABASE_FETCH_TIMEOUT_MS,
  );
  const externalSignal = init?.signal ?? undefined;
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  try {
    return await fetchImpl(resolveUrl(input), {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

const expoFetchImpl: FetchImpl = async (url, init) => {
  const response = await expoFetch(
    url,
    init as Parameters<typeof expoFetch>[1],
  );
  return response as unknown as Response;
};

/** RN whatwg-fetch / XHR — different stack from URLSession; survives iOS 18.4 Simulator HTTP/3 bugs. */
const xhrFetchImpl: FetchImpl = (url, init) => globalThis.fetch(url, init);

/**
 * On native, prefer `expo/fetch` (URLSession/OkHttp). If it fails with a transient
 * transport error — especially iOS 18.4 Simulator's URLSession/HTTP3 bug
 * (NSURLError -1005 "The network connection was lost"; see Apple forums 777999 /
 * supabase#35224) — immediately retry via RN's XHR-based `fetch`, which often
 * still works on that Simulator build.
 */
function createSupabaseFetch(): typeof globalThis.fetch {
  if (Platform.OS === 'web') {
    return globalThis.fetch.bind(globalThis);
  }

  const fetchOnce = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    try {
      return await fetchWithTimeout(expoFetchImpl, input, init);
    } catch (expoErr) {
      if (init?.signal?.aborted) throw expoErr;
      if (!isTransientNetworkError(errorMessage(expoErr))) throw expoErr;
      try {
        return await fetchWithTimeout(xhrFetchImpl, input, init);
      } catch {
        throw expoErr;
      }
    }
  };

  return (async (input, init) => {
    if (init?.signal?.aborted) {
      throw new Error('Fetch request has been canceled');
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= SUPABASE_FETCH_RETRIES; attempt++) {
      if (init?.signal?.aborted) {
        throw new Error('Fetch request has been canceled');
      }
      try {
        return await fetchOnce(input, init);
      } catch (err) {
        lastError = err;
        const retryable =
          isTransientNetworkError(errorMessage(err)) &&
          !init?.signal?.aborted;
        if (!retryable || attempt === SUPABASE_FETCH_RETRIES) {
          throw err;
        }
        await sleep(SUPABASE_FETCH_RETRY_DELAY_MS * (attempt + 1));
      }
    }
    throw lastError;
  }) as typeof globalThis.fetch;
}

function createSupabaseClient(): SupabaseClient {
  return createClient(
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

/**
 * Lazy singleton — avoids Metro evaluating `createClient` while the module graph
 * is still wiring (fixes partial/undefined exports during init).
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient();
  }
  return client;
}

/**
 * Drop the in-memory client after local sign-out / account delete so the next
 * sign-in doesn't inherit a poisoned auth-js lock or stale in-memory session
 * from a canceled `signOut()` / sync storm.
 */
export function resetSupabaseClient(): void {
  client = null;
}
