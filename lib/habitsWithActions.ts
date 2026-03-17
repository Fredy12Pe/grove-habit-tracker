/**
 * Habit-with-actions data model: types, initial data, and helpers.
 * Used by All habits tab (dropdown form).
 */

export type HabitCategory = "Faith" | "Fitness" | "Well Being";

export type HabitInteractionType = "toggle" | "counter" | "timer" | "input" | "scheduled";

export interface HabitBase {
  id: string;
  name: string;
  category: HabitCategory;
  emoji: string;
  streak: number;
  completedToday: boolean;
  type: HabitInteractionType;
}

export interface ToggleSetup {
  reminder?: boolean;
}

export interface CounterSetup {
  goal: number;
  unit?: string;
}

export interface TimerSetup {
  durationMinutes: number;
}

export interface InputSetup {
  minLength?: number;
  promptEnabled?: boolean;
  gratitudeCount?: number;
}

export interface ScheduledSetup {
  goalHours?: number;
  maxHours?: number;
}

export type HabitSetup =
  | ToggleSetup
  | CounterSetup
  | TimerSetup
  | InputSetup
  | ScheduledSetup;

export interface ToggleProgress {
  confirmed: boolean;
}

export interface CounterProgress {
  current: number;
}

export interface TimerProgress {
  completed: boolean;
  secondsRemaining: number;
  isRunning: boolean;
}

export interface InputProgress {
  text: string;
  gratitudeItems?: string[];
}

export interface ScheduledProgress {
  value: number;
}

export type HabitProgress =
  | ToggleProgress
  | CounterProgress
  | TimerProgress
  | InputProgress
  | ScheduledProgress;

export interface HabitWithActions extends HabitBase {
  setup: HabitSetup;
  progress: HabitProgress;
}

const habitsList: HabitWithActions[] = [
  {
    id: "pray",
    name: "Pray",
    category: "Faith",
    emoji: "🙏",
    streak: 12,
    completedToday: false,
    type: "timer",
    setup: { durationMinutes: 10 },
    progress: { completed: false, secondsRemaining: 10 * 60, isRunning: false },
  },
  {
    id: "read-scripture",
    name: "Read Scripture",
    category: "Faith",
    emoji: "📖",
    streak: 0,
    completedToday: false,
    type: "timer",
    setup: { durationMinutes: 10 },
    progress: { completed: false, secondsRemaining: 10 * 60, isRunning: false },
  },
  {
    id: "journal",
    name: "Journal",
    category: "Faith",
    emoji: "📝",
    streak: 5,
    completedToday: false,
    type: "input",
    setup: { minLength: 10, promptEnabled: false },
    progress: { text: "" },
  },
  {
    id: "meditate",
    name: "Meditate",
    category: "Faith",
    emoji: "🧘",
    streak: 3,
    completedToday: false,
    type: "timer",
    setup: { durationMinutes: 5 },
    progress: { completed: false, secondsRemaining: 5 * 60, isRunning: false },
  },
  {
    id: "practice-gratitude",
    name: "Practice Gratitude",
    category: "Faith",
    emoji: "💚",
    streak: 0,
    completedToday: false,
    type: "input",
    setup: { gratitudeCount: 3 },
    progress: { text: "", gratitudeItems: ["", "", ""] },
  },
  {
    id: "drink-water",
    name: "Drink Water",
    category: "Fitness",
    emoji: "💧",
    streak: 0,
    completedToday: false,
    type: "counter",
    setup: { goal: 8, unit: "glasses" },
    progress: { current: 0 },
  },
  {
    id: "exercise",
    name: "Exercise",
    category: "Fitness",
    emoji: "💪",
    streak: 4,
    completedToday: false,
    type: "timer",
    setup: { durationMinutes: 30 },
    progress: { completed: false, secondsRemaining: 30 * 60, isRunning: false },
  },
  {
    id: "stretch",
    name: "Stretch",
    category: "Fitness",
    emoji: "🤸",
    streak: 9,
    completedToday: false,
    type: "timer",
    setup: { durationMinutes: 10 },
    progress: { completed: false, secondsRemaining: 10 * 60, isRunning: false },
  },
  {
    id: "sleep",
    name: "Sleep 7+ Hours",
    category: "Fitness",
    emoji: "😴",
    streak: 0,
    completedToday: false,
    type: "scheduled",
    setup: { goalHours: 7 },
    progress: { value: 0 },
  },
  {
    id: "eat-healthy",
    name: "Eat Healthy",
    category: "Fitness",
    emoji: "🥗",
    streak: 0,
    completedToday: false,
    type: "counter",
    setup: { goal: 2, unit: "meals" },
    progress: { current: 0 },
  },
  {
    id: "read-book",
    name: "Read a Book",
    category: "Well Being",
    emoji: "📚",
    streak: 0,
    completedToday: false,
    type: "counter",
    setup: { goal: 20, unit: "pages" },
    progress: { current: 0 },
  },
  {
    id: "study",
    name: "Study / Learn",
    category: "Well Being",
    emoji: "✏️",
    streak: 0,
    completedToday: false,
    type: "timer",
    setup: { durationMinutes: 25 },
    progress: { completed: false, secondsRemaining: 25 * 60, isRunning: false },
  },
  {
    id: "limit-screen",
    name: "Limit Screen Time",
    category: "Well Being",
    emoji: "📵",
    streak: 0,
    completedToday: false,
    type: "scheduled",
    setup: { maxHours: 2 },
    progress: { value: 0 },
  },
  {
    id: "avoid-alcohol",
    name: "Avoid Alcohol",
    category: "Well Being",
    emoji: "🍃",
    streak: 0,
    completedToday: false,
    type: "toggle",
    setup: {},
    progress: { confirmed: false },
  },
  {
    id: "avoid-porn",
    name: "Avoid Pornography",
    category: "Well Being",
    emoji: "🛡️",
    streak: 0,
    completedToday: false,
    type: "toggle",
    setup: {},
    progress: { confirmed: false },
  },
  {
    id: "no-social-media",
    name: "No Social Media",
    category: "Well Being",
    emoji: "🌿",
    streak: 0,
    completedToday: false,
    type: "toggle",
    setup: {},
    progress: { confirmed: false },
  },
];

