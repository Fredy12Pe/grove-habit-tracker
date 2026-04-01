import type { User } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { useAvatarPreviewStore } from '@/lib/store/useAvatarPreviewStore';
import { getAvatarUrl } from '@/lib/user-display';

function normalizeUrl(u: string): string {
  try {
    const x = new URL(u);
    x.search = '';
    return x.href;
  } catch {
    return u;
  }
}

/**
 * Prefer optimistic preview (camera roll / just-uploaded) over `user` metadata until they match.
 */
export function useResolvedAvatarUri(user: User | null): string | null {
  const previewUri = useAvatarPreviewStore((s) => s.avatarPreviewUri);
  const setPreview = useAvatarPreviewStore((s) => s.setAvatarPreviewUri);
  const fromUser = getAvatarUrl(user);

  useEffect(() => {
    if (!user) {
      setPreview(null);
      return;
    }
    if (!previewUri || !fromUser) return;
    if (normalizeUrl(previewUri) === normalizeUrl(fromUser)) {
      setPreview(null);
    }
  }, [user?.id, previewUri, fromUser, setPreview]);

  return previewUri ?? fromUser;
}
