import * as Haptics from "expo-haptics";
import { InteractionManager, Platform } from "react-native";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Run after store updates / layout so Taptic calls aren’t dropped on iOS. */
function runNativeHaptic(fn: () => void): void {
  if (Platform.OS === "web") return;
  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(fn);
  });
}

/** Haptic when a habit is marked complete (success) or incomplete (light tap). Web is a no-op. */
export function triggerHabitToggleHaptic(nowCompleted: boolean): void {
  if (Platform.OS === "web") return;
  runNativeHaptic(() => {
    if (nowCompleted) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  });
}

/** Stronger “buzz” when every habit for the day is completed (native only). */
export function triggerAllHabitsCompleteHaptic(): void {
  if (Platform.OS === "web") return;
  runNativeHaptic(() => {
    void (async () => {
      try {
        if (Platform.OS === "android") {
          await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
          await delay(55);
          await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
          await delay(55);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          return;
        }
        // iOS: success + heavy impacts = noticeable “buzz” / celebration.
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await delay(85);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await delay(50);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      } catch {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          /* ignore */
        }
      }
    })();
  });
}

/** Short tap when a habit timer starts or resumes (native only). */
export function triggerHabitTimerStartedHaptic(): void {
  if (Platform.OS === "web") return;
  runNativeHaptic(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  });
}

/**
 * Longer alarm-style buzz when a habit timer reaches zero (native only).
 * Use instead of a single success ping for timer completion.
 */
export function triggerHabitTimerFinishedHaptic(): void {
  if (Platform.OS === "web") return;
  runNativeHaptic(() => {
    void (async () => {
      try {
        if (Platform.OS === "android") {
          await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.LongPress);
          await delay(110);
          await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
          await delay(110);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await delay(70);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
          return;
        }
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await delay(160);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await delay(160);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await delay(70);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      } catch {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {
          /* ignore */
        }
      }
    })();
  });
}

/** Light tap when changing a counter habit up or down (native only). */
export function triggerHabitCounterStepHaptic(): void {
  if (Platform.OS === "web") return;
  runNativeHaptic(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  });
}
