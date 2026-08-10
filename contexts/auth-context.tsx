/**
 * Auth flow (Grove): sign-in required for account features; **guest mode** lets new users
 * explore before committing to an account.
 * Methods: email + password, Google OAuth, Sign in with Apple (iOS).
 * Order:
 *   - Guest: straight to onboarding → main app (/(tabs)/garden)
 *   - Authenticated: sign-in/sign-up → onboarding → main app
 * Onboarding completion:
 *   - Authenticated: stored in Supabase user_metadata.onboarding_completed
 *   - Guest: stored locally in AsyncStorage (grove.guest key)
 * Guest-to-account migration: when a guest creates/signs into an account, their display name
 * is pushed to Supabase user_metadata, onboarding is marked complete (skipping the flow),
 * habits migrate via syncHabitsWithAuthUser, then habit_snapshots cloud sync kicks in.
 */
import type { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import {
  isAccountDeleteTransportError,
  isInvalidCredentialsError,
  isMissingDeleteAccountRpcError,
  isOrphanedSessionAuthError,
  isTransientNetworkError,
} from '@/lib/auth-invalid-session';
import { getAuthOAuthRedirectUrl } from '@/lib/auth-redirect-url';
import { callWithNetworkRetry } from '@/lib/auth-retry';
import { fetchSignInHintForEmail } from '@/lib/auth-signin-hint';
import { signUpIndicatesExistingAccount } from '@/lib/auth-signup-duplicate';
import {
  clearHabitCloudMeta,
  pauseHabitCloudSync,
  setHabitCloudSyncUser,
} from '@/lib/habit-cloud-sync';
import {
  deleteHabitSnapshotForUser,
  syncHabitsWithAuthUser,
  writeHabitMeta,
} from '@/lib/habit-user-snapshot';
import { useHabitStore } from '@/lib/store/useHabitStore';
import { isSupabaseConfigured, rawSupabaseUrl } from '@/lib/supabase-env';
import { getSupabase, resetSupabaseClient } from '@/lib/supabase';
import { supabaseAuthStorage } from '@/lib/supabase-storage';
import { trackEvent } from '@/lib/analytics';
import { setSentryUser } from '@/lib/sentry';

// ─── Guest state (AsyncStorage) ──────────────────────────────────────────────

const GUEST_KEY = 'grove.guest';

type GuestData = {
  onboardingCompleted: boolean;
  displayName: string | null;
  avatarUri: string | null;
};

function getSupabaseAuthStorageKey(): string | null {
  try {
    const host = new URL(rawSupabaseUrl).hostname;
    const projectRef = host.split('.')[0];
    if (!projectRef) return null;
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}

async function clearLocalSupabaseSession(): Promise<void> {
  const key = getSupabaseAuthStorageKey();
  if (!key) return;
  try {
    await Promise.all([
      supabaseAuthStorage.removeItem(key),
      supabaseAuthStorage.removeItem(`${key}-code-verifier`),
      supabaseAuthStorage.removeItem(`${key}-user`),
    ]);
  } catch (e) {
    console.warn('[auth] clear local supabase session:', e);
  }
}

async function readGuestData(): Promise<GuestData | null> {
  try {
    const raw = await supabaseAuthStorage.getItem(GUEST_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<GuestData>;
    // Must have at least one guest-specific field to be considered valid
    if (o.onboardingCompleted === undefined && o.displayName === undefined && o.avatarUri === undefined) {
      return null;
    }
    return {
      onboardingCompleted: o.onboardingCompleted === true,
      displayName: typeof o.displayName === 'string' ? o.displayName : null,
      avatarUri: typeof o.avatarUri === 'string' ? o.avatarUri : null,
    };
  } catch {
    return null;
  }
}

async function writeGuestData(data: GuestData): Promise<void> {
  try {
    await supabaseAuthStorage.setItem(GUEST_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[auth] write guest data:', e);
  }
}

async function clearGuestDataStorage(): Promise<void> {
  try {
    await supabaseAuthStorage.removeItem(GUEST_KEY);
  } catch (e) {
    console.warn('[auth] clear guest data:', e);
  }
}

/** When a guest signs up/in, push their name + mark onboarding complete on the new account. */
async function migrateGuestToAccount(guest: GuestData): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const updateData: Record<string, unknown> = { onboarding_completed: true };
    if (guest.displayName) {
      updateData.display_name = guest.displayName;
    }
    const { data, error } = await getSupabase().auth.updateUser({ data: updateData });
    if (error) {
      console.warn('[auth] migrate guest to account:', error.message);
      return null;
    }
    return data.user ?? null;
  } catch (e) {
    console.warn('[auth] migrate guest to account:', e);
    return null;
  }
}

// ─── Context type ─────────────────────────────────────────────────────────────

const CONFIG_ERROR = new Error(
  'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, restart Expo, and rebuild if needed.'
);

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  /** False when env vars are missing — sign-in will not work until configured. */
  supabaseConfigured: boolean;
  needsOnboarding: boolean;
  /** True when the user is browsing as a guest (no account). */
  isGuest: boolean;
  /** Guest's locally-stored display name (null for authenticated users). */
  guestDisplayName: string | null;
  /** Guest's locally-stored avatar URI (file:// path, null for authenticated users). */
  guestAvatarUri: string | null;
  /** Merge `user` from `updateUser` / upload so `avatar_url` & name show before the next auth event. */
  applySessionUser: (nextUser: User) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null;
    sessionCreated: boolean;
    accountAlreadyExists: boolean;
  }>;
  signOut: () => Promise<void>;
  /** Permanently deletes the signed-in user's account and locally cached data. Guests have nothing to delete server-side. */
  deleteAccount: () => Promise<{ error: Error | null }>;
  completeOnboarding: () => Promise<{ error: Error | null }>;
  /** Skip sign-in and enter the app as a guest. */
  continueAsGuest: () => Promise<void>;
  /** Clear guest state — used when the guest decides to sign out and return to the login screen. */
  clearGuest: () => Promise<void>;
  setGuestDisplayName: (name: string) => Promise<void>;
  setGuestAvatarUri: (uri: string | null) => Promise<void>;
  /** After email/password sign-up, wait until guest→account migration finishes (guest blob cleared). No-op if not a guest. */
  waitForGuestMigrationIfAny: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getNeedsOnboarding(user: User | null): boolean {
  if (!user) return false;
  return user.user_metadata?.onboarding_completed !== true;
}

/** Avoid hanging forever on splash if Auth/network never resolves (common after account delete on simulator). */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  /**
   * Bumped whenever we `resetSupabaseClient()` so the auth listener re-attaches to the
   * new singleton. Without this, sign-out / account-delete leave React stuck with
   * `session === null` even after a successful email/OAuth sign-in (listener is on the
   * discarded client).
   */
  const [authClientEpoch, setAuthClientEpoch] = useState(0);
  /** Last user id we synced with `grove.habits.user.*` snapshots (not React session order). */
  const habitSyncUserIdRef = useRef<string | null>(null);
  /** Ref mirror of guestData so async callbacks always read the latest value. */
  const guestRef = useRef<GuestData | null>(null);
  const mountedRef = useRef(true);

  // Keep the ref in sync with state
  useEffect(() => {
    guestRef.current = guestData;
  }, [guestData]);

  const recycleSupabaseClient = useCallback(() => {
    resetSupabaseClient();
    setAuthClientEpoch((n) => n + 1);
  }, []);

  /**
   * Push a Supabase session into React state, migrating guest prefs when needed.
   * Used by `onAuthStateChange` and by email sign-in/up so navigation never races the
   * async listener (especially after a client recycle).
   */
  const applyAuthenticatedSession = useCallback(async (nextSession: Session) => {
    const guest = guestRef.current;
    if (!guest) {
      if (mountedRef.current) setSession(nextSession);
      return;
    }

    const updatedUser = await migrateGuestToAccount(guest);
    guestRef.current = null;
    setGuestData(null);
    await clearGuestDataStorage();
    if (!mountedRef.current) return;
    setSession(
      updatedUser ? { ...nextSession, user: updatedUser } : nextSession,
    );
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let mounted = true;

    if (!isSupabaseConfigured) {
      void readGuestData().then((g) => {
        if (!mounted) return;
        guestRef.current = g;
        setGuestData(g);
        setSession(null);
        setInitialized(true);
      });
      return () => {
        mounted = false;
        mountedRef.current = false;
      };
    }

    const supabase = getSupabase();

    void (async () => {
      /** Always reuse guest from storage — never wipe on Supabase/init transport errors (offline-friendly). */
      const g = await readGuestData();
      // Guest mode is local-only by design. Clear stale local auth tokens so
      // auth-js does not attempt background refresh on startup.
      if (g) {
        await clearLocalSupabaseSession();
      }
      let s: Session | null = null;

      try {
        /** `getSession()` reads the persisted token from local storage — no network round-trip. */
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          'getSession',
        );
        if (!mounted) return;
        if (error) {
          console.warn('[auth] getSession:', error.message);
        }
        s = data.session ?? null;
      } catch (err: unknown) {
        console.warn('[auth] session bootstrap failed:', err);
      }

      if (!mounted) return;
      /** If login exists, hide guest prefs (migration runs on upgrade from guest elsewhere). */
      const activeGuest = s ? null : g;
      guestRef.current = activeGuest;
      setGuestData(activeGuest);
      setSession(s);
      setInitialized(true);

      /**
       * Revalidate the cached token with the server in the background. Trusting the local
       * session first (above) means reload/splash never waits on this network round-trip —
       * it only clears the session after the fact if the token turns out to be orphaned.
       */
      if (s?.access_token) {
        try {
          const { error: userErr } = await withTimeout(
            supabase.auth.getUser(),
            8000,
            'getUser',
          );
          if (userErr && isOrphanedSessionAuthError(userErr.message) && mounted) {
            console.warn('[auth] clearing invalid session:', userErr.message);
            /**
             * Orphaned JWT / deleted user — clear storage and drop the in-memory client.
             * Do NOT await `signOut()` (noisy transport errors). Recycle so the listener
             * rebinds; `signOut`/`deleteAccount` use the same path.
             */
            setSession(null);
            await clearLocalSupabaseSession();
            recycleSupabaseClient();
          } else if (userErr) {
            console.warn('[auth] getUser:', userErr.message);
          }
        } catch (e: unknown) {
          /** `fetch`/XHR often throws when offline — keep cached session, it's already in use. */
          const msg = e instanceof Error ? e.message : String(e);
          console.warn(
            '[auth] getUser transport error — keeping cached session:',
            msg,
          );
        }
      }
    })();

    const { data: listenerData } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        if (!nextSession) {
          setSession(null);
          return;
        }
        void applyAuthenticatedSession(nextSession);
      },
    );

    const subscription = listenerData?.subscription;
    if (!subscription) {
      console.warn('[auth] onAuthStateChange: missing subscription');
    }

    return () => {
      mounted = false;
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [authClientEpoch, applyAuthenticatedSession, recycleSupabaseClient]);

  /**
   * Per-user habit snapshots (local) then cloud sync (signed-in only):
   * sign-out / account switch save to AsyncStorage; same user signing back in restores
   * from snapshot. Same-user cold start trusts rehydrated `grove.habits.v1`.
   * After local restore, `setHabitCloudSyncUser` pulls/merges/pushes `habit_snapshots`.
   */
  useEffect(() => {
    if (!initialized) return;

    const uid = session?.user?.id ?? null;
    const prev = habitSyncUserIdRef.current;
    let cancelled = false;

    void (async () => {
      await syncHabitsWithAuthUser({ previousUserId: prev, nextUserId: uid });
      if (cancelled) return;
      habitSyncUserIdRef.current = uid;
      await setHabitCloudSyncUser(uid);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialized, session?.user?.id]);

  /**
   * iOS/Android: suppress always-on JWT refresh (`autoRefreshToken: false` in `lib/supabase.ts`).
   * Run the ticker only while the app is foreground so offline / flaky DNS doesn't spam retries
   * (each failure logs via auth-js `#_handleRequest`).
   *
   * Web keeps default Supabase visibility handling (`autoRefreshToken: true`).
   */
  useEffect(() => {
    if (!initialized || !isSupabaseConfigured || Platform.OS === 'web') {
      return;
    }

    const supabase = getSupabase();

    const syncRefresh = async (next: AppStateStatus) => {
      try {
        if (next === 'active') {
          await supabase.auth.startAutoRefresh();
        } else {
          await supabase.auth.stopAutoRefresh();
        }
      } catch {
        /* ignore idle GoTrue transitions */
      }
    };

    void syncRefresh(AppState.currentState ?? 'active');

    const sub = AppState.addEventListener('change', syncRefresh);

    return () => {
      sub.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, [initialized]);

  const user = session?.user ?? null;
  const isGuest = !session && guestData !== null;

  /** Crash reports carry the signed-in user id/email; guests stay anonymous. */
  useEffect(() => {
    setSentryUser(user ? { id: user.id, email: user.email } : null);
  }, [user]);

  const needsOnboarding = useMemo(() => {
    if (user) return getNeedsOnboarding(user);
    if (isGuest) return !guestData?.onboardingCompleted;
    return false;
  }, [user, isGuest, guestData]);

  const applySessionUser = useCallback((nextUser: User) => {
    setSession((prev) => (prev ? { ...prev, user: nextUser } : prev));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: CONFIG_ERROR };
    }
    try {
      const { data, error } = await callWithNetworkRetry(() =>
        getSupabase().auth.signInWithPassword({ email, password }),
      );
      if (!error) {
        if (data.session) {
          await applyAuthenticatedSession(data.session);
        }
        trackEvent('sign_in', { method: 'email' });
        return { error: null };
      }
      /**
       * A dropped connection surfaces here as a normal `{ error }` (auth-js catches its
       * own thrown `AuthRetryableFetchError` and returns it) rather than as a thrown
       * exception — show a clear network message instead of the raw transport string.
       */
      if (isTransientNetworkError(error.message)) {
        return {
          error: new Error(
            "Couldn't reach the server. Check your connection and try again.",
          ),
        };
      }
      /**
       * Supabase returns the same generic "Invalid login credentials" for both a wrong
       * password and a non-existent account. We already reveal account existence via
       * `sign_in_hint_for_email` in the sign-up "account already exists" flow, so reuse
       * it here to give a specific, honest message instead of the raw Supabase string.
       */
      if (isInvalidCredentialsError(error.message)) {
        const hint = await fetchSignInHintForEmail(email);
        return {
          error: new Error(
            hint.found
              ? 'Incorrect password. Try again.'
              : "No account found with that email. Check your email or create a new account.",
          ),
        };
      }
      return { error: new Error(error.message) };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Network request failed';
      if (isTransientNetworkError(msg)) {
        return {
          error: new Error(
            "Couldn't reach the server. Check your connection and try again.",
          ),
        };
      }
      return {
        error: new Error(
          `Sign in failed: ${msg}. Check your internet/VPN/DNS and try again.`,
        ),
      };
    }
  }, [applyAuthenticatedSession]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: CONFIG_ERROR,
        sessionCreated: false,
        accountAlreadyExists: false,
      };
    }
    try {
      const { data, error } = await callWithNetworkRetry(() =>
        getSupabase().auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getAuthOAuthRedirectUrl(),
          },
        }),
      );
      const accountAlreadyExists = signUpIndicatesExistingAccount(
        data,
        error,
      );
      if (accountAlreadyExists && !error) {
        await getSupabase().auth.signOut();
        setSession(null);
      } else if (!error) {
        if (data.session) {
          await applyAuthenticatedSession(data.session);
        }
        trackEvent('sign_up', { method: 'email' });
      }
      return {
        error:
          error && !accountAlreadyExists
            ? new Error(
                isTransientNetworkError(error.message)
                  ? "Couldn't reach the server. Check your connection and try again."
                  : error.message,
              )
            : null,
        sessionCreated: Boolean(data?.session),
        accountAlreadyExists,
      };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Network request failed';
      if (isTransientNetworkError(msg)) {
        return {
          error: new Error(
            "Couldn't reach the server. Check your connection and try again.",
          ),
          sessionCreated: false,
          accountAlreadyExists: false,
        };
      }
      return {
        error: new Error(
          `Sign up failed: ${msg}. Check your internet/VPN/DNS and try again.`,
        ),
        sessionCreated: false,
        accountAlreadyExists: false,
      };
    }
  }, [applyAuthenticatedSession]);

  const signOut = useCallback(async () => {
    trackEvent('sign_out');
    /**
     * Clear React + persisted session locally. Do NOT await `auth.signOut()` —
     * that always makes a network revoke call which, on flaky Simulator
     * networking, aborts in-flight requests and can leave auth-js wedged so
     * the next Apple/Google/email sign-in also fails with "Couldn't reach the
     * server." Same approach as account-delete cleanup.
     */
    pauseHabitCloudSync();
    setSession(null);
    await clearLocalSupabaseSession();
    recycleSupabaseClient();
  }, [recycleSupabaseClient]);

  const deleteAccount = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return { error: CONFIG_ERROR };
    }
    const uid = session?.user?.id;
    if (!uid) {
      return { error: new Error('No account to delete.') };
    }

    const finishLocalCleanup = async () => {
      pauseHabitCloudSync();
      try {
        await clearHabitCloudMeta();
      } catch {
        /* ignore */
      }
      try {
        await deleteHabitSnapshotForUser(uid);
      } catch {
        /* ignore */
      }
      try {
        await writeHabitMeta(null);
      } catch {
        /* ignore */
      }
      useHabitStore.getState().resetHabitsForNewAccount();
      habitSyncUserIdRef.current = null;
      /**
       * Clear storage directly instead of `signOut()` — the user no longer exists server-side,
       * so `signOut()`'s network call to revoke the session is not just unnecessary, it's prone
       * to failing with a scary "network connection was lost" transport error (auth-js always
       * logs those, even when the app handles them gracefully — see `isAccountDeleteTransportError`).
       */
      await clearLocalSupabaseSession();
      recycleSupabaseClient();
      trackEvent('account_deleted');
      setSession(null);
    };

    // Stop sync immediately (no network flush) so a hung upsert can't freeze the spinner.
    pauseHabitCloudSync();

    try {
      const { error } = await withTimeout(
        Promise.resolve(getSupabase().rpc('delete_own_account')),
        15000,
        'delete_own_account',
      );

      if (error) {
        const msg = error.message || String(error);
        if (isMissingDeleteAccountRpcError(msg)) {
          void setHabitCloudSyncUser(uid);
          return {
            error: new Error(
              'Account deletion is not set up on the server yet. Apply the delete_own_account migration in Supabase, then try again.',
            ),
          };
        }

        // Deleting auth.users often aborts the HTTP response on iOS even when
        // the row was removed. Confirm the user is gone before surfacing an error.
        if (isAccountDeleteTransportError(msg)) {
          let stillExists = false;
          try {
            const { data, error: userErr } = await withTimeout(
              getSupabase().auth.getUser(),
              5000,
              'getUser after delete',
            );
            if (userErr && isOrphanedSessionAuthError(userErr.message)) {
              stillExists = false;
            } else if (!userErr && data.user?.id === uid) {
              stillExists = true;
            }
          } catch {
            // Unverifiable after transport abort — treat as deleted.
            stillExists = false;
          }
          if (stillExists) {
            void setHabitCloudSyncUser(uid);
            return {
              error: new Error(
                'Could not reach the server to delete your account. Check your connection and try again.',
              ),
            };
          }
        } else {
          void setHabitCloudSyncUser(uid);
          return { error: new Error(msg) };
        }
      }

      await finishLocalCleanup();
      return { error: null };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Network request failed';
      if (
        isAccountDeleteTransportError(msg) ||
        msg.toLowerCase().includes('timed out')
      ) {
        // RPC timed out / connection dropped after server may have deleted the user.
        // Prefer signing the user out locally over leaving them stuck spinning.
        try {
          let stillExists = false;
          try {
            const { data, error: userErr } = await withTimeout(
              getSupabase().auth.getUser(),
              4000,
              'getUser after delete timeout',
            );
            if (!userErr && data.user?.id === uid) stillExists = true;
            if (userErr && isOrphanedSessionAuthError(userErr.message)) {
              stillExists = false;
            }
          } catch {
            stillExists = false;
          }
          if (!stillExists) {
            await finishLocalCleanup();
            return { error: null };
          }
        } catch {
          /* fall through */
        }
      }
      void setHabitCloudSyncUser(uid);
      return {
        error: new Error(
          `Delete account failed: ${msg}. Check your internet connection and try again.`,
        ),
      };
    }
  }, [session, recycleSupabaseClient]);

  const completeOnboarding = useCallback(async () => {
    // Guest path: write local flag only
    if (!session) {
      const current = guestRef.current;
      if (current) {
        const updated: GuestData = { ...current, onboardingCompleted: true };
        guestRef.current = updated;
        setGuestData(updated);
        await writeGuestData(updated);
      }
      return { error: null };
    }
    // Authenticated path: write to Supabase
    if (!isSupabaseConfigured) {
      return { error: CONFIG_ERROR };
    }
    const { data, error } = await getSupabase().auth.updateUser({
      data: { onboarding_completed: true },
    });
    if (error) {
      return { error: new Error(error.message) };
    }
    if (data.user) {
      setSession((prev) => (prev ? { ...prev, user: data.user! } : prev));
    }
    trackEvent('onboarding_completed');
    return { error: null };
  }, [session]);

  const continueAsGuest = useCallback(async () => {
    const newGuest: GuestData = {
      onboardingCompleted: false,
      displayName: null,
      avatarUri: null,
    };
    await clearLocalSupabaseSession();
    await writeGuestData(newGuest);
    guestRef.current = newGuest;
    setGuestData(newGuest);
    trackEvent('guest_mode_started');
  }, []);

  const clearGuest = useCallback(async () => {
    await clearGuestDataStorage();
    guestRef.current = null;
    setGuestData(null);
  }, []);

  const setGuestDisplayName = useCallback(async (name: string) => {
    const current = guestRef.current;
    if (!current) return;
    const updated: GuestData = { ...current, displayName: name };
    guestRef.current = updated;
    setGuestData(updated);
    await writeGuestData(updated);
  }, []);

  const setGuestAvatarUri = useCallback(async (uri: string | null) => {
    const current = guestRef.current;
    if (!current) return;
    const updated: GuestData = { ...current, avatarUri: uri };
    guestRef.current = updated;
    setGuestData(updated);
    await writeGuestData(updated);
  }, []);

  const waitForGuestMigrationIfAny = useCallback(async () => {
    for (let i = 0; i < 60; i++) {
      const g = await readGuestData();
      if (!g) return;
      await new Promise<void>((r) => setTimeout(r, 50));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      initialized,
      supabaseConfigured: isSupabaseConfigured,
      needsOnboarding,
      isGuest,
      guestDisplayName: guestData?.displayName ?? null,
      guestAvatarUri: guestData?.avatarUri ?? null,
      applySessionUser,
      signIn,
      signUp,
      signOut,
      deleteAccount,
      completeOnboarding,
      continueAsGuest,
      clearGuest,
      setGuestDisplayName,
      setGuestAvatarUri,
      waitForGuestMigrationIfAny,
    }),
    [
      session,
      user,
      initialized,
      needsOnboarding,
      isGuest,
      guestData,
      applySessionUser,
      signIn,
      signUp,
      signOut,
      deleteAccount,
      completeOnboarding,
      continueAsGuest,
      clearGuest,
      setGuestDisplayName,
      setGuestAvatarUri,
      waitForGuestMigrationIfAny,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
