import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { useGroveColors } from "@/hooks/useGroveColors";
import { GroveBorderRadius } from "@/styles/theme";
import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

interface SproutSupportCardProps {
  onPress?: () => void;
}

export function SproutSupportCard({ onPress }: SproutSupportCardProps) {
  const colors = useGroveColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Breathe with Sprout"
    >
      <Card
        style={[styles.card, { backgroundColor: colors.accentLimeSoft }]}
      >
        <View style={styles.content}>
          <View style={styles.mascotWrap}>
            <Image
              source={require("@/assets/garden/redesign/sprout-waving.png")}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.textBlock}>
            <AppText
              variant="h1"
              style={[styles.heading, { color: colors.onAccent }]}
            >
              Feeling Stressed?
            </AppText>
            <AppText
              variant="small"
              style={[styles.body, { color: colors.limeMuted }]}
            >
              {"Let's take a few calm\nbreaths with Sprout."}
            </AppText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: GroveBorderRadius.homeCard,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    borderRadius: GroveBorderRadius.homeCard,
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
    minHeight: 174,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 174,
    // Right inset matches garden / progress (30); left is driven by Sprout
    paddingRight: 30,
  },
  // Figma: 119x165 sprout offset 8px from the left, cropped ~30px past the card bottom
  mascotWrap: {
    width: 146,
    height: 174,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingLeft: 8,
  },
  mascotImage: {
    width: 119,
    height: 165,
    marginTop: 24,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 6,
    paddingVertical: 20,
    // Extra nudge so copy clears the sprout (Figma text starts ~156 from left)
    paddingLeft: 10,
  },
  heading: {
    fontSize: 20.5,
    lineHeight: 27,
    fontWeight: "600",
  },
  body: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: "600",
  },
});
