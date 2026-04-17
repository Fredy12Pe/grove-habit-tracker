import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/auth-context";
import { calendarDateKey } from "@/lib/calendarDate";
import { gameImpactLight } from "@/lib/gameHaptics";
import { useHabitStore } from "@/lib/store";
import { syncWidgets } from "@/lib/widgets/syncWidgets";
import { GroveColors, GroveSpacing } from "@/styles/theme";
import { Redirect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_BG = "#F3FBDE";

const GRATITUDE_HABIT_ID = "practice-gratitude";

const PROMPTS = [
  "Something small that went well today",
  "A person or moment you’re glad for",
  "Something simple you’re looking forward to",
] as const;

function GratitudeScreenContent() {
  const router = useRouter();
  const habits = useHabitStore((s) => s.habits);
  const setHabitEntry = useHabitStore((s) => s.setHabitEntry);
  const toggleHabit = useHabitStore((s) => s.toggleHabit);

  const [lines, setLines] = useState<string[]>(() =>
    PROMPTS.map(() => ""),
  );

  const hasAnyText = useMemo(
    () => lines.some((t) => t.trim().length > 0),
    [lines],
  );

  const allFilled = useMemo(
    () => lines.every((t) => t.trim().length > 0),
    [lines],
  );

  const updateLine = (index: number, value: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const onSave = () => {
    if (!hasAnyText) return;
    gameImpactLight();

    const date = calendarDateKey();
    const gratitudeHabit = habits.find((h) => h.id === GRATITUDE_HABIT_ID);
    if (
      gratitudeHabit &&
      !gratitudeHabit.completedToday &&
      allFilled
    ) {
      const note = lines
        .map((t, i) => `• ${t.trim()}`)
        .join("\n");
      setHabitEntry(GRATITUDE_HABIT_ID, date, { note });
      toggleHabit(GRATITUDE_HABIT_ID);
      syncWidgets();
    }

    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol
                name="chevron.left"
                size={20}
                color={GroveColors.primaryText}
              />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <AppText variant="h1" style={styles.title}>
                A moment of gratitude
              </AppText>
              <AppText variant="paragraphRegular" style={styles.subtitle}>
                Jot down a few things — no pressure for perfect words.
              </AppText>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <Image
            source={require("@/assets/Game/activities/Gratitude.png")}
            style={styles.hero}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />

          {PROMPTS.map((prompt, i) => (
            <View key={prompt} style={styles.fieldBlock}>
              <AppText variant="paragraphRegular" style={styles.promptLabel}>
                {prompt}
              </AppText>
              <TextInput
                style={styles.input}
                placeholder="Write something…"
                placeholderTextColor={GroveColors.secondaryText}
                value={lines[i] ?? ""}
                onChangeText={(t) => updateLine(i, t)}
                multiline
                textAlignVertical="top"
              />
            </View>
          ))}

          <Pressable
            onPress={onSave}
            disabled={!hasAnyText}
            style={({ pressed }) => [
              styles.primaryBtn,
              !hasAnyText && styles.primaryBtnDisabled,
              pressed && hasAnyText && styles.primaryBtnPressed,
            ]}
          >
            <AppText style={styles.primaryBtnText}>Save</AppText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function GratitudeScreen() {
  const { initialized, session, needsOnboarding } = useAuth();
  if (!initialized) {
    return null;
  }
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }
  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  return <GratitudeScreenContent />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 36 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: GroveColors.primaryText,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 6,
    alignSelf: "stretch",
  },
  subtitle: {
    textAlign: "center",
    color: GroveColors.secondaryText,
    fontSize: 13,
    lineHeight: 18,
  },
  hero: {
    width: "72%",
    maxWidth: 220,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
  },
  fieldBlock: {
    marginBottom: 18,
  },
  promptLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: GroveColors.primaryText,
    marginBottom: 8,
  },
  input: {
    minHeight: 72,
    backgroundColor: GroveColors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: GroveColors.primaryText,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#6B9E1A",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnPressed: {
    opacity: 0.9,
  },
  primaryBtnText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: GroveColors.white,
  },
});
