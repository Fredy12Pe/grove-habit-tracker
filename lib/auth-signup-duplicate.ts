import type { Session, User } from '@supabase/supabase-js';

/**
 * Supabase hides duplicate sign-ups when email (and phone) confirmation is enabled:
 * success with no session and a user whose `identities` array is empty.
 * @see https://supabase.com/docs/reference/javascript/auth-signup
 *
 * With confirmation off, signup may return an error such as "User already registered".
 */
export function signUpIndicatesExistingAccount(
  data: { user: User | null; session: Session | null } | null | undefined,
  authError: { message: string } | null,
): boolean {
  if (authError) {
    const m = authError.message.toLowerCase();
    return (
      m.includes('already registered') ||
      m.includes('already been registered') ||
      m.includes('user already exists') ||
      (m.includes('already') && m.includes('registered'))
    );
  }

  const user = data?.user;
  if (!user || data?.session) {
    return false;
  }

  return (user.identities?.length ?? 0) === 0;
}
