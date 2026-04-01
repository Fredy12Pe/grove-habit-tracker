import { AppText } from '@/components/ui/AppText';
import { Image } from 'expo-image';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { authWelcomeTheme } from '@/components/auth/auth-welcome-theme';

const groveTitleImage = require('@/assets/auth/grove-title.png');

export function AuthWelcomeHeader() {
  return (
    <View style={styles.header}>
      <Image
        source={groveTitleImage}
        style={styles.titleImage}
        contentFit="contain"
        accessibilityLabel="grove"
      />
      <AppText variant="paragraphRegular" style={styles.tagline}>
        {'Small daily habits grow into\na life that blooms'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: Platform.select({ ios: 26, android: 28 }),
  },
  titleImage: {
    width: '94%',
    maxWidth: 380,
    height: 96,
    marginBottom: 12,
  },
  tagline: {
    color: authWelcomeTheme.taglineGreen,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 24,
    fontSize: 15,
    fontWeight: '500',
  },
});
