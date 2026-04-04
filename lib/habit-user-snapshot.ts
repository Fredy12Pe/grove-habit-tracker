import { Platform } from "react-native";

import type {
  CompletionDatesByHabit,
  HabitEntriesByHabit,
} from "@/lib/store/useHabitStore";
import { useHabitStore } from "@/lib/store/useHabitStore";
import type { Habit } from "@/lib/types";

const PER_USER_KEY = (userId: string) => `grove.habits.user.${userId}`;
const META_KEY = "grove.habits.meta";

type HabitMeta = {
  /** Last user id we treated as “current” for habit sync (survives app restarts). */
  activeUserId: string | null;
};

type HabitPersistSlice = {
  habits: Habit[];
  completionDates: CompletionDatesByHabit;
  habitEntries: HabitEntriesByHabit;
  lastResetDate: string | null;
};

function getAsyncStorage(): {
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
} | null {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return {
      getItem: async (k) => window.localStorage.getItem(k),
      setItem: async (k, v) => {
        window.localStorage.setItem(k, v);
      },
    };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-async-storage/async-storage") as {
      default?: {
        getItem: (k: string) => Promise<string | null>;
        setItem: (k: string, v: string) => Promise<void>;
      };
    };
    if (mod?.default) return mod.default;
  } catch {
    /* ignore */
  }
  return null;
}

async function readHabitMeta(): Promise<HabitMeta> {
  const storage = getAsyncStorage();
  if (!storage) return { activeUserId: null };
  try {
    const raw = await storage.getItem(META_KEY);
    if (!raw) return { activeUserId: null };
    const o = JSON.parse(raw) as Partial<HabitMeta>;
    return {
      activeUserId:
        typeof o.activeUserId === "string" ? o.activeUserId : null,
    };
  } catch {
    return { activeUserId: null };
  }
}

export async function writeHabitMeta(activeUserId: string | null): Promise<void> {
  const storage = getAsyncStorage();
  if (!storage) return;
  try {
    await storage.setItem(
      META_KEY,
      JSON.stringify({ activeUserId } as HabitMeta),
    );
  } catch (e) {
    console.warn("[habits] write meta:", e);
  }
}

/** Wait until zustand has applied `grove.habits.v1` from disk (avoids clobbering with defaults). */
export function waitForHabitStoreHydration(): Promise<void> {
  if (useHabitStore.persist.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = useHabitStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

export async function saveHabitSnapshotForUser(userId: string): Promise<void> {
  const storage = getAsyncStorage();
  if (!storage) return;
  const s = useHabitStore.getState();
  const slice: HabitPersistSlice = {
    habits: s.habits,
    completionDates: s.completionDates,
    habitEntries: s.habitEntries,
    lastResetDate: s.lastResetDate,
  };
  try {
    await storage.setItem(PER_USER_KEY(userId), JSON.stringify(slice));
  } catch (e) {
    console.warn("[habits] save snapshot:", e);
  }
}

/** Returns true if a saved snapshot was applied. */
export async function loadHabitSnapshotForUser(
  userId: string,
): Promise<boolean> {
  const storage = getAsyncStorage();
  if (!storage) return false;
  let raw: string | null;
  try {
    raw = await storage.getItem(PER_USER_KEY(userId));
  } catch (e) {
    console.warn("[habits] load snapshot:", e);
    return false;
  }
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as Partial<HabitPersistSlice>;
    if (!Array.isArray(data.habits)) return false;
    useHabitStore.setState({
      habits: data.habits,
      completionDates: data.completionDates ?? {},
      habitEntries: data.habitEntries ?? {},
      lastResetDate: data.lastResetDate ?? null,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Restore habits after sign-out → sign-in, or load a different account’s snapshot.
 * Does **not** replace rehydrated `grove.habits.v1` when the same user resumes a session (cold start);
 * the caller should handle that with `shouldTrustRehydratedV1`.
 */
export async function syncHabitsWithAuthUser(options: {
  previousUserId: string | null;
  nextUserId: string | null;
}): Promise<void> {
  const { previousUserId, nextUserId } = options;
  await waitForHabitStoreHydration();

  const meta = await readHabitMeta();

  if (nextUserId && nextUserId !== previousUserId) {
    if (previousUserId) {
      await saveHabitSnapshotForUser(previousUserId);
    }

    const sameUserColdStart =
      previousUserId === null && meta.activeUserId === nextUserId;

    if (sameUserColdStart) {
      await saveHabitSnapshotForUser(nextUserId);
      await writeHabitMeta(nextUserId);
      return;
    }

    const loaded = await loadHabitSnapshotForUser(nextUserId);
    if (!loaded) {
      if (previousUserId !== null) {
        useHabitStore.getState().resetHabitsForNewAccount();
      } else {
        await saveHabitSnapshotForUser(nextUserId);
      }
    }
    await writeHabitMeta(nextUserId);
    return;
  }

  if (!nextUserId && previousUserId !== null) {
    await saveHabitSnapshotForUser(previousUserId);
    useHabitStore.getState().resetHabitsForNewAccount();
    await writeHabitMeta(null);
  }
}