export const INITIAL_HABITS_WITH_ACTIONS: HabitWithActions[] = habitsList.map((h) => ({
  ...h,
  progress: { ...(h.progress as object) } as HabitProgress,
}));

export const CATEGORY_ORDER: HabitCategory[] = ["Faith", "Fitness", "Well Being"];

export function getProgressSummary(habit: HabitWithActions): string {
  switch (habit.type) {
    case "counter": {
      const p = habit.progress as CounterProgress;
      const s = habit.setup as CounterSetup;
      return `${p.current} / ${s.goal} ${s.unit ?? ""}`.trim();
    }
    case "timer": {
      const p = habit.progress as TimerProgress;
      if (p.completed) return "Done";
      const s = habit.setup as TimerSetup;
      return p.isRunning
        ? `${Math.ceil(p.secondsRemaining / 60)} min left`
        : `${s.durationMinutes} min`;
    }
    case "scheduled": {
      const p = habit.progress as ScheduledProgress;
      const s = habit.setup as ScheduledSetup;
      if (s.goalHours != null) return `Slept: ${p.value} h (goal ${s.goalHours})`;
      if (s.maxHours != null) return `Screen time: ${p.value} h (max ${s.maxHours})`;
      return `${p.value} h`;
    }
    case "input": {
      const p = habit.progress as InputProgress;
      if (habit.id === "practice-gratitude") {
        const filled = (p.gratitudeItems ?? []).filter((t) => t.trim().length > 0).length;
        const s = habit.setup as InputSetup;
        return `${filled} / ${s.gratitudeCount ?? 3} items`;
      }
      return p.text.length > 0 ? `${p.text.length} chars` : "Write something";
    }
    case "toggle":
      return "";
  }
}

export function isHabitComplete(habit: HabitWithActions): boolean {
  switch (habit.type) {
    case "toggle":
      return (habit.progress as ToggleProgress).confirmed;
    case "counter": {
      const p = habit.progress as CounterProgress;
      const s = habit.setup as CounterSetup;
      return p.current >= s.goal;
    }
    case "timer":
      return (habit.progress as TimerProgress).completed;
    case "input": {
      const p = habit.progress as InputProgress;
      if (habit.id === "practice-gratitude") {
        const s = habit.setup as InputSetup;
        const items = p.gratitudeItems ?? [];
        const required = s.gratitudeCount ?? 3;
        return items.filter((t) => t.trim().length > 0).length >= required;
      }
      const s = habit.setup as InputSetup;
      return p.text.trim().length >= (s.minLength ?? 10);
    }
    case "scheduled": {
      const p = habit.progress as ScheduledProgress;
      const s = habit.setup as ScheduledSetup;
      if (s.goalHours != null) return p.value >= s.goalHours;
      if (s.maxHours != null) return p.value <= s.maxHours;
      return false;
    }
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
