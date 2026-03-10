import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function OnboardingScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome to Grove</ThemedText>
      <ThemedText style={styles.subtitle}>
        Grow your garden by building habits. Complete daily habits to see your plants bloom.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 16,
    opacity: 0.9,
  },
});
