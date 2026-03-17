export type HabitActionType =
  | 'journal'      // Multiline text (Journal)
  | 'note'         // Optional short note (Pray, Read Scripture, Gratitude)
  | 'duration'     // Minutes picker (Meditate, Exercise, Stretch, Read, Study)
  | 'count'        // Number 1–N (Drink Water)
  | 'checkbox_only'; // Just mark done (Sleep, Eat Healthy, Avoids, etc.)

export interface CatalogHabit {
  id: string;
  name: string;
  icon: number;
}

/** Which action UI to show when user taps the card dropdown. */
export const HABIT_ACTION_MAP: Record<string, HabitActionType> = {
  // Faith
  pray: 'note',
  'read-scripture': 'note',
  journal: 'journal',
  meditate: 'duration',
  'practice-gratitude': 'note',
  // Fitness
  'drink-water': 'count',
  exercise: 'duration',
  stretch: 'duration',
  sleep: 'checkbox_only',
  'eat-healthy': 'checkbox_only',
  // Well Being
  'read-book': 'duration',
  study: 'duration',
  'limit-screen': 'checkbox_only',
  'avoid-alcohol': 'checkbox_only',
  'avoid-porn': 'checkbox_only',
  'no-social-media': 'checkbox_only',
};

/** Duration presets (minutes) per habit id. Default used when not listed. */
export const HABIT_DURATION_OPTIONS: Record<string, number[]> = {
  meditate: [5, 10, 15, 20],
  exercise: [10, 20, 30, 45, 60],
  stretch: [5, 10, 15, 20],
  'read-book': [15, 30, 45, 60],
  study: [15, 30, 45, 60, 90],
};

export const DEFAULT_DURATION_OPTIONS = [5, 10, 15, 20, 30];

export function getHabitActionType(habitId: string): HabitActionType {
  return HABIT_ACTION_MAP[habitId] ?? 'checkbox_only';
}

export function getDurationOptions(habitId: string): number[] {
  return HABIT_DURATION_OPTIONS[habitId] ?? DEFAULT_DURATION_OPTIONS;
}

export interface CatalogSection {
  title: string;
  habits: CatalogHabit[];
}

export const HABIT_SECTIONS: CatalogSection[] = [
  {
    title: 'Faith',
    habits: [
      { id: 'pray',               name: 'Pray',               icon: require('@/assets/habits/HabitIcons/Pray.png') },
      { id: 'read-scripture',     name: 'Read Scripture',     icon: require('@/assets/habits/HabitIcons/ReadScripture.png') },
      { id: 'journal',            name: 'Journal',            icon: require('@/assets/habits/HabitIcons/Journal.png') },
      { id: 'meditate',           name: 'Meditate',           icon: require('@/assets/habits/HabitIcons/Meditate.png') },
      { id: 'practice-gratitude', name: 'Practice Gratitude', icon: require('@/assets/habits/HabitIcons/PracticeGratitude.png') },
    ],
  },
  {
    title: 'Fitness',
    habits: [
      { id: 'drink-water',  name: 'Drink Water',   icon: require('@/assets/habits/HabitIcons/DrinkWater.png') },
      { id: 'exercise',     name: 'Exercise',       icon: require('@/assets/habits/HabitIcons/Exercise.png') },
      { id: 'stretch',      name: 'Stretch',        icon: require('@/assets/habits/HabitIcons/Stretch.png') },
      { id: 'sleep',        name: 'Sleep 7+ Hours', icon: require('@/assets/habits/HabitIcons/Sleep7Hours.png') },
      { id: 'eat-healthy',  name: 'Eat Healthy',    icon: require('@/assets/habits/HabitIcons/EatHealthy.png') },
    ],
  },
  {
    title: 'Well Being',
    habits: [
      { id: 'read-book',       name: 'Read a Book',       icon: require('@/assets/habits/HabitIcons/ReadABook.png') },
      { id: 'study',           name: 'Study / Learn',     icon: require('@/assets/habits/HabitIcons/StudyLearn.png') },
      { id: 'limit-screen',    name: 'Limit Screen Time', icon: require('@/assets/habits/HabitIcons/LimitScreenTime.png') },
      { id: 'avoid-alcohol',   name: 'Avoid Alcohol',     icon: require('@/assets/habits/HabitIcons/AvoidAlcohol.png') },
      { id: 'avoid-porn',      name: 'Avoid Pornography', icon: require('@/assets/habits/HabitIcons/AvoidPornography.png') },
      { id: 'no-social-media', name: 'No Social Media',   icon: require('@/assets/habits/HabitIcons/NoSocialMedia.png') },
    ],
  },
];

export const HABIT_CATALOG = HABIT_SECTIONS.flatMap((s) => s.habits);

export const CATALOG_ICON_MAP: Record<string, number> = Object.fromEntries(
  HABIT_CATALOG.map((h) => [h.id, h.icon])
);

export const CATALOG_NAME_MAP: Record<string, string> = Object.fromEntries(
  HABIT_CATALOG.map((h) => [h.id, h.name])
);
