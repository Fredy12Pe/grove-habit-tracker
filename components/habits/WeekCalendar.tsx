import {
  addCalendarDays,
  calendarDateKey,
  calendarTodayDate,
  startOfWeekMonday,
} from "@/lib/calendarDate";
import { AppText } from "@/components/ui/AppText";
import { GroveBorderRadius, GroveColors } from "@/styles/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type MonthCell = { kind: "blank" } | { kind: "day"; day: number };

function buildMonthCells(year: number, month: number): MonthCell[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ kind: "blank" });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ kind: "day", day: d });
  while (cells.length % 7 !== 0) cells.push({ kind: "blank" });
  return cells;
}

export interface WeekCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function WeekCalendar({
  selectedDate,
  onSelectDate,
}: WeekCalendarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const today = calendarTodayDate();
  const todayKey = calendarDateKey(today);
  const selectedKey = calendarDateKey(selectedDate);
  const thisWeekMonday = startOfWeekMonday(today);
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addCalendarDays(thisWeekMonday, i),
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarSpacer} />
        <TouchableOpacity
          style={styles.toolbarIconBtn}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.7}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open calendar"
        >
          <MaterialIcons
            name="calendar-today"
            size={22}
            color={GroveColors.primaryText}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {weekDates.map((date) => {
          const key = calendarDateKey(date);
          const isFuture = key > todayKey;
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isFuture && styles.dayCellFuture,
              ]}
              onPress={() => !isFuture && onSelectDate(date)}
              disabled={isFuture}
              activeOpacity={isFuture ? 1 : 0.7}
            >
              <AppText
                variant="small"
                style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelSelected,
                  isFuture && styles.dayLabelFuture,
                ]}
              >
                {WEEKDAY_LABELS[date.getDay()]}
              </AppText>
              <AppText
                variant="paragraph"
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  isFuture && styles.dayNumberFuture,
                  isToday && !isSelected && !isFuture && styles.dayNumberToday,
                ]}
              >
                {date.getDate()}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <CalendarPickerModal
        visible={pickerOpen}
        anchorSelected={selectedDate}
        onClose={() => setPickerOpen(false)}
        onSelectDate={(d) => {
          onSelectDate(d);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

interface CalendarPickerModalProps {
  visible: boolean;
  anchorSelected: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

function CalendarPickerModal({
  visible,
  anchorSelected,
  onClose,
  onSelectDate,
}: CalendarPickerModalProps) {
  const todayKey = calendarDateKey();
  const [viewYear, setViewYear] = useState(() => anchorSelected.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => anchorSelected.getMonth());

  useEffect(() => {
    if (!visible) return;
    setViewYear(anchorSelected.getFullYear());
    setViewMonth(anchorSelected.getMonth());
  }, [visible, anchorSelected]);

  const cells = useMemo(
    () => buildMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  const firstOfNextMonthKey = calendarDateKey(new Date(viewYear, viewMonth + 1, 1));
  const canGoNextMonth = firstOfNextMonthKey <= todayKey;

  const goPrevMonth = () => {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goNextMonth = () => {
    if (!canGoNextMonth) return;
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const selectedKey = calendarDateKey(anchorSelected);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : undefined}
      onRequestClose={onClose}
    >
      <SafeAreaView style={pickerStyles.safe}>
        <View style={pickerStyles.header}>
          <AppText variant="h2" style={pickerStyles.title}>
            Choose date
          </AppText>
          <Pressable onPress={onClose} hitSlop={12}>
            <AppText style={pickerStyles.close}>Done</AppText>
          </Pressable>
        </View>

        <View style={pickerStyles.monthNav}>
          <TouchableOpacity
            onPress={goPrevMonth}
            style={pickerStyles.monthNavBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <MaterialIcons
              name="chevron-left"
              size={28}
              color={GroveColors.primaryText}
            />
          </TouchableOpacity>
          <AppText style={pickerStyles.monthTitle}>{monthTitle}</AppText>
          <TouchableOpacity
            onPress={goNextMonth}
            disabled={!canGoNextMonth}
            style={[
              pickerStyles.monthNavBtn,
              !canGoNextMonth && pickerStyles.monthNavBtnDisabled,
            ]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <MaterialIcons
              name="chevron-right"
              size={28}
              color={
                canGoNextMonth
                  ? GroveColors.primaryText
                  : GroveColors.inactive
              }
            />
          </TouchableOpacity>
        </View>

        <View style={pickerStyles.weekdayRow}>
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} style={pickerStyles.weekdayCell}>
              <AppText style={pickerStyles.weekdayText}>{label}</AppText>
            </View>
          ))}
        </View>
        <View style={pickerStyles.grid}>
          {cells.map((cell, index) => {
            if (cell.kind === "blank") {
              return <View key={`b-${index}`} style={pickerStyles.gridCell} />;
            }
            const { day } = cell;
            const date = new Date(viewYear, viewMonth, day, 12, 0, 0);
            const key = calendarDateKey(date);
            const isFuture = key > todayKey;
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;

            return (
              <TouchableOpacity
                key={key}
                style={pickerStyles.gridCell}
                onPress={() => !isFuture && onSelectDate(date)}
                disabled={isFuture}
                activeOpacity={isFuture ? 1 : 0.65}
              >
                <View
                  style={[
                    pickerStyles.dayDisk,
                    isSelected && pickerStyles.dayDiskSelected,
                    isToday && !isSelected && !isFuture && pickerStyles.dayDiskToday,
                    isFuture && pickerStyles.dayDiskFuture,
                  ]}
                >
                  <AppText
                    style={[
                      pickerStyles.gridDayText,
                      isSelected && pickerStyles.gridDayTextSelected,
                      isFuture && pickerStyles.gridDayTextFuture,
                    ]}
                  >
                    {day}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  toolbarSpacer: {
    flex: 1,
  },
  toolbarIconBtn: {
    padding: 6,
    borderRadius: GroveBorderRadius.button,
    backgroundColor: GroveColors.cardBackground,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: GroveBorderRadius.button,
    backgroundColor: GroveColors.cardBackground,
    gap: 4,
  },
  dayCellSelected: {
    backgroundColor: GroveColors.primaryGreen,
  },
  dayCellFuture: {
    backgroundColor: GroveColors.background,
    opacity: 0.55,
  },
  dayLabel: {
    fontSize: 11,
    color: GroveColors.secondaryText,
    fontWeight: "500",
  },
  dayLabelSelected: {
    color: GroveColors.white,
  },
  dayLabelFuture: {
    color: GroveColors.secondaryText,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: GroveColors.primaryText,
    lineHeight: 20,
  },
  dayNumberSelected: {
    color: GroveColors.white,
  },
  dayNumberToday: {
    color: GroveColors.primaryGreen,
  },
  dayNumberFuture: {
    color: GroveColors.secondaryText,
  },
});

const pickerStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: GroveColors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GroveColors.inactive,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: GroveColors.primaryText,
  },
  close: {
    fontSize: 16,
    fontWeight: "600",
    color: GroveColors.primaryGreen,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  monthNavBtn: {
    padding: 4,
    minWidth: 44,
    alignItems: "center",
  },
  monthNavBtnDisabled: {
    opacity: 0.35,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: GroveColors.primaryText,
  },
  weekdayRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: "600",
    color: GroveColors.secondaryText,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  gridCell: {
    width: "14.2857%",
    aspectRatio: 1,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDisk: {
    width: "88%",
    aspectRatio: 1,
    maxWidth: 44,
    maxHeight: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  dayDiskSelected: {
    backgroundColor: GroveColors.primaryGreen,
  },
  dayDiskToday: {
    borderWidth: 2,
    borderColor: GroveColors.primaryGreen,
  },
  dayDiskFuture: {
    opacity: 0.35,
  },
  gridDayText: {
    fontSize: 16,
    fontWeight: "600",
    color: GroveColors.primaryText,
  },
  gridDayTextSelected: {
    color: GroveColors.white,
  },
  gridDayTextFuture: {
    color: GroveColors.secondaryText,
  },
});
