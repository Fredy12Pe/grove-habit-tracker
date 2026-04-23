import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GroveBorderRadius, GroveColors } from "@/styles/theme";
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
  return (
    <TouchableOpacity
      style={[styles.addCustomRow, style]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.addCustomIcon}>
        <IconSymbol
          name="plus"
          size={16}
          color={GroveColors.primaryText}
          weight="bold"
        />
      </View>
      <View style={styles.addCustomTextCol}>
        <AppText variant="paragraph" style={styles.addCustomTitle}>
          Add a custom habit
        </AppText>
        <AppText variant="small" style={styles.addCustomSubtle}>
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
    backgroundColor: GroveColors.white,
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
    backgroundColor: GroveColors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  addCustomTextCol: {
    flex: 1,
    gap: 3,
  },
  addCustomTitle: {
    fontWeight: "600",
    color: GroveColors.primaryText,
    fontSize: 15,
  },
  addCustomSubtle: {
    color: GroveColors.secondaryText,
    fontSize: 11,
  },
});
