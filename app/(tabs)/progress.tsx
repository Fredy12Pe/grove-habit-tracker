import { MonthHeatmap } from "@/components/progress/MonthHeatmap";
import { AppText } from "@/components/ui/AppText";
import { CATALOG_ICON_MAP } from "@/lib/habitCatalog";
import { calendarDateKey } from "@/lib/calendarDate";
import { useHabitStore } from "@/lib/store";
import {
  getActiveDaysInMonth,
  getCompletionsInMonth,
  getCurrentStreak,
} from "@/lib/stats";
import { GroveBorderRadius, GroveColors, GroveSpacing } from "@/styles/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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

const HEATMAP_COLORS = [
  "#A7DE33", // green (overall / first)
  "#8B7EC8", // purple
  "#5B8DEE", // blue
  "#4ECDC4", // teal
  "#95E1A3", // light green
  "#DDA0DD", // plum
  "#87CEEB", // sky blue
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function ProgressScreen() {
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: title + current month (tappable) */}
        <View style={styles.header}>
          <AppText variant="h1" style={styles.title}>
            Progress
          </AppText>
          <TouchableOpacity
            style={styles.monthPill}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.7}
          >
            <AppText variant="paragraph" style={styles.monthPillText}>
              {monthLabel}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Records: stat cards */}
        <View style={styles.recordsSection}>
          <View style={styles.recordsRow}>
            <View style={styles.recordCard}>
              <View style={styles.recordIconNumberRow}>
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color={GroveColors.primaryText}
                />
                <AppText variant="h2" style={styles.recordNumber}>
                  {records.daysInMonth}
                </AppText>
              </View>
              <AppText variant="small" style={styles.recordUnit}>
                {records.daysInMonth === 1 ? "Day" : "Days"}
              </AppText>
              <AppText variant="small" style={styles.recordLabel}>
                Days in {MONTH_NAMES[month]}
              </AppText>
            </View>
            <View style={styles.recordCard}>
              <View style={styles.recordIconNumberRow}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={GroveColors.primaryText}
                />
                <AppText variant="h2" style={styles.recordNumber}>
                  {records.completionsInMonth}
                </AppText>
              </View>
              <AppText variant="small" style={styles.recordUnit}>
                {records.completionsInMonth === 1 ? "Completion" : "Completions"}
              </AppText>
              <AppText variant="small" style={styles.recordLabel}>
                Completions in {MONTH_NAMES[month]}
              </AppText>
            </View>
            <View style={styles.recordCard}>
              <View style={styles.recordIconNumberRow}>
                <MaterialIcons
                  name="local-fire-department"
                  size={20}
                  color={GroveColors.primaryText}
                />
                <AppText variant="h2" style={styles.recordNumber}>
                  {records.currentStreak}
                </AppText>
              </View>
              <AppText variant="small" style={styles.recordUnit}>
                {records.currentStreak === 1 ? "Day" : "Days"}
              </AppText>
              <AppText variant="small" style={styles.recordLabel}>
                Current Streak
              </AppText>
            </View>
          </View>
        </View>

        {/* Per-habit: two per row, month grid each */}
        <View style={styles.habitsGrid}>
          {habits.map((habit, index) => {
            const color =
              HEATMAP_COLORS[(index % (HEATMAP_COLORS.length - 1)) + 1] ??
              HEATMAP_COLORS[1];
            const icon = CATALOG_ICON_MAP[habit.id];
            return (
              <View key={habit.id} style={styles.habitCard}>
                <View style={styles.habitSectionBorder} />
                <View style={styles.habitHeader}>
                  {icon != null && (
                    <Image
                      source={icon}
                      style={styles.habitIcon}
                      resizeMode="contain"
                    />
                  )}
                  <AppText
                    variant="paragraph"
                    style={styles.habitName}
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
            style={styles.pickerCard}
            onStartShouldSetResponder={() => true}
          >
            <AppText variant="h2" style={styles.pickerTitle}>
              Choose month
            </AppText>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                onPress={() => changeYear(-1)}
                style={styles.pickerBtn}
                hitSlop={12}
              >
                <AppText style={styles.pickerBtnText}>‹ Year</AppText>
              </TouchableOpacity>
              <AppText variant="paragraph" style={styles.pickerValue}>
                {year}
              </AppText>
              <TouchableOpacity
                onPress={() => changeYear(1)}
                style={styles.pickerBtn}
                hitSlop={12}
              >
                <AppText style={styles.pickerBtnText}>Year ›</AppText>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                style={styles.pickerBtn}
                hitSlop={12}
              >
                <AppText style={styles.pickerBtnText}>‹ Month</AppText>
              </TouchableOpacity>
              <AppText variant="paragraph" style={styles.pickerValue}>
                {MONTH_NAMES[month]}
              </AppText>
              <TouchableOpacity
                onPress={() => changeMonth(1)}
                style={styles.pickerBtn}
                hitSlop={12}
              >
                <AppText style={styles.pickerBtnText}>Month ›</AppText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.pickerDoneBtn}
              onPress={() => setPickerVisible(false)}
              activeOpacity={0.8}
            >
              <AppText style={styles.pickerDoneText}>Done</AppText>
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
    backgroundColor: GroveColors.background,
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
    color: GroveColors.primaryText,
    fontWeight: "700",
  },
  monthPill: {
    backgroundColor: GroveColors.cardBackground,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: GroveSpacing.sectionGap,
    minWidth: 120,
    alignItems: "center",
  },
  monthPillText: {
    color: GroveColors.primaryText,
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
    backgroundColor: GroveColors.cardBackground,
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
    color: GroveColors.primaryText,
  },
  recordUnit: {
    color: GroveColors.secondaryText,
    marginTop: 2,
  },
  recordLabel: {
    color: GroveColors.secondaryText,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pickerCard: {
    backgroundColor: GroveColors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  pickerTitle: {
    marginBottom: 20,
    textAlign: "center",
    color: GroveColors.primaryText,
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
    color: GroveColors.primaryGreen,
    fontWeight: "600",
  },
  pickerValue: {
    color: GroveColors.primaryText,
    fontWeight: "600",
  },
  pickerDoneBtn: {
    backgroundColor: GroveColors.primaryGreen,
    paddingVertical: 14,
    borderRadius: GroveBorderRadius.button,
    alignItems: "center",
    marginTop: 8,
  },
  pickerDoneText: {
    color: GroveColors.white,
    fontWeight: "600",
    fontSize: 16,
  },
  habitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
    gap: 36,
  },
  habitCard: {
    width: "45%",
    minWidth: 140,
    marginBottom: 40,
  },
  habitSectionBorder: {
    borderTopWidth: 1,
    borderTopColor: GroveColors.inactive,
    marginBottom: 14,
  },
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  habitIcon: {
    width: 24,
    height: 24,
  },
  habitName: {
    color: GroveColors.primaryText,
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
  },
  bottomSpacer: {
    height: 40,
  },
});
