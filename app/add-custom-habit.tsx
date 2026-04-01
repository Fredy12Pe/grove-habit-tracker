import React, { useCallback, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { AppText } from "@/components/ui/AppText";
import { useAuth } from "@/contexts/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GroveBorderRadius, GroveColors, GroveSpacing } from "@/styles/theme";
import { HABIT_CATALOG } from "@/lib/habitCatalog";
import { useHabitStore } from "@/lib/store";
import type {
  HabitCustomCategory,
  HabitCustomTracking,
} from "@/lib/types/habit";
import { Alert } from "react-native";

const CATEGORIES: HabitCustomCategory[] = ["Faith", "Fitness", "Well Being"];

const TRACKING_OPTIONS: {
  value: HabitCustomTracking;
  label: string;
}[] = [
  { value: "toggle", label: "Checkbox" },
  { value: "counter", label: "Counter" },
  { value: "timer", label: "Timer" },
  { value: "input", label: "Text" },
];

function trackingLabel(t: HabitCustomTracking): string {
  return TRACKING_OPTIONS.find((o) => o.value === t)?.label ?? t;
}

function AddCustomHabitScreenContent() {
  const router = useRouter();
  const addHabit = useHabitStore((s) => s.addHabit);
  const habitCount = useHabitStore((s) => s.habits.length);

  const [name, setName] = useState("");
  const [customIconId, setCustomIconId] = useState(HABIT_CATALOG[0]?.id ?? "pray");
  const [category, setCategory] = useState<HabitCustomCategory>("Faith");
  const [tracking, setTracking] = useState<HabitCustomTracking>("toggle");
  const [trackingPickerVisible, setTrackingPickerVisible] = useState(false);

  const MAX_ACTIVE_HABITS = 8;
  const atLimit = habitCount >= MAX_ACTIVE_HABITS;
  const canSave = name.trim().length > 0 && !atLimit;

  const handleSave = useCallback(() => {
    const n = name.trim();
    if (!n) return;
    if (atLimit) {
      Alert.alert(
        "Limit reached",
        `You can only have ${MAX_ACTIVE_HABITS} habits. Remove one first, then try again.`,
        [{ text: "OK" }],
      );
      return;
    }
    addHabit({
      name: n,
      frequency: "daily",
      completedToday: false,
      streakCount: 0,
      growthState: "seed",
      customIconCatalogId: customIconId,
      customTracking: tracking,
      customCategory: category,
    });
    router.back();
  }, [
    addHabit,
    atLimit,
    category,
    customIconId,
    name,
    router,
    tracking,
  ]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={20} color={GroveColors.primaryText} />
          </TouchableOpacity>
          <AppText variant="h2" style={styles.headerTitle}>
            Custom habit
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            {atLimit ? (
              <AppText variant="small" style={styles.limitWarning}>
                You already have {MAX_ACTIVE_HABITS} habits. Remove one to add a
                custom habit.
              </AppText>
            ) : null}
          <AppText variant="small" style={styles.fieldLabel}>
            Category
          </AppText>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => {
              const selected = category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                >
                  <AppText
                    variant="paragraph"
                    style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}
                  >
                    {c}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <AppText variant="small" style={styles.fieldLabel}>
            Name
          </AppText>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Habit name"
            placeholderTextColor={GroveColors.secondaryText}
          />

          <AppText variant="small" style={styles.fieldLabel}>
            Icon
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.iconScroll}
          >
            {HABIT_CATALOG.map((h) => {
              const picked = customIconId === h.id;
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.iconPick, picked && styles.iconPickSelected]}
                  onPress={() => setCustomIconId(h.id)}
                  activeOpacity={0.8}
                >
                  <Image source={h.icon} style={styles.iconPickImg} resizeMode="contain" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <AppText variant="small" style={styles.fieldLabel}>
            Tracking
          </AppText>
          <TouchableOpacity
            style={styles.trackingRow}
            onPress={() => setTrackingPickerVisible(true)}
            activeOpacity={0.75}
          >
            <AppText variant="paragraph" style={styles.trackingRowText}>
              {trackingLabel(tracking)}
            </AppText>
            <IconSymbol name="chevron.right" size={16} color={GroveColors.secondaryText} />
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <AppText variant="paragraph" style={styles.saveBtnText}>
              Save habit
            </AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {trackingPickerVisible ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setTrackingPickerVisible(false)}
          {...(Platform.OS === "ios"
            ? { presentationStyle: "overFullScreen" as const }
            : {})}
        >
          <View style={styles.pickerWrap}>
            <TouchableOpacity
              style={styles.pickerBackdrop}
              activeOpacity={1}
              onPress={() => setTrackingPickerVisible(false)}
            />
            <View style={styles.pickerBottom}>
              <View style={styles.pickerCard}>
                {TRACKING_OPTIONS.map((opt, index) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.pickerRow,
                      index === TRACKING_OPTIONS.length - 1 && styles.pickerRowLast,
                    ]}
                    onPress={() => {
                      setTracking(opt.value);
                      setTrackingPickerVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <AppText variant="paragraph" style={styles.pickerRowText}>
                      {opt.label}
                    </AppText>
                    {tracking === opt.value ? (
                      <IconSymbol
                        name="checkmark"
                        size={16}
                        color={GroveColors.primaryGreen}
                        weight="bold"
                      />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

export default function AddCustomHabitScreen() {
  const { initialized, session, needsOnboarding } = useAuth();
  if (!initialized) {
    return null;
  }
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }
  if (needsOnboarding) {
    return <Redirect href="/onboarding/choose-habits" />;
  }
  return <AddCustomHabitScreenContent />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: GroveColors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GroveColors.inactive,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: GroveColors.primaryText,
  },
  headerSpacer: {
    width: 28,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 16,
    paddingBottom: 24,
  },
  fieldLabel: {
    color: GroveColors.secondaryText,
    marginBottom: 8,
    marginTop: 4,
  },
  limitWarning: {
    color: "#B3261E",
    marginBottom: 14,
    lineHeight: 18,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: GroveColors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GroveColors.inactive,
  },
  categoryChipSelected: {
    backgroundColor: GroveColors.primaryGreen,
    borderColor: GroveColors.primaryGreen,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: GroveColors.primaryText,
  },
  categoryChipTextSelected: {
    color: GroveColors.white,
  },
  textInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GroveColors.inactive,
    borderRadius: GroveBorderRadius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: GroveColors.primaryText,
    backgroundColor: GroveColors.white,
    marginBottom: 8,
  },
  iconScroll: {
    gap: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  iconPick: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: GroveColors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconPickSelected: {
    borderColor: GroveColors.primaryGreen,
  },
  iconPickImg: {
    width: 40,
    height: 40,
  },
  trackingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GroveColors.inactive,
    marginBottom: 16,
  },
  trackingRowText: {
    fontWeight: "500",
    color: GroveColors.primaryText,
  },
  footer: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 12,
    paddingBottom: 8,
  },
  saveBtn: {
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    color: GroveColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  pickerWrap: {
    flex: 1,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  pickerBottom: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 40,
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    zIndex: 1,
  },
  pickerCard: {
    backgroundColor: GroveColors.background,
    borderRadius: GroveBorderRadius.card,
    overflow: "hidden",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GroveColors.inactive,
  },
  pickerRowLast: {
    borderBottomWidth: 0,
  },
  pickerRowText: {
    color: GroveColors.primaryText,
    fontWeight: "500",
  },
});
