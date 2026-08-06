import { useThemeStore } from "@/lib/store/useThemeStore";

/** Resolved Grove appearance (user preference, not raw system). */
export function useColorScheme() {
  return useThemeStore((s) => s.preference);
}
