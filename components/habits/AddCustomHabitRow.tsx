import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGroveColors } from "@/hooks/useGroveColors";
import { GroveBorderRadius } from "@/styles/theme";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";

type AddCustomHabitRowProps = {
  onPress: () => void;
  style?: ViewStyle;
};

/**
 * Same “Add a custom habit” callout as onboarding (`choose-habits`).
 */
export function AddCustomHabitRow({ onPress, style }: AddCustomHabitRowProps) {
  const colors = useGroveColors();

  return (
    <TouchableOpacity
      style={[
        styles.addCustomRow,
        { backgroundColor: colors.softSurface },
        style,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View
        style={[styles.addCustomIcon, { backgroundColor: colors.white }]}
      >
        <IconSymbol
          name="plus"
          size={16}
          color={colors.deepText}
          weight="bold"
        />
      </View>
      <View style={styles.addCustomTextCol}>
        <AppText
          variant="paragraph"
          style={[styles.addCustomTitle, { color: colors.deepText }]}
        >
          Add a custom habit
        </AppText>
        <AppText
          variant="small"
          style={[styles.addCustomSubtle, { color: colors.secondaryText }]}
        >
          Something personal, simple, and yours
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addCustomRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: GroveBorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    overflow: "hidden",
  },
  addCustomIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addCustomTextCol: {
    flex: 1,
    gap: 3,
  },
  addCustomTitle: {
    fontWeight: "600",
    fontSize: 15,
  },
  addCustomSubtle: {
    fontSize: 11,
  },
});
