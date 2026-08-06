import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useGroveColors } from '@/hooks/useGroveColors';
import { GroveBorderRadius, GroveSpacing } from '@/styles/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...rest }: CardProps) {
  const colors = useGroveColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: GroveBorderRadius.card,
    paddingHorizontal: GroveSpacing.cardPaddingHorizontal,
    paddingVertical: GroveSpacing.cardPaddingVertical,
  },
});
