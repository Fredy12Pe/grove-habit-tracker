import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

/**
 * Placeholder for Rive mascot animation.
 * Replace with Rive when .riv assets are added to assets/rive/
 */
export function MascotRive() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.placeholder}>Mascot (Rive)</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 12,
    opacity: 0.7,
  },
});
