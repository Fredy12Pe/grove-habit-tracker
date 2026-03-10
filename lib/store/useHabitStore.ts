import { create } from 'zustand';
import type { Habit, PlantGrowthState } from '@/lib/types';

interface HabitStore {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  completeHabit: (id: string) => void;
  setGrowthState: (habitId: string, state: PlantGrowthState) => void;
  removeHabit: (id: string) => void;
}

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],

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
}));
