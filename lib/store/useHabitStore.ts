import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Platform } from 'react-native';
import type { Habit, PlantGrowthState } from '@/lib/types';
import { calendarDateKey } from '@/lib/calendarDate';
import { CATALOG_ID_SET, HABIT_CATALOG, CATALOG_NAME_MAP } from '@/lib/habitCatalog';

/** ISO date string (YYYY-MM-DD) per habit for progress heatmaps */
export type CompletionDatesByHabit = Record<string, string[]>;

/** Optional payload when completing a habit (journal, note, duration, count). */
export interface HabitEntry {
  journalText?: string;
  note?: string;
  durationMinutes?: number;
  count?: number;
}

/** habitId -> date -> HabitEntry */
export type HabitEntriesByHabit = Record<string, Record<string, HabitEntry>>;

interface HabitStore {
  habits: Habit[];
  completionDates: CompletionDatesByHabit;
  /** Action payloads per habit per date (journal text, note, duration, count). */
  habitEntries: HabitEntriesByHabit;
  lastResetDate: string | null;
  /** Replace the current habits list (used for onboarding preview restore). */
  setHabits: (habits: Habit[]) => void;
  /** Apply an explicit ordered list of habit ids (catalog and custom). */
  applySelectedHabits: (selectedIds: string[]) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'plantId'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  completeHabit: (id: string) => void;
  toggleHabit: (id: string) => void;
  setGrowthState: (habitId: string, state: PlantGrowthState) => void;
  removeHabit: (id: string) => void;
  syncHabits: (selectedIds: string[]) => void;
  recordCompletion: (habitId: string, date: string) => void;
  ensureDayReset: () => void;
  /** Set action payload for a habit on a date (merge with existing). */
  setHabitEntry: (habitId: string, date: string, entry: Partial<HabitEntry>) => void;
  /** Get entry for habit on date. */
  getHabitEntry: (habitId: string, date: string) => HabitEntry | undefined;
}

const MAX_ACTIVE_HABITS = 8;

const makeHabit = (id: string, streakCount = 0, completedToday = false): Habit => ({
  id,
  name: CATALOG_NAME_MAP[id] ?? id,
  completedToday,
  streakCount,
  frequency: 'daily',
  plantId: id,
  growthState: 'seed',
  createdAt: '',
  updatedAt: '',
});

const DEFAULT_HABITS: Habit[] = [
  { ...makeHabit('pray',     12, true)  },
  { ...makeHabit('journal',   5, true)  },
  { ...makeHabit('meditate',  3, false) },
  { ...makeHabit('exercise',  4, false) },
  { ...makeHabit('stretch',   9, false) },
];

const todayStr = () => calendarDateKey();

function getNativeAsyncStorage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage') as {
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

const habitStoreStorage = createJSONStorage(() => {
  if (Platform.OS === 'web') {
    return window.localStorage;
  }
  const native = getNativeAsyncStorage();
  if (!native) {
    // In-memory fallback (dev only). Avoids crashing if AsyncStorage is unavailable.
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
  return native;
});

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: DEFAULT_HABITS,
      completionDates: {},
      habitEntries: {},
      lastResetDate: null,

  setHabits: (habits) => set(() => ({ habits })),

  applySelectedHabits: (selectedIds) =>
    set((state) => {
      const existing = new Map(state.habits.map((h) => [h.id, h]));
      const next: Habit[] = [];
      for (const id of selectedIds) {
        const isCatalog = CATALOG_ID_SET.has(id);
        const h = existing.get(id);
        if (h) {
          next.push(h);
        } else if (isCatalog) {
          next.push(makeHabit(id));
        }
      }
      return { habits: next };
    }),

  addHabit: (habit) =>
    set((state) => {
      if (state.habits.length >= MAX_ACTIVE_HABITS) {
        return state;
      }
      const now = new Date().toISOString();
      const id = `habit_${Date.now()}`;
      const newHabit: Habit = {
        ...habit,
        id,
        plantId: id,
        createdAt: now,
        updatedAt: now,
      };
      return { habits: [...state.habits, newHabit] };
    }),

  updateHabit: (id, updates) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
      ),
    })),

  toggleHabit: (id) =>
    set((state) => {
      const today = todayStr();
      const h = state.habits.find((x) => x.id === id);
      const nextCompleted = h ? !h.completedToday : false;
      const dates = state.completionDates[id] ?? [];
      const nextDates = nextCompleted
        ? dates.includes(today) ? dates : [...dates, today]
        : dates.filter((d) => d !== today);
      return {
        habits: state.habits.map((h) =>
          h.id === id ? { ...h, completedToday: nextCompleted, updatedAt: new Date().toISOString() } : h
        ),
        completionDates: { ...state.completionDates, [id]: nextDates },
      };
    }),

  recordCompletion: (habitId, date) =>
    set((state) => {
      const dates = state.completionDates[habitId] ?? [];
      if (dates.includes(date)) return state;
      return {
        completionDates: {
          ...state.completionDates,
          [habitId]: [...dates, date].sort(),
        },
      };
    }),

  completeHabit: (id) =>
    set((state) => {
      const today = todayStr();
      const dates = state.completionDates[id] ?? [];
      const nextDates = dates.includes(today) ? dates : [...dates, today];
      return {
        habits: state.habits.map((h) =>
          h.id === id
            ? {
                ...h,
                completedToday: true,
                streakCount: h.streakCount + 1,
                updatedAt: new Date().toISOString(),
              }
            : h
        ),
        completionDates: { ...state.completionDates, [id]: nextDates },
      };
    }),

  setGrowthState: (habitId, growthState) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId ? { ...h, growthState, updatedAt: new Date().toISOString() } : h
      ),
    })),

  removeHabit: (id) =>
    set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })),

  syncHabits: (selectedIds) =>
    set((state) => {
      const existing = new Map(state.habits.map((h) => [h.id, h]));
      const catalogOrdered = HABIT_CATALOG.filter((c) =>
        selectedIds.includes(c.id),
      ).map((c) => existing.get(c.id) ?? makeHabit(c.id));
      const custom = state.habits.filter((h) => !CATALOG_ID_SET.has(h.id));
      const remainingSlots = Math.max(0, MAX_ACTIVE_HABITS - catalogOrdered.length);
      return { habits: [...catalogOrdered, ...custom.slice(0, remainingSlots)] };
    }),

  ensureDayReset: () =>
    set((state) => {
      const today = todayStr();
      if (state.lastResetDate === today) return state;
      return {
        lastResetDate: today,
        habits: state.habits.map((h) => ({ ...h, completedToday: false })),
      };
    }),

  setHabitEntry: (habitId, date, entry) =>
    set((state) => {
      const byDate = state.habitEntries[habitId] ?? {};
      const existing = byDate[date] ?? {};
      return {
        habitEntries: {
          ...state.habitEntries,
          [habitId]: {
            ...byDate,
            [date]: { ...existing, ...entry },
          },
        },
      };
    }),

  getHabitEntry: (habitId, date) => {
    const byDate = get().habitEntries[habitId];
    return byDate?.[date];
  },
    }),
    {
      name: 'grove.habits.v1',
      storage: habitStoreStorage,
      partialize: (state) => ({
        habits: state.habits,
        completionDates: state.completionDates,
        habitEntries: state.habitEntries,
        lastResetDate: state.lastResetDate,
      }),
    },
  ),
);
