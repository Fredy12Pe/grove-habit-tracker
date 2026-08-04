import { ProgressCard, SproutSupportCard } from "@/components/cards";
import { GamePreview } from "@/components/game/GamePreview";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { useResolvedAvatarUri } from "@/hooks/useResolvedAvatarUri";
import { useAuth } from "@/contexts/auth-context";
import { calendarDateKey } from "@/lib/calendarDate";
import { useHabitStore } from "@/lib/store";
import { getCurrentStreak } from "@/lib/stats";
import { getDisplayName } from "@/lib/user-display";
import { GroveBorderRadius, GroveColors, GroveSpacing } from "@/styles/theme";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");

function streakLabel(days: number): string {
  if (days === 1) return "1 Day Streak";
  return `${days} Days Streak`;
}

export default function GardenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session, isGuest, guestDisplayName, guestAvatarUri } = useAuth();
  const displayName = isGuest ? guestDisplayName ?? "Gardener" : getDisplayName(user);
  const resolvedAvatarUri = useResolvedAvatarUri(user) ?? (isGuest ? guestAvatarUri : null);

  const storeHabits = useHabitStore((s) => s.habits);
  const completionDates = useHabitStore((s) => s.completionDates);
  const today = calendarDateKey();
  const currentStreak = useMemo(
    () => getCurrentStreak(completionDates, storeHabits, today),
    [completionDates, storeHabits, today]
  );

  const habits = storeHabits.map((h) => ({
    id: h.id,
    name: h.name,
    completed: h.completedToday,
  }));
  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;

  const statusBarFadeHeight = insets.top + 20;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/profile",
                  params: { pickPhoto: "1" },
                })
              }
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Open profile to update photo"
            >
              <ProfileAvatar
                uri={resolvedAvatarUri}
                accessToken={session?.access_token}
                imageStyle={styles.avatarImage}
                fallback={
                  <IconSymbol
                    name="leaf.fill"
                    size={22}
                    color={GroveColors.accentLime}
                  />
                }
              />
            </TouchableOpacity>
            <AppText variant="display" style={styles.userName}>
              {displayName}
            </AppText>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.streakPill}>
              <IconSymbol
                name="flame.fill"
                size={14}
                color={GroveColors.streakFlame}
              />
              <AppText variant="small" style={styles.streakText}>
                {streakLabel(currentStreak)}
              </AppText>
            </View>
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

        {/* Sprout Support — no section gap; bottomSpacer clears the floating tab bar */}
        <SproutSupportCard onPress={() => router.push("/breathe")} />

        {/* Clear floating tab bar (96) plus breathing room above the menu */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed status-bar veil — does not scroll with content */}
      <View
        pointerEvents="none"
        style={[styles.statusBarFade, { height: statusBarFadeHeight }]}
      >
        <Svg width={SCREEN_W} height={statusBarFadeHeight}>
          <Defs>
            <LinearGradient id="homeStatusBarFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect
            width={SCREEN_W}
            height={statusBarFadeHeight}
            fill="url(#homeStatusBarFade)"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GroveColors.white,
  },
  statusBarFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
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
    gap: 10,
    flexShrink: 1,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    backgroundColor: GroveColors.softSurface,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  userName: {
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 40,
    backgroundColor: GroveColors.white,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  streakText: {
    color: GroveColors.deepText,
  },
  gardenCardWrap: {
    width: "100%",
    height: 325,
    marginBottom: GroveSpacing.sectionGap,
  },
  gardenCard: {
    flex: 1,
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
    borderRadius: GroveBorderRadius.homeCard,
    backgroundColor: GroveColors.accentLime,
  },
  section: {
    marginBottom: GroveSpacing.sectionGap,
  },
  bottomSpacer: {
    height: 124,
  },
});
