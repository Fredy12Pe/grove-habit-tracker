/**
 * Local calendar YYYY-MM-DD — matches how users think about "today" and month grids.
 * Prefer this over `toISOString().slice(0, 10)` for stored completion keys.
 */
export function calendarDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD as local calendar date (noon avoids DST edge cases). */
export function parseDateKeyLocal(key: string): Date {
  const [ys, ms, ds] = key.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Sunday (0) start, local calendar, noon anchor to avoid DST glitches. */
export function startOfWeekSunday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export function addCalendarDays(d: Date, days: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  x.setDate(x.getDate() + days);
  return x;
}

/** Local calendar “today” at noon (stable for week boundaries). */
export function calendarTodayDate(): Date {
  return parseDateKeyLocal(calendarDateKey());
}

/**
 * Monday-start week containing `d` (local calendar), noon anchor.
 * Mon … Sun — typical “this week” for scheduling UIs.
 */
export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  const day = x.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + delta);
  return x;
}
