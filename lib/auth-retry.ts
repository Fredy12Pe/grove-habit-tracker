import { isTransientNetworkError } from '@/lib/auth-invalid-session';

/**
 * Retries a Supabase auth call exactly once if it fails with a known-transient
 * transport error (dropped connection, aborted request, iOS Simulator network
 * blips — e.g. the iOS 18.4 Simulator URLSession/HTTP-3 bug: see
 * https://github.com/supabase/supabase/issues/35224). Handles both shapes
 * auth-js can produce: a thrown exception, or a normal `{ error }` return.
 *
 * Safe for calls that are naturally idempotent to repeat (password sign-in,
 * `signUp`, starting an OAuth flow) — do NOT use this for single-use
 * operations like exchanging an OAuth code for a session.
 */
export async function callWithNetworkRetry<T extends { error: { message: string } | null }>(
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const result = await fn();
    if (result.error && isTransientNetworkError(result.error.message)) {
      try {
        return await fn();
      } catch {
        return result;
      }
    }
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isTransientNetworkError(msg)) {
      return fn();
    }
    throw err;
  }
}
