/**
 * Auth flow (Grove): **sign-in required** (no guest mode).
 * Methods: **email + password**, **Google OAuth** (`lib/auth-google`), **Sign in with Apple** on iOS (`lib/auth-apple`).
 * Order: **sign-in / sign-up → onboarding (once) → main app** (`(tabs)`).
 * Onboarding completion is stored in Supabase `user.user_metadata.onboarding_completed`.
 */
import type { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getAuthOAuthRedirectUrl } from '@/lib/auth-redirect-url';
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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; sessionCreated: boolean }>;
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
      .then(({ data: { session: s }, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn('[auth] getSession:', error.message);
        }
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

  const user = session?.user ?? null;
  const needsOnboarding = useMemo(() => getNeedsOnboarding(user), [user]);

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
      return { error: CONFIG_ERROR, sessionCreated: false };
    }
    try {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthOAuthRedirectUrl(),
        },
      });
      return {
        error: error ? new Error(error.message) : null,
        sessionCreated: Boolean(data?.session),
      };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Network request failed';
      return {
        error: new Error(
          `Sign up failed: ${msg}. Check your internet/VPN/DNS and try again.`,
        ),
        sessionCreated: false,
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return;
    }
    await getSupabase().auth.signOut();
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return { error: CONFIG_ERROR };
    }
    const { error } = await getSupabase().auth.updateUser({
      data: { onboarding_completed: true },
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      initialized,
      supabaseConfigured: isSupabaseConfigured,
      needsOnboarding,
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
