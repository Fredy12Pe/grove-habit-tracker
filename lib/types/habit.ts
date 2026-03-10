/**
 * Habit and plant growth types for Grove.
 */

export type PlantGrowthState = 'seed' | 'sprout' | 'bloom' | 'wilt';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  plantId: string;
  growthState: PlantGrowthState;
  completedToday: boolean;
  streakCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  habitId: string;
  completedAt: string;
}
