import { isTransientNetworkError } from '@/lib/auth-invalid-session';

/**
 * Retries a Supabase auth call up to 2 extra times if it fails with a known-transient
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
  const maxAttempts = 3;
  let lastResult: T | undefined;
  let lastThrown: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      lastResult = result;
      if (
        !result.error ||
        !isTransientNetworkError(result.error.message) ||
        attempt === maxAttempts - 1
      ) {
        return result;
      }
    } catch (err: unknown) {
      lastThrown = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!isTransientNetworkError(msg) || attempt === maxAttempts - 1) {
        throw err;
      }
    }
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }

  if (lastResult) return lastResult;
  throw lastThrown;
}
