import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GroveBorderRadius, GroveColors, GroveSpacing } from "@/styles/theme";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const WIDGET_SMALL = require("@/assets/Onboarding/Widgets/widgetSmall.png");
const WIDGET_LARGE = require("@/assets/Onboarding/Widgets/widgetLarge.png");

export default function OnboardingWidgetsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            name="chevron.left"
            size={18}
            color={GroveColors.primaryText}
          />
          <AppText variant="paragraph" style={styles.backLabel}>
            Back
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="h1" style={styles.title}>
          Don’t forget to add widgets…
        </AppText>
        <AppText variant="paragraphRegular" style={styles.subtitle}>
          Add widgets to your home screen to see your daily progress and weekly
          garden growth
        </AppText>

        <View style={styles.previews}>
          <Image
            source={WIDGET_SMALL}
            style={styles.imgSmall}
            resizeMode="contain"
            accessibilityLabel="Small home screen widget preview"
          />
          <Image
            source={WIDGET_LARGE}
            style={styles.imgLarge}
            resizeMode="contain"
            accessibilityLabel="Large home screen widget preview"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push("/onboarding/garden-intro")}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
        >
          <AppText variant="paragraph" style={styles.primaryBtnText}>
            Next
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: GroveColors.background,
  },
  headerNav: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLabel: {
    color: GroveColors.primaryText,
    fontSize: 15,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 4,
    paddingBottom: 32,
  },
  title: {
    color: GroveColors.primaryText,
    fontWeight: "700",
    textAlign: "center",
    alignSelf: "stretch",
    marginBottom: 14,
  },
  subtitle: {
    color: GroveColors.secondaryText,
    textAlign: "center",
    alignSelf: "stretch",
    lineHeight: 24,
    marginBottom: 0,
    paddingHorizontal: 4,
  },
  previews: {
    marginTop: 44,
    gap: 22,
    alignItems: "center",
    width: "100%",
  },
  imgSmall: {
    width: "100%",
    maxWidth: 340,
    height: 168,
    borderRadius: GroveBorderRadius.card,
  },
  imgLarge: {
    width: "100%",
    maxWidth: 340,
    height: 292,
    borderRadius: GroveBorderRadius.card,
  },
  footer: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingBottom: 32,
    paddingTop: 20,
  },
  primaryBtn: {
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: GroveBorderRadius.button,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnPressed: {
    opacity: 0.9,
  },
  primaryBtnText: {
    color: GroveColors.white,
    fontWeight: "700",
  },
});
