import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
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
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "@/components/ui/AppText";
import { useAuth } from "@/contexts/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { HABIT_CATALOG, getHabitActionType } from "@/lib/habitCatalog";
import { useHabitStore } from "@/lib/store";
import type { HabitCustomTracking } from "@/lib/types/habit";
import { GroveBorderRadius, GroveColors, GroveSpacing } from "@/styles/theme";

const TRACKING_OPTIONS: { value: HabitCustomTracking; label: string }[] = [
  { value: "toggle", label: "Checkbox" },
  { value: "counter", label: "Counter" },
  { value: "timer", label: "Timer" },
  { value: "input", label: "Text" },
];

function trackingLabel(t: HabitCustomTracking): string {
  return TRACKING_OPTIONS.find((o) => o.value === t)?.label ?? t;
}

function inferTrackingFromCatalogId(habitId: string): HabitCustomTracking {
  switch (getHabitActionType(habitId)) {
    case "count":
      return "counter";
    case "duration":
      return "timer";
    case "journal":
      return "input";
    case "note":
      return "input";
    case "checkbox_only":
    default:
      return "toggle";
  }
}

function HabitSettingsScreenContent() {
  const router = useRouter();
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const id = habitId ?? "";

  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);

  const initialIconId = useMemo(() => {
    if (!habit) return HABIT_CATALOG[0]?.id ?? "pray";
    if (habit.customIconCatalogId) return habit.customIconCatalogId;
    const isCatalog = HABIT_CATALOG.some((c) => c.id === habit.id);
    return isCatalog ? habit.id : HABIT_CATALOG[0]?.id ?? "pray";
  }, [habit]);

  const initialTracking = useMemo(() => {
    if (!habit) return "toggle" as HabitCustomTracking;
    if (habit.customTracking) return habit.customTracking;
    return inferTrackingFromCatalogId(habit.id);
  }, [habit]);

  const [name, setName] = useState(habit?.name ?? "");
  const [iconId, setIconId] = useState(initialIconId);
  const [tracking, setTracking] = useState<HabitCustomTracking>(initialTracking);
  const [pickerVisible, setPickerVisible] = useState(false);

  const canSave = name.trim().length > 0 && !!habit;

  const handleSave = useCallback(() => {
    if (!habit) return;
    updateHabit(habit.id, {
      name: name.trim(),
      customIconCatalogId: iconId,
      customTracking: tracking,
    });
    router.back();
  }, [habit, iconId, name, router, tracking, updateHabit]);

  const handleDelete = useCallback(() => {
    if (!habit) return;
    Alert.alert(
      "Remove habit?",
      "This will remove the habit from your current list. You can add it back anytime.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeHabit(habit.id);
            router.replace("/(tabs)/habits");
          },
        },
      ],
    );
  }, [habit, removeHabit, router]);

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
            <IconSymbol
              name="chevron.left"
              size={20}
              color={GroveColors.primaryText}
            />
          </TouchableOpacity>
          <AppText variant="h2" style={styles.headerTitle}>
            Habit settings
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        {!habit ? (
          <View style={styles.missingWrap}>
            <AppText variant="paragraph" style={styles.missingText}>
              Habit not found.
            </AppText>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
                  const picked = iconId === h.id;
                  return (
                    <TouchableOpacity
                      key={h.id}
                      style={[styles.iconPick, picked && styles.iconPickSelected]}
                      onPress={() => setIconId(h.id)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={h.icon}
                        style={styles.iconPickImg}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <AppText variant="small" style={styles.fieldLabel}>
                Tracker type
              </AppText>
              <TouchableOpacity
                style={styles.trackingRow}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.75}
              >
                <AppText variant="paragraph" style={styles.trackingRowText}>
                  {trackingLabel(tracking)}
                </AppText>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={GroveColors.secondaryText}
                />
              </TouchableOpacity>

              <View style={styles.dangerZone}>
                <Pressable
                  onPress={handleDelete}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    pressed && styles.deleteBtnPressed,
                  ]}
                >
                  <AppText variant="paragraph" style={styles.deleteBtnText}>
                    Delete habit
                  </AppText>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                style={({ pressed }) => [
                  styles.saveBtn,
                  !canSave && styles.saveBtnDisabled,
                  pressed && canSave && styles.saveBtnPressed,
                ]}
              >
                <AppText variant="paragraph" style={styles.saveBtnText}>
                  Save changes
                </AppText>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {pickerVisible ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setPickerVisible(false)}
          {...(Platform.OS === "ios"
            ? { presentationStyle: "overFullScreen" as const }
            : {})}
        >
          <View style={styles.pickerWrap}>
            <TouchableOpacity
              style={styles.pickerBackdrop}
              activeOpacity={1}
              onPress={() => setPickerVisible(false)}
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
                      setPickerVisible(false);
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

export default function HabitSettingsScreen() {
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
  return <HabitSettingsScreenContent />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GroveColors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GroveColors.inactive,
  },
  headerBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: GroveColors.primaryText,
  },
  headerSpacer: { width: 28 },
  scroll: { flex: 1 },
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
  iconScroll: { gap: 10, paddingVertical: 4, marginBottom: 8 },
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
  iconPickSelected: { borderColor: GroveColors.primaryGreen },
  iconPickImg: { width: 40, height: 40 },
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
  trackingRowText: { fontWeight: "500", color: GroveColors.primaryText },
  dangerZone: {
    marginTop: 10,
    marginBottom: 12,
  },
  deleteBtn: {
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(179, 38, 30, 0.35)",
  },
  deleteBtnPressed: {
    opacity: 0.85,
  },
  deleteBtnText: {
    color: "#B3261E",
    fontWeight: "600",
    textAlign: "center",
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
  saveBtnPressed: { opacity: 0.9 },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    color: GroveColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  missingWrap: { flex: 1, padding: 24 },
  missingText: { color: GroveColors.secondaryText },
  pickerWrap: { flex: 1 },
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
  pickerRowLast: { borderBottomWidth: 0 },
  pickerRowText: { color: GroveColors.primaryText, fontWeight: "500" },
});

