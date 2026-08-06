import { AppText } from "@/components/ui/AppText";
import {
  triggerHabitCounterStepHaptic,
  triggerHabitTimerStartedHaptic,
} from "@/lib/habitHaptics";
import {
  formatTime,
  isHabitComplete,
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
import React, { useMemo } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

interface HabitFormInlineProps {
  habit: HabitWithActions;
  onUpdate: (id: string, updates: Partial<HabitWithActions>) => void;
  /** Darker shade of the habit card background for controls. */
  accentColor: string;
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

  const updateProgress = (progress: HabitProgress) => {
    const next = { ...habit, progress };
    (next as HabitWithActions).completedToday = isHabitComplete(
      next as HabitWithActions,
    );
    onUpdate(habit.id, { progress, completedToday: next.completedToday });
  };

  const updateSetup = (setup: HabitSetup) => {
    const updates: Partial<HabitWithActions> = { setup };
    if (habit.type === "timer" && "durationMinutes" in setup) {
      const p = habit.progress as TimerProgress;
      if (!p.isRunning && !p.completed) {
        updates.progress = {
          ...p,
          secondsRemaining: (setup as TimerSetup).durationMinutes * 60,
        };
      }
    }
    onUpdate(habit.id, updates);
  };

  const renderSetup = () => {
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
              Write at least 10 characters to complete.
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
        const done = p.completed || p.secondsRemaining <= 0;
        const fullDuration = s.durationMinutes * 60;
        const isIdle =
          !p.isRunning && !done && p.secondsRemaining >= fullDuration;

        return (
          <View style={styles.section}>
            <AppText variant="small" style={styles.sectionTitle}>
              Today’s action
            </AppText>
            {isIdle && (
              <Pressable
                style={[styles.primaryBtn, accentFill]}
                onPress={() =>
                  updateProgress({
                    ...p,
                    secondsRemaining: fullDuration,
                    isRunning: true,
                  })
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
                  {done ? "0:00" : formatTime(p.secondsRemaining)}
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
                        onPress={() =>
                          updateProgress({ ...p, isRunning: false })
                        }
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
                          updateProgress({ ...p, isRunning: true });
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
                        updateProgress({
                          ...p,
                          isRunning: false,
                          completed: false,
                          secondsRemaining: fullDuration,
                        })
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
          const items = p.gratitudeItems ?? Array(count).fill("");
          const updateItem = (i: number, val: string) => {
            const next = [...items];
            next[i] = val;
            while (next.length < count) next.push("");
            while (next.length > count) next.pop();
            updateProgress({ ...p, gratitudeItems: next });
          };
          return (
            <View style={styles.section}>
              <AppText variant="small" style={styles.sectionTitle}>
                Today’s gratitude
              </AppText>
              {Array.from({ length: count }, (_, i) => (
                <TextInput
                  key={i}
                  style={[styles.input, accentOutline]}
                  placeholder={`Gratitude ${i + 1}`}
                  placeholderTextColor={colors.secondaryText}
                  value={items[i] ?? ""}
                  onChangeText={(val) => updateItem(i, val)}
                />
              ))}
              {isHabitComplete(habit) && (
                <AppText variant="paragraphRegular" style={styles.reward}>
                  Your plant grew a little 🌱
                </AppText>
              )}
            </View>
          );
        }
        const p = habit.progress as InputProgress;
        return (
          <View style={styles.section}>
            <AppText variant="small" style={styles.sectionTitle}>
              Today’s entry
            </AppText>
            <TextInput
              style={[styles.input, styles.inputMultiline, accentOutline]}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.secondaryText}
              value={p.text}
              onChangeText={(text) => updateProgress({ ...p, text })}
              multiline
              numberOfLines={4}
            />
            {isHabitComplete(habit) && (
              <AppText variant="paragraphRegular" style={styles.reward}>
                Your plant grew a little 🌱
              </AppText>
            )}
          </View>
        );
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
    paddingTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
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
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.deepText,
    minWidth: 44,
    textAlign: "center",
  },
  customDurationInput: {
    fontFamily: GroveFontFamily,
    fontSize: 16,
    fontWeight: "700",
    color: colors.deepText,
    textAlign: "center",
    minWidth: 48,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  customDurationUnit: {
    fontSize: 14,
    fontWeight: "600",
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
    color: colors.onAccent,
  },
  counterValueWrap: { alignItems: "center" },
  counterValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.deepText,
  },
  counterUnit: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: GroveBorderRadius.button,
    alignItems: "center",
  },
  primaryBtnDone: {
    backgroundColor: colors.accentLime,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onAccent,
  },
  primaryBtnTextDone: {
    color: colors.deepText,
  },
  timerWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  timerText: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.deepText,
    fontVariant: ["tabular-nums"],
  },
  timerControls: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
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
    color: colors.onAccent,
  },
  timerCtrlTextMuted: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    fontFamily: GroveFontFamily,
    backgroundColor: colors.white,
    borderRadius: GroveBorderRadius.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
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
    color: colors.deepText,
    marginTop: 8,
    fontWeight: "500",
  },
});
}

