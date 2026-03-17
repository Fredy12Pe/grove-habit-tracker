import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { GroveColors, GroveSpacing, GroveBorderRadius } from '@/styles/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHabitStore } from '@/lib/store';
import {
  getBestStreak,
  getActiveDaysInMonth,
  getTotalCompletionsAllTime,
} from '@/lib/stats';

const DISPLAY_NAME = 'Fredy';
const GROWTH_STAGE = 'Seedling';

const GARDEN_VALUES = [
  { id: 'faith', label: 'Faith', icon: 'eco' as const },
  { id: 'discipline', label: 'Discipline', icon: 'eco' as const },
  { id: 'peace', label: 'Peace', icon: 'local-florist' as const },
  { id: 'strength', label: 'Strength', icon: 'park' as const },
];

const SETTINGS_ROWS = [
  { id: 'settings', label: 'Settings', icon: 'settings' as const },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' as const },
  { id: 'reminders', label: 'Reminders', icon: 'calendar-today' as const },
  { id: 'devotional', label: 'Devotional Preferences', icon: 'menu-book' as const },
];

export default function ProfileScreen() {
  const habits = useHabitStore((s) => s.habits);
  const completionDates = useHabitStore((s) => s.completionDates);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const growthStats = useMemo(
    () => ({
      longestStreak: getBestStreak(completionDates, habits, today),
      habitsCompleted: getTotalCompletionsAllTime(completionDates, habits, today),
      activeDaysThisMonth: getActiveDaysInMonth(
        completionDates,
        habits,
        today,
        year,
        month
      ),
    }),
    [completionDates, habits, today, year, month]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="h1" style={styles.title}>
            Profile
          </AppText>
        </View>

        {/* User block: avatar, name, subtitle, badge */}
        <View style={styles.userBlock}>
          <View style={styles.avatar}>
            <IconSymbol name="leaf.fill" size={48} color={GroveColors.primaryGreen} />
          </View>
          <View style={styles.userNameRow}>
            <AppText variant="h1" style={styles.userName}>
              {DISPLAY_NAME}
            </AppText>
            <IconSymbol name="leaf.fill" size={18} color={GroveColors.primaryGreen} />
          </View>
          <AppText variant="paragraph" style={styles.subtitle}>
            Growing steadily
          </AppText>
          <View style={styles.badge}>
            <AppText variant="small" style={styles.badgeText}>
              {GROWTH_STAGE}
            </AppText>
            <IconSymbol name="leaf.fill" size={12} color={GroveColors.primaryGreen} />
          </View>
        </View>

        {/* Your Growth card */}
        <View style={styles.section}>
          <AppText variant="h2" style={styles.sectionTitle}>
            Your Growth
          </AppText>
          <View style={styles.growthCard}>
            <View style={styles.growthRow}>
              <MaterialIcons name="local-fire-department" size={20} color="#C96A1D" />
              <AppText variant="paragraph" style={styles.growthLabel}>
                Longest streak:
              </AppText>
              <AppText variant="paragraph" style={styles.growthValue}>
                {growthStats.longestStreak} days
              </AppText>
            </View>
            <View style={styles.growthRow}>
              <MaterialIcons name="eco" size={20} color={GroveColors.primaryGreen} />
              <AppText variant="paragraph" style={styles.growthLabel}>
                Habits completed:
              </AppText>
              <AppText variant="paragraph" style={styles.growthValue}>
                {growthStats.habitsCompleted}
              </AppText>
            </View>
            <View style={styles.growthRow}>
              <MaterialIcons name="calendar-today" size={20} color={GroveColors.primaryText} />
              <AppText variant="paragraph" style={styles.growthLabel}>
                Active days:
              </AppText>
              <AppText variant="paragraph" style={styles.growthValue}>
                {growthStats.activeDaysThisMonth} this month
              </AppText>
            </View>
          </View>
        </View>

        {/* Your Garden */}
        <View style={styles.section}>
          <AppText variant="h2" style={styles.sectionTitle}>
            Your Garden
          </AppText>
          <View style={styles.gardenRow}>
            {GARDEN_VALUES.map((item) => (
              <View key={item.id} style={styles.gardenCard}>
                <View style={styles.gardenIconWrap}>
                  <MaterialIcons
                    name={item.icon}
                    size={28}
                    color={GroveColors.primaryGreen}
                  />
                </View>
                <AppText variant="small" style={styles.gardenLabel} numberOfLines={1}>
                  {item.label}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Settings & preferences */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            {SETTINGS_ROWS.map((row, index) => (
              <TouchableOpacity
                key={row.id}
                style={[
                  styles.settingsRow,
                  index === SETTINGS_ROWS.length - 1 && styles.settingsRowLast,
                ]}
                activeOpacity={0.7}
                onPress={() => {}}
              >
                <MaterialIcons
                  name={row.icon}
                  size={22}
                  color={GroveColors.primaryText}
                />
                <AppText variant="paragraph" style={styles.settingsLabel}>
                  {row.label}
                </AppText>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={GroveColors.secondaryText}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    marginBottom: 24,
  },
  title: {
    color: GroveColors.primaryText,
    fontWeight: '700',
  },
  userBlock: {
    alignItems: 'center',
    marginBottom: GroveSpacing.sectionGap,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GroveColors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    color: GroveColors.primaryText,
    fontSize: 22,
  },
  subtitle: {
    color: GroveColors.secondaryText,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GroveColors.cardBackground,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: GroveBorderRadius.pill,
  },
  badgeText: {
    color: GroveColors.primaryText,
    fontWeight: '600',
  },
  section: {
    marginBottom: GroveSpacing.sectionGap,
  },
  sectionTitle: {
    color: GroveColors.primaryText,
    fontWeight: '600',
    marginBottom: 12,
  },
  growthCard: {
    backgroundColor: GroveColors.cardBackground,
    borderRadius: GroveBorderRadius.card,
    padding: GroveSpacing.cardPaddingHorizontal,
    paddingVertical: 18,
    gap: 14,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  growthLabel: {
    flex: 1,
    color: GroveColors.secondaryText,
  },
  growthValue: {
    color: GroveColors.primaryText,
    fontWeight: '600',
  },
  gardenRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gardenCard: {
    flex: 1,
    backgroundColor: GroveColors.cardBackground,
    borderRadius: GroveBorderRadius.card,
    padding: 14,
    alignItems: 'center',
    minWidth: 0,
  },
  gardenIconWrap: {
    marginBottom: 8,
  },
  gardenLabel: {
    color: GroveColors.primaryText,
    fontWeight: '500',
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.card,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GroveColors.inactive,
  },
  settingsRowLast: {
    borderBottomWidth: 0,
  },
  settingsLabel: {
    flex: 1,
    color: GroveColors.primaryText,
  },
  bottomSpacer: {
    height: 40,
  },
});
