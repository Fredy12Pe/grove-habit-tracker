/**
 * Supabase Auth errors that mean the stored JWT no longer matches a real user
 * (deleted user, wrong project, reset DB). Local session should be cleared.
 */
export function isOrphanedSessionAuthError(message: string): boolean {
  const m = message.toLowerCase();
  if (m.includes('sub claim') && m.includes('does not exist')) return true;
  if (m.includes('user not found') && m.includes('jwt')) return true;
  if (m.includes('invalid refresh token')) return true;
  if (m.includes('refresh token not found')) return true;
  return false;
}
