import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { GroveColors, GroveBorderRadius } from '@/styles/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(today: Date): Date[] {
  const dates: Date[] = [];
  for (let i = -2; i <= 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

interface WeekCalendarProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

export function WeekCalendar({ selectedDate, onSelectDate }: WeekCalendarProps) {
  const today = new Date();
  const selected = selectedDate ?? today;
  const dates = getWeekDates(today);

  return (
    <View style={styles.container}>
      {dates.map((date, i) => {
        const isSelected =
          date.toDateString() === selected.toDateString();
        const isToday = date.toDateString() === today.toDateString();

        return (
          <TouchableOpacity
            key={i}
            style={[styles.dayCell, isSelected && styles.dayCellSelected]}
            onPress={() => onSelectDate?.(date)}
            activeOpacity={0.7}
          >
            <AppText
              variant="small"
              style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}
            >
              {DAYS[date.getDay()]}
            </AppText>
            <AppText
              variant="paragraph"
              style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}
            >
              {date.getDate()}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: GroveBorderRadius.button,
    backgroundColor: GroveColors.cardBackground,
    gap: 4,
  },
  dayCellSelected: {
    backgroundColor: GroveColors.primaryGreen,
  },
  dayLabel: {
    fontSize: 11,
    color: GroveColors.secondaryText,
    fontWeight: '500',
  },
  dayLabelSelected: {
    color: GroveColors.white,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: GroveColors.primaryText,
    lineHeight: 20,
  },
  dayNumberSelected: {
    color: GroveColors.white,
  },
});
