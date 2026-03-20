import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
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
  formatTime,
  isHabitComplete,
} from "@/lib/habitsWithActions";
import {
  GroveBorderRadius,
  GroveColors,
  GroveSpacing,
} from "@/styles/theme";

interface HabitFormInlineProps {
  habit: HabitWithActions;
  onUpdate: (id: string, updates: Partial<HabitWithActions>) => void;
}

export function HabitFormInline({ habit, onUpdate }: HabitFormInlineProps) {
  const updateProgress = (progress: HabitProgress) => {
    const next = { ...habit, progress };
    (next as HabitWithActions).completedToday = isHabitComplete(next as HabitWithActions);
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
            <Text style={styles.sectionTitle}>Duration (minutes)</Text>
            <View style={styles.pillRow}>
              {presets.map((min) => (
                <Pressable
                  key={min}
                  style={[styles.pill, s.durationMinutes === min && styles.pillSelected]}
                  onPress={() => updateSetup({ durationMinutes: min })}
                >
                  <Text style={[styles.pillText, s.durationMinutes === min && styles.pillTextSelected]}>{min}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.customLabel}>Or custom</Text>
            <View style={styles.stepperRow}>
              <TextInput
                style={styles.customDurationInput}
                keyboardType="number-pad"
                value={String(customMinutes)}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num)) {
                    updateSetup({ durationMinutes: Math.max(1, Math.min(120, num)) });
                  } else if (text === "") {
                    updateSetup({ durationMinutes: 1 });
                  }
                }}
                selectTextOnFocus
                maxLength={3}
              />
              <Text style={styles.customDurationUnit}>min</Text>
            </View>
          </View>
        );
      }
      case "counter": {
        const s = habit.setup as CounterSetup;
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily goal</Text>
            <View style={styles.stepperRow}>
              <Pressable style={styles.stepperBtn} onPress={() => updateSetup({ ...s, goal: Math.max(1, s.goal - 1) })}>
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{s.goal} {s.unit ?? ""}</Text>
              <Pressable style={styles.stepperBtn} onPress={() => updateSetup({ ...s, goal: s.goal + 1 })}>
                <Text style={styles.stepperText}>+</Text>
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
              <Text style={styles.sectionTitle}>Number of gratitude items</Text>
              <View style={styles.stepperRow}>
                <Pressable style={styles.stepperBtn} onPress={() => updateSetup({ ...s, gratitudeCount: Math.max(1, count - 1) })}>
                  <Text style={styles.stepperText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{count}</Text>
                <Pressable style={styles.stepperBtn} onPress={() => updateSetup({ ...s, gratitudeCount: count + 1 })}>
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        }
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Journaling</Text>
            <Text style={styles.hint}>Write at least 10 characters to complete.</Text>
          </View>
        );
      case "scheduled": {
        const s = habit.setup as ScheduledSetup;
        if (s.goalHours != null) {
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Target sleep (hours)</Text>
              <View style={styles.stepperRow}>
                <Pressable style={styles.stepperBtn} onPress={() => updateSetup({ ...s, goalHours: Math.max(4, (s.goalHours ?? 7) - 1) })}>
                  <Text style={styles.stepperText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{s.goalHours ?? 7} h</Text>
                <Pressable style={styles.stepperBtn} onPress={() => updateSetup({ ...s, goalHours: (s.goalHours ?? 7) + 1 })}>
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        }
        if (s.maxHours != null) {
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Max screen time (hours)</Text>
              <View style={styles.stepperRow}>
                <Pressable style={styles.stepperBtn} onPress={() => updateSetup({ ...s, maxHours: Math.max(0, (s.maxHours ?? 2) - 1) })}>
                  <Text style={styles.stepperText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{s.maxHours ?? 2} h</Text>
                <Pressable style={styles.stepperBtn} onPress={() => updateSetup({ ...s, maxHours: (s.maxHours ?? 2) + 1 })}>
                  <Text style={styles.stepperText}>+</Text>
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
            <Text style={styles.sectionTitle}>Setup</Text>
            <Text style={styles.hint}>Confirm daily when you’ve stayed on track.</Text>
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
            <Text style={styles.sectionTitle}>Daily action</Text>
            <Pressable
              style={[styles.primaryBtn, p.confirmed && styles.primaryBtnDone]}
              onPress={() => updateProgress({ confirmed: !p.confirmed })}
            >
              <Text style={styles.primaryBtnText}>{p.confirmed ? "Completed ✓" : label}</Text>
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
            <Text style={styles.sectionTitle}>Today’s progress</Text>
            <View style={styles.counterRow}>
              <Pressable style={styles.counterBtn} onPress={() => updateProgress({ current: Math.max(0, p.current - 1) })}>
                <Text style={styles.counterBtnText}>−</Text>
              </Pressable>
              <View style={styles.counterValueWrap}>
                <Text style={styles.counterValue}>{p.current}</Text>
                <Text style={styles.counterUnit}>/ {s.goal} {s.unit ?? ""}</Text>
              </View>
              <Pressable style={styles.counterBtn} onPress={() => updateProgress({ current: p.current + 1 })}>
                <Text style={styles.counterBtnText}>+</Text>
              </Pressable>
            </View>
            {complete && <Text style={styles.reward}>Your plant grew a little 🌱</Text>}
          </View>
        );
      }
      case "timer": {
        const p = habit.progress as TimerProgress;
        const s = habit.setup as TimerSetup;
        const done = p.completed || p.secondsRemaining <= 0;
        const fullDuration = s.durationMinutes * 60;
        const isIdle = !p.isRunning && !done && p.secondsRemaining >= fullDuration;

        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today’s action</Text>
            {isIdle && (
              <Pressable
                style={styles.primaryBtn}
                onPress={() =>
                  updateProgress({
                    ...p,
                    secondsRemaining: fullDuration,
                    isRunning: true,
                  })
                }
              >
                <Text style={styles.primaryBtnText}>Start {s.durationMinutes} min</Text>
              </Pressable>
            )}
            {!isIdle && (
              <View style={styles.timerWrap}>
                <Text style={styles.timerText}>{done ? "0:00" : formatTime(p.secondsRemaining)}</Text>
                {done && <Text style={styles.reward}>A butterfly visited your grove 🦋</Text>}
                {!done && (
                  <View style={styles.timerControls}>
                    {p.isRunning ? (
                      <Pressable
                        style={[styles.timerCtrlBtn, styles.timerCtrlPause]}
                        onPress={() => updateProgress({ ...p, isRunning: false })}
                      >
                        <Text style={styles.timerCtrlTextPrimary}>Pause</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.timerCtrlBtn, styles.timerCtrlPlay]}
                        onPress={() => updateProgress({ ...p, isRunning: true })}
                      >
                        <Text style={styles.timerCtrlTextPrimary}>Play</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.timerCtrlBtn, styles.timerCtrlStop]}
                      onPress={() =>
                        updateProgress({
                          ...p,
                          isRunning: false,
                          completed: false,
                          secondsRemaining: fullDuration,
                        })
                      }
                    >
                      <Text style={styles.timerCtrlTextMuted}>Stop</Text>
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
              <Text style={styles.sectionTitle}>Today’s gratitude</Text>
              {Array.from({ length: count }, (_, i) => (
                <TextInput
                  key={i}
                  style={styles.input}
                  placeholder={`Gratitude ${i + 1}`}
                  placeholderTextColor={GroveColors.secondaryText}
                  value={items[i] ?? ""}
                  onChangeText={(val) => updateItem(i, val)}
                />
              ))}
              {isHabitComplete(habit) && <Text style={styles.reward}>Your plant grew a little 🌱</Text>}
            </View>
          );
        }
        const p = habit.progress as InputProgress;
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today’s entry</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="What's on your mind?"
              placeholderTextColor={GroveColors.secondaryText}
              value={p.text}
              onChangeText={(text) => updateProgress({ ...p, text })}
              multiline
              numberOfLines={4}
            />
            {isHabitComplete(habit) && <Text style={styles.reward}>Your plant grew a little 🌱</Text>}
          </View>
        );
      case "scheduled": {
        const p = habit.progress as ScheduledProgress;
        const s = habit.setup as ScheduledSetup;
        if (s.goalHours != null) {
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How many hours did you sleep?</Text>
              <View style={styles.stepperRow}>
                <Pressable style={styles.stepperBtn} onPress={() => updateProgress({ value: Math.max(0, p.value - 1) })}>
                  <Text style={styles.stepperText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{p.value} h</Text>
                <Pressable style={styles.stepperBtn} onPress={() => updateProgress({ value: p.value + 1 })}>
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
              {isHabitComplete(habit) && <Text style={styles.reward}>Rest well 🌙</Text>}
            </View>
          );
        }
        if (s.maxHours != null) {
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Screen time today (hours)</Text>
              <View style={styles.stepperRow}>
                <Pressable style={styles.stepperBtn} onPress={() => updateProgress({ value: Math.max(0, p.value - 0.5) })}>
                  <Text style={styles.stepperText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{p.value} h</Text>
                <Pressable style={styles.stepperBtn} onPress={() => updateProgress({ value: p.value + 0.5 })}>
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
              {isHabitComplete(habit) && <Text style={styles.reward}>Under limit 📵</Text>}
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

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: GroveColors.primaryText,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: GroveColors.secondaryText,
    lineHeight: 18,
  },
  customLabel: {
    fontSize: 12,
    color: GroveColors.secondaryText,
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
    backgroundColor: GroveColors.cardBackground,
    borderWidth: 2,
    borderColor: GroveColors.inactive,
  },
  pillSelected: {
    backgroundColor: GroveColors.primaryGreen,
    borderColor: GroveColors.primaryGreen,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    color: GroveColors.primaryText,
  },
  pillTextSelected: {
    color: GroveColors.white,
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
    backgroundColor: GroveColors.white,
    borderWidth: 1,
    borderColor: GroveColors.inactive,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: {
    fontSize: 18,
    fontWeight: "600",
    color: GroveColors.primaryText,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: "700",
    color: GroveColors.primaryText,
    minWidth: 44,
    textAlign: "center",
  },
  customDurationInput: {
    fontSize: 16,
    fontWeight: "700",
    color: GroveColors.primaryText,
    textAlign: "center",
    minWidth: 48,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: GroveColors.inactive,
    borderRadius: 8,
    backgroundColor: GroveColors.white,
  },
  customDurationUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: GroveColors.secondaryText,
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
    backgroundColor: GroveColors.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    fontSize: 22,
    fontWeight: "600",
    color: GroveColors.white,
  },
  counterValueWrap: { alignItems: "center" },
  counterValue: {
    fontSize: 24,
    fontWeight: "700",
    color: GroveColors.primaryText,
  },
  counterUnit: {
    fontSize: 13,
    color: GroveColors.secondaryText,
  },
  primaryBtn: {
    backgroundColor: GroveColors.primaryGreen,
    paddingVertical: 14,
    borderRadius: GroveBorderRadius.button,
    alignItems: "center",
  },
  primaryBtnDone: {
    backgroundColor: "#6B8E23",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: GroveColors.white,
  },
  timerWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  timerText: {
    fontSize: 36,
    fontWeight: "700",
    color: GroveColors.primaryText,
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
  timerCtrlPause: {
    backgroundColor: GroveColors.primaryGreen,
  },
  timerCtrlPlay: {
    backgroundColor: GroveColors.primaryGreen,
  },
  timerCtrlStop: {
    backgroundColor: GroveColors.white,
    borderWidth: 2,
    borderColor: GroveColors.inactive,
  },
  timerCtrlTextPrimary: {
    fontSize: 14,
    fontWeight: "600",
    color: GroveColors.white,
  },
  timerCtrlTextMuted: {
    fontSize: 14,
    fontWeight: "600",
    color: GroveColors.primaryText,
  },
  input: {
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: GroveColors.primaryText,
    borderWidth: 1,
    borderColor: GroveColors.inactive,
    marginBottom: 8,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  reward: {
    fontSize: 13,
    color: "#6B8E23",
    marginTop: 8,
    fontWeight: "500",
  },
});
