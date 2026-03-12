import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GroveColors } from '@/styles/theme';

interface PlantPlaceholderProps {
  size?: number;
  style?: object;
}

export function PlantPlaceholder({ size = 40, style }: PlantPlaceholderProps) {
  return (
    <View style={[styles.plot, { width: size, height: size, borderRadius: size / 4 }, style]}>
      <View style={[styles.plant, { width: size * 0.5, height: size * 0.6, borderRadius: size * 0.15 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plant: {
    backgroundColor: '#FF8C00',
  },
});
