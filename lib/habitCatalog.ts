export interface CatalogHabit {
  id: string;
  name: string;
  icon: number;
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
      { id: 'read-scripture',     name: 'Read Scripture',     icon: require('@/assets/habits/HabitIcons/Read Scripture.png') },
      { id: 'journal',            name: 'Journal',            icon: require('@/assets/habits/HabitIcons/Journal.png') },
      { id: 'meditate',           name: 'Meditate',           icon: require('@/assets/habits/HabitIcons/Meditate.png') },
      { id: 'practice-gratitude', name: 'Practice Gratitude', icon: require('@/assets/habits/HabitIcons/Practice Gratitude.png') },
    ],
  },
  {
    title: 'Fitness',
    habits: [
      { id: 'drink-water',  name: 'Drink Water',      icon: require('@/assets/habits/HabitIcons/Drink Water.png') },
      { id: 'exercise',     name: 'Exercise',          icon: require('@/assets/habits/HabitIcons/Exercise.png') },
      { id: 'stretch',      name: 'Stretch',           icon: require('@/assets/habits/HabitIcons/Stretch.png') },
      { id: 'sleep',        name: 'Sleep 7+ Hours',    icon: require('@/assets/habits/HabitIcons/Sleep 7+ Hours.png') },
      { id: 'eat-healthy',  name: 'Eat Healthy',       icon: require('@/assets/habits/HabitIcons/Eat Healthy.png') },
    ],
  },
  {
    title: 'Well Being',
    habits: [
      { id: 'read-book',       name: 'Read a Book',       icon: require('@/assets/habits/HabitIcons/Read a Book.png') },
      { id: 'study',           name: 'Study / Learn',     icon: require('@/assets/habits/HabitIcons/StudyLearn.png') },
      { id: 'limit-screen',    name: 'Limit Screen Time', icon: require('@/assets/habits/HabitIcons/Limit Screen Time.png') },
      { id: 'avoid-alcohol',   name: 'Avoid Alcohol',     icon: require('@/assets/habits/HabitIcons/Avoid Alcohol.png') },
      { id: 'avoid-porn',      name: 'Avoid Pornography', icon: require('@/assets/habits/HabitIcons/Avoid Pornography.png') },
      { id: 'no-social-media', name: 'No Social Media',   icon: require('@/assets/habits/HabitIcons/No Social Media.png') },
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
