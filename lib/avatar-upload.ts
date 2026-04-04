import type { User } from '@supabase/supabase-js';
import {
  EncodingType,
  readAsStringAsync,
} from 'expo-file-system/legacy';

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

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const trimmed = b64.replace(/\s/g, '');
  const binaryString = globalThis.atob(trimmed);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * React Native often fails `fetch(file://…)` / empty blobs for library URIs.
 * Prefer ImagePicker `base64`; then fetch; then expo-file-system.
 */
async function readLocalImageBytes(
  uri: string,
  mimeType: string | undefined,
  pickerBase64?: string | null
): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const contentType =
    mimeType && mimeType.length > 0 ? mimeType : 'image/jpeg';

  if (pickerBase64 && pickerBase64.length > 0) {
    return {
      bytes: base64ToArrayBuffer(pickerBase64),
      contentType,
    };
  }

  try {
    const res = await fetch(uri);
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 0) {
        const bytes = await blob.arrayBuffer();
        const ct =
          blob.type && blob.type.startsWith('image/') ? blob.type : contentType;
        return { bytes, contentType: ct };
      }
    }
  } catch {
    // fall through to file-system
  }

  try {
    const b64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    if (b64 && b64.length > 0) {
      return {
        bytes: base64ToArrayBuffer(b64),
        contentType,
      };
    }
  } catch {
    // handled below
  }

  throw new Error(
    'Could not read the selected image. Try another photo, or paste an image URL from Profile.'
  );
}

/** Bust caches (expo-image + clients) when the Storage path is reused via upsert. */
function avatarUrlWithCacheBust(url: string): string {
  const u = url.trim();
  if (!u.length) return u;
  const sep = u.includes('?') ? '&' : '?';
  return `${u}${sep}v=${Date.now()}`;
}

async function resolveUserAfterUpdate(
  supabase: ReturnType<typeof getSupabase>,
  fromUpdate: User | null
): Promise<User | null> {
  if (fromUpdate) return fromUpdate;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Uploads a local image URI to Supabase Storage and sets `user_metadata.avatar_url`.
 * Pass `pickerBase64` from ImagePicker when using `base64: true` (recommended on native).
 */
export async function uploadAvatarFromUri(
  userId: string,
  localUri: string,
  mimeType: string | undefined,
  pickerBase64?: string | null
): Promise<{ publicUrl: string; user: User } | { error: Error }> {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }

  let bytes: ArrayBuffer;
  let contentType: string;
  try {
    const r = await readLocalImageBytes(localUri, mimeType, pickerBase64);
    bytes = r.bytes;
    contentType = r.contentType;
  } catch (e) {
    return {
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }

  const path = objectPath(userId, contentType);

  const supabase = getSupabase();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
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
  const storedAvatarUrl = avatarUrlWithCacheBust(data.publicUrl);

  const { data: authData, error: authError } = await supabase.auth.updateUser({
    data: { avatar_url: storedAvatarUrl },
  });

  if (authError) {
    return { error: new Error(authError.message) };
  }

  const user = await resolveUserAfterUpdate(supabase, authData.user ?? null);
  if (!user) {
    return { error: new Error('Could not refresh user after photo upload.') };
  }

  return { publicUrl: storedAvatarUrl, user };
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
): Promise<{ ok: true; avatarUrl: string; user: User } | { error: Error }> {
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

  const linked = avatarUrlWithCacheBust(trimmed);
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.updateUser({
    data: { avatar_url: linked },
  });
  if (error) {
    return { error: new Error(error.message) };
  }

  const user = await resolveUserAfterUpdate(supabase, data.user ?? null);
  if (!user) {
    return { error: new Error('Could not refresh user after photo URL save.') };
  }
  return { ok: true, avatarUrl: linked, user };
}

