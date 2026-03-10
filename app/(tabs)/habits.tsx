import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HabitsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Habits</ThemedText>
      <ThemedText style={styles.subtitle}>
        Track daily habits. Completing habits grows your garden plants.
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
