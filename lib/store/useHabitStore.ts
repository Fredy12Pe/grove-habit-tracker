import { create } from 'zustand';
import type { Habit, PlantGrowthState } from '@/lib/types';
import { HABIT_CATALOG, CATALOG_NAME_MAP } from '@/lib/habitCatalog';

interface HabitStore {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  completeHabit: (id: string) => void;
  toggleHabit: (id: string) => void;
  setGrowthState: (habitId: string, state: PlantGrowthState) => void;
  removeHabit: (id: string) => void;
  syncHabits: (selectedIds: string[]) => void;
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

export const useHabitStore = create<HabitStore>((set) => ({
  habits: DEFAULT_HABITS,

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
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, completedToday: !h.completedToday, updatedAt: new Date().toISOString() } : h
      ),
    })),

  completeHabit: (id) =>
    set((state) => ({
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
    })),

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
}));
