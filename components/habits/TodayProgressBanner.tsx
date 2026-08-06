import { AppText } from "@/components/ui/AppText";
import { useGroveColors, useIsDarkMode } from "@/hooks/useGroveColors";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

const bgImage = require("@/assets/habits/ProgressCard/Progress_Background.png");
const sproutImage = require("@/assets/habits/ProgressCard/Progress_Sprout.png");

interface TodayProgressBannerProps {
  completedCount: number;
  totalCount: number;
  /** Defaults to “Today’s Progress”. */
  title?: string;
}

export function TodayProgressBanner({
  completedCount,
  totalCount,
  title = "Today's Progress",
}: TodayProgressBannerProps) {
  const colors = useGroveColors();
  const isDark = useIsDarkMode();
  const remaining = totalCount - completedCount;

  return (
    <View style={[styles.banner, { backgroundColor: colors.softSurface }]}>
      {/* Background decorative image */}
      <Image
        source={bgImage}
        style={[styles.bg, isDark && { opacity: 0.35 }]}
        resizeMode="cover"
      />

      {/* Content sits on top of background */}
      <View style={styles.content}>
        <AppText
          variant="h2"
          style={[styles.title, { color: colors.deepText }]}
        >
          {title}
        </AppText>
        <AppText
          variant="paragraphRegular"
          style={[styles.summary, { color: colors.secondaryText }]}
        >
          {completedCount} / {totalCount} habits completed
        </AppText>

        {/* Number segments */}
        <View style={styles.progressRow}>
          {Array.from({ length: totalCount }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  backgroundColor:
                    i < completedCount ? colors.accentLime : colors.mutedGray,
                },
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
        <View
          style={[
            styles.messagePill,
            {
              backgroundColor: isDark
                ? "rgba(26, 34, 30, 0.72)"
                : "rgba(255,255,255,0.65)",
            },
          ]}
        >
          <AppText
            variant="small"
            style={[styles.messageText, { color: colors.secondaryText }]}
          >
            {remaining > 0
              ? `${remaining} more habit${remaining > 1 ? "s" : ""} and your `
              : "All done! Your "}
            <AppText
              variant="small"
              style={[styles.messageTextBold, { color: colors.deepText }]}
            >
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
    borderRadius: 24,
    overflow: "hidden",
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
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  segment: {
    width: 20,
    height: 6,
    borderRadius: 50,
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
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 16,
  },
  messageTextBold: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
});
