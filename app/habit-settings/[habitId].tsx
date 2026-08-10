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
import { HabitColorPickerModal } from "@/components/habits/HabitColorPickerModal";
import { HABIT_CARD_THEMES } from "@/components/habits/HabitRow";
import { AppText } from "@/components/ui/AppText";
import { useAuth } from "@/contexts/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGroveColors } from "@/hooks/useGroveColors";
import {
  HABIT_CATALOG,
  TRACKING_OPTIONS,
  getHabitActionType,
  trackingLabel,
} from "@/lib/habitCatalog";
import { useHabitStore } from "@/lib/store";
import type { HabitCustomTracking } from "@/lib/types/habit";
import { GroveBorderRadius, GroveSpacing } from "@/styles/theme";

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
  const colors = useGroveColors();
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const id = habitId ?? "";

  const habits = useHabitStore((s) => s.habits);
  const habit = habits.find((h) => h.id === id);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);

  const listIndex = Math.max(
    0,
    habits.findIndex((h) => h.id === id),
  );

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
  const [colorIndex, setColorIndex] = useState(
    typeof habit?.customColorIndex === "number"
      ? habit.customColorIndex
      : listIndex % HABIT_CARD_THEMES.length,
  );
  const [customColor, setCustomColor] = useState<string | null>(
    habit?.customColor ?? null,
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  const canSave = name.trim().length > 0 && !!habit;

  const handleSave = useCallback(() => {
    if (!habit) return;
    updateHabit(habit.id, {
      name: name.trim(),
      customIconCatalogId: iconId,
      customTracking: tracking,
      customColorIndex: customColor ? undefined : colorIndex,
      customColor: customColor ?? undefined,
    });
    router.back();
  }, [
    colorIndex,
    customColor,
    habit,
    iconId,
    name,
    router,
    tracking,
    updateHabit,
  ]);

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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.white }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="chevron.left"
              size={20}
              color={colors.deepText}
            />
          </TouchableOpacity>
          <AppText
            variant="h2"
            style={[styles.headerTitle, { color: colors.deepText }]}
          >
            Habit settings
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        {!habit ? (
          <View style={styles.missingWrap}>
            <AppText
              variant="paragraph"
              style={{ color: colors.secondaryText }}
            >
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
              <AppText
                variant="small"
                style={[styles.fieldLabel, { color: colors.secondaryText }]}
              >
                Name
              </AppText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.inactive,
                    color: colors.deepText,
                    backgroundColor: colors.softSurface,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Habit name"
                placeholderTextColor={colors.secondaryText}
              />

              <AppText
                variant="small"
                style={[styles.fieldLabel, { color: colors.secondaryText }]}
              >
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
                      style={[
                        styles.iconPick,
                        { backgroundColor: colors.softSurface },
                        picked && { borderColor: colors.primaryGreen },
                      ]}
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

              <AppText
                variant="small"
                style={[styles.fieldLabel, { color: colors.secondaryText }]}
              >
                Tracker type
              </AppText>
              <TouchableOpacity
                style={[
                  styles.trackingRow,
                  {
                    backgroundColor: colors.softSurface,
                    borderColor: colors.divider,
                  },
                ]}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.75}
              >
                <AppText
                  variant="paragraph"
                  style={[styles.trackingRowText, { color: colors.deepText }]}
                >
                  {trackingLabel(tracking)}
                </AppText>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.secondaryText}
                />
              </TouchableOpacity>

              <AppText
                variant="small"
                style={[styles.fieldLabel, { color: colors.secondaryText }]}
              >
                Color
              </AppText>
              <View style={styles.colorRow}>
                {HABIT_CARD_THEMES.map((theme, index) => {
                  const selected = !customColor && colorIndex === index;
                  return (
                    <TouchableOpacity
                      key={theme.accent}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.accent },
                        selected && { borderColor: colors.deepText },
                      ]}
                      onPress={() => {
                        setCustomColor(null);
                        setColorIndex(index);
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Color ${index + 1}`}
                    >
                      {selected ? (
                        <IconSymbol
                          name="checkmark"
                          size={16}
                          color={colors.onAccent}
                          weight="bold"
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[
                    styles.colorSwatch,
                    styles.colorSwatchAdd,
                    customColor
                      ? { backgroundColor: customColor }
                      : {
                          backgroundColor: colors.softSurface,
                          borderColor: colors.inactive,
                          borderStyle: "dashed",
                        },
                    !!customColor && { borderColor: colors.deepText },
                  ]}
                  onPress={() => setColorPickerVisible(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: !!customColor }}
                  accessibilityLabel="Custom color"
                >
                  {customColor ? (
                    <IconSymbol
                      name="checkmark"
                      size={16}
                      color={colors.onAccent}
                      weight="bold"
                    />
                  ) : (
                    <IconSymbol
                      name="plus"
                      size={18}
                      color={colors.deepText}
                      weight="bold"
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.dangerZone}>
                <Pressable
                  onPress={handleDelete}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    {
                      backgroundColor: colors.white,
                      borderColor: "rgba(179, 38, 30, 0.35)",
                    },
                    pressed && styles.deleteBtnPressed,
                  ]}
                >
                  <AppText
                    variant="paragraph"
                    style={[styles.deleteBtnText, { color: colors.error }]}
                  >
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
                  { backgroundColor: colors.primaryGreen },
                  !canSave && styles.saveBtnDisabled,
                  pressed && canSave && styles.saveBtnPressed,
                ]}
              >
                <AppText
                  variant="paragraph"
                  style={[styles.saveBtnText, { color: colors.onAccent }]}
                >
                  Save changes
                </AppText>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      <HabitColorPickerModal
        visible={colorPickerVisible}
        initialColor={
          customColor ?? HABIT_CARD_THEMES[colorIndex]?.accent ?? "#7CFF6B"
        }
        onClose={() => setColorPickerVisible(false)}
        onSelect={(hex) => {
          setCustomColor(hex);
          setColorPickerVisible(false);
        }}
      />

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
              <View
                style={[styles.pickerCard, { backgroundColor: colors.white }]}
              >
                {TRACKING_OPTIONS.map((opt, index) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.pickerRow,
                      { borderBottomColor: colors.divider },
                      index === TRACKING_OPTIONS.length - 1 &&
                        styles.pickerRowLast,
                    ]}
                    onPress={() => {
                      setTracking(opt.value);
                      setPickerVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <AppText
                      variant="paragraph"
                      style={[
                        styles.pickerRowText,
                        { color: colors.deepText },
                      ]}
                    >
                      {opt.label}
                    </AppText>
                    {tracking === opt.value ? (
                      <IconSymbol
                        name="checkmark"
                        size={16}
                        color={colors.primaryGreen}
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
  const { initialized, session, isGuest, needsOnboarding } = useAuth();
  if (!initialized) {
    return null;
  }
  if (!session && !isGuest) {
    return <Redirect href="/(auth)/login" />;
  }
  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  return <HabitSettingsScreenContent />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: { width: 28 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 16,
    paddingBottom: 24,
  },
  fieldLabel: {
    marginBottom: 8,
    marginTop: 4,
  },
  textInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: GroveBorderRadius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  iconScroll: { gap: 10, paddingVertical: 4, marginBottom: 8 },
  iconPick: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconPickImg: { width: 40, height: 40 },
  trackingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: GroveBorderRadius.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  trackingRowText: { fontWeight: "500" },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorSwatchAdd: {
    borderStyle: "solid",
  },
  dangerZone: {
    marginTop: 10,
    marginBottom: 12,
  },
  deleteBtn: {
    borderRadius: GroveBorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deleteBtnPressed: {
    opacity: 0.85,
  },
  deleteBtnText: {
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 12,
    paddingBottom: 8,
  },
  saveBtn: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnPressed: { opacity: 0.9 },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  missingWrap: { flex: 1, padding: 24 },
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
  },
  pickerRowLast: { borderBottomWidth: 0 },
  pickerRowText: { fontWeight: "500" },
});
