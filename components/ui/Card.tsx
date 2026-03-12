import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { GroveBorderRadius, GroveColors, GroveSpacing } from '@/styles/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GroveColors.cardBackground,
    borderRadius: GroveBorderRadius.card,
    paddingHorizontal: GroveSpacing.cardPaddingHorizontal,
    paddingVertical: GroveSpacing.cardPaddingVertical,
  },
});
