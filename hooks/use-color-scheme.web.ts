import { useEffect, useState } from "react";
import { useThemeStore } from "@/lib/store/useThemeStore";

/**
 * To support static rendering, default to light until the client hydrates.
 */
export function useColorScheme() {
  const preference = useThemeStore((s) => s.preference);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) {
    return "light";
  }

  return preference;
}
