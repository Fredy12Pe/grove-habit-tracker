import { useAuth } from '@/contexts/auth-context';
import { isOrphanedSessionAuthError } from '@/lib/auth-invalid-session';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * If `message` indicates a dead JWT / missing auth user, signs out and sends the user to login.
 * @returns true when recovery ran (caller should skip generic error UI).
 */
export function useRecoverOrphanedSession() {
  const { signOut } = useAuth();
  const router = useRouter();

  return useCallback(
    async (message: string): Promise<boolean> => {
      if (!isOrphanedSessionAuthError(message)) return false;
      await signOut();
      router.replace('/(auth)/login');
      return true;
    },
    [signOut, router]
  );
}
