import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { GroveTypography } from '@/styles/theme';

type Variant = 'h1' | 'h2' | 'paragraph' | 'paragraphRegular' | 'small';

interface AppTextProps extends TextProps {
  variant?: Variant;
  children: React.ReactNode;
  /** When true, "Sprout" in children can be bold (used in SproutSupportCard). */
  boldSprout?: boolean;
}

export function AppText({
  variant = 'paragraph',
  children,
  style,
  boldSprout,
  ...rest
}: AppTextProps) {
  const textStyle = GroveTypography[variant];
  const resolvedStyle = [styles.base, textStyle, style];

  if (boldSprout && typeof children === 'string' && children.includes('Sprout')) {
    const parts = children.split(/(Sprout)/);
    return (
      <Text style={resolvedStyle} {...rest}>
        {parts.map((part, i) =>
          part === 'Sprout' ? (
            <Text key={i} style={[resolvedStyle, styles.bold]}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  }

  return (
    <Text style={resolvedStyle} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {},
  bold: {
    fontWeight: '700',
  },
});
