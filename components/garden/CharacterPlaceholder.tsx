import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GroveColors } from '@/styles/theme';

interface CharacterPlaceholderProps {
  size?: number;
  color?: string;
  style?: object;
}

export function CharacterPlaceholder({
  size = 32,
  color = '#4A90D9',
  style,
}: CharacterPlaceholderProps) {
  return (
    <View style={[styles.character, { width: size, height: size * 1.2, backgroundColor: color }, style]}>
      <View style={[styles.face, { width: size * 0.5, height: size * 0.4, borderRadius: size * 0.1 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  character: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  face: {
    backgroundColor: GroveColors.white,
  },
});
