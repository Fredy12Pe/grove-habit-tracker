/**
 * `@supabase/auth-js` unconditionally calls `console.error` on any transient fetch
 * failure (dropped connection, offline, simulator network blips) inside its internal
 * `_handleRequest` helper — *before* rethrowing it as a normal, catchable error that
 * every call site in this app already handles gracefully (see `auth-context.tsx`,
 * `habit-cloud-sync.ts`). That's a library implementation detail, not an app bug: the
 * error is expected and already recovered from, but the unconditional `console.error`
 * still prints a scary redbox-style entry to the Metro/device terminal on every
 * network hiccup, independent of `LogBox.ignoreLogs` (which only hides the in-app
 * popup, not the terminal stream).
 *
 * Import this module for its side effect as early as possible (before any Supabase
 * call can run) to downgrade just this known-benign pattern to a `console.warn` —
 * still visible for debugging, without looking like a crash on every simulator blip.
 */
const BENIGN_NETWORK_ERROR_PATTERN = /fetch failed/i;

function toMessageText(value: unknown): string {
  if (value instanceof Error) return value.message;
  return typeof value === 'string' ? value : String(value ?? '');
}

let patched = false;

export function silenceBenignNetworkErrors(): void {
  if (patched) return;
  patched = true;

  const originalConsoleError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    if (
      args.length > 0 &&
      BENIGN_NETWORK_ERROR_PATTERN.test(toMessageText(args[0]))
    ) {
      console.warn('[network]', ...args);
      return;
    }
    originalConsoleError(...args);
  };
}
