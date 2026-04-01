import type { User } from '@supabase/supabase-js';

export function displayNameFromEmail(email: string | undefined): string {
  if (!email) return 'Gardener';
  const local = email.split('@')[0] ?? email;
  return local.length > 0
    ? local.charAt(0).toUpperCase() + local.slice(1)
    : 'Gardener';
}

/** Visible name: custom `display_name`, then OAuth `full_name` / `name`, then email local part. */
export function getDisplayName(user: User | null): string {
  if (!user) return 'Gardener';
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const custom =
    meta?.display_name ?? meta?.full_name ?? meta?.name;
  if (typeof custom === 'string' && custom.trim().length > 0) {
    return custom.trim();
  }
  return displayNameFromEmail(user.email);
}

export function getAvatarUrl(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const raw = meta?.avatar_url ?? meta?.picture;
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  return null;
}
