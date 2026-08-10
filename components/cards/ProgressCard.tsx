import { ProgressBlobs } from "@/components/cards/ProgressBlobs";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGroveColors } from "@/hooks/useGroveColors";
import { GroveBorderRadius } from "@/styles/theme";
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
  const colors = useGroveColors();
  const segmentCount = Math.max(totalCount, 1);
  const cardTappable = readonly && !!onCompleteHabits;

  const content = (
    <Card
      style={[styles.cardWrapper, { backgroundColor: colors.softSurface }]}
    >
      <View style={styles.blobs} pointerEvents="none">
        <ProgressBlobs />
      </View>

      <View style={styles.headerRow}>
        <AppText variant="h1" style={[styles.title, { color: colors.deepText }]}>
          Today&apos;s Progress
        </AppText>
        {onCompleteHabits ? (
          cardTappable ? (
            <IconSymbol
              name="chevron.right"
              size={16}
              color={colors.deepText}
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
                color={colors.deepText}
              />
            </TouchableOpacity>
          )
        ) : null}
      </View>

      <AppText variant="small" style={[styles.summary, { color: colors.mutedGray }]}>
        {completedCount}/{totalCount} Habits Completed
      </AppText>

      <View style={styles.progressRow}>
        {Array.from({ length: segmentCount }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              {
                backgroundColor:
                  i < completedCount ? colors.accentLime : colors.mutedGray,
              },
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
                    ? {
                        backgroundColor: colors.accentLime,
                        borderColor: colors.accentLime,
                      }
                    : {
                        backgroundColor: "transparent",
                        borderColor: colors.accentLime,
                      },
                ]}
              >
                {habit.completed ? (
                  <IconSymbol
                    name="checkmark"
                    size={10}
                    color={colors.onAccent}
                  />
                ) : null}
              </View>
              <AppText
                variant="h2"
                style={[
                  styles.habitName,
                  {
                    color: habit.completed
                      ? colors.deepText
                      : colors.mutedGray,
                  },
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
    borderRadius: GroveBorderRadius.homeCard,
    paddingTop: 36,
    paddingBottom: 36,
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
    flex: 1,
    paddingRight: 12,
  },
  summary: {
    marginBottom: 12,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: "600",
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
    borderWidth: 3,
  },
  habitName: {
    fontSize: 18.5,
    lineHeight: 25,
    fontWeight: "600",
  },
});
