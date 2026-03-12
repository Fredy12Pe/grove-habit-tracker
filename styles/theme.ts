/**
 * Grove design system — calm, nature-inspired habit tracker.
 * Colors and typography are final per design spec.
 */

export const GroveColors = {
  primaryGreen: '#A7DE33',
  background: '#F9FAF1',
  cardBackground: '#F2F1E4',
  white: '#FFFFFF',
  primaryText: '#7C7B67',
  secondaryText: '#807E71',
  /** Light gray for inactive progress, outlines */
  inactive: '#E0E0E0',
} as const;

export const GroveSpacing = {
  screenPaddingHorizontal: 20,
  sectionGap: 20,
  cardPaddingHorizontal: 20,
  cardPaddingVertical: 28,
  habitRowGap: 16,
} as const;

export const GroveBorderRadius = {
  card: 24,
  button: 12,
  pill: 999,
} as const;

/** SF Compact Rounded — iOS uses system rounded; we map to platform rounded. */
export const GroveTypography = {
  h1: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: GroveColors.primaryText,
    lineHeight: 28,
  },
  h2: {
    fontSize: 20,
    fontWeight: '500' as const,
    color: GroveColors.primaryText,
    lineHeight: 26,
  },
  paragraph: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: GroveColors.secondaryText,
    lineHeight: 22,
  },
  paragraphRegular: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: GroveColors.secondaryText,
    lineHeight: 22,
  },
  small: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: GroveColors.secondaryText,
    lineHeight: 14,
  },
} as const;
