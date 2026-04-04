import { AddHabitSheet } from "@/components/habits/AddHabitSheet";
import { HabitFormInline } from "@/components/habits/HabitFormInline";
import { HabitRow, type HabitData } from "@/components/habits/HabitRow";
import { TodayProgressBanner } from "@/components/habits/TodayProgressBanner";
import { WeekCalendar } from "@/components/habits/WeekCalendar";
import { AppText } from "@/components/ui/AppText";
import { calendarDateKey } from "@/lib/calendarDate";
import { CATALOG_ICON_MAP, HABIT_CATALOG } from "@/lib/habitCatalog";
import {
    triggerAllHabitsCompleteHaptic,
    triggerHabitTimerFinishedHaptic,
    triggerHabitToggleHaptic,
} from "@/lib/habitHaptics";
import {
    getProgressSummary,
    isHabitComplete,
    type HabitWithActions,
    type TimerProgress,
} from "@/lib/habitsWithActions";
import {
    buildHabitWithActionsFromStore,
    buildHabitsWithActionsListFromStore,
} from "@/lib/habitWithActionsFromStore";
import { useHabitStore } from "@/lib/store";
import { syncWidgets } from "@/lib/widgets/syncWidgets";
import { GroveColors, GroveSpacing } from "@/styles/theme";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

