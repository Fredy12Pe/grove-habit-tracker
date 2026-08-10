import { AppText } from "@/components/ui/AppText";
import {
  triggerHabitCounterStepHaptic,
  triggerHabitTimerStartedHaptic,
} from "@/lib/habitHaptics";
import {
  formatTime,
  isHabitComplete,
  pauseTimer,
  resetTimer,
  startOrResumeTimer,
  timerSecondsRemaining,
  type CounterProgress,
  type CounterSetup,
  type HabitProgress,
  type HabitSetup,
  type HabitWithActions,
  type InputProgress,
  type InputSetup,
  type ScheduledProgress,
  type ScheduledSetup,
  type TimerProgress,
  type TimerSetup,
  type ToggleProgress,
} from "@/lib/habitsWithActions";
import { useGroveColors } from "@/hooks/useGroveColors";
import {
  GroveBorderRadius,
  GroveFontFamily,
  type GroveColorPalette,
} from "@/styles/theme";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

interface HabitFormInlineProps {
  habit: HabitWithActions;
  onUpdate: (id: string, updates: Partial<HabitWithActions>) => void;
  /** Darker shade of the habit card background for controls. */
  accentColor: string;
}

function gratitudeDraftFromHabit(habit: HabitWithActions): string[] {
  const p = habit.progress as InputProgress;
  const s = habit.setup as InputSetup;
  const count = s.gratitudeCount ?? 3;
  const items = p.gratitudeItems ?? [];
  return Array.from({ length: count }, (_, i) => items[i] ?? "");
}

