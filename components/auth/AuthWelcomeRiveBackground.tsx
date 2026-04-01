import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useAssets } from 'expo-asset';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const welcomeRive = require('@/assets/auth/sprout_welcome.riv');

const AUTH_FALLBACK_BG = '#E8F5EC';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Full-screen welcome Rive for auth. Uses Cover fit so the artboard fills the screen.
 * In Expo Go, shows a solid mint background (Rive native module unavailable).
 */
export function AuthWelcomeRiveBackground({ style }: Props) {
  const [riveAssets, riveAssetError] = useAssets([welcomeRive]);

  const riveNative = useMemo(() => {
    if (isExpoGo) return null;
    return require('rive-react-native') as typeof import('rive-react-native');
  }, []);

  const riveUrl = riveAssets?.[0]?.localUri ?? null;

  if (riveAssetError) {
    console.warn('[AuthWelcomeRiveBackground] asset load error:', riveAssetError);
  }

  if (isExpoGo || !riveNative) {
    return <View style={[styles.fill, { backgroundColor: AUTH_FALLBACK_BG }, style]} />;
  }

  const { default: Rive, Fit, Alignment } = riveNative;

  if (!riveUrl) {
    return (
      <View style={[styles.fill, styles.loadingWrap, style]}>
        <ActivityIndicator color="#5A7D5A" />
      </View>
    );
  }

  return (
    <View style={[styles.fill, style]}>
      <Rive
        url={riveUrl}
        style={styles.fill}
        fit={Fit.Cover}
        alignment={Alignment.Center}
        autoplay
        onError={(e) => {
          console.warn('[AuthWelcomeRiveBackground] Rive error:', e);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingWrap: {
    backgroundColor: AUTH_FALLBACK_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
