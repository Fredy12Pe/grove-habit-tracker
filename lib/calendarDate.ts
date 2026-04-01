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
