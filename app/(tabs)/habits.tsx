import { AddHabitSheet } from "@/components/habits/AddHabitSheet";
import { HabitFormInline } from "@/components/habits/HabitFormInline";
import {
  HabitRow,
  habitCardAccentAt,
  habitCardThemeFromAccent,
  type HabitData,
} from "@/components/habits/HabitRow";
import { HabitsCompletionOverlay } from "@/components/habits/HabitsCompletionOverlay";
import { TodayProgressBanner } from "@/components/habits/TodayProgressBanner";
import { WeekCalendar } from "@/components/habits/WeekCalendar";
import { AppText } from "@/components/ui/AppText";
import { useGroveColors, useIsDarkMode } from "@/hooks/useGroveColors";
import {
  addCalendarDays,
  calendarDateKey,
  startOfWeekMonday,
} from "@/lib/calendarDate";
import { CATALOG_ICON_MAP, HABIT_CATALOG } from "@/lib/habitCatalog";
import {
  triggerHabitReorderStartHaptic,
  triggerHabitTimerFinishedHaptic,
  triggerHabitToggleHaptic,
} from "@/lib/habitHaptics";
import {
  getProgressSummary,
  isHabitComplete,
  timerSecondsRemaining,
  type HabitWithActions,
  type TimerProgress,
} from "@/lib/habitsWithActions";
import {
  applyHabitEntryToHabit,
  buildHabitWithActionsFromStore,
  buildHabitsWithActionsListFromStore,
  habitEntryFromInputProgress,
} from "@/lib/habitWithActionsFromStore";
import { useHabitStore } from "@/lib/store";
import { takeReopenAddHabitSheetFromSheet } from "@/lib/reopenAddHabitSheetFromSheet";
import { syncWidgets } from "@/lib/widgets/syncWidgets";
import { GroveSpacing } from "@/styles/theme";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  AppState,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";

const LIST_GAP = 12;

