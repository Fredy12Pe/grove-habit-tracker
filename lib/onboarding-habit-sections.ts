import { HABIT_SECTIONS } from "@/lib/habitCatalog";

/**
 * Onboarding-specific grouping:
 * - Spiritual: Faith
 * - Health: Fitness
 * - Discipline: Well Being (excluding harsher "Avoid ..." habits by default)
 */
export const ONBOARDING_HABIT_SECTIONS: {
  title: "Spiritual" | "Health" | "Discipline";
  habitIds: string[];
}[] = [
  {
    title: "Spiritual",
    habitIds: HABIT_SECTIONS.find((s) => s.title === "Faith")?.habits.map((h) => h.id) ?? [],
  },
  {
    title: "Health",
    habitIds: HABIT_SECTIONS.find((s) => s.title === "Fitness")?.habits.map((h) => h.id) ?? [],
  },
  {
    title: "Discipline",
    habitIds:
      HABIT_SECTIONS.find((s) => s.title === "Well Being")
        ?.habits.map((h) => h.id)
        .filter(
          (id) =>
            id !== "avoid-alcohol" && id !== "avoid-porn",
        ) ?? [],
  },
];

