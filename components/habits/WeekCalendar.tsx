import { AppText } from "@/components/ui/AppText";
import { useGroveColors } from "@/hooks/useGroveColors";
import {
  addCalendarDays,
  calendarDateKey,
  calendarTodayDate,
  startOfWeekMonday,
} from "@/lib/calendarDate";
import { GroveBorderRadius } from "@/styles/theme";
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
  const colors = useGroveColors();
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
          style={[styles.toolbarIconBtn, { backgroundColor: colors.softSurface }]}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.7}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open calendar"
        >
          <MaterialIcons
            name="calendar-today"
            size={22}
            color={colors.primaryText}
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
                { backgroundColor: colors.softSurface },
                isSelected && { backgroundColor: colors.primaryGreen },
                isFuture && { opacity: 0.55 },
              ]}
              onPress={() => !isFuture && onSelectDate(date)}
              disabled={isFuture}
              activeOpacity={isFuture ? 1 : 0.7}
            >
              <AppText
                variant="small"
                style={[
                  styles.dayLabel,
                  {
                    color: isSelected
                      ? colors.onAccent
                      : colors.secondaryText,
                  },
                ]}
              >
                {WEEKDAY_LABELS[date.getDay()]}
              </AppText>
              <AppText
                variant="paragraph"
                style={[
                  styles.dayNumber,
                  {
                    color: isSelected
                      ? colors.onAccent
                      : isFuture
                        ? colors.secondaryText
                        : isToday
                          ? colors.primaryGreen
                          : colors.primaryText,
                  },
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
  const colors = useGroveColors();
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

  const firstOfNextMonthKey = calendarDateKey(
    new Date(viewYear, viewMonth + 1, 1),
  );
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
      <SafeAreaView style={[pickerStyles.safe, { backgroundColor: colors.white }]}>
        <View
          style={[
            pickerStyles.header,
            { borderBottomColor: colors.inactive },
          ]}
        >
          <AppText
            variant="h2"
            style={[pickerStyles.title, { color: colors.primaryText }]}
          >
            Choose date
          </AppText>
          <Pressable onPress={onClose} hitSlop={12}>
            <AppText style={[pickerStyles.close, { color: colors.primaryGreen }]}>
              Done
            </AppText>
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
              color={colors.primaryText}
            />
          </TouchableOpacity>
          <AppText
            style={[pickerStyles.monthTitle, { color: colors.primaryText }]}
          >
            {monthTitle}
          </AppText>
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
                canGoNextMonth ? colors.primaryText : colors.inactive
              }
            />
          </TouchableOpacity>
        </View>

        <View style={pickerStyles.weekdayRow}>
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} style={pickerStyles.weekdayCell}>
              <AppText
                style={[
                  pickerStyles.weekdayText,
                  { color: colors.secondaryText },
                ]}
              >
                {label}
              </AppText>
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
                    isSelected && { backgroundColor: colors.primaryGreen },
                    isToday &&
                      !isSelected &&
                      !isFuture && {
                        borderWidth: 2,
                        borderColor: colors.primaryGreen,
                      },
                    isFuture && { opacity: 0.35 },
                  ]}
                >
                  <AppText
                    style={[
                      pickerStyles.gridDayText,
                      {
                        color: isSelected
                          ? colors.onAccent
                          : isFuture
                            ? colors.secondaryText
                            : colors.primaryText,
                      },
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
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
});

const pickerStyles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  close: {
    fontSize: 16,
    fontWeight: "600",
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
  gridDayText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
