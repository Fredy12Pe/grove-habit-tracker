import type { Habit, HabitCustomTracking } from "@/lib/types/habit";
import {
  INITIAL_HABITS_WITH_ACTIONS,
  type HabitProgress,
  type HabitWithActions,
  type TimerSetup,
} from "@/lib/habitsWithActions";

const templateById = new Map(
  INITIAL_HABITS_WITH_ACTIONS.map((h) => [h.id, h]),
);

/** Clone defaults from an existing catalog row of the same interaction type. */
const TEMPLATE_ID_BY_CUSTOM_TRACKING: Record<HabitCustomTracking, string> = {
  toggle: "avoid-alcohol",
  counter: "drink-water",
  timer: "pray",
  input: "journal",
};

/** Deep-clone progress/setup for a habit row (same pattern as INITIAL_HABITS_WITH_ACTIONS). */
export function cloneHabitWithActions(h: HabitWithActions): HabitWithActions {
  return {
    ...h,
    setup: { ...(h.setup as object) } as HabitWithActions["setup"],
    progress: { ...(h.progress as object) } as HabitProgress,
  };
}

function buildSyntheticCustomHabitWithActions(h: Habit): HabitWithActions | null {
  if (!h.customTracking) return null;
  const templateId = TEMPLATE_ID_BY_CUSTOM_TRACKING[h.customTracking];
  const t = templateById.get(templateId);
  if (!t) return null;

  const base = cloneHabitWithActions(t);
  base.id = h.id;
  base.name = h.name;
  if (h.customCategory) base.category = h.customCategory;
  base.streak = h.streakCount;
  base.completedToday = h.completedToday;

  switch (base.type) {
    case "toggle":
      base.progress = { confirmed: false };
      break;
    case "counter":
      base.progress = { current: 0 };
      break;
    case "timer": {
      const setup = base.setup as TimerSetup;
      base.progress = {
        completed: false,
        secondsRemaining: setup.durationMinutes * 60,
        isRunning: false,
      };
      break;
    }
    case "input":
      base.progress = { text: "" };
      break;
    default:
      return null;
  }

  return base;
}

/**
 * One store habit + catalog template → HabitWithActions for inline forms.
 * Custom habits use a synthetic template from the same interaction type.
 */
export function buildHabitWithActionsFromStore(h: Habit): HabitWithActions | null {
  // If user explicitly chose a tracker type, honor it even for catalog-backed ids.
  if (h.customTracking) return buildSyntheticCustomHabitWithActions(h);
  const catalog = templateById.get(h.id);
  if (catalog) {
    const base = cloneHabitWithActions(catalog);
    base.streak = h.streakCount;
    base.completedToday = h.completedToday;
    return base;
  }
  return buildSyntheticCustomHabitWithActions(h);
}

export function buildHabitsWithActionsListFromStore(habits: Habit[]): HabitWithActions[] {
  return habits
    .map((h) => buildHabitWithActionsFromStore(h))
    .filter((x): x is HabitWithActions => x != null);
}
