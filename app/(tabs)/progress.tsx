import { HABIT_CARD_THEMES } from "@/components/habits/HabitRow";
import { MonthHeatmap } from "@/components/progress/MonthHeatmap";
import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGroveColors } from "@/hooks/useGroveColors";
import { CATALOG_ICON_MAP, HABIT_CATALOG } from "@/lib/habitCatalog";
import { calendarDateKey } from "@/lib/calendarDate";
import { useHabitStore } from "@/lib/store";
import {
  getActiveDaysInMonth,
  getCompletionsInMonth,
  getCurrentStreak,
} from "@/lib/stats";
import { GroveBorderRadius, GroveSpacing } from "@/styles/theme";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function habitHeatColor(
  habit: { customColor?: string; customColorIndex?: number },
  index: number,
): string {
  if (habit.customColor) return habit.customColor;
  if (typeof habit.customColorIndex === "number") {
    return HABIT_CARD_THEMES[habit.customColorIndex % HABIT_CARD_THEMES.length]
      .accent;
  }
  return HABIT_CARD_THEMES[index % HABIT_CARD_THEMES.length].accent;
}

export default function ProgressScreen() {
  const colors = useGroveColors();
  const [selectedMonth, setSelectedMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const habits = useHabitStore((s) => s.habits);
  const completionDates = useHabitStore((s) => s.completionDates);
  const recordCompletion = useHabitStore((s) => s.recordCompletion);

  const today = calendarDateKey();
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  // Keep Progress in sync with Habits tab: any habit marked completed today
  // should have today in completionDates so heatmaps stay correct.
  useEffect(() => {
    habits.forEach((h) => {
      if (h.completedToday) {
        const dates = completionDates[h.id] ?? [];
        if (!dates.includes(today)) recordCompletion(h.id, today);
      }
    });
  }, [habits, completionDates, today, recordCompletion]);

  const getActivityForHabit =
    (habitId: string, completedToday: boolean) =>
    (dayOfMonth: number, date: Date) => {
      const set = completionDates[habitId] ?? [];
      if (set.includes(calendarDateKey(date))) return 1;
      if (completedToday && calendarDateKey(date) === today) return 1;
      return 0;
    };

  const changeMonth = (delta: number) => {
    setSelectedMonth((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const changeYear = (delta: number) => {
    setSelectedMonth((d) => new Date(d.getFullYear() + delta, d.getMonth(), 1));
  };

  const records = useMemo(
    () => ({
      daysInMonth: getActiveDaysInMonth(
        completionDates,
        habits,
        today,
        year,
        month,
      ),
      completionsInMonth: getCompletionsInMonth(
        completionDates,
        habits,
        today,
        year,
        month,
      ),
      currentStreak: getCurrentStreak(completionDates, habits, today),
    }),
    [completionDates, habits, today, year, month],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.white }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: title + current month (tappable) */}
        <View style={styles.header}>
          <AppText variant="h1" style={[styles.title, { color: colors.deepText }]}>
            Progress
          </AppText>
          <TouchableOpacity
            style={[
              styles.monthPill,
              {
                backgroundColor: colors.white,
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.7}
          >
            <AppText
              variant="paragraph"
              style={[styles.monthPillText, { color: colors.deepText }]}
            >
              {monthLabel}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Records: stat cards */}
        <View style={styles.recordsSection}>
          <View style={styles.recordsRow}>
            <View
              style={[
                styles.recordCard,
                { backgroundColor: colors.softSurface },
              ]}
            >
              <View style={styles.recordIconNumberRow}>
                <IconSymbol
                  name="calendar"
                  size={18}
                  color={colors.deepText}
                />
                <AppText
                  variant="h2"
                  style={[styles.recordNumber, { color: colors.deepText }]}
                >
                  {records.daysInMonth}
                </AppText>
              </View>
              <AppText
                variant="small"
                style={[styles.recordLabel, { color: colors.mutedGray }]}
              >
                Days
              </AppText>
            </View>
            <View
              style={[
                styles.recordCard,
                { backgroundColor: colors.softSurface },
              ]}
            >
              <View style={styles.recordIconNumberRow}>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={18}
                  color={colors.accentLime}
                />
                <AppText
                  variant="h2"
                  style={[styles.recordNumber, { color: colors.deepText }]}
                >
                  {records.completionsInMonth}
                </AppText>
              </View>
              <AppText
                variant="small"
                style={[styles.recordLabel, { color: colors.mutedGray }]}
              >
                Completions
              </AppText>
            </View>
            <View
              style={[
                styles.recordCard,
                { backgroundColor: colors.softSurface },
              ]}
            >
              <View style={styles.recordIconNumberRow}>
                <IconSymbol
                  name="flame.fill"
                  size={18}
                  color={colors.streakFlame}
                />
                <AppText
                  variant="h2"
                  style={[styles.recordNumber, { color: colors.deepText }]}
                >
                  {records.currentStreak}
                </AppText>
              </View>
              <AppText
                variant="small"
                style={[styles.recordLabel, { color: colors.mutedGray }]}
              >
                Streak
              </AppText>
            </View>
          </View>
        </View>

        {/* Per-habit: two per row, month grid each */}
        <View style={styles.habitsGrid}>
          {habits.map((habit, index) => {
            const color = habitHeatColor(habit, index);
            const icon =
              CATALOG_ICON_MAP[habit.customIconCatalogId ?? habit.id] ??
              HABIT_CATALOG[0]?.icon;
            return (
              <View
                key={habit.id}
                style={[
                  styles.habitCard,
                  { backgroundColor: colors.softSurface },
                ]}
              >
                <View style={styles.habitHeader}>
                  {icon != null && (
                    <View
                      style={[
                        styles.habitIconWell,
                        { backgroundColor: colors.white },
                      ]}
                    >
                      <Image
                        source={icon}
                        style={styles.habitIcon}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  <AppText
                    variant="paragraph"
                    style={[styles.habitName, { color: colors.deepText }]}
                    numberOfLines={1}
                  >
                    {habit.name}
                  </AppText>
                </View>
                <MonthHeatmap
                  year={year}
                  month={month}
                  getActivity={getActivityForHabit(
                    habit.id,
                    habit.completedToday,
                  )}
                  color={color}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Month/Year picker modal */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View
            style={[styles.pickerCard, { backgroundColor: colors.white }]}
            onStartShouldSetResponder={() => true}
          >
            <AppText
              variant="h2"
              style={[styles.pickerTitle, { color: colors.deepText }]}
            >
              Choose month
            </AppText>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                onPress={() => changeYear(-1)}
                style={styles.pickerBtn}
                hitSlop={12}
              >
                <AppText
                  style={[styles.pickerBtnText, { color: colors.primaryGreen }]}
                >
                  ‹ Year
                </AppText>
              </TouchableOpacity>
              <AppText
                variant="paragraph"
                style={[styles.pickerValue, { color: colors.deepText }]}
              >
                {year}
              </AppText>
              <TouchableOpacity
                onPress={() => changeYear(1)}
                style={styles.pickerBtn}
                hitSlop={12}
              >
                <AppText
                  style={[styles.pickerBtnText, { color: colors.primaryGreen }]}
                >
                  Year ›
                </AppText>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                style={styles.pickerBtn}
                hitSlop={12}
              >
                <AppText
                  style={[styles.pickerBtnText, { color: colors.primaryGreen }]}
                >
                  ‹ Month
                </AppText>
              </TouchableOpacity>
              <AppText
                variant="paragraph"
                style={[styles.pickerValue, { color: colors.deepText }]}
              >
                {MONTH_NAMES[month]}
              </AppText>
              <TouchableOpacity
                onPress={() => changeMonth(1)}
                style={styles.pickerBtn}
                hitSlop={12}
              >
                <AppText
                  style={[styles.pickerBtnText, { color: colors.primaryGreen }]}
                >
                  Month ›
                </AppText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.pickerDoneBtn,
                { backgroundColor: colors.primaryGreen },
              ]}
              onPress={() => setPickerVisible(false)}
              activeOpacity={0.8}
            >
              <AppText
                style={[styles.pickerDoneText, { color: colors.onAccent }]}
              >
                Done
              </AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontWeight: "600",
  },
  monthPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: GroveBorderRadius.pill,
    minWidth: 120,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  monthPillText: {
    fontWeight: "600",
  },
  recordsSection: {
    marginBottom: GroveSpacing.sectionGap,
  },
  recordsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  recordCard: {
    flex: 1,
    borderRadius: GroveBorderRadius.card,
    paddingVertical: 22,
    paddingHorizontal: 14,
    minHeight: 76,
  },
  recordIconNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordNumber: {
    fontWeight: "600",
  },
  recordLabel: {
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pickerCard: {
    borderRadius: GroveBorderRadius.card,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  pickerTitle: {
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pickerBtn: {
    padding: 8,
  },
  pickerBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pickerValue: {
    fontWeight: "600",
  },
  pickerDoneBtn: {
    paddingVertical: 14,
    borderRadius: GroveBorderRadius.pill,
    alignItems: "center",
    marginTop: 8,
  },
  pickerDoneText: {
    fontWeight: "600",
    fontSize: 16,
  },
  habitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
    rowGap: 12,
  },
  habitCard: {
    width: "48%",
    borderRadius: GroveBorderRadius.card,
    padding: 12,
    overflow: "hidden",
  },
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  habitIconWell: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  habitIcon: {
    width: 20,
    height: 20,
  },
  habitName: {
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
    flexShrink: 1,
  },
  bottomSpacer: {
    height: 110,
  },
});
