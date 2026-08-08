/**
 * Crash reporting (Sentry). A no-op everywhere until `EXPO_PUBLIC_SENTRY_DSN` is
 * set — safe to call from any environment (dev, CI, no .env) without extra guards.
 *
 * Setup: create a project at sentry.io, then add
 *   EXPO_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
 * to your `.env` and rebuild. For automatic source-map upload during EAS/local
 * native builds, also run `npx @sentry/wizard@latest -i reactNative` to wire up
 * SENTRY_AUTH_TOKEN and the org/project in the `@sentry/react-native` Expo plugin
 * (already present with no options in app.json).
 */
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

import { isSentryConfigured, rawSentryDsn } from './sentry-env';

let initialized = false;

/** Call once, as early as possible (root layout module scope). */
export function initSentry(): void {
  if (initialized || !isSentryConfigured) return;
  initialized = true;
  Sentry.init({
    dsn: rawSentryDsn,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
  });
}

/** Reports a caught/handled error. Logs softly (no red LogBox); forwards to Sentry when configured. */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  // Prefer warn: `console.error` triggers Expo's red LogBox for expected/handled failures
  // (e.g. best-effort cloud flush on flaky simulator networks).
  console.warn('[sentry]', error, context ?? '');
  if (!isSentryConfigured) return;
  try {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    /* never let error reporting itself crash the app */
  }
}

/** Attaches the signed-in user to future crash reports (call with `null` on sign-out). */
export function setSentryUser(
  user: { id: string; email?: string | null } | null,
): void {
  if (!isSentryConfigured) return;
  try {
    Sentry.setUser(
      user ? { id: user.id, email: user.email ?? undefined } : null,
    );
  } catch {
    /* ignore */
  }
}

export { isSentryConfigured };
