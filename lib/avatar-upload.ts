import { getSupabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase-env';

export const AVATAR_STORAGE_BUCKET = 'avatars';

/** `Error.name` when upload failed because the `avatars` bucket does not exist. */
export const AVATARS_BUCKET_MISSING_ERROR_NAME = 'AvatarsBucketMissing';

const BUCKET = AVATAR_STORAGE_BUCKET;

/** True when Supabase Storage rejected the upload because the bucket is missing. */
export function isAvatarsBucketMissingError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('bucket not found') ||
    m.includes('no such bucket') ||
    (m.includes('not found') && m.includes('bucket'))
  );
}

function objectPath(userId: string, contentType: string): string {
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  return `${userId}/avatar.${ext}`;
}

/**
 * Uploads a local image URI to Supabase Storage and sets `user_metadata.avatar_url`.
 */
export async function uploadAvatarFromUri(
  userId: string,
  localUri: string,
  mimeType: string | undefined
): Promise<{ publicUrl: string } | { error: Error }> {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }

  const contentType =
    mimeType && mimeType.length > 0 ? mimeType : 'image/jpeg';
  const path = objectPath(userId, contentType);

  const response = await fetch(localUri);
  const blob = await response.blob();

  const supabase = getSupabase();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType,
    });

  if (uploadError) {
    const raw = uploadError.message;
    if (isAvatarsBucketMissingError(raw)) {
      const err = new Error(
        `Create a public Storage bucket named "${BUCKET}" (Dashboard → Storage), then run the SQL file supabase/migrations/20260331140000_avatars_storage.sql in the SQL Editor so uploads are allowed.`
      );
      err.name = AVATARS_BUCKET_MISSING_ERROR_NAME;
      return { error: err };
    }
    return { error: new Error(raw) };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: authError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });

  if (authError) {
    return { error: new Error(authError.message) };
  }

  return { publicUrl };
}

function isHttpImageUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Sets `user_metadata.avatar_url` to a remote image URL (no Storage upload).
 * Profile and Garden read it with `getAvatarUrl` from `@/lib/user-display`.
 */
export async function setAvatarUrlFromLink(
  url: string
): Promise<{ ok: true } | { error: Error }> {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return { error: new Error('Enter an image URL.') };
  }
  if (!isHttpImageUrl(trimmed)) {
    return {
      error: new Error('Use a full URL starting with https:// or http://'),
    };
  }

  const { error } = await getSupabase().auth.updateUser({
    data: { avatar_url: trimmed },
  });
  if (error) {
    return { error: new Error(error.message) };
  }
  return { ok: true };
}

