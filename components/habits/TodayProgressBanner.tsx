import { AppText } from "@/components/ui/AppText";
import { GroveBorderRadius, GroveColors } from "@/styles/theme";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

const bgImage = require("@/assets/habits/ProgressCard/Progress_Background.png");
const sproutImage = require("@/assets/habits/ProgressCard/Progress_Sprout.png");

interface TodayProgressBannerProps {
  completedCount: number;
  totalCount: number;
}

export function TodayProgressBanner({
  completedCount,
  totalCount,
}: TodayProgressBannerProps) {
  const remaining = totalCount - completedCount;

  return (
    <View style={styles.banner}>
      {/* Background decorative image */}
      <Image source={bgImage} style={styles.bg} resizeMode="cover" />

      {/* Content sits on top of background */}
      <View style={styles.content}>
        <AppText variant="h2" style={styles.title}>
          Today's Progress
        </AppText>
        <AppText variant="paragraphRegular" style={styles.summary}>
          {completedCount} / {totalCount} habits completed
        </AppText>

        {/* Progress segments */}
        <View style={styles.progressRow}>
          {Array.from({ length: totalCount }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                i < completedCount
                  ? styles.segmentFilled
                  : styles.segmentInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom row: Sprout icon left-anchored + message text beside it */}
      <View style={styles.bottomRow}>
        <Image
          source={sproutImage}
          style={styles.sprout}
          resizeMode="contain"
        />
        <View style={styles.messagePill}>
          <AppText variant="small" style={styles.messageText}>
            {remaining > 0
              ? `${remaining} more habit${remaining > 1 ? "s" : ""} and your `
              : "All done! Your "}
            <AppText variant="small" style={styles.messageTextBold}>
              {remaining > 0 ? "garden grows!" : "garden is thriving!"}
            </AppText>
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: GroveBorderRadius.card,
    overflow: "hidden",
    backgroundColor: GroveColors.cardBackground,
  },
  bg: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 140,
    height: 140,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: GroveColors.primaryText,
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    color: GroveColors.secondaryText,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  segment: {
    width: 22,
    height: 6,
    borderRadius: 3,
  },
  segmentFilled: {
    backgroundColor: GroveColors.primaryGreen,
  },
  segmentInactive: {
    backgroundColor: GroveColors.inactive,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 12,
    paddingBottom: 0,
    gap: 6,
  },
  sprout: {
    width: 70,
    height: 70,
  },
  messagePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  messageText: {
    fontSize: 12,
    color: GroveColors.secondaryText,
    lineHeight: 16,
  },
  messageTextBold: {
    fontSize: 12,
    fontWeight: "700",
    color: GroveColors.primaryText,
    lineHeight: 16,
  },
});
