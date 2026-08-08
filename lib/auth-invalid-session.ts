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

/**
 * Transient fetch / URLSession failures (simulator blips, brief offline, aborted
 * responses). Shared by account delete and cloud sync so we don't red-box these.
 */
export function isTransientNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('network connection was lost') ||
    m.includes('network request failed') ||
    m.includes('fetch failed') ||
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('timed out') ||
    m.includes('timeout') ||
    m.includes('aborted') ||
    m.includes('connection reset') ||
    (m.includes('socket') && m.includes('closed'))
  );
}

/**
 * Supabase's generic rejection for `signInWithPassword` — deliberately identical for
 * wrong passwords and non-existent accounts (see callers for how we disambiguate).
 */
export function isInvalidCredentialsError(message: string): boolean {
  return message.toLowerCase().includes('invalid login credentials');
}

/**
 * Transport errors that commonly fire on iOS after `delete_own_account` succeeds:
 * deleting `auth.users` invalidates the JWT mid-response, so URLSession reports
 * "network connection was lost" even though the account is gone.
 */
export function isAccountDeleteTransportError(message: string): boolean {
  const m = message.toLowerCase();
  if (m.includes('not authenticated')) return false;
  if (m.includes('permission denied') || m.includes('not authorized')) return false;
  if (
    m.includes('could not find the function') ||
    (m.includes('delete_own_account') && m.includes('does not exist')) ||
    (m.includes('function') &&
      m.includes('delete_own_account') &&
      m.includes('not found'))
  ) {
    return false;
  }
  return isTransientNetworkError(message);
}

/** Clearer copy when the RPC migration was never applied on the project. */
export function isMissingDeleteAccountRpcError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('could not find the function') ||
    (m.includes('delete_own_account') && m.includes('does not exist')) ||
    (m.includes('function') && m.includes('delete_own_account') && m.includes('not found'))
  );
}
