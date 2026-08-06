import { useThemeStore } from "@/lib/store/useThemeStore";
import {
  getGroveColors,
  type ColorSchemeName,
  type GroveColorPalette,
} from "@/styles/theme";

export function useColorSchemePreference(): ColorSchemeName {
  return useThemeStore((s) => s.preference);
}

/** Active Grove palette for the user's light/dark preference. */
export function useGroveColors(): GroveColorPalette {
  const preference = useColorSchemePreference();
  return getGroveColors(preference);
}

export function useIsDarkMode(): boolean {
  return useColorSchemePreference() === "dark";
}
