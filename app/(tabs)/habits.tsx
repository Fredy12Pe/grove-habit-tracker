import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { HabitRow, type HabitData } from '@/components/habits/HabitRow';
import { WeekCalendar } from '@/components/habits/WeekCalendar';
import { TodayProgressBanner } from '@/components/habits/TodayProgressBanner';
import { AddHabitSheet } from '@/components/habits/AddHabitSheet';
import { GroveColors, GroveSpacing } from '@/styles/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { useHabitStore } from '@/lib/store';
import { CATALOG_ICON_MAP } from '@/lib/habitCatalog';

export default function HabitsScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sheetVisible, setSheetVisible] = useState(false);
  const storeHabits = useHabitStore((s) => s.habits);
  const toggleHabit = useHabitStore((s) => s.toggleHabit);
  const syncHabits = useHabitStore((s) => s.syncHabits);

  const habits: HabitData[] = storeHabits.map((h) => ({
    id: h.id,
    name: h.name,
    streak: h.streakCount,
    icon: CATALOG_ICON_MAP[h.id],
    completed: h.completedToday,
  }));

  const completed = habits.filter((h) => h.completed);
  const inProgress = habits.filter((h) => !h.completed);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.push('/(tabs)/garden')}>
            <IconSymbol name="chevron.left" size={18} color={GroveColors.primaryText} />
            <AppText variant="paragraph" style={styles.backLabel}>Garden</AppText>
          </TouchableOpacity>
        </View>

        {/* Week calendar */}
        <View style={styles.section}>
          <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </View>

        {/* Today's progress banner */}
        <View style={styles.section}>
          <TodayProgressBanner
            completedCount={completed.length}
            totalCount={habits.length}
          />
        </View>

        {/* Completed */}
        {completed.length > 0 && (
          <View style={styles.section}>
            <AppText variant="paragraphRegular" style={styles.sectionLabel}>
              Completed
            </AppText>
            {completed.map((habit) => (
              <HabitRow key={habit.id} habit={habit} onToggle={toggleHabit} />
            ))}
          </View>
        )}

        {/* In Progress */}
        {inProgress.length > 0 && (
          <View style={styles.section}>
            <AppText variant="paragraphRegular" style={styles.sectionLabel}>
              In Progress
            </AppText>
            {inProgress.map((habit) => (
              <HabitRow key={habit.id} habit={habit} onToggle={toggleHabit} />
            ))}
          </View>
        )}

        {/* Add habit button */}
        <View style={styles.addSection}>
          <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={() => setSheetVisible(true)}>
            <AppText style={styles.addIcon}>+</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AddHabitSheet
        visible={sheetVisible}
        activeHabitIds={storeHabits.map((h) => h.id)}
        onClose={() => setSheetVisible(false)}
        onUpdate={(ids) => syncHabits(ids)}
      />
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
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLabel: {
    color: GroveColors.primaryText,
    fontSize: 15,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: GroveColors.secondaryText,
    marginBottom: 10,
    fontWeight: '500',
  },
  addSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GroveColors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    color: GroveColors.white,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '300',
  },
  bottomSpacer: {
    height: 32,
  },
});
