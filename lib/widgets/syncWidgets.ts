import { useHabitStore } from "@/lib/store";
import { calendarDateKey } from "@/lib/calendarDate";
import { FRAMES_PER_PLANT, getPlantIndexForHabitSlot } from "@/lib/game/plantSprites";
import { pushWidgetSnapshots } from "@/lib/widgets/widgetSharedStorage";
import { agentLog } from "@/lib/debug-log";

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
  /** Legacy aggregate; unused by tiles (each plant has `weekDays`). */
  days: Array<{ iso: string; completed: boolean }>;
  plants: Array<{
    habitId: string;
    plantIndex: number;
    frameIndex: number;
    weekDays: Array<{ iso: string; completed: boolean }>;
  }>;
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
  // Clear stale `completedToday` when the calendar day changes before reading counts.
  // Otherwise root `syncWidgets` (without visiting Habits/Game) can push yesterday’s
  // progress into the widget extension.
  useHabitStore.getState().ensureDayReset();
  const state = useHabitStore.getState();
  const habits = state.habits.slice(0, MAX_PLANTS);
  const todayIso = calendarDateKey();

  const completedToday = habits.filter((h) => h.completedToday).length;
  const totalToday = habits.length;

  // #region agent log
  agentLog({
    hypothesisId: 'H2,H4,H5',
    location: 'syncWidgets.ts:syncWidgets',
    message: 'syncWidgets snapshot built',
    data: {
      todayIsoLocal: todayIso,
      lastResetDate: state.lastResetDate,
      completedToday,
      totalToday,
      habits: habits.map((h) => ({
        id: h.id,
        completedToday: h.completedToday,
        completionDatesLast3: (state.completionDates[h.id] ?? []).slice(-3),
        todayInCompletionDates: (state.completionDates[h.id] ?? []).includes(todayIso),
      })),
    },
  });
  // #endregion
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

  const weekKey = isoDate(mondayStart(now));
  const plants: WeeklyGrowthWidgetProps["plants"] = habits.map((h, idx) => {
    const dates = state.completionDates[h.id] ?? [];
    const weekDays = week.map((d) => {
      const inStored = weekSet.has(d.iso) && dates.includes(d.iso);
      const todayCounted = d.iso === todayIso && h.completedToday;
      return { iso: d.iso, completed: inStored || todayCounted };
    });
    const count = weekDays.filter((x) => x.completed).length;
    const frameIndex = Math.min(count, FRAMES_PER_PLANT - 1);
    const plantIndex = getPlantIndexForHabitSlot(idx, weekKey);
    return { habitId: h.id, plantIndex, frameIndex, weekDays };
  });

  const weeklyProps: WeeklyGrowthWidgetProps = {
    completedCountToday: completedToday,
    totalCountToday: totalToday,
    title:
      completedToday <= 0
        ? "Your garden\nis quiet"
        : completedToday >= totalToday
          ? "Your garden is thriving"
          : "Your garden is growing",
    subtitle:
      totalToday <= 0
        ? "Start with one habit"
        : completedToday >= totalToday
          ? "All habits completed"
          : `${completedToday} of ${totalToday} habits completed`,
    days: [],
    plants,
  };

  // #region agent log
  agentLog({
    hypothesisId: 'H4',
    location: 'syncWidgets.ts:pushPayload',
    message: 'payload pushed to widget',
    data: {
      todayIsoLocal: todayIso,
      weekIsoDaysUTC: week.map((d) => d.iso),
      tzOffsetMinutes: new Date().getTimezoneOffset(),
      weeklySubtitle: weeklyProps.subtitle,
      dailySubtitle: dailyProps.subtitle,
      samplePlantWeekDays: plants[0]?.weekDays ?? null,
    },
  });
  // #endregion
  pushWidgetSnapshots({
    dailyJson: JSON.stringify(dailyProps),
    weeklyJson: JSON.stringify(weeklyProps),
  });
}
