/** Env-only module (no Sentry import) — safe to read before the SDK initializes. */

export const rawSentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? '';

/** False until a DSN is supplied — crash reporting/analytics become silent no-ops. */
export const isSentryConfigured = Boolean(rawSentryDsn);
