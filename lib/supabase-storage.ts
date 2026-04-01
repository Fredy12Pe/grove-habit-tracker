import { Platform } from 'react-native';

/**
 * Supabase Auth storage adapter.
 * - **Native:** `@react-native-async-storage/async-storage` (lazy `require`).
 * - **Web:** `localStorage`.
 * - **Fallback:** in-memory map if native module is missing (never pass `undefined` to Supabase).
 */
const webStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') return Promise.resolve(null);
    return Promise.resolve(window.localStorage.getItem(key));
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return Promise.resolve();
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') return Promise.resolve();
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const memory = new Map<string, string>();
const memoryStorage = {
  getItem(key: string) {
    return Promise.resolve(memory.get(key) ?? null);
  },
  setItem(key: string, value: string) {
    memory.set(key, value);
    return Promise.resolve();
  },
  removeItem(key: string) {
    memory.delete(key);
    return Promise.resolve();
  },
};

function getNativeAsyncStorage(): typeof webStorage {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage') as {
      default?: typeof webStorage;
    };
    if (mod?.default) {
      return mod.default;
    }
  } catch {
    // ignore
  }
  return memoryStorage;
}

export const supabaseAuthStorage: typeof webStorage =
  Platform.OS === 'web' ? webStorage : getNativeAsyncStorage();
