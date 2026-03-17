import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GroveBorderRadius, GroveColors } from "@/styles/theme";
import React, { useState, type ReactNode } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";

export interface HabitData {
  id: string;
  name: string;
  streak: number;
  icon: ImageSourcePropType;
  completed: boolean;
  /** Optional progress summary (e.g. "3 / 8 glasses") */
  progressSummary?: string;
}

interface HabitRowProps {
  habit: HabitData;
  onToggle: (id: string) => void;
  /** When provided, tapping the chevron opens this habit's action (e.g. in All habits tab). */
  onOpenAction?: (habitId: string) => void;
  /** When provided, row expand shows this content instead of default message. Use with expanded + onExpandToggle for controlled mode. */
  expandedContent?: ReactNode;
  /** Controlled expanded state (use with onExpandToggle). */
  expanded?: boolean;
  /** Called when row or chevron is pressed to toggle expand (use for controlled mode). */
  onExpandToggle?: () => void;
}

export function HabitRow({ habit, onToggle, onOpenAction, expandedContent, expanded: expandedProp, onExpandToggle }: HabitRowProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isControlled = expandedProp !== undefined && onExpandToggle !== undefined;
  const expanded = isControlled ? expandedProp : internalExpanded;

  const toggleExpand = () => {
    if (onOpenAction) {
      onOpenAction(habit.id);
      return;
    }
    if (isControlled) onExpandToggle();
    else setInternalExpanded((v) => !v);
  };

  const onChevronPress = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (onOpenAction) onOpenAction(habit.id);
    else if (isControlled) onExpandToggle();
    else setInternalExpanded((v) => !v);
  };

  const chevronNode = (
    <IconSymbol
      name={expanded ? "chevron.up" : "chevron.down"}
      size={16}
      color={GroveColors.secondaryText}
    />
  );

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.row}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Image source={habit.icon} style={styles.icon} resizeMode="contain" />
        </View>

        {/* Name & streak */}
        <View style={styles.info}>
          <AppText variant="paragraph" style={styles.name}>
            {habit.name}
          </AppText>
          <AppText variant="small" style={styles.streak}>
            Streak {habit.streak} days
            {habit.progressSummary ? ` · ${habit.progressSummary}` : ""}
          </AppText>
        </View>

        {/* Checkbox — stops propagation so it doesn't toggle the dropdown */}
        <TouchableOpacity
          style={[styles.checkbox, habit.completed && styles.checkboxDone]}
          onPress={(e) => {
            e.stopPropagation();
            onToggle(habit.id);
          }}
          activeOpacity={0.7}
        >
          {habit.completed && (
            <IconSymbol
              name="checkmark"
              size={14}
              color={GroveColors.white}
              weight="bold"
            />
          )}
        </TouchableOpacity>

        {/* Chevron — opens action sheet when onOpenAction provided, else toggles expand */}
        <TouchableOpacity
          style={styles.chevronBtn}
          onPress={onChevronPress}
          activeOpacity={0.7}
        >
          {chevronNode}
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedArea}>
          {expandedContent ?? (
            <AppText variant="small" style={styles.expandedText}>
              Keep going! Complete this habit to grow your garden.
            </AppText>
          )}
        </View>
      )}
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
  streak: {
    color: GroveColors.secondaryText,
    fontSize: 12,
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
  checkboxDone: {
    backgroundColor: GroveColors.primaryGreen,
    borderColor: GroveColors.primaryGreen,
  },
  chevronBtn: {
    padding: 4,
  },
  expandedArea: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  expandedText: {
    color: GroveColors.secondaryText,
    fontSize: 12,
    lineHeight: 16,
  },
});
