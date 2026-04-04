import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export function gameSelection(): void {
  if (Platform.OS === "web") return;
  void Haptics.selectionAsync();
}

export function gameImpactLight(): void {
  if (Platform.OS === "web") return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function gameImpactMedium(): void {
  if (Platform.OS === "web") return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function gameImpactRigid(): void {
  if (Platform.OS === "web") return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
}

export function gameSuccess(): void {
  if (Platform.OS === "web") return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** First contact when dragging the walk joystick (full game only). */
export const gameJoystickEngage = gameImpactLight;
