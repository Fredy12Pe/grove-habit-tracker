import { ProgressCard, SproutSupportCard } from "@/components/cards";
import { GamePreview } from "@/components/game/GamePreview";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useHabitStore } from "@/lib/store";
import { GroveColors, GroveSpacing } from "@/styles/theme";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function GardenScreen() {
  const router = useRouter();
  const storeHabits = useHabitStore((s) => s.habits);

  const habits = storeHabits.map((h) => ({
    id: h.id,
    name: h.name,
    completed: h.completedToday,
  }));
  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <View style={styles.avatarPlaceholder} />
            <AppText variant="h1" style={styles.userName}>
              Daniel
            </AppText>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.streakPill}>
              <IconSymbol name="flame.fill" size={14} color="#FF8C00" />
              <AppText variant="small" style={styles.streakText}>
                12 day Streak
              </AppText>
            </View>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <IconSymbol
                name="bell.fill"
                size={18}
                color={GroveColors.secondaryText}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Garden game preview — tap to open full game; preview fills card only */}
        <View style={styles.gardenCardWrap}>
          <Card style={styles.gardenCard}>
            <GamePreview />
          </Card>
        </View>

        {/* Today's Progress */}
        <View style={styles.section}>
          <ProgressCard
            completedCount={completedCount}
            totalCount={totalCount}
            habits={habits}
            onCompleteHabits={() => router.push("/(tabs)/habits")}
            readonly
          />
        </View>

        {/* Sprout Support */}
        <View style={styles.section}>
          <SproutSupportCard onPress={() => {}} />
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
  scrollContent: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GroveColors.inactive,
    borderWidth: 1,
    borderColor: "rgba(124, 123, 103, 0.12)",
  },
  userName: {
    fontWeight: "700",
    color: GroveColors.primaryText,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(124, 123, 103, 0.2)",
  },
  streakText: {
    color: GroveColors.secondaryText,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(124, 123, 103, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  gardenCardWrap: {
    width: "100%",
    height: 320,
    marginBottom: GroveSpacing.sectionGap,
  },
  gardenCard: {
    flex: 1,
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
  },
  section: {
    marginBottom: GroveSpacing.sectionGap,
  },
  bottomSpacer: {
    height: 24,
  },
});
