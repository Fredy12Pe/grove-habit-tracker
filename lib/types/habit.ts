/**
 * Habit and plant growth types for Grove.
 */

export type PlantGrowthState = 'seed' | 'sprout' | 'bloom' | 'wilt';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

/** Section label when the user adds a habit via the custom flow (matches habit catalog sections). */
export type HabitCustomCategory = 'Faith' | 'Fitness' | 'Well Being';

/** Inline tracking mode for user-created habits (maps to HabitWithActions types). */
export type HabitCustomTracking = 'toggle' | 'counter' | 'timer' | 'input';

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
  /** Catalog habit id whose icon asset to show (only for non-catalog habit ids). */
  customIconCatalogId?: string;
  customTracking?: HabitCustomTracking;
  customCategory?: HabitCustomCategory;
}

export interface HabitCompletion {
  habitId: string;
  completedAt: string;
}

export interface CustomHabitPayload {
  name: string;
  customIconCatalogId: string;
  customTracking: HabitCustomTracking;
  customCategory: HabitCustomCategory;
}
