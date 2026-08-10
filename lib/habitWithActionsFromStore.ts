import type { Habit, HabitCustomTracking } from "@/lib/types/habit";
import type { HabitEntry } from "@/lib/store/useHabitStore";
import {
  INITIAL_HABITS_WITH_ACTIONS,
  type HabitProgress,
  type HabitWithActions,
  type InputProgress,
  type InputSetup,
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

function cloneProgress(progress: HabitProgress): HabitProgress {
  const p = { ...(progress as object) } as HabitProgress;
  if ("gratitudeItems" in p && Array.isArray((p as InputProgress).gratitudeItems)) {
    (p as InputProgress).gratitudeItems = [
      ...((p as InputProgress).gratitudeItems ?? []),
    ];
  }
  return p;
}

/** Deep-clone progress/setup for a habit row (same pattern as INITIAL_HABITS_WITH_ACTIONS). */
export function cloneHabitWithActions(h: HabitWithActions): HabitWithActions {
  return {
    ...h,
    setup: { ...(h.setup as object) } as HabitWithActions["setup"],
    progress: cloneProgress(h.progress),
  };
}

/** Parse a stored gratitude note (e.g. from the game screen) into input lines. */
function gratitudeItemsFromNote(note: string, count: number): string[] {
  const lines = note
    .split("\n")
    .map((line) => line.replace(/^[•\-*]\s*/, "").trim())
    .filter((line) => line.length > 0);
  return Array.from({ length: count }, (_, i) => lines[i] ?? "");
}

/** Apply a persisted habit entry onto an input habit's progress. */
export function applyHabitEntryToHabit(
  habit: HabitWithActions,
  entry: HabitEntry | undefined,
): HabitWithActions {
  if (!entry || habit.type !== "input") return habit;
  const p = habit.progress as InputProgress;
  const s = habit.setup as InputSetup;

  if (habit.id === "practice-gratitude") {
    const count = s.gratitudeCount ?? 3;
    const items =
      entry.gratitudeItems != null
        ? Array.from(
            { length: count },
            (_, i) => entry.gratitudeItems?.[i] ?? "",
          )
        : entry.note != null
          ? gratitudeItemsFromNote(entry.note, count)
          : undefined;
    if (!items) return habit;
    return {
      ...habit,
      progress: {
        ...p,
        gratitudeItems: items,
        text: items.filter((t) => t.trim().length > 0).join("\n"),
      },
    };
  }

  const text = entry.journalText ?? entry.note;
  if (text == null) return habit;
  return {
    ...habit,
    progress: { ...p, text },
  };
}

/** Build a HabitEntry payload from input-habit progress. */
export function habitEntryFromInputProgress(
  habit: HabitWithActions,
): HabitEntry | null {
  if (habit.type !== "input") return null;
  const p = habit.progress as InputProgress;
  if (habit.id === "practice-gratitude") {
    const items = (p.gratitudeItems ?? []).map((t) => t.trimEnd());
    const note = items
      .filter((t) => t.trim().length > 0)
      .map((t) => `• ${t.trim()}`)
      .join("\n");
    return {
      gratitudeItems: items,
      note: note.length > 0 ? note : undefined,
    };
  }
  return { journalText: p.text };
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
