import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Appearance, Platform } from "react-native";
import type { ColorSchemeName } from "@/styles/theme";

export type ThemePreference = ColorSchemeName;

interface ThemeStore {
  preference: ThemePreference;
  hydrated: boolean;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
  setHydrated: (hydrated: boolean) => void;
}

function getNativeAsyncStorage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-async-storage/async-storage") as {
      default?: {
        getItem: (key: string) => Promise<string | null>;
        setItem: (key: string, value: string) => Promise<void>;
        removeItem: (key: string) => Promise<void>;
      };
    };
    if (mod?.default) return mod.default;
  } catch {
    // ignore
  }
  return undefined;
}

function memoryStorage() {
  const mem = new Map<string, string>();
  return {
    getItem: async (key: string) => mem.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      mem.set(key, value);
    },
    removeItem: async (key: string) => {
      mem.delete(key);
    },
  };
}

const themeStoreStorage = createJSONStorage(() => {
  /**
   * `Platform.OS === "web"` is also true during Expo Router's Node-based SSR
   * render pass for the web bundle, where there's no `window` — guard for
   * that or `persist`'s eager rehydration crashes the whole Metro process.
   * (Falling through to `getNativeAsyncStorage()` doesn't help here: its
   * web-resolved implementation touches `window` too.)
   */
  if (Platform.OS === "web") {
    if (typeof window === "undefined") {
      return memoryStorage();
    }
    return {
      getItem: async (key: string) => window.localStorage.getItem(key),
      setItem: async (key: string, value: string) => {
        window.localStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        window.localStorage.removeItem(key);
      },
    };
  }
  return getNativeAsyncStorage() ?? memoryStorage();
});

function applyNativeColorScheme(preference: ThemePreference) {
  try {
    Appearance.setColorScheme(preference);
  } catch {
    // Older runtimes may not support setColorScheme
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      preference: "light",
      hydrated: false,
      setPreference: (preference) => {
        applyNativeColorScheme(preference);
        set({ preference });
      },
      toggle: () => {
        const next: ThemePreference =
          get().preference === "dark" ? "light" : "dark";
        applyNativeColorScheme(next);
        set({ preference: next });
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "grove-theme",
      storage: themeStoreStorage,
      partialize: (state) => ({ preference: state.preference }),
      onRehydrateStorage: () => (state) => {
        if (state?.preference) {
          applyNativeColorScheme(state.preference);
        }
        useThemeStore.getState().setHydrated(true);
      },
    },
  ),
);
