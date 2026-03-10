import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProgressScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Progress</ThemedText>
      <ThemedText style={styles.subtitle}>
        View streaks, stats, and garden growth over time.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.8,
  },
});
