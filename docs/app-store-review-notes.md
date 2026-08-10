# App Store Connect — V1 submission checklist

Use this when filling out App Store Connect for Grove `1.0.0`.

## URLs (required)

Host the HTML files in `docs/legal/` somewhere public (GitHub Pages, your site, Notion public page, etc.), then paste:

| Field | Suggested source |
| --- | --- |
| **Privacy Policy URL** | Hosted `docs/legal/privacy.html` |
| **Support URL** | Same site, or a page that shows `support@grovehabits.app` / mailto |

In-app copies live at Profile → Privacy Policy / Terms of Use (and on the login screen). Keep hosted HTML in sync with `lib/legal.ts` when you edit copy.

Update `SUPPORT_EMAIL` in `lib/legal.ts` if you use a different inbox.

## App Privacy labels (nutrition labels)

Typical disclosures for Grove’s current design (adjust if you change providers):

| Data type | Linked to user? | Used for tracking? | Notes |
| --- | --- | --- | --- |
| Contact Info → Email Address | Yes | No | Account sign-in |
| Contact Info → Name | Yes | No | Display name |
| User Content → Photos or Videos | Yes | No | Optional profile photo |
| User Content → Other User Content | Yes | No | Habits, completions, journal text when saved |
| Identifiers → User ID | Yes | No | Auth / sync |
| Diagnostics → Crash Data | Yes (if Sentry DSN set in production) | No | Only if `EXPO_PUBLIC_SENTRY_DSN` is in EAS production |

If Sentry is **not** configured in the production build, do **not** claim Crash Data.

## App Review notes (paste into ASC)

```
Grove is a habit tracker with an optional garden world and calming mini-activities (breathing, gratitude, puzzle, focus timer). It is wellness / productivity software — not a medical app.

Sign-in options: Apple, Google, email/password, or Continue without an account (guest; data stays on device).

Account deletion (Guideline 5.1.1(v)):
1. Sign in with a real account.
2. Open the Profile tab.
3. Tap Delete account and confirm.

Guest mode has no cloud account; use Exit guest mode instead.

No in-app purchases. No ads. No tracking.
```

Optional: add a demo Apple/email account if review cannot use Sign in with Apple on their device.

## Before you submit (ops)

1. Apply all Supabase migrations on the **production** project, including `delete_own_account` + the storage `allow_delete_query` fix.
2. Confirm EAS production env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (and Sentry DSN only if you want crash reporting).
3. Smoke-test on TestFlight: Apple/Google/email login, habit sync, Profile → Delete account.
4. Ship a **new** production build after env/migration changes.
