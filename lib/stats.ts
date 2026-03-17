/**
 * Shared helpers for growth/stats used by Profile and Progress.
 */

const dateStr = (d: Date) => d.toISOString().slice(0, 10);

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

/** All-time longest run of consecutive days with at least one completion. */
export function getBestStreak(
  completionDates: Record<string, string[]>,
  habits: { id: string; completedToday: boolean }[],
  today: string
): number {
  const active = getActiveDates(completionDates, habits, today);
  const sorted = [...active].sort();
  if (sorted.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]).getTime();
    const curr = new Date(sorted[i]).getTime();
    const diffDays = (curr - prev) / (24 * 60 * 60 * 1000);
    if (diffDays === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
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
    const d = new Date(year, month, day);
    if (active.has(dateStr(d))) count += 1;
  }
  return count;
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