export function HabitFormInline({
  habit,
  onUpdate,
  accentColor,
}: HabitFormInlineProps) {
  const colors = useGroveColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accentFill = {
    backgroundColor: accentColor,
    borderColor: accentColor,
  };
  const accentOutline = { borderColor: accentColor };
  const accentFg = { color: accentColor };
  const pillStyle = (selected: boolean) => [
    styles.pill,
    selected ? accentFill : accentOutline,
  ];
  const pillTextStyle = (selected: boolean) => [
    styles.pillText,
    selected ? styles.pillTextSelected : accentFg,
  ];

  const isGratitude = habit.type === "input" && habit.id === "practice-gratitude";
  const isJournalLike = habit.type === "input" && !isGratitude;
  const gratitudeCount =
    habit.type === "input"
      ? ((habit.setup as InputSetup).gratitudeCount ?? 3)
      : 3;

  const [gratitudeDraft, setGratitudeDraft] = useState(() =>
    isGratitude ? gratitudeDraftFromHabit(habit) : [],
  );
  const [journalDraft, setJournalDraft] = useState(() =>
    isJournalLike ? (habit.progress as InputProgress).text : "",
  );
  const [justSaved, setJustSaved] = useState(false);

  // Keep draft length in sync when the user changes gratitude item count.
  useEffect(() => {
    if (!isGratitude) return;
    setGratitudeDraft((prev) => {
      if (prev.length === gratitudeCount) return prev;
      return Array.from({ length: gratitudeCount }, (_, i) => prev[i] ?? "");
    });
  }, [gratitudeCount, isGratitude]);

  const updateProgress = (progress: HabitProgress) => {
    const next = { ...habit, progress };
    (next as HabitWithActions).completedToday = isHabitComplete(
      next as HabitWithActions,
    );
    onUpdate(habit.id, { progress, completedToday: next.completedToday });
  };

  const saveInputProgress = (progress: InputProgress) => {
    updateProgress(progress);
    setJustSaved(true);
  };

  const updateSetup = (setup: HabitSetup) => {
    const updates: Partial<HabitWithActions> = { setup };
    if (habit.type === "timer" && "durationMinutes" in setup) {
      const p = habit.progress as TimerProgress;
      if (!p.isRunning && !p.completed) {
        updates.progress = {
          ...p,
          secondsRemaining: (setup as TimerSetup).durationMinutes * 60,
          endsAtMs: undefined,
        };
      }
    }
    onUpdate(habit.id, updates);
  };

  const renderSetup = () => {
    // Keep duration controls out of the way while a session is in progress.
    if (habit.type === "timer") {
      const p = habit.progress as TimerProgress;
      const s = habit.setup as TimerSetup;
      const fullDuration = s.durationMinutes * 60;
      const remaining = timerSecondsRemaining(p);
      const sessionActive =
        p.isRunning || p.completed || remaining < fullDuration;
      if (sessionActive) return null;
    }

    switch (habit.type) {
      case "timer": {
        const s = habit.setup as TimerSetup;
        const presets = [5, 10, 15, 20];
        const customMinutes = Math.max(1, Math.min(120, s.durationMinutes));
        return (
          <View style={styles.section}>
            <AppText variant="small" style={styles.sectionTitle}>
              Duration (minutes)
            </AppText>
            <View style={styles.pillRow}>
              {presets.map((min) => (
                <Pressable
                  key={min}
                  style={pillStyle(s.durationMinutes === min)}
                  onPress={() => updateSetup({ durationMinutes: min })}
                >
                  <AppText
                    variant="paragraph"
                    style={pillTextStyle(s.durationMinutes === min)}
                  >
                    {min}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="paragraphRegular" style={styles.customLabel}>
              Or custom
            </AppText>
            <View style={styles.stepperRow}>
              <TextInput
                style={[styles.customDurationInput, accentOutline]}
                keyboardType="number-pad"
                value={String(customMinutes)}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num)) {
                    updateSetup({
                      durationMinutes: Math.max(1, Math.min(120, num)),
                    });
                  } else if (text === "") {
                    updateSetup({ durationMinutes: 1 });
                  }
                }}
                selectTextOnFocus
                maxLength={3}
              />
              <AppText variant="paragraph" style={styles.customDurationUnit}>
                min
              </AppText>
            </View>
          </View>
        );
      }
      case "counter": {
        const s = habit.setup as CounterSetup;
        return (
          <View style={styles.section}>
            <AppText variant="small" style={styles.sectionTitle}>
              Daily goal
            </AppText>
            <View style={styles.stepperRow}>
              <Pressable
                style={[styles.stepperBtn, accentOutline]}
                onPress={() =>
                  updateSetup({ ...s, goal: Math.max(1, s.goal - 1) })
                }
              >
                <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                  −
                </AppText>
              </Pressable>
              <AppText variant="paragraph" style={styles.stepperValue}>
                {s.goal} {s.unit ?? ""}
              </AppText>
              <Pressable
                style={[styles.stepperBtn, accentOutline]}
                onPress={() => updateSetup({ ...s, goal: s.goal + 1 })}
              >
                <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                  +
                </AppText>
              </Pressable>
            </View>
          </View>
        );
      }
      case "input":
        if (habit.id === "practice-gratitude") {
          const s = habit.setup as InputSetup;
          const count = s.gratitudeCount ?? 3;
          return (
            <View style={styles.section}>
              <AppText variant="small" style={styles.sectionTitle}>
                Number of gratitude items
              </AppText>
              <View style={styles.stepperRow}>
                <Pressable
                  style={[styles.stepperBtn, accentOutline]}
                  onPress={() =>
                    updateSetup({
                      ...s,
                      gratitudeCount: Math.max(1, count - 1),
                    })
                  }
                >
                  <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                    −
                  </AppText>
                </Pressable>
                <AppText variant="paragraph" style={styles.stepperValue}>
                  {count}
                </AppText>
                <Pressable
                  style={[styles.stepperBtn, accentOutline]}
                  onPress={() =>
                    updateSetup({ ...s, gratitudeCount: count + 1 })
                  }
                >
                  <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                    +
                  </AppText>
                </Pressable>
              </View>
            </View>
          );
        }
        return (
          <View style={styles.section}>
            <AppText variant="small" style={styles.sectionTitle}>
              Journaling
            </AppText>
            <AppText variant="paragraphRegular" style={styles.hint}>
              Write your thoughts, then tap Save.
            </AppText>
          </View>
        );
      case "scheduled": {
        const s = habit.setup as ScheduledSetup;
        if (s.goalHours != null) {
          return (
            <View style={styles.section}>
              <AppText variant="small" style={styles.sectionTitle}>
                Target sleep (hours)
              </AppText>
              <View style={styles.stepperRow}>
                <Pressable
                  style={[styles.stepperBtn, accentOutline]}
                  onPress={() =>
                    updateSetup({
                      ...s,
                      goalHours: Math.max(4, (s.goalHours ?? 7) - 1),
                    })
                  }
                >
                  <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                    −
                  </AppText>
                </Pressable>
                <AppText variant="paragraph" style={styles.stepperValue}>
                  {s.goalHours ?? 7} h
                </AppText>
                <Pressable
                  style={[styles.stepperBtn, accentOutline]}
                  onPress={() =>
                    updateSetup({
                      ...s,
                      goalHours: (s.goalHours ?? 7) + 1,
                    })
                  }
                >
                  <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                    +
                  </AppText>
                </Pressable>
              </View>
            </View>
          );
        }
        if (s.maxHours != null) {
          return (
            <View style={styles.section}>
              <AppText variant="small" style={styles.sectionTitle}>
                Max screen time (hours)
              </AppText>
              <View style={styles.stepperRow}>
                <Pressable
                  style={[styles.stepperBtn, accentOutline]}
                  onPress={() =>
                    updateSetup({
                      ...s,
                      maxHours: Math.max(0, (s.maxHours ?? 2) - 1),
                    })
                  }
                >
                  <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                    −
                  </AppText>
                </Pressable>
                <AppText variant="paragraph" style={styles.stepperValue}>
                  {s.maxHours ?? 2} h
                </AppText>
                <Pressable
                  style={[styles.stepperBtn, accentOutline]}
                  onPress={() =>
                    updateSetup({
                      ...s,
                      maxHours: (s.maxHours ?? 2) + 1,
                    })
                  }
                >
                  <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                    +
                  </AppText>
                </Pressable>
              </View>
            </View>
          );
        }
        return null;
      }
      case "toggle":
        return (
          <View style={styles.section}>
            <AppText variant="small" style={styles.sectionTitle}>
              Setup
            </AppText>
            <AppText variant="paragraphRegular" style={styles.hint}>
              Confirm daily when you’ve stayed on track.
            </AppText>
          </View>
        );
    }
  };

  const renderDailyAction = () => {
    switch (habit.type) {
      case "toggle": {
        const p = habit.progress as ToggleProgress;
        const labels: Record<string, string> = {
          "avoid-alcohol": "Stayed alcohol-free today",
          "avoid-porn": "Stayed strong today",
          "no-social-media": "Stayed off social media today",
        };
        const label = labels[habit.id] ?? "Mark complete";
        return (
          <View style={styles.section}>
            <AppText variant="small" style={styles.sectionTitle}>
              Daily action
            </AppText>
            <Pressable
              style={[
                styles.primaryBtn,
                p.confirmed ? styles.primaryBtnDone : accentFill,
              ]}
              onPress={() => updateProgress({ confirmed: !p.confirmed })}
            >
              <AppText
                variant="paragraph"
                style={[
                  styles.primaryBtnText,
                  p.confirmed && styles.primaryBtnTextDone,
                ]}
              >
                {p.confirmed ? "Completed ✓" : label}
              </AppText>
            </Pressable>
          </View>
        );
      }
      case "counter": {
        const p = habit.progress as CounterProgress;
        const s = habit.setup as CounterSetup;
        const complete = p.current >= s.goal;
        return (
          <View style={styles.section}>
            <AppText variant="small" style={styles.sectionTitle}>
              Today’s progress
            </AppText>
            <View style={styles.counterRow}>
              <Pressable
                style={[styles.counterBtn, accentFill]}
                onPress={() => {
                  const next = Math.max(0, p.current - 1);
                  if (next === p.current) return;
                  triggerHabitCounterStepHaptic();
                  updateProgress({ current: next });
                }}
              >
                <AppText variant="h2" style={styles.counterBtnText}>
                  −
                </AppText>
              </Pressable>
              <View style={styles.counterValueWrap}>
                <AppText variant="h1" style={styles.counterValue}>
                  {p.current}
                </AppText>
                <AppText variant="paragraphRegular" style={styles.counterUnit}>
                  / {s.goal} {s.unit ?? ""}
                </AppText>
              </View>
              <Pressable
                style={[styles.counterBtn, accentFill]}
                onPress={() => {
                  triggerHabitCounterStepHaptic();
                  updateProgress({ current: p.current + 1 });
                }}
              >
                <AppText variant="h2" style={styles.counterBtnText}>
                  +
                </AppText>
              </Pressable>
            </View>
            {complete && (
              <AppText variant="paragraphRegular" style={styles.reward}>
                Your plant grew a little 🌱
              </AppText>
            )}
          </View>
        );
      }
      case "timer": {
        const p = habit.progress as TimerProgress;
        const s = habit.setup as TimerSetup;
        const remaining = timerSecondsRemaining(p);
        const done = p.completed || remaining <= 0;
        const fullDuration = s.durationMinutes * 60;
        const isIdle =
          !p.isRunning && !done && remaining >= fullDuration;

        return (
          <View style={[styles.section, !isIdle && styles.timerSection]}>
            <AppText
              variant="small"
              style={[styles.sectionTitle, !isIdle && styles.timerSectionTitle]}
            >
              Today’s action
            </AppText>
            {isIdle && (
              <Pressable
                style={[styles.primaryBtn, accentFill]}
                onPress={() =>
                  updateProgress(startOrResumeTimer(p, fullDuration))
                }
              >
                <AppText variant="paragraph" style={styles.primaryBtnText}>
                  Start {s.durationMinutes} min
                </AppText>
              </Pressable>
            )}
            {!isIdle && (
              <View style={styles.timerWrap}>
                <AppText variant="display" style={styles.timerText}>
                  {done ? "0:00" : formatTime(remaining)}
                </AppText>
                {done && (
                  <AppText variant="paragraphRegular" style={styles.reward}>
                    A butterfly visited your grove 🦋
                  </AppText>
                )}
                {!done && (
                  <View style={styles.timerControls}>
                    {p.isRunning ? (
                      <Pressable
                        style={[styles.timerCtrlBtn, accentFill]}
                        onPress={() => updateProgress(pauseTimer(p))}
                      >
                        <AppText
                          variant="paragraph"
                          style={styles.timerCtrlTextPrimary}
                        >
                          Pause
                        </AppText>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.timerCtrlBtn, accentFill]}
                        onPress={() => {
                          triggerHabitTimerStartedHaptic();
                          updateProgress(startOrResumeTimer(p));
                        }}
                      >
                        <AppText
                          variant="paragraph"
                          style={styles.timerCtrlTextPrimary}
                        >
                          Play
                        </AppText>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.timerCtrlBtn, styles.timerCtrlStop, accentOutline]}
                      onPress={() =>
                        updateProgress(resetTimer(s.durationMinutes))
                      }
                    >
                      <AppText
                        variant="paragraph"
                        style={[styles.timerCtrlTextMuted, accentFg]}
                      >
                        Stop
                      </AppText>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      }
      case "input":
        if (habit.id === "practice-gratitude") {
          const p = habit.progress as InputProgress;
          const s = habit.setup as InputSetup;
          const count = s.gratitudeCount ?? 3;
          const items = Array.from(
            { length: count },
            (_, i) => gratitudeDraft[i] ?? "",
          );
          const draftHabit = {
            ...habit,
            progress: { ...p, gratitudeItems: items },
          };
          const draftComplete = isHabitComplete(draftHabit);
          const hasDraftText = items.some((t) => t.trim().length > 0);
          const updateItem = (i: number, val: string) => {
            setJustSaved(false);
            setGratitudeDraft((prev) => {
              const next = Array.from(
                { length: count },
                (_, j) => prev[j] ?? "",
              );
              next[i] = val;
              return next;
            });
          };
          return (
            <View style={styles.section}>
              <AppText variant="small" style={styles.sectionTitle}>
                Today’s gratitude
              </AppText>
              {items.map((value, i) => (
                <TextInput
                  key={i}
                  style={[styles.input, accentOutline]}
                  placeholder={`Gratitude ${i + 1}`}
                  placeholderTextColor={colors.secondaryText}
                  value={value}
                  onChangeText={(val) => updateItem(i, val)}
                />
              ))}
              <Pressable
                style={[
                  styles.primaryBtn,
                  justSaved ? styles.primaryBtnDone : accentFill,
                  !hasDraftText && !justSaved && styles.primaryBtnDisabled,
                ]}
                disabled={!hasDraftText && !justSaved}
                onPress={() => {
                  if (!hasDraftText) return;
                  saveInputProgress({
                    ...p,
                    gratitudeItems: items,
                    text: items
                      .filter((t) => t.trim().length > 0)
                      .join("\n"),
                  });
                }}
              >
                <AppText
                  variant="paragraph"
                  style={[
                    styles.primaryBtnText,
                    justSaved && styles.primaryBtnTextDone,
                  ]}
                >
                  {justSaved ? "Saved ✓" : "Save"}
                </AppText>
              </Pressable>
              {draftComplete && justSaved && (
                <AppText variant="paragraphRegular" style={styles.reward}>
                  Your plant grew a little 🌱
                </AppText>
              )}
            </View>
          );
        }
        {
          const p = habit.progress as InputProgress;
          const s = habit.setup as InputSetup;
          const draftHabit = {
            ...habit,
            progress: { ...p, text: journalDraft },
          };
          const draftComplete = isHabitComplete(draftHabit);
          const hasDraftText = journalDraft.trim().length > 0;
          return (
            <View style={styles.section}>
              <AppText variant="small" style={styles.sectionTitle}>
                Today’s entry
              </AppText>
              <TextInput
                style={[styles.input, styles.inputMultiline, accentOutline]}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.secondaryText}
                value={journalDraft}
                onChangeText={(text) => {
                  setJustSaved(false);
                  setJournalDraft(text);
                }}
                multiline
                numberOfLines={4}
              />
              <Pressable
                style={[
                  styles.primaryBtn,
                  justSaved ? styles.primaryBtnDone : accentFill,
                  !hasDraftText && !justSaved && styles.primaryBtnDisabled,
                ]}
                disabled={!hasDraftText && !justSaved}
                onPress={() => {
                  if (!hasDraftText) return;
                  saveInputProgress({ ...p, text: journalDraft });
                }}
              >
                <AppText
                  variant="paragraph"
                  style={[
                    styles.primaryBtnText,
                    justSaved && styles.primaryBtnTextDone,
                  ]}
                >
                  {justSaved ? "Saved ✓" : "Save"}
                </AppText>
              </Pressable>
              {draftComplete && justSaved ? (
                <AppText variant="paragraphRegular" style={styles.reward}>
                  Your plant grew a little 🌱
                </AppText>
              ) : !draftComplete && hasDraftText ? (
                <AppText variant="paragraphRegular" style={styles.hint}>
                  Write at least {s.minLength ?? 10} characters to complete.
                </AppText>
              ) : null}
            </View>
          );
        }
      case "scheduled": {
        const p = habit.progress as ScheduledProgress;
        const s = habit.setup as ScheduledSetup;
        if (s.goalHours != null) {
          return (
            <View style={styles.section}>
              <AppText variant="small" style={styles.sectionTitle}>
                How many hours did you sleep?
              </AppText>
              <View style={styles.stepperRow}>
                <Pressable
                  style={[styles.stepperBtn, accentOutline]}
                  onPress={() =>
                    updateProgress({ value: Math.max(0, p.value - 1) })
                  }
                >
                  <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                    −
                  </AppText>
                </Pressable>
                <AppText variant="paragraph" style={styles.stepperValue}>
                  {p.value} h
                </AppText>
                <Pressable
                  style={[styles.stepperBtn, accentOutline]}
                  onPress={() => updateProgress({ value: p.value + 1 })}
                >
                  <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                    +
                  </AppText>
                </Pressable>
              </View>
              {isHabitComplete(habit) && (
                <AppText variant="paragraphRegular" style={styles.reward}>
                  Rest well 🌙
                </AppText>
              )}
            </View>
          );
        }
        if (s.maxHours != null) {
          return (
            <View style={styles.section}>
              <AppText variant="small" style={styles.sectionTitle}>
                Screen time today (hours)
              </AppText>
              <View style={styles.stepperRow}>
                <Pressable
                  style={[styles.stepperBtn, accentOutline]}
                  onPress={() =>
                    updateProgress({ value: Math.max(0, p.value - 0.5) })
                  }
                >
                  <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                    −
                  </AppText>
                </Pressable>
                <AppText variant="paragraph" style={styles.stepperValue}>
                  {p.value} h
                </AppText>
                <Pressable
                  style={[styles.stepperBtn, accentOutline]}
                  onPress={() => updateProgress({ value: p.value + 0.5 })}
                >
                  <AppText variant="h2" style={[styles.stepperText, accentFg]}>
                    +
                  </AppText>
                </Pressable>
              </View>
              {isHabitComplete(habit) && (
                <AppText variant="paragraphRegular" style={styles.reward}>
                  Under limit 📵
                </AppText>
              )}
            </View>
          );
        }
        return null;
      }
    }
  };

  return (
    <View style={styles.wrap}>
      {renderSetup()}
      {renderDailyAction()}
    </View>
  );
}

function createStyles(colors: GroveColorPalette) {
  return StyleSheet.create({
  wrap: {
    paddingTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    color: colors.deepText,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: colors.secondaryText,
    lineHeight: 18,
  },
  customLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondaryText,
    marginTop: 12,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: GroveBorderRadius.pill,
    backgroundColor: colors.white,
    borderWidth: 2,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  pillTextSelected: {
    color: colors.onAccent,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: GroveBorderRadius.button,
    backgroundColor: colors.white,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 22,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    color: colors.deepText,
    minWidth: 44,
    textAlign: "center",
  },
  customDurationInput: {
    fontFamily: GroveFontFamily,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
    color: colors.deepText,
    textAlign: "center",
    minWidth: 52,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  customDurationUnit: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    color: colors.secondaryText,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
    color: colors.onAccent,
  },
  counterValueWrap: { alignItems: "center" },
  counterValue: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
    color: colors.deepText,
  },
  counterUnit: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.secondaryText,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: GroveBorderRadius.button,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnDone: {
    backgroundColor: colors.accentLime,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    color: colors.onAccent,
  },
  primaryBtnTextDone: {
    color: colors.deepText,
  },
  timerSection: {
    alignItems: "center",
  },
  timerSectionTitle: {
    textAlign: "center",
    alignSelf: "stretch",
  },
  timerWrap: {
    alignItems: "center",
    alignSelf: "stretch",
    paddingTop: 4,
    paddingBottom: 4,
  },
  timerText: {
    fontSize: 36,
    fontWeight: "700",
    /** Must exceed fontSize — display variant defaults to lineHeight 30. */
    lineHeight: 44,
    color: colors.deepText,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    includeFontPadding: false,
  },
  timerControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },
  timerCtrlBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: GroveBorderRadius.button,
    minWidth: 72,
    alignItems: "center",
  },
  timerCtrlStop: {
    backgroundColor: colors.white,
    borderWidth: 2,
  },
  timerCtrlTextPrimary: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    color: colors.onAccent,
  },
  timerCtrlTextMuted: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  input: {
    fontFamily: GroveFontFamily,
    backgroundColor: colors.white,
    borderRadius: GroveBorderRadius.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 20,
    color: colors.deepText,
    borderWidth: 2,
    marginBottom: 8,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  reward: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.deepText,
    marginTop: 8,
    fontWeight: "500",
    textAlign: "center",
  },
});
}

