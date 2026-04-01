import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GroveBorderRadius, GroveColors } from "@/styles/theme";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

export type HabitSelectData = {
  id: string;
  name: string;
  icon: number;
};

export function HabitSelectRow({
  habit,
  selected,
  disabled,
  onPress,
}: {
  habit: HabitSelectData;
  selected: boolean;
  disabled?: boolean;
  onPress: (id: string) => void;
}) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.row, selected && styles.rowSelected]}
        onPress={() => onPress(habit.id)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <View style={styles.iconWrap}>
          <Image source={habit.icon} style={styles.icon} resizeMode="contain" />
        </View>

        <View style={styles.info}>
          <AppText variant="paragraph" style={styles.name}>
            {habit.name}
          </AppText>
          <AppText variant="small" style={styles.subtle}>
            Becomes a plant in your garden
          </AppText>
        </View>

        <View
          style={[
            styles.checkbox,
            selected && styles.checkboxSelected,
            disabled && !selected && styles.checkboxDisabled,
          ]}
        >
          {selected ? (
            <IconSymbol
              name="checkmark"
              size={14}
              color={GroveColors.white}
              weight="bold"
            />
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.card,
    marginBottom: 10,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  rowSelected: {
    backgroundColor: "rgba(167, 222, 51, 0.12)",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: GroveColors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 52,
    height: 52,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontWeight: "600",
    color: GroveColors.primaryText,
    fontSize: 15,
  },
  subtle: {
    color: GroveColors.secondaryText,
    fontSize: 11,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: GroveColors.inactive,
    backgroundColor: GroveColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: GroveColors.primaryGreen,
    borderColor: GroveColors.primaryGreen,
  },
  checkboxDisabled: {
    opacity: 0.55,
  },
});

