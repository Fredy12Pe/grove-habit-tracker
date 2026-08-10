import React, { useCallback, useState } from "react";
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
import { Redirect, useRouter } from "expo-router";
import { HabitColorPickerModal } from "@/components/habits/HabitColorPickerModal";
import { HABIT_CARD_THEMES } from "@/components/habits/HabitRow";
import { AppText } from "@/components/ui/AppText";
import { useAuth } from "@/contexts/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGroveColors } from "@/hooks/useGroveColors";
import { GroveBorderRadius, GroveSpacing } from "@/styles/theme";
import { HABIT_CATALOG, TRACKING_OPTIONS, trackingLabel } from "@/lib/habitCatalog";
import { clearReopenAddHabitSheetFromSheet } from "@/lib/reopenAddHabitSheetFromSheet";
import { useHabitStore } from "@/lib/store";
import type {
  HabitCustomCategory,
  HabitCustomTracking,
} from "@/lib/types/habit";

const CATEGORIES: HabitCustomCategory[] = ["Faith", "Fitness", "Well Being"];

function AddCustomHabitScreenContent() {
  const router = useRouter();
  const colors = useGroveColors();
  const addHabit = useHabitStore((s) => s.addHabit);
  const habitCount = useHabitStore((s) => s.habits.length);

  const [name, setName] = useState("");
  const [customIconId, setCustomIconId] = useState(HABIT_CATALOG[0]?.id ?? "pray");
  const [category, setCategory] = useState<HabitCustomCategory>("Faith");
  const [tracking, setTracking] = useState<HabitCustomTracking>("toggle");
  const [colorIndex, setColorIndex] = useState(0);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [trackingPickerVisible, setTrackingPickerVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

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
      customColorIndex: customColor ? undefined : colorIndex,
      customColor: customColor ?? undefined,
    });
    clearReopenAddHabitSheetFromSheet();
    router.back();
  }, [
    addHabit,
    atLimit,
    category,
    colorIndex,
    customColor,
    customIconId,
    name,
    router,
    tracking,
  ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.white }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[styles.header, { borderBottomColor: colors.divider }]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.deepText} />
          </TouchableOpacity>
          <AppText
            variant="h2"
            style={[styles.headerTitle, { color: colors.deepText }]}
          >
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
              <AppText
                variant="small"
                style={[styles.limitWarning, { color: colors.error }]}
              >
                You already have {MAX_ACTIVE_HABITS} habits. Remove one to add a
                custom habit.
              </AppText>
            ) : null}
          <AppText
            variant="small"
            style={[styles.fieldLabel, { color: colors.secondaryText }]}
          >
            Category
          </AppText>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => {
              const selected = category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: colors.softSurface,
                      borderColor: colors.divider,
                    },
                    selected && {
                      backgroundColor: colors.primaryGreen,
                      borderColor: colors.primaryGreen,
                    },
                  ]}
                >
                  <AppText
                    variant="paragraph"
                    style={[
                      styles.categoryChipText,
                      {
                        color: selected ? colors.onAccent : colors.deepText,
                      },
                    ]}
                  >
                    {c}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

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
              const picked = customIconId === h.id;
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[
                    styles.iconPick,
                    { backgroundColor: colors.softSurface },
                    picked && { borderColor: colors.primaryGreen },
                  ]}
                  onPress={() => setCustomIconId(h.id)}
                  activeOpacity={0.8}
                >
                  <Image source={h.icon} style={styles.iconPickImg} resizeMode="contain" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <AppText
            variant="small"
            style={[styles.fieldLabel, { color: colors.secondaryText }]}
          >
            Tracking
          </AppText>
          <TouchableOpacity
            style={[
              styles.trackingRow,
              {
                backgroundColor: colors.softSurface,
                borderColor: colors.divider,
              },
            ]}
            onPress={() => setTrackingPickerVisible(true)}
            activeOpacity={0.75}
          >
            <AppText
              variant="paragraph"
              style={[styles.trackingRowText, { color: colors.deepText }]}
            >
              {trackingLabel(tracking)}
            </AppText>
            <IconSymbol name="chevron.right" size={16} color={colors.secondaryText} />
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
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.primaryGreen },
              !canSave && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <AppText
              variant="paragraph"
              style={[styles.saveBtnText, { color: colors.onAccent }]}
            >
              Save habit
            </AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <HabitColorPickerModal
        visible={colorPickerVisible}
        initialColor={customColor ?? HABIT_CARD_THEMES[colorIndex]?.accent ?? "#7CFF6B"}
        onClose={() => setColorPickerVisible(false)}
        onSelect={(hex) => {
          setCustomColor(hex);
          setColorPickerVisible(false);
        }}
      />

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
              <View
                style={[styles.pickerCard, { backgroundColor: colors.white }]}
              >
                {TRACKING_OPTIONS.map((opt, index) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.pickerRow,
                      { borderBottomColor: colors.divider },
                      index === TRACKING_OPTIONS.length - 1 && styles.pickerRowLast,
                    ]}
                    onPress={() => {
                      setTracking(opt.value);
                      setTrackingPickerVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <AppText
                      variant="paragraph"
                      style={[styles.pickerRowText, { color: colors.deepText }]}
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

export default function AddCustomHabitScreen() {
  const { initialized, session, isGuest } = useAuth();
  if (!initialized) {
    return null;
  }
  if (!session && !isGuest) {
    return <Redirect href="/(auth)/login" />;
  }
  return <AddCustomHabitScreenContent />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
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
    marginBottom: 8,
    marginTop: 4,
  },
  limitWarning: {
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  textInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: GroveBorderRadius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconPickImg: {
    width: 40,
    height: 40,
  },
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
  trackingRowText: {
    fontWeight: "500",
  },
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
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
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
  pickerRowLast: {
    borderBottomWidth: 0,
  },
  pickerRowText: {
    fontWeight: "500",
  },
});
