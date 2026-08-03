/**
 * Grove design system — calm, nature-inspired habit tracker.
 * Colors and typography aligned to Figma (SF Pro Rounded).
 */

import { Platform } from "react-native";

export const GroveColors = {
  primaryGreen: "#A7DE33",
  /** Figma home lime accents */
  accentLime: "#C5EA47",
  accentLimeSoft: "#BADF3D",
  /** Muted green for lime-card secondary copy */
  limeMuted: "#8AA335",
  background: "#F9FAF1",
  cardBackground: "#F2F1E4",
  /** Soft surface used on home progress card / tab bar */
  softSurface: "#F8F9F9",
  white: "#FFFFFF",
  primaryText: "#7C7B67",
  /** Deep charcoal for home headers / names */
  deepText: "#213242",
  secondaryText: "#807E71",
  /** Light gray for inactive progress, outlines */
  inactive: "#E0E0E0",
  /** Figma inactive habit / muted label */
  mutedGray: "#B7BDC1",
  /** Streak flame */
  streakFlame: "#FF8C00",
  /** Form fields, onboarding wells — matches primaryText tint */
  outline: "rgba(124, 123, 103, 0.22)",
  /** Section dividers (e.g. sticky footers) */
  divider: "rgba(124, 123, 103, 0.12)",
  /** Inline errors */
  error: "#B3261E",
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
  /** Large home cards (progress, garden, breathe) */
  homeCard: 48,
  button: 12,
  pill: 999,
} as const;

/**
 * SF Pro Rounded via iOS system design (`ui-rounded`).
 * Android falls back to the default sans-serif face.
 */
export const GroveFontFamily = Platform.select({
  ios: "ui-rounded",
  android: "sans-serif",
  default: "System",
  web: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', system-ui, sans-serif",
}) as string;

/**
 * Figma type scale — SF Pro Rounded at Semibold (600) unless noted.
 * Sizes from Grove Home Screen: 24 name, 20 titles, 18 habits, 14 labels.
 */
export const GroveTypography = {
  /** Display / profile name — 24 Semibold */
  display: {
    fontFamily: GroveFontFamily,
    fontSize: 24,
    fontWeight: "600" as const,
    color: GroveColors.deepText,
    lineHeight: 30,
  },
  /** Section titles — 20 Semibold */
  h1: {
    fontFamily: GroveFontFamily,
    fontSize: 20,
    fontWeight: "600" as const,
    color: GroveColors.deepText,
    lineHeight: 26,
  },
  /** Card headings — 18 Semibold */
  h2: {
    fontFamily: GroveFontFamily,
    fontSize: 18,
    fontWeight: "600" as const,
    color: GroveColors.deepText,
    lineHeight: 24,
  },
  /** Body / habit rows — 16 Medium */
  paragraph: {
    fontFamily: GroveFontFamily,
    fontSize: 16,
    fontWeight: "500" as const,
    color: GroveColors.secondaryText,
    lineHeight: 22,
  },
  /** Supporting copy — 14 Regular */
  paragraphRegular: {
    fontFamily: GroveFontFamily,
    fontSize: 14,
    fontWeight: "400" as const,
    color: GroveColors.secondaryText,
    lineHeight: 20,
  },
  /** Labels / streak / tab — 14 Semibold */
  small: {
    fontFamily: GroveFontFamily,
    fontSize: 14,
    fontWeight: "600" as const,
    color: GroveColors.secondaryText,
    lineHeight: 18,
  },
} as const;
