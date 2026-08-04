import { ProgressBlobs } from "@/components/cards/ProgressBlobs";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GroveBorderRadius, GroveColors } from "@/styles/theme";
import React from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";

export interface HabitItem {
  id: string;
  name: string;
  completed: boolean;
}

interface ProgressCardProps {
  completedCount: number;
  totalCount: number;
  habits: HabitItem[];
  onToggleHabit?: (id: string) => void;
  onCompleteHabits?: () => void;
  readonly?: boolean;
}

export function ProgressCard({
  completedCount,
  totalCount,
  habits,
  onToggleHabit,
  onCompleteHabits,
  readonly = false,
}: ProgressCardProps) {
  const segmentCount = Math.max(totalCount, 1);
  const cardTappable = readonly && !!onCompleteHabits;

  const content = (
    <Card style={styles.cardWrapper}>
      <View style={styles.blobs} pointerEvents="none">
        <ProgressBlobs />
      </View>

      <View style={styles.headerRow}>
        <AppText variant="h1" style={styles.title}>
          Today's Progress
        </AppText>
        {onCompleteHabits ? (
          cardTappable ? (
            <IconSymbol
              name="chevron.right"
              size={16}
              color={GroveColors.deepText}
            />
          ) : (
            <TouchableOpacity
              onPress={onCompleteHabits}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go to habits"
            >
              <IconSymbol
                name="chevron.right"
                size={16}
                color={GroveColors.deepText}
              />
            </TouchableOpacity>
          )
        ) : null}
      </View>

      <AppText variant="small" style={styles.summary}>
        {completedCount}/{totalCount} Habits Completed
      </AppText>

      <View style={styles.progressRow}>
        {Array.from({ length: segmentCount }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i < completedCount
                ? styles.progressSegmentFilled
                : styles.progressSegmentInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.habitList}>
        {habits.map((habit) => {
          const RowComponent = readonly ? View : TouchableOpacity;
          const rowProps = readonly
            ? {}
            : {
                onPress: () => onToggleHabit?.(habit.id),
                activeOpacity: 0.7,
              };
          return (
            <RowComponent key={habit.id} style={styles.habitRow} {...rowProps}>
              <View
                style={[
                  styles.checkbox,
                  habit.completed
                    ? styles.checkboxFilled
                    : styles.checkboxEmpty,
                ]}
              >
                {habit.completed ? (
                  <IconSymbol
                    name="checkmark"
                    size={10}
                    color={GroveColors.white}
                  />
                ) : null}
              </View>
              <AppText
                variant="h2"
                style={[
                  styles.habitName,
                  !habit.completed && styles.habitNameInactive,
                ]}
              >
                {habit.name}
              </AppText>
            </RowComponent>
          );
        })}
      </View>
    </Card>
  );

  if (cardTappable) {
    return (
      <Pressable
        onPress={onCompleteHabits}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Go to habits"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: GroveBorderRadius.homeCard,
  },
  pressed: {
    opacity: 0.92,
  },
  cardWrapper: {
    overflow: "hidden",
    backgroundColor: GroveColors.softSurface,
    borderRadius: GroveBorderRadius.homeCard,
    paddingTop: 36,
    paddingBottom: 10,
    // Match garden / breathe text inset (30)
    paddingHorizontal: 30,
    minHeight: 384,
  },
  /**
   * Whole blob cluster pinned to the bottom-right corner.
   * Figma frame is 363×384; the cluster's box spans x 261→523, y 137→418,
   * so it hangs 160px past the right edge and 34px past the bottom.
   */
  blobs: {
    position: "absolute",
    right: -130,
    bottom: -34,
    width: 262,
    height: 281,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20.5,
    lineHeight: 27,
    fontWeight: "600",
    color: GroveColors.deepText,
    flex: 1,
    paddingRight: 12,
  },
  summary: {
    marginBottom: 12,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: "600",
    color: GroveColors.mutedGray,
  },
  progressRow: {
    flexDirection: "row",
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: 30,
  },
  progressSegment: {
    width: 20,
    height: 6,
    borderRadius: 50,
  },
  progressSegmentFilled: {
    backgroundColor: GroveColors.accentLime,
  },
  progressSegmentInactive: {
    backgroundColor: GroveColors.mutedGray,
  },
  habitList: {
    gap: 12,
    maxWidth: 220,
    zIndex: 1,
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxEmpty: {
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: GroveColors.accentLime,
  },
  checkboxFilled: {
    backgroundColor: GroveColors.accentLime,
    borderWidth: 3,
    borderColor: GroveColors.accentLime,
  },
  habitName: {
    fontSize: 18.5,
    lineHeight: 25,
    fontWeight: "600",
    color: GroveColors.deepText,
  },
  habitNameInactive: {
    color: GroveColors.mutedGray,
  },
});
