/**
 * Grove design system — calm, nature-inspired habit tracker.
 * Colors and typography aligned to Figma (SF Pro Rounded).
 */

import { Platform } from "react-native";

export type ColorSchemeName = "light" | "dark";

/** Shared shape for light and dark Grove palettes. */
export type GroveColorPalette = {
  primaryGreen: string;
  accentLime: string;
  accentLimeSoft: string;
  limeMuted: string;
  background: string;
  cardBackground: string;
  softSurface: string;
  /** Screen / elevated “paper” surface (white in light mode) */
  white: string;
  primaryText: string;
  deepText: string;
  secondaryText: string;
  inactive: string;
  mutedGray: string;
  streakFlame: string;
  outline: string;
  divider: string;
  error: string;
  /** Hairline borders on pills / cards */
  borderSubtle: string;
  /** Status-bar fade veil (matches screen surface) */
  statusBarFade: string;
  /** Floating tab bar fill */
  tabBar: string;
  /** Text / icons on lime or green accent fills (always light) */
  onAccent: string;
};

export const GrovePaletteLight: GroveColorPalette = {
  primaryGreen: "#A7DE33",
  accentLime: "#C5EA47",
  accentLimeSoft: "#BADF3D",
  limeMuted: "#8AA335",
  background: "#F9FAF1",
  cardBackground: "#F2F1E4",
  softSurface: "#F8F9F9",
  white: "#FFFFFF",
  primaryText: "#7C7B67",
  deepText: "#213242",
  secondaryText: "#807E71",
  inactive: "#E0E0E0",
  mutedGray: "#B7BDC1",
  streakFlame: "#FF8C00",
  outline: "rgba(124, 123, 103, 0.22)",
  divider: "rgba(124, 123, 103, 0.12)",
  error: "#B3261E",
  borderSubtle: "rgba(0, 0, 0, 0.1)",
  statusBarFade: "#FFFFFF",
  tabBar: "#E8EAEB",
  onAccent: "#FFFFFF",
};

/** Forest-night surfaces with Grove lime accents. */
export const GrovePaletteDark: GroveColorPalette = {
  primaryGreen: "#A7DE33",
  accentLime: "#C5EA47",
  accentLimeSoft: "#BADF3D",
  limeMuted: "#5E7028",
  background: "#141A17",
  cardBackground: "#1E2823",
  softSurface: "#24302B",
  white: "#1A221E",
  primaryText: "#A8A996",
  deepText: "#F0F2E8",
  secondaryText: "#9A9B8A",
  inactive: "#3A4540",
  mutedGray: "#6B736C",
  streakFlame: "#FF9F2E",
  outline: "rgba(240, 242, 232, 0.14)",
  divider: "rgba(240, 242, 232, 0.1)",
  error: "#E57373",
  borderSubtle: "rgba(255, 255, 255, 0.12)",
  statusBarFade: "#1A221E",
  tabBar: "#222C28",
  onAccent: "#FFFFFF",
};

export const GrovePalettes = {
  light: GrovePaletteLight,
  dark: GrovePaletteDark,
} as const;

/**
 * Default light tokens — prefer `useGroveColors()` for theme-aware UI.
 * Kept for call sites that only render in light / static contexts.
 */
export const GroveColors = GrovePaletteLight;

export function getGroveColors(scheme: ColorSchemeName): GroveColorPalette {
  return GrovePalettes[scheme];
}

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
 * Color is applied by AppText from the active palette.
 */
export const GroveTypography = {
  /** Display / profile name — 24 Semibold */
  display: {
    fontFamily: GroveFontFamily,
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 30,
  },
  /** Section titles — 20 Semibold */
  h1: {
    fontFamily: GroveFontFamily,
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  /** Card headings — 18 Semibold */
  h2: {
    fontFamily: GroveFontFamily,
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  /** Body / habit rows — 16 Medium */
  paragraph: {
    fontFamily: GroveFontFamily,
    fontSize: 16,
    fontWeight: "500" as const,
    lineHeight: 22,
  },
  /** Supporting copy — 14 Regular */
  paragraphRegular: {
    fontFamily: GroveFontFamily,
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  /** Labels / streak / tab — 14 Semibold */
  small: {
    fontFamily: GroveFontFamily,
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 18,
  },
} as const;

/** Default text color key per typography variant. */
export const GroveTypographyColorKey = {
  display: "deepText",
  h1: "deepText",
  h2: "deepText",
  paragraph: "secondaryText",
  paragraphRegular: "secondaryText",
  small: "secondaryText",
} as const satisfies Record<
  keyof typeof GroveTypography,
  keyof GroveColorPalette
>;
