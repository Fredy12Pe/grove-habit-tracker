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
 * and habits migrate automatically via syncHabitsWithAuthUser.
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

import { isOrphanedSessionAuthError } from '@/lib/auth-invalid-session';
import { getAuthOAuthRedirectUrl } from '@/lib/auth-redirect-url';
import { signUpIndicatesExistingAccount } from '@/lib/auth-signup-duplicate';
import { syncHabitsWithAuthUser } from '@/lib/habit-user-snapshot';
import { isSupabaseConfigured, rawSupabaseUrl } from '@/lib/supabase-env';
import { getSupabase } from '@/lib/supabase';
import { supabaseAuthStorage } from '@/lib/supabase-storage';

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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  /** Last user id we synced with `grove.habits.user.*` snapshots (not React session order). */
  const habitSyncUserIdRef = useRef<string | null>(null);
  /** Ref mirror of guestData so async callbacks always read the latest value. */
  const guestRef = useRef<GuestData | null>(null);

  // Keep the ref in sync with state
  useEffect(() => {
    guestRef.current = guestData;
  }, [guestData]);

  useEffect(() => {
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
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          console.warn('[auth] getSession:', error.message);
        }
        s = data.session ?? null;

        if (s?.access_token) {
          try {
            const { error: userErr } = await supabase.auth.getUser();
            if (
              userErr &&
              isOrphanedSessionAuthError(userErr.message) &&
              mounted
            ) {
              console.warn('[auth] clearing invalid session:', userErr.message);
              await supabase.auth.signOut();
              guestRef.current = g;
              setGuestData(g);
              setSession(null);
              setInitialized(true);
              return;
            }
            if (userErr) {
              console.warn('[auth] getUser:', userErr.message);
            }
          } catch (e: unknown) {
            /** `fetch`/XHR often throws rather than `{ error }` when offline — keep cached session. */
            const msg = e instanceof Error ? e.message : String(e);
            console.warn('[auth] getUser transport error — keeping cached session:', msg);
          }
        }
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
    })();

    const { data: listenerData } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void (async () => {
        if (!mounted) return;
        if (!nextSession) {
          setSession(null);
          return;
        }

        let sessionToSet: Session = nextSession;
        const guest = guestRef.current ?? (await readGuestData());
        if (guest) {
          const updatedUser = await migrateGuestToAccount(guest);
          guestRef.current = null;
          setGuestData(null);
          await clearGuestDataStorage();
          if (updatedUser) {
            sessionToSet = { ...nextSession, user: updatedUser };
          }
        }

        if (mounted) {
          setSession(sessionToSet);
        }
      })();
    });

    const subscription = listenerData?.subscription;
    if (!subscription) {
      console.warn('[auth] onAuthStateChange: missing subscription');
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Per-user habit snapshots: sign-out / account switch save to AsyncStorage; same user signing
   * back in restores from snapshot. Same-user cold start trusts rehydrated `grove.habits.v1`.
   */
  useEffect(() => {
    if (!initialized) return;

    const uid = session?.user?.id ?? null;
    const prev = habitSyncUserIdRef.current;
    let cancelled = false;

    void (async () => {
      await syncHabitsWithAuthUser({ previousUserId: prev, nextUserId: uid });
      if (!cancelled) {
        habitSyncUserIdRef.current = uid;
      }
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
      const { error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Network request failed';
      return {
        error: new Error(
          `Sign in failed: ${msg}. Check your internet/VPN/DNS and try again.`,
        ),
      };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: CONFIG_ERROR,
        sessionCreated: false,
        accountAlreadyExists: false,
      };
    }
    try {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthOAuthRedirectUrl(),
        },
      });
      const accountAlreadyExists = signUpIndicatesExistingAccount(
        data,
        error,
      );
      if (accountAlreadyExists && !error) {
        await getSupabase().auth.signOut();
      }
      return {
        error:
          error && !accountAlreadyExists ? new Error(error.message) : null,
        sessionCreated: Boolean(data?.session),
        accountAlreadyExists,
      };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Network request failed';
      return {
        error: new Error(
          `Sign up failed: ${msg}. Check your internet/VPN/DNS and try again.`,
        ),
        sessionCreated: false,
        accountAlreadyExists: false,
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await getSupabase().auth.signOut();
    }
    /** Habit save + in-memory reset run in `useEffect` when session becomes null. */
  }, []);

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
