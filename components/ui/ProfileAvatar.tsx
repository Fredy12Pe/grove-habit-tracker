import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type ImageStyle,
  type StyleProp,
  StyleSheet,
  View,
} from 'react-native';

import {
  isSupabaseConfigured,
  rawSupabaseAnonKey,
  rawSupabaseUrl,
} from '@/lib/supabase-env';

function storageSource(
  uri: string,
  accessToken: string | null | undefined
): { uri: string; headers?: Record<string, string> } {
  if (!uri.includes('/storage/v1/object/')) {
    return { uri };
  }
  // Public bucket URLs must not send user JWT — some setups reject the request.
  if (uri.includes('/object/public/')) {
    return { uri };
  }
  if (!accessToken || !isSupabaseConfigured) {
    return { uri };
  }
  try {
    if (new URL(uri).hostname !== new URL(rawSupabaseUrl).hostname) {
      return { uri };
    }
    return {
      uri,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: rawSupabaseAnonKey,
      },
    };
  } catch {
    return { uri };
  }
}

type ProfileAvatarProps = {
  uri: string | null | undefined;
  fallback: React.ReactNode;
  imageStyle?: StyleProp<ImageStyle>;
  accessToken?: string | null;
};

const fill: ImageStyle = { width: '100%', height: '100%' };

/**
 * Avatar URL from auth metadata or preview; falls back when missing or when the request fails
 * (common with non-public Storage). Optional bearer + apikey for Supabase Storage.
 */
export function ProfileAvatar({
  uri,
  fallback,
  imageStyle,
  accessToken,
}: ProfileAvatarProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const trimmed = typeof uri === 'string' ? uri.trim() : '';

  const source = useMemo(() => {
    if (!trimmed) return null;
    const low = trimmed.toLowerCase();
    if (
      low.startsWith('file:') ||
      low.startsWith('content:') ||
      low.startsWith('ph:')
    ) {
      return { uri: trimmed };
    }
    return storageSource(trimmed, accessToken);
  }, [trimmed, accessToken]);

  useEffect(() => {
    setLoadFailed(false);
  }, [trimmed]);

  if (!trimmed || loadFailed || !source) {
    return (
      <View style={[fill, styles.center]}>{fallback}</View>
    );
  }

  return (
    <Image
      key={trimmed}
      source={source}
      style={[fill, imageStyle]}
      contentFit="cover"
      transition={200}
      recyclingKey={trimmed}
      onError={(e) => {
        if (__DEV__) {
          console.warn('[ProfileAvatar] load error', e.error, trimmed.slice(0, 100));
        }
        setLoadFailed(true);
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
