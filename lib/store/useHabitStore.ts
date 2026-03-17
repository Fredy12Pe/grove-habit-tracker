import { create } from 'zustand';
import type { Habit, PlantGrowthState } from '@/lib/types';
import { HABIT_CATALOG, CATALOG_NAME_MAP } from '@/lib/habitCatalog';

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
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void;
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

const todayStr = () => new Date().toISOString().slice(0, 10);

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: DEFAULT_HABITS,
  completionDates: {},
  habitEntries: {},
  lastResetDate: null,

  addHabit: (habit) =>
    set((state) => {
      const now = new Date().toISOString();
      const newHabit: Habit = {
        ...habit,
        id: `habit_${Date.now()}`,
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
      const ordered = HABIT_CATALOG.filter((c) => selectedIds.includes(c.id));
      return {
        habits: ordered.map((c) => existing.get(c.id) ?? makeHabit(c.id)),
      };
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
}));
