import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { GroveColors, GroveSpacing } from '@/styles/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

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
  return (
    <Card style={styles.cardWrapper}>
      <Image
        source={require('@/assets/garden/ProgresCard_illustration.png')}
        style={styles.illustration}
        resizeMode="contain"
      />
      <AppText variant="h1" style={styles.title}>
        Today's Progress
      </AppText>
      <AppText variant="paragraphRegular" style={styles.summary}>
        {completedCount}/{totalCount} habits completed
      </AppText>

      {/* Progress indicator: rounded segments */}
      <View style={styles.progressRow}>
        {Array.from({ length: totalCount }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i < completedCount ? styles.progressSegmentFilled : styles.progressSegmentInactive,
            ]}
          />
        ))}
      </View>

      <AppText variant="h2" style={styles.sectionHeader}>
        Today's Habits
      </AppText>

      <View style={styles.habitSection}>
        <View style={styles.habitList}>
          {habits.map((habit) => {
            const RowComponent = readonly ? View : TouchableOpacity;
            const rowProps = readonly
              ? {}
              : { onPress: () => onToggleHabit?.(habit.id), activeOpacity: 0.7 };
            return (
              <RowComponent key={habit.id} style={styles.habitRow} {...rowProps}>
                <View
                  style={[
                    styles.checkbox,
                    habit.completed ? styles.checkboxFilled : styles.checkboxEmpty,
                  ]}
                >
                  {habit.completed && (
                    <IconSymbol name="checkmark" size={12} color={GroveColors.white} />
                  )}
                </View>
                <AppText variant="paragraph" style={styles.habitName}>
                  {habit.name}
                </AppText>
              </RowComponent>
            );
          })}
        </View>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={onCompleteHabits}
          activeOpacity={0.8}
        >
          <AppText variant="paragraph" style={styles.completeButtonText}>
            Complete Habits
          </AppText>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const cardText = {
  title: 20,
  summary: 15,
  sectionHeader: 18,
  body: 15,
};

const styles = StyleSheet.create({
  cardWrapper: {
    overflow: 'hidden',
  },
  illustration: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 140,
    height: 140,
    opacity: 0.9,
  },
  title: {
    marginBottom: 8,
    fontSize: cardText.title,
  },
  summary: {
    marginBottom: 16,
    fontSize: cardText.summary,
  },
  progressRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 22,
  },
  progressSegment: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  progressSegmentFilled: {
    backgroundColor: GroveColors.primaryGreen,
  },
  progressSegmentInactive: {
    backgroundColor: GroveColors.inactive,
  },
  sectionHeader: {
    marginBottom: 16,
    fontSize: cardText.sectionHeader,
  },
  habitSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  habitList: {
    flex: 1,
    gap: GroveSpacing.habitRowGap,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    backgroundColor: GroveColors.white,
    borderWidth: 2,
    borderColor: GroveColors.inactive,
  },
  checkboxFilled: {
    backgroundColor: GroveColors.primaryGreen,
  },
  habitName: {
    flex: 1,
    fontSize: cardText.body,
  },
  completeButton: {
    backgroundColor: GroveColors.primaryGreen,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  completeButtonText: {
    color: GroveColors.white,
    fontWeight: '600',
    fontSize: cardText.body,
  },
});
