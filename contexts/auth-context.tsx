/**
 * Auth flow (Grove): **sign-in required** (no guest mode).
 * Methods: **email + password**, **Google OAuth** (`lib/auth-google`), **Sign in with Apple** on iOS (`lib/auth-apple`).
 * Order: **sign-in / sign-up → onboarding (habits → profile → widgets → garden intro) → main app** (`(tabs)`).
 * Onboarding completion is stored in Supabase `user.user_metadata.onboarding_completed`.
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

import { isOrphanedSessionAuthError } from '@/lib/auth-invalid-session';
import { getAuthOAuthRedirectUrl } from '@/lib/auth-redirect-url';
import { signUpIndicatesExistingAccount } from '@/lib/auth-signup-duplicate';
import { syncHabitsWithAuthUser } from '@/lib/habit-user-snapshot';
import { isSupabaseConfigured } from '@/lib/supabase-env';
import { getSupabase } from '@/lib/supabase';

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
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getNeedsOnboarding(user: User | null): boolean {
  if (!user) return false;
  return user.user_metadata?.onboarding_completed !== true;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  /** Last user id we synced with `grove.habits.user.*` snapshots (not React session order). */
  const habitSyncUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setSession(null);
      setInitialized(true);
      return () => {
        mounted = false;
      };
    }

    const supabase = getSupabase();

    supabase.auth
      .getSession()
      .then(async ({ data: { session: s }, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn('[auth] getSession:', error.message);
        }
        if (s?.access_token) {
          const { error: userErr } = await supabase.auth.getUser();
          if (
            userErr &&
            isOrphanedSessionAuthError(userErr.message) &&
            mounted
          ) {
            console.warn('[auth] clearing invalid session:', userErr.message);
            await supabase.auth.signOut();
            setSession(null);
            setInitialized(true);
            return;
          }
        }
        if (!mounted) return;
        setSession(s ?? null);
        setInitialized(true);
      })
      .catch((err: unknown) => {
        console.warn('[auth] getSession failed:', err);
        if (mounted) {
          setSession(null);
          setInitialized(true);
        }
      });

    const { data: listenerData } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
      }
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

  const user = session?.user ?? null;
  const needsOnboarding = useMemo(() => getNeedsOnboarding(user), [user]);

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
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      initialized,
      supabaseConfigured: isSupabaseConfigured,
      needsOnboarding,
      applySessionUser,
      signIn,
      signUp,
      signOut,
      completeOnboarding,
    }),
    [
      session,
      user,
      initialized,
      needsOnboarding,
      applySessionUser,
      signIn,
      signUp,
      signOut,
      completeOnboarding,
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
