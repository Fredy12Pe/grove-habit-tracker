import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { HabitRow, type HabitData } from "@/components/habits/HabitRow";
import { HabitFormInline } from "@/components/habits/HabitFormInline";
import {
  CATEGORY_ORDER,
  INITIAL_HABITS_WITH_ACTIONS,
  getProgressSummary,
  isHabitComplete,
  type HabitWithActions,
  type TimerProgress,
} from "@/lib/habitsWithActions";
import { CATALOG_ICON_MAP } from "@/lib/habitCatalog";
import { GroveColors, GroveSpacing } from "@/styles/theme";

export default function AllHabitsTab() {
  const [habits, setHabits] = useState<HabitWithActions[]>(() =>
    INITIAL_HABITS_WITH_ACTIONS.map((h) => ({
      ...h,
      progress: { ...(h.progress as object) } as HabitWithActions["progress"],
    }))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateHabit = useCallback((id: string, updates: Partial<HabitWithActions>) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const next = { ...h, ...updates };
        next.completedToday = isHabitComplete(next);
        return next;
      })
    );
  }, []);

  const expandedHabit = habits.find((h) => h.id === expandedId);
  const timerRunning =
    expandedHabit?.type === "timer" && (expandedHabit.progress as TimerProgress)?.isRunning;

  useEffect(() => {
    if (!expandedId || !expandedHabit || expandedHabit.type !== "timer") return;
    const p = expandedHabit.progress as TimerProgress;
    if (!p.isRunning || p.secondsRemaining <= 0) return;

    const id = setInterval(() => {
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== expandedId || h.type !== "timer") return h;
          const prog = h.progress as TimerProgress;
          if (!prog.isRunning) return h;
          const next = prog.secondsRemaining - 1;
          if (next <= 0) {
            return {
              ...h,
              progress: { ...prog, secondsRemaining: 0, isRunning: false, completed: true },
              completedToday: true,
            };
          }
          return { ...h, progress: { ...prog, secondsRemaining: next } };
        })
      );
    }, 1000);
    return () => clearInterval(id);
  }, [expandedId, timerRunning]);

  const toHabitData = (habit: HabitWithActions): HabitData => ({
    id: habit.id,
    name: habit.name,
    streak: habit.streak,
    completed: isHabitComplete(habit),
    icon: CATALOG_ICON_MAP[habit.id],
    progressSummary: getProgressSummary(habit),
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <AppText variant="h2" style={styles.title}>
          All habits
        </AppText>
        <AppText variant="small" style={styles.subtitle}>
          Tap a habit to expand and log progress.
        </AppText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {CATEGORY_ORDER.map((cat) => {
          const list = habits.filter((h) => h.category === cat);
          if (list.length === 0) return null;
          return (
            <View key={cat} style={styles.section}>
              <AppText variant="paragraphRegular" style={styles.sectionLabel}>
                {cat}
              </AppText>
              {list.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={toHabitData(habit)}
                  onToggle={() => {}}
                  expanded={expandedId === habit.id}
                  onExpandToggle={() => setExpandedId(expandedId === habit.id ? null : habit.id)}
                  expandedContent={
                    expandedId === habit.id ? (
                      <HabitFormInline
                        habit={habits.find((h) => h.id === habit.id)!}
                        onUpdate={updateHabit}
                      />
                    ) : undefined
                  }
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GroveColors.background,
  },
  header: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GroveColors.inactive,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: GroveColors.primaryText,
    marginBottom: 4,
  },
  subtitle: {
    color: GroveColors.secondaryText,
    fontSize: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: GroveColors.secondaryText,
    marginBottom: 10,
    fontWeight: "500",
  },
});