function hydrateHabitsWithEntries(
  habits: HabitWithActions[],
  dateKey: string,
): HabitWithActions[] {
  const { getHabitEntry } = useHabitStore.getState();
  return habits.map((h) =>
    applyHabitEntryToHabit(h, getHabitEntry(h.id, dateKey)),
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const colors = useGroveColors();
  const isDark = useIsDarkMode();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sheetVisible, setSheetVisible] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (takeReopenAddHabitSheetFromSheet()) {
        setSheetVisible(true);
      }
    }, []),
  );

  const storeHabits = useHabitStore((s) => s.habits);
  const completionDates = useHabitStore((s) => s.completionDates);
  const toggleHabit = useHabitStore((s) => s.toggleHabit);
  const toggleCompletionForDate = useHabitStore(
    (s) => s.toggleCompletionForDate,
  );
  const syncHabits = useHabitStore((s) => s.syncHabits);
  const reorderHabits = useHabitStore((s) => s.reorderHabits);
  const ensureDayReset = useHabitStore((s) => s.ensureDayReset);
  const setHabitEntry = useHabitStore((s) => s.setHabitEntry);

  const selectedKey = calendarDateKey(selectedDate);
  const todayKey = calendarDateKey();
  const isViewingToday = selectedKey === todayKey;

  const [habitsWithActions, setHabitsWithActions] = useState<
    HabitWithActions[]
  >(() =>
    hydrateHabitsWithEntries(
      buildHabitsWithActionsListFromStore(storeHabits),
      calendarDateKey(),
    ),
  );

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
          if (built) {
            next.push(
              applyHabitEntryToHabit(
                built,
                useHabitStore.getState().getHabitEntry(built.id, todayKey),
              ),
            );
          }
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
  }, [storeHabits, todayKey]);

  // When the calendar day rolls over, reload saved text for the new day.
  useEffect(() => {
    setHabitsWithActions((prev) =>
      hydrateHabitsWithEntries(
        prev.map((h) => {
          if (h.type !== "input") return h;
          return {
            ...h,
            progress:
              h.id === "practice-gratitude"
                ? {
                    text: "",
                    gratitudeItems: Array(
                      ((h.setup as { gratitudeCount?: number }).gratitudeCount ??
                        3),
                    ).fill(""),
                  }
                : { text: "" },
          };
        }),
        todayKey,
      ),
    );
  }, [todayKey]);

  const updateHabit = useCallback(
    (id: string, updates: Partial<HabitWithActions>) => {
      setHabitsWithActions((prev) => {
        if (calendarDateKey(selectedDate) !== calendarDateKey()) return prev;
        const h = prev.find((x) => x.id === id);
        if (!h) return prev;
        const merged = { ...h, ...updates };
        merged.completedToday = isHabitComplete(merged);

        if (updates.progress && merged.type === "input") {
          const entry = habitEntryFromInputProgress(merged);
          if (entry) {
            queueMicrotask(() => {
              setHabitEntry(id, calendarDateKey(), entry);
            });
          }
        }

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
              if (allDone) setShowCompletionOverlay(true);
              else triggerHabitToggleHaptic(true);
            } else {
              triggerHabitToggleHaptic(false);
            }
          });
        }
        return prev.map((x) => (x.id === id ? merged : x));
      });
    },
    [toggleHabit, selectedDate, setHabitEntry],
  );

  useEffect(() => {
    setExpandedId(null);
  }, [selectedKey]);

  const anyTimerRunning = habitsWithActions.some(
    (h) =>
      h.type === "timer" && (h.progress as TimerProgress).isRunning === true,
  );

  useEffect(() => {
    if (!isViewingToday || !anyTimerRunning) return;

    const markFinished = (finishedIds: string[]) => {
      if (finishedIds.length === 0) return;
      let markedAny = false;
      for (const habitId of finishedIds) {
        const st = useHabitStore.getState().habits.find((x) => x.id === habitId);
        if (st && !st.completedToday) {
          toggleHabit(habitId);
          markedAny = true;
        }
      }
      if (!markedAny) return;
      syncWidgets();
      const habits = useHabitStore.getState().habits;
      const allDone =
        habits.length > 0 && habits.every((x) => x.completedToday);
      if (allDone) setShowCompletionOverlay(true);
      else triggerHabitTimerFinishedHaptic();
    };

    const tick = () => {
      const now = Date.now();
      setHabitsWithActions((prev) => {
        let changed = false;
        const finishedIds: string[] = [];
        const next = prev.map((h) => {
          if (h.type !== "timer") return h;
          const prog = h.progress as TimerProgress;
          if (!prog.isRunning) return h;

          // Migrate timers started before wall-clock endsAtMs existed.
          const running =
            typeof prog.endsAtMs === "number"
              ? prog
              : {
                  ...prog,
                  endsAtMs: now + Math.max(0, prog.secondsRemaining) * 1000,
                };

          const remaining = timerSecondsRemaining(running, now);
          if (remaining <= 0) {
            changed = true;
            finishedIds.push(h.id);
            return {
              ...h,
              progress: {
                ...running,
                secondsRemaining: 0,
                isRunning: false,
                completed: true,
                endsAtMs: undefined,
              },
              completedToday: true,
            };
          }

          if (
            remaining !== prog.secondsRemaining ||
            running.endsAtMs !== prog.endsAtMs
          ) {
            changed = true;
            return {
              ...h,
              progress: { ...running, secondsRemaining: remaining },
            };
          }
          return h;
        });

        if (finishedIds.length > 0) {
          queueMicrotask(() => markFinished(finishedIds));
        }
        return changed ? next : prev;
      });
    };

    tick();
    const id = setInterval(tick, 250);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") tick();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [anyTimerRunning, toggleHabit, isViewingToday]);

  const weekStart = startOfWeekMonday(selectedDate);
  const weekKeys = Array.from({ length: 7 }, (_, i) =>
    calendarDateKey(addCalendarDays(weekStart, i)),
  );

  const habitRows: HabitData[] = storeHabits.map((sh) => {
    const hwa = habitsWithActions.find((h) => h.id === sh.id);
    const iconSource =
      CATALOG_ICON_MAP[sh.customIconCatalogId ?? sh.id] ??
      HABIT_CATALOG[0].icon;
    const completedForDay =
      completionDates[sh.id]?.includes(selectedKey) ?? false;
    const dates = completionDates[sh.id] ?? [];
    return {
      id: sh.id,
      name: sh.name,
      streak: sh.streakCount,
      icon: iconSource,
      completed: completedForDay,
      progressSummary:
        isViewingToday && hwa ? getProgressSummary(hwa) : undefined,
      weekCompletion: weekKeys.map(
        (key) => key <= selectedKey && dates.includes(key),
      ),
    };
  });

  const completedCount = habitRows.filter((h) => h.completed).length;

  const onDragBegin = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onDragEnd = useCallback(
    ({ data }: { data: HabitData[] }) => {
      reorderHabits(data.map((h) => h.id));
      // Defer so the list re-enables its scroll gesture after release.
      requestAnimationFrame(() => setIsDragging(false));
    },
    [reorderHabits],
  );

  const renderItem = useCallback(
    ({ item: habit, drag, isActive }: RenderItemParams<HabitData>) => {
      const hwa = habitsWithActions.find((h) => h.id === habit.id);
      const storeHabit = storeHabits.find((h) => h.id === habit.id);
      const listIndex = Math.max(
        0,
        storeHabits.findIndex((h) => h.id === habit.id),
      );
      const colorIndex =
        typeof storeHabit?.customColorIndex === "number"
          ? storeHabit.customColorIndex
          : listIndex;
      const customAccent = storeHabit?.customColor;
      const accentColor = customAccent
        ? habitCardThemeFromAccent(customAccent, isDark).accentDeep
        : habitCardAccentAt(colorIndex, isDark);

      return (
        <ScaleDecorator activeScale={1.03}>
          <HabitRow
            habit={habit}
            colorIndex={colorIndex}
            customAccent={customAccent}
            dragging={isActive}
            style={styles.listItem}
            onDrag={() => {
              setExpandedId(null);
              triggerHabitReorderStartHaptic();
              drag();
            }}
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
                    setShowCompletionOverlay(true);
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
            onPressSettings={(habitId) =>
              router.push(`/habit-settings/${habitId}`)
            }
            expanded={expandedId === habit.id}
            onExpandToggle={() =>
              setExpandedId(expandedId === habit.id ? null : habit.id)
            }
            expandedContent={
              expandedId === habit.id && hwa ? (
                isViewingToday ? (
                  <HabitFormInline
                    key={hwa.id}
                    habit={hwa}
                    onUpdate={updateHabit}
                    accentColor={accentColor}
                  />
                ) : (
                  <AppText
                    variant="small"
                    style={{
                      color: colors.secondaryText,
                      paddingBottom: 8,
                    }}
                  >
                    Switch to today to track or edit this habit.
                  </AppText>
                )
              ) : undefined
            }
          />
        </ScaleDecorator>
      );
    },
    [
      habitsWithActions,
      storeHabits,
      selectedDate,
      isViewingToday,
      toggleHabit,
      completionDates,
      selectedKey,
      toggleCompletionForDate,
      router,
      expandedId,
      updateHabit,
      colors.secondaryText,
      isDark,
    ],
  );

  const listHeader = (
    <>
      <View style={styles.section}>
        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </View>

      <View style={styles.section}>
        <TodayProgressBanner
          completedCount={completedCount}
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
    </>
  );

  const listFooter = (
    <View style={styles.addSection}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primaryGreen }]}
        activeOpacity={0.8}
        onPress={() => setSheetVisible(true)}
        accessibilityLabel="Add habits"
      >
        <AppText style={[styles.addIcon, { color: colors.onAccent }]}>+</AppText>
      </TouchableOpacity>
      <View style={styles.bottomSpacer} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.white }]}>
      <DraggableFlatList
        data={habitRows}
        keyExtractor={(item) => item.id}
        onDragBegin={onDragBegin}
        onDragEnd={onDragEnd}
        onRelease={() => {
          // Safety net if drag ends without a completed drop animation.
          requestAnimationFrame(() => setIsDragging(false));
        }}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // High threshold so normal pans scroll; reorder only via handle + drag().
        activationDistance={isDragging ? 1 : 999}
        scrollEnabled={!isDragging}
        dragItemOverflow
        containerStyle={styles.list}
      />

      {sheetVisible ? (
        <AddHabitSheet
          activeHabitIds={storeHabits.map((h) => h.id)}
          onClose={() => setSheetVisible(false)}
          onUpdate={(ids) => syncHabits(ids)}
        />
      ) : null}

      <HabitsCompletionOverlay
        visible={showCompletionOverlay}
        onFinish={() => setShowCompletionOverlay(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  listItem: {
    width: "100%",
    marginBottom: LIST_GAP,
  },
  addSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "300",
  },
  bottomSpacer: {
    height: 110,
  },
});
