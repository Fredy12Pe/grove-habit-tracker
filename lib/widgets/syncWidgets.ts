import { useHabitStore } from "@/lib/store";
import { calendarDateKey } from "@/lib/calendarDate";
import { FRAMES_PER_PLANT, getPlantIndexForHabitSlot } from "@/lib/game/plantSprites";
import { pushWidgetSnapshots } from "@/lib/widgets/widgetSharedStorage";

const MAX_PLANTS = 8;

type DailyStatusWidgetProps = {
  completedCount: number;
  totalCount: number;
  title: string;
  subtitle: string;
};

type WeeklyGrowthWidgetProps = {
  completedCountToday: number;
  totalCountToday: number;
  title: string;
  subtitle: string;
  days: Array<{ iso: string; completed: boolean }>;
  plants: Array<{ habitId: string; plantIndex: number; frameIndex: number }>;
};

function mondayStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // JS: 0=Sun..6=Sat. Convert to days since Monday.
  const day = d.getDay();
  const delta = (day + 6) % 7;
  d.setDate(d.getDate() - delta);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function weekDaysMonSun(today: Date): Array<{ iso: string; date: Date }> {
  const start = mondayStart(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { iso: isoDate(d), date: d };
  });
}

function titleVariant(completed: number, total: number): { title: string; subtitle: string } {
  if (total <= 0) return { title: "Your garden is quiet", subtitle: "Start with one habit" };
  if (completed >= total) return { title: "Today's Habits", subtitle: "100% COMPLETED" };
  if (completed <= 0) return { title: "Today's Habits", subtitle: "0% COMPLETED" };
  const pct = Math.round((completed / total) * 100);
  return { title: "Today's Habits", subtitle: `${pct}% COMPLETED` };
}

/**
 * Compute current widget props from local-first habit store and push to iOS widgets.
 * Safe to call often (e.g. app foreground, after toggles).
 */
export function syncWidgets() {
  const state = useHabitStore.getState();
  const habits = state.habits.slice(0, MAX_PLANTS);
  const todayIso = calendarDateKey();

  const completedToday = habits.filter((h) => h.completedToday).length;
  const totalToday = habits.length;
  const { title: smallTitle, subtitle: smallSubtitle } = titleVariant(completedToday, totalToday);

  const dailyProps: DailyStatusWidgetProps = {
    completedCount: completedToday,
    totalCount: totalToday,
    title: smallTitle,
    subtitle: smallSubtitle,
  };

  const now = new Date();
  const week = weekDaysMonSun(now);
  const weekSet = new Set(week.map((d) => d.iso));

  // Day dots: completed if any habit completion exists on that day.
  const anyCompletionByDay = new Set<string>();
  for (const h of habits) {
    const dates = state.completionDates[h.id] ?? [];
    for (const d of dates) {
      if (weekSet.has(d)) anyCompletionByDay.add(d);
    }
    // Ensure today counts even if some older data missed storing today.
    if (h.completedToday && weekSet.has(todayIso)) anyCompletionByDay.add(todayIso);
  }

  const days = week.map((d) => ({ iso: d.iso, completed: anyCompletionByDay.has(d.iso) }));

  const weekKey = isoDate(mondayStart(now));
  const plants: WeeklyGrowthWidgetProps["plants"] = habits.map((h, idx) => {
    const dates = state.completionDates[h.id] ?? [];
    const count = dates.reduce((acc, d) => (weekSet.has(d) ? acc + 1 : acc), 0);
    const frameIndex = Math.min(count, FRAMES_PER_PLANT - 1);
    const plantIndex = getPlantIndexForHabitSlot(idx, weekKey);
    return { habitId: h.id, plantIndex, frameIndex };
  });

  const weeklyProps: WeeklyGrowthWidgetProps = {
    completedCountToday: completedToday,
    totalCountToday: totalToday,
    title: completedToday >= totalToday && totalToday > 0 ? "Your garden is thriving" : "Your garden is growing",
    subtitle:
      totalToday > 0 ? `${completedToday} of ${totalToday} habits completed` : "Start with one habit",
    days,
    plants,
  };

  pushWidgetSnapshots({
    dailyJson: JSON.stringify(dailyProps),
    weeklyJson: JSON.stringify(weeklyProps),
  });
}
