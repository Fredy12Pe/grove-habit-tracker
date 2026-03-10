import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { Habit } from '@/lib/types';

interface HabitCardProps {
  habit: Habit;
  onPress?: () => void;
}

export function HabitCard({ habit, onPress }: HabitCardProps) {
  return (
    <View style={styles.card}>
      <ThemedText type="defaultSemiBold">{habit.name}</ThemedText>
      <ThemedText style={styles.state}>{habit.growthState}</ThemedText>
      {habit.completedToday && (
        <ThemedText style={styles.done}>Done today</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  state: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  done: {
    fontSize: 12,
    marginTop: 4,
    color: '#22c55e',
  },
});
