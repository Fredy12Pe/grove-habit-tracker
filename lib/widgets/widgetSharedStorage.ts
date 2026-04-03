import { ExtensionStorage } from "@bacons/apple-targets";
import { Platform } from "react-native";

const APP_GROUP = "group.com.groveHabits.app";

export const widgetStorageKeys = {
  daily: "grove_daily",
  weekly: "grove_weekly",
} as const;

/** Must match `kind` on `GroveHabitsWidget` in `targets/widget/GroveWidgets.swift`. */
export const widgetTimelineKind = "GroveHabitsWidget" as const;

export function pushWidgetSnapshots(payload: { dailyJson: string; weeklyJson: string }) {
  if (Platform.OS !== "ios") return;
  try {
    const storage = new ExtensionStorage(APP_GROUP);
    storage.set(widgetStorageKeys.daily, payload.dailyJson);
    storage.set(widgetStorageKeys.weekly, payload.weeklyJson);
    ExtensionStorage.reloadWidget(widgetTimelineKind);
  } catch {
    // Widgets require a dev build with the extension; ignore elsewhere.
  }
}