export default function HabitsScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sheetVisible, setSheetVisible] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const storeHabits = useHabitStore((s) => s.habits);
  const completionDates = useHabitStore((s) => s.completionDates);
  const toggleHabit = useHabitStore((s) => s.toggleHabit);
  const toggleCompletionForDate = useHabitStore(
    (s) => s.toggleCompletionForDate,
  );
  const syncHabits = useHabitStore((s) => s.syncHabits);
  const ensureDayReset = useHabitStore((s) => s.ensureDayReset);

  const selectedKey = calendarDateKey(selectedDate);
  const todayKey = calendarDateKey();
  const isViewingToday = selectedKey === todayKey;

  const [habitsWithActions, setHabitsWithActions] = useState<
    HabitWithActions[]
  >(() => buildHabitsWithActionsListFromStore(storeHabits));

  useEffect(() => {
    ensureDayReset();
  }, [ensureDayReset]);

  useEffect(() => {
    setHabitsWithActions((prev) => {
      const storeById = new Map(storeHabits.map((h) => [h.id, h]));
      const storeIds = new Set(storeById.keys());

      let next = prev.filter((h) => storeIds.has(h.id));

      for (const sh of storeHabits) {
        if (!next.some((h) => h.id === sh.id)) {
          const built = buildHabitWithActionsFromStore(sh);
          if (built) next.push(built);
        }
      }

      next = storeHabits
        .map((sh) => next.find((h) => h.id === sh.id))
        .filter((x): x is HabitWithActions => x != null);

      return next.map((h) => {
        const sh = storeById.get(h.id);
        if (!sh) return h;
        return {
          ...h,
          streak: sh.streakCount,
          completedToday: sh.completedToday,
        };
      });
    });
  }, [storeHabits]);

  const updateHabit = useCallback(
    (id: string, updates: Partial<HabitWithActions>) => {
      setHabitsWithActions((prev) => {
        if (calendarDateKey(selectedDate) !== calendarDateKey()) return prev;
        const h = prev.find((x) => x.id === id);
        if (!h) return prev;
        const merged = { ...h, ...updates };
        merged.completedToday = isHabitComplete(merged);
        const storeComplete =
          useHabitStore.getState().habits.find((s) => s.id === id)
            ?.completedToday ?? false;
        if (merged.completedToday !== storeComplete) {
          const becomingComplete = merged.completedToday;
          queueMicrotask(() => {
            toggleHabit(id);
            syncWidgets();
            const habits = useHabitStore.getState().habits;
            if (habits.length === 0) return;
            const allDone = habits.every((x) => x.completedToday);
            if (becomingComplete) {
              if (allDone) triggerAllHabitsCompleteHaptic();
              else triggerHabitToggleHaptic(true);
            } else {
              triggerHabitToggleHaptic(false);
            }
          });
        }
        return prev.map((x) => (x.id === id ? merged : x));
      });
    },
    [toggleHabit, selectedDate],
  );

  useEffect(() => {
    setExpandedId(null);
  }, [selectedKey]);

  const expandedHabit = habitsWithActions.find((h) => h.id === expandedId);
  const timerRunning =
    expandedHabit?.type === "timer" &&
    (expandedHabit.progress as TimerProgress)?.isRunning;

  useEffect(() => {
    if (!isViewingToday) return;
    if (!expandedId || !expandedHabit || expandedHabit.type !== "timer") return;
    const p = expandedHabit.progress as TimerProgress;
    if (!p.isRunning || p.secondsRemaining <= 0) return;

    const id = setInterval(() => {
      setHabitsWithActions((prev) =>
        prev.map((h) => {
          if (h.id !== expandedId || h.type !== "timer") return h;
          const prog = h.progress as TimerProgress;
          if (!prog.isRunning) return h;
          const nextSec = prog.secondsRemaining - 1;
          if (nextSec <= 0) {
            queueMicrotask(() => {
              const st = useHabitStore
                .getState()
                .habits.find((x) => x.id === expandedId);
              if (st && !st.completedToday) {
                toggleHabit(expandedId);
                syncWidgets();
                const habits = useHabitStore.getState().habits;
                const allDone =
                  habits.length > 0 && habits.every((x) => x.completedToday);
                if (allDone) triggerAllHabitsCompleteHaptic();
                else triggerHabitTimerFinishedHaptic();
              }
            });
            return {
              ...h,
              progress: {
                ...prog,
                secondsRemaining: 0,
                isRunning: false,
                completed: true,
              },
              completedToday: true,
            };
          }
          return { ...h, progress: { ...prog, secondsRemaining: nextSec } };
        }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, [expandedId, timerRunning, toggleHabit, isViewingToday]);

  const habitRows: HabitData[] = storeHabits.map((sh) => {
    const hwa = habitsWithActions.find((h) => h.id === sh.id);
    const iconSource =
      CATALOG_ICON_MAP[sh.customIconCatalogId ?? sh.id] ??
      HABIT_CATALOG[0].icon;
    const completedForDay =
      completionDates[sh.id]?.includes(selectedKey) ?? false;
    return {
      id: sh.id,
      name: sh.name,
      streak: sh.streakCount,
      icon: iconSource,
      completed: completedForDay,
      progressSummary:
        isViewingToday && hwa ? getProgressSummary(hwa) : undefined,
    };
  });

  const inProgress = habitRows.filter((h) => !h.completed);
  const completed = habitRows
    .filter((h) => h.completed)
    .slice()
    .sort((a, b) => {
      const ha = storeHabits.find((x) => x.id === a.id);
      const hb = storeHabits.find((x) => x.id === b.id);
      const ta = ha?.updatedAt ? new Date(ha.updatedAt).getTime() : 0;
      const tb = hb?.updatedAt ? new Date(hb.updatedAt).getTime() : 0;
      return ta - tb;
    });

  const renderHabitRow = (habit: HabitData) => {
    const hwa = habitsWithActions.find((h) => h.id === habit.id);
    return (
      <HabitRow
        key={habit.id}
        habit={habit}
        onToggle={(habitId) => {
          if (calendarDateKey(selectedDate) > calendarDateKey()) return;
          if (isViewingToday) {
            const wasComplete =
              useHabitStore.getState().habits.find((h) => h.id === habitId)
                ?.completedToday ?? false;
            toggleHabit(habitId);
            syncWidgets();
            queueMicrotask(() => {
              const habits = useHabitStore.getState().habits;
              if (habits.length === 0) return;
              const allDone = habits.every((h) => h.completedToday);
              if (wasComplete) {
                triggerHabitToggleHaptic(false);
              } else if (allDone) {
                triggerAllHabitsCompleteHaptic();
              } else {
                triggerHabitToggleHaptic(true);
              }
            });
            return;
          }
          const wasComplete =
            completionDates[habitId]?.includes(selectedKey) ?? false;
          toggleCompletionForDate(habitId, selectedKey);
          syncWidgets();
          queueMicrotask(() => {
            if (wasComplete) triggerHabitToggleHaptic(false);
            else triggerHabitToggleHaptic(true);
          });
        }}
        onPressSettings={(habitId) => router.push(`/habit-settings/${habitId}`)}
        expanded={expandedId === habit.id}
        onExpandToggle={() =>
          setExpandedId(expandedId === habit.id ? null : habit.id)
        }
        expandedContent={
          expandedId === habit.id && hwa ? (
            isViewingToday ? (
              <HabitFormInline habit={hwa} onUpdate={updateHabit} />
            ) : (
              <AppText
                variant="small"
                style={{
                  color: GroveColors.secondaryText,
                  paddingBottom: 8,
                }}
              >
                Switch to today to track or edit this habit.
              </AppText>
            )
          ) : undefined
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Week calendar */}
        <View style={styles.section}>
          <WeekCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </View>

        {/* Today's progress banner */}
        <View style={styles.section}>
          <TodayProgressBanner
            completedCount={completed.length}
            totalCount={habitRows.length}
            title={
              isViewingToday
                ? undefined
                : `${selectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })} Progress`
            }
          />
        </View>

        {/* Completed — oldest-first so the most recently completed is at the bottom of this section */}
        {completed.length > 0 && (
          <View style={styles.section}>
            <AppText variant="paragraphRegular" style={styles.sectionLabel}>
              Completed
            </AppText>
            {completed.map(renderHabitRow)}
          </View>
        )}

        {inProgress.length > 0 && (
          <View style={styles.section}>
            <AppText variant="paragraphRegular" style={styles.sectionLabel}>
              In Progress
            </AppText>
            {inProgress.map(renderHabitRow)}
          </View>
        )}

        {/* Add habit button */}
        <View style={styles.addSection}>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={() => setSheetVisible(true)}
          >
            <AppText style={styles.addIcon}>+</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {sheetVisible ? (
        <AddHabitSheet
          activeHabitIds={storeHabits.map((h) => h.id)}
          onClose={() => setSheetVisible(false)}
          onUpdate={(ids) => syncHabits(ids)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GroveColors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 20,
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
  addSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GroveColors.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    color: GroveColors.white,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "300",
  },
  bottomSpacer: {
    height: 32,
  },
});
