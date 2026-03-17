import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { GroveColors } from '@/styles/theme';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type DayCompletionState = 'completed' | 'today_completed' | 'today_incomplete' | 'empty';

interface WeekCompletionRowProps {
  completion: DayCompletionState[];
  /** Optional accent for completed circles (default: primaryGreen) */
  accentColor?: string;
}

export function WeekCompletionRow({ completion, accentColor = GroveColors.primaryGreen }: WeekCompletionRowProps) {
  return (
    <View style={styles.container}>
      {DAY_LABELS.map((label, i) => {
        const state = completion[i] ?? 'empty';
        const filled = state === 'completed' || state === 'today_completed';

        return (
          <View key={i} style={styles.cell}>
            <View
              style={[
                styles.circle,
                filled && styles.circleFilled,
                filled && { backgroundColor: accentColor },
              ]}
            >
              {filled && (
                <MaterialIcons name="check" size={9} color={GroveColors.white} />
              )}
            </View>
            <AppText variant="small" style={styles.dayLabel} numberOfLines={1}>
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const CIRCLE_SIZE = 16;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 2,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: GroveColors.inactive,
    backgroundColor: GroveColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleFilled: {
    borderColor: GroveColors.primaryGreen,
  },
  dayLabel: {
    color: GroveColors.secondaryText,
    fontSize: 9,
    opacity: 0.65,
  },
});
