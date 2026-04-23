/**
 * Shared helpers for growth/stats used by Profile and Progress.
 */

import { calendarDateKey, parseDateKeyLocal } from "@/lib/calendarDate";

function isHabitCompleteOnDate(
  h: { id: string; completedToday: boolean },
  completionDates: Record<string, string[]>,
  dayKey: string,
  today: string,
): boolean {
  const dates = completionDates[h.id] ?? [];
  if (dates.includes(dayKey)) return true;
  if (dayKey === today && h.completedToday) return true;
  return false;
}

/** True when every current habit is completed on this calendar day. */
function isAllHabitsCompleteOnDate(
  completionDates: Record<string, string[]>,
  habits: { id: string; completedToday: boolean }[],
  dayKey: string,
  today: string,
): boolean {
  if (habits.length === 0) return false;
  return habits.every((h) =>
    isHabitCompleteOnDate(h, completionDates, dayKey, today),
  );
}

/** All dates (YYYY-MM-DD) where the user completed at least one habit. */
export function getActiveDates(
  completionDates: Record<string, string[]>,
  habits: { id: string; completedToday: boolean }[],
  today: string
): Set<string> {
  const set = new Set<string>();
  for (const h of habits) {
    const dates = completionDates[h.id] ?? [];
    dates.forEach((d) => set.add(d));
    if (h.completedToday) set.add(today);
  }
  return set;
}

/**
 * Consecutive days ending today where every current habit was completed
 * (0 if today is not a “perfect” day, or if there are no habits).
 */
export function getCurrentStreak(
  completionDates: Record<string, string[]>,
  habits: { id: string; completedToday: boolean }[],
  today: string,
): number {
  if (!isAllHabitsCompleteOnDate(completionDates, habits, today, today)) {
    return 0;
  }
  let streak = 0;
  const t = parseDateKeyLocal(today);
  while (true) {
    const d = calendarDateKey(t);
    if (!isAllHabitsCompleteOnDate(completionDates, habits, d, today)) break;
    streak += 1;
    t.setDate(t.getDate() - 1);
  }
  return streak;
}

/**
 * All-time longest run of consecutive “perfect” days (every current habit
 * completed) using the current habit list for every day in the range.
 */
export function getBestStreak(
  completionDates: Record<string, string[]>,
  habits: { id: string; completedToday: boolean }[],
  today: string
): number {
  if (habits.length === 0) return 0;
  let minKey: string | null = null;
  for (const h of habits) {
    for (const d of completionDates[h.id] ?? []) {
      if (minKey == null || d < minKey) minKey = d;
    }
  }
  if (minKey == null) {
    return isAllHabitsCompleteOnDate(completionDates, habits, today, today)
      ? 1
      : 0;
  }
  const start = minKey;
  const end = today;
  if (start > end) {
    return isAllHabitsCompleteOnDate(completionDates, habits, end, today)
      ? 1
      : 0;
  }
  let best = 0;
  let run = 0;
  const d = parseDateKeyLocal(start);
  const endT = parseDateKeyLocal(end).getTime();
  while (d.getTime() <= endT) {
    const key = calendarDateKey(d);
    if (isAllHabitsCompleteOnDate(completionDates, habits, key, today)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    d.setDate(d.getDate() + 1);
  }
  return best;
}

/** Unique days in the given month with at least one completion. */
export function getActiveDaysInMonth(
  completionDates: Record<string, string[]>,
  habits: { id: string; completedToday: boolean }[],
  today: string,
  year: number,
  month: number
): number {
  const active = getActiveDates(completionDates, habits, today);
  let count = 0;
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    const key = calendarDateKey(new Date(year, month, day));
    if (active.has(key)) count += 1;
  }
  return count;
}

/** Total habit-completions (checkmarks) in the given calendar month. */
export function getCompletionsInMonth(
  completionDates: Record<string, string[]>,
  habits: { id: string; completedToday: boolean }[],
  today: string,
  year: number,
  month: number
): number {
  let total = 0;
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    const d = calendarDateKey(new Date(year, month, day));
    for (const h of habits) {
      const dates = completionDates[h.id] ?? [];
      if (dates.includes(d) || (h.completedToday && d === today)) total += 1;
    }
  }
  return total;
}

/** Total habit-completions (checkmarks) all-time across all habits. */
export function getTotalCompletionsAllTime(
  completionDates: Record<string, string[]>,
  habits: { id: string; completedToday: boolean }[],
  today: string
): number {
  let total = 0;
  for (const h of habits) {
    const dates = completionDates[h.id] ?? [];
    total += dates.length;
    if (h.completedToday && !dates.includes(today)) total += 1;
  }
  return total;
}
