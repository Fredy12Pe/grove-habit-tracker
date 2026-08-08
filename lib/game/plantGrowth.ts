/**
 * Derives each habit's plant growth stage from its completion history so the
 * garden visually reflects momentum: freshly started habits are seeds,
 * habits gaining steam this week sprout, a fully completed week blooms, and
 * a habit that goes quiet after being active starts to wilt.
 */
import { addCalendarDays, calendarDateKey, parseDateKeyLocal, startOfWeekSunday } from '@/lib/calendarDate';
import type { PlantGrowthState } from '@/lib/types';
import { FRAMES_PER_PLANT } from '@/lib/game/plantSprites';
import type { CompletionDatesByHabit } from '@/lib/store/useHabitStore';

/** Number of completions this week (Sun–Sat) needed before a plant is considered fully bloomed. */
const BLOOM_THRESHOLD = FRAMES_PER_PLANT - 1;

export function computeGrowthState(
  habit: { id: string; completedToday: boolean },
  completionDates: CompletionDatesByHabit,
  today: string = calendarDateKey(),
): PlantGrowthState {
  const dates = completionDates[habit.id] ?? [];
  const hasAnyHistory = dates.length > 0 || habit.completedToday;
  const completedToday = habit.completedToday || dates.includes(today);

  const todayDate = parseDateKeyLocal(today);
  const yesterday = calendarDateKey(addCalendarDays(todayDate, -1));
  const missedYesterday = !completedToday && !dates.includes(yesterday);

  // A habit that has grown before but has now gone two days without love starts to wilt.
  if (hasAnyHistory && missedYesterday) {
    return 'wilt';
  }

  const weekStart = calendarDateKey(startOfWeekSunday(todayDate));
  const weekEnd = calendarDateKey(addCalendarDays(startOfWeekSunday(todayDate), 6));
  const weekCount =
    dates.filter((d) => d >= weekStart && d <= weekEnd && d !== today).length +
    (completedToday ? 1 : 0);

  if (weekCount >= BLOOM_THRESHOLD) return 'bloom';
  if (weekCount > 0) return 'sprout';
  return 'seed';
}
