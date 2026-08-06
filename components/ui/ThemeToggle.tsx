import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGroveColors } from "@/hooks/useGroveColors";
import { useThemeStore } from "@/lib/store/useThemeStore";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

/**
 * Compact sun/moon control matching Home streak-pill chrome.
 */
export function ThemeToggle() {
  const colors = useGroveColors();
  const preference = useThemeStore((s) => s.preference);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = preference === "dark";

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        toggle();
      }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: colors.white,
          borderColor: colors.borderSubtle,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
      hitSlop={6}
    >
      <IconSymbol
        name={isDark ? "sun.max.fill" : "moon.fill"}
        size={18}
        color={isDark ? colors.accentLime : colors.deepText}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
