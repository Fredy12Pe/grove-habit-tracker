/**
 * Bottom-sheet shown when the player inspects a garden plot: per-habit plant
 * cards with growth stage and week completion stats.
 */

import {
  GARDEN_MAX_PLANTS,
  getWeekCompletionCount,
  getWeekOfMonthDateRange,
  makeWeekKeyForPlot,
} from "@/lib/game/gardenBackupGrid";
import {
  FRAMES_PER_PLANT,
  getPlantDisplayName,
  getPlantIndexForHabitSlot,
  getPlantSprite,
} from "@/lib/game/plantSprites";
import type { CompletionDatesByHabit } from "@/lib/store/useHabitStore";
import type { Habit } from "@/lib/types";
import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const GARDEN_NAMES = [
  "Sunrise Garden",
  "Moonlight Garden",
  "River Garden",
  "Twilight Garden",
];

function getWeekRangeLabel(weekIndex: number): string {
  const { startDate, endDate } = getWeekOfMonthDateRange(weekIndex);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Week of ${fmt(startDate)}\u2013${fmt(endDate)}`;
}

function getGrowthLabel(completionCount: number): string {
  if (completionCount >= 5) return "Blooming";
  if (completionCount >= 3) return "Growing";
  if (completionCount >= 1) return "Sprouting";
  return "Seed";
}

export function GardenDetailsModal({
  visible,
  plotIndex,
  habits,
  completionDates,
  currentWeekPlot,
  onClose,
}: {
  visible: boolean;
  plotIndex: number;
  habits: Habit[];
  completionDates: CompletionDatesByHabit;
  currentWeekPlot: number;
  onClose: () => void;
}) {
  const safeIndex = Math.max(plotIndex, 0);
  const isFuture = safeIndex > currentWeekPlot;
  const weekKey = makeWeekKeyForPlot(new Date(), safeIndex);
  const weekRange = getWeekOfMonthDateRange(safeIndex);
  const gardenHabits = habits.slice(0, GARDEN_MAX_PLANTS);

  const habitCompletions = gardenHabits.map((h) =>
    getWeekCompletionCount(
      h.id,
      completionDates,
      weekRange.start,
      weekRange.end,
    ),
  );
  const totalCompletions = habitCompletions.reduce((a, b) => a + b, 0);
  const maxPossible = gardenHabits.length * 7;
  const pct =
    maxPossible > 0 ? Math.round((totalCompletions / maxPossible) * 100) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {GARDEN_NAMES[plotIndex] ?? "Garden"}
              </Text>
              <Text style={styles.subtitle}>{getWeekRangeLabel(safeIndex)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {isFuture ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                This week hasn&apos;t started yet.
              </Text>
              <Text style={styles.emptySubtext}>
                Check back when the week begins to see your garden grow.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <Text style={styles.statValue}>{pct}%</Text>
                  <Text style={styles.statLabel}>Complete</Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.statValue}>
                    {totalCompletions}/{maxPossible}
                  </Text>
                  <Text style={styles.statLabel}>This Week</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>This Week&apos;s Plants</Text>

              <ScrollView
                style={styles.plantList}
                contentContainerStyle={styles.plantGrid}
              >
                {gardenHabits.map((habit, idx) => {
                  const plantIndex = getPlantIndexForHabitSlot(idx, weekKey);
                  const count = habitCompletions[idx];
                  const frame = Math.min(count, FRAMES_PER_PLANT - 1);
                  const sprite = getPlantSprite(plantIndex, frame);
                  const growthLabel = getGrowthLabel(count);
                  return (
                    <View key={habit.id} style={styles.plantCard}>
                      <Image
                        source={sprite}
                        style={styles.plantImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.plantName} numberOfLines={2}>
                        {habit.name}
                      </Text>
                      <Text style={styles.plantVarietyName} numberOfLines={2}>
                        {getPlantDisplayName(plantIndex)}
                      </Text>
                      <Text style={styles.plantStatus}>{growthLabel}</Text>
                      <Text style={styles.plantStreak}>{count}/7 days</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 22,
    color: "#aaa",
    fontWeight: "600",
    paddingLeft: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statBadge: {
    flex: 1,
    backgroundColor: "#f4f7f0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3a5a20",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  plantList: {
    maxHeight: 300,
  },
  plantGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  plantCard: {
    width: "47%",
    backgroundColor: "#f9faf6",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8ecdf",
  },
  plantImage: {
    width: 56,
    height: 56,
    marginBottom: 6,
  },
  plantName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2a2a2a",
    textAlign: "center",
  },
  plantVarietyName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#5a7d4a",
    textAlign: "center",
    marginTop: 2,
  },
  plantStatus: {
    fontSize: 12,
    color: "#6a9a3a",
    marginTop: 2,
  },
  plantStreak: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#555",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: "#3a5a20",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
