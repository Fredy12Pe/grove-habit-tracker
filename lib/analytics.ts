/**
 * Minimal, vendor-agnostic product analytics.
 *
 * There's no dedicated analytics backend wired up yet — events are logged in dev
 * and, once `EXPO_PUBLIC_SENTRY_DSN` is configured, attached to Sentry as
 * breadcrumbs (cheap, and gives crash reports real user-flow context) rather than
 * as separate issues, so this never inflates the Sentry error count.
 *
 * Swap the body of `trackEvent` for a real analytics SDK (PostHog, Amplitude, …)
 * later without touching any call site.
 */
import * as Sentry from '@sentry/react-native';

import { isSentryConfigured } from './sentry-env';

export type AnalyticsEventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export function trackEvent(
  name: string,
  properties?: AnalyticsEventProperties,
): void {
  if (__DEV__) {
    console.log(`[analytics] ${name}`, properties ?? {});
  }
  if (!isSentryConfigured) return;
  try {
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: name,
      level: 'info',
      data: properties,
    });
  } catch {
    /* analytics must never break the app */
  }
}
