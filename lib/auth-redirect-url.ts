import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

/**
 * Deep link after OAuth (Google, etc.) and email confirmation links.
 * Must be listed in Supabase → Authentication → URL Configuration → Redirect URLs
 * (e.g. `grove://auth/callback`).
 */
export function getAuthOAuthRedirectUrl(): string {
  const created = Linking.createURL('auth/callback');
  if (!created.startsWith('exp://') && !created.startsWith('exps://')) {
    return created;
  }

  const raw = Constants.expoConfig?.scheme;
  const scheme =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw) && raw[0]
        ? raw[0]
        : 'grove';
  return `${scheme}://auth/callback`;
}
