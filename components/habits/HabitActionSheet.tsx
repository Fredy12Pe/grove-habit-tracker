import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  CATALOG_NAME_MAP,
  getDurationOptions,
  getHabitActionType,
  type HabitActionType,
} from "@/lib/habitCatalog";
import type { HabitEntry } from "@/lib/store/useHabitStore";
import { useHabitStore } from "@/lib/store";
import {
  GroveBorderRadius,
  GroveColors,
  GroveSpacing,
} from "@/styles/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.6, 420);

const todayStr = () => new Date().toISOString().slice(0, 10);

interface HabitActionSheetProps {
  visible: boolean;
  habitId: string | null;
  onClose: () => void;
  /** When true, "Save" also marks the habit complete for today. Default true. */
  markCompleteOnSave?: boolean;
}

export function HabitActionSheet({
  visible,
  habitId,
  onClose,
  markCompleteOnSave = true,
}: HabitActionSheetProps) {
  const getHabitEntry = useHabitStore((s) => s.getHabitEntry);
  const setHabitEntry = useHabitStore((s) => s.setHabitEntry);
  const toggleHabit = useHabitStore((s) => s.toggleHabit);

  const [journalText, setJournalText] = useState("");
  const [note, setNote] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [count, setCount] = useState<number>(1);

  const date = todayStr();
  const actionType: HabitActionType = habitId
    ? getHabitActionType(habitId)
    : "checkbox_only";
  const durationOptions = habitId ? getDurationOptions(habitId) : [];
  const habitName = habitId ? CATALOG_NAME_MAP[habitId] ?? habitId : "";

  useEffect(() => {
    if (!visible || !habitId) return;
    const entry = getHabitEntry(habitId, date);
    setJournalText(entry?.journalText ?? "");
    setNote(entry?.note ?? "");
    setDurationMinutes(entry?.durationMinutes ?? null);
    setCount(entry?.count ?? 1);
  }, [visible, habitId, date, getHabitEntry]);

  const handleSave = () => {
    if (!habitId) {
      onClose();
      return;
    }
    const entry: Partial<HabitEntry> = {};
    if (actionType === "journal") entry.journalText = journalText;
    if (actionType === "note") entry.note = note;
    if (actionType === "duration" && durationMinutes != null)
      entry.durationMinutes = durationMinutes;
    if (actionType === "count") entry.count = count;

    if (Object.keys(entry).length > 0) setHabitEntry(habitId, date, entry);
    if (markCompleteOnSave) toggleHabit(habitId);
    onClose();
  };

  const handleMarkDone = () => {
    if (habitId) toggleHabit(habitId);
    onClose();
  };

  if (!habitId) return null;

  const canSave =
    actionType === "checkbox_only" ||
    actionType === "journal" ||
    actionType === "note" ||
    (actionType === "duration" && durationMinutes != null) ||
    (actionType === "count" && count >= 1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <AppText variant="h2" style={styles.title}>
              {habitName}
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol
                name="xmark"
                size={18}
                color={GroveColors.secondaryText}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {actionType === "journal" && (
              <View style={styles.field}>
                <AppText variant="small" style={styles.label}>
                  Today&apos;s entry
                </AppText>
                <TextInput
                  style={styles.textArea}
                  placeholder="What's on your mind?"
                  placeholderTextColor={GroveColors.secondaryText}
                  value={journalText}
                  onChangeText={setJournalText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}

            {actionType === "note" && (
              <View style={styles.field}>
                <AppText variant="small" style={styles.label}>
                  Note (optional)
                </AppText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. What you prayed about, a verse, something you're grateful for"
                  placeholderTextColor={GroveColors.secondaryText}
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            )}

            {actionType === "duration" && (
              <View style={styles.field}>
                <AppText variant="small" style={styles.label}>
                  How long?
                </AppText>
                <View style={styles.chips}>
                  {durationOptions.map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.chip,
                        durationMinutes === mins && styles.chipSelected,
                      ]}
                      onPress={() =>
                        setDurationMinutes((m) => (m === mins ? null : mins))
                      }
                      activeOpacity={0.7}
                    >
                      <AppText
                        variant="paragraph"
                        style={[
                          styles.chipText,
                          durationMinutes === mins && styles.chipTextSelected,
                        ]}
                      >
                        {mins} min
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {actionType === "count" && (
              <View style={styles.field}>
                <AppText variant="small" style={styles.label}>
                  How many glasses today?
                </AppText>
                <View style={styles.chips}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.chip, count === n && styles.chipSelected]}
                      onPress={() => setCount(n)}
                      activeOpacity={0.7}
                    >
                      <AppText
                        variant="paragraph"
                        style={[
                          styles.chipText,
                          count === n && styles.chipTextSelected,
                        ]}
                      >
                        {n}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {actionType === "checkbox_only" && (
              <View style={styles.field}>
                <AppText variant="paragraphRegular" style={styles.hint}>
                  Mark this habit as done for today.
                </AppText>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                actionType !== "checkbox_only" && !canSave && styles.saveBtnDisabled,
              ]}
              onPress={
                actionType === "checkbox_only" ? handleMarkDone : handleSave
              }
              activeOpacity={0.85}
              disabled={
                actionType !== "checkbox_only" &&
                actionType !== "note" &&
                !canSave
              }
            >
              <AppText variant="paragraph" style={styles.saveBtnText}>
                {actionType === "checkbox_only" ? "Mark as done" : "Save"}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: GroveColors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: GroveColors.inactive,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: GroveColors.primaryText,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingBottom: 12,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: GroveColors.secondaryText,
    fontSize: 12,
    fontWeight: "500",
  },
  input: {
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: GroveColors.primaryText,
    borderWidth: 1,
    borderColor: GroveColors.inactive,
  },
  textArea: {
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: GroveColors.primaryText,
    borderWidth: 1,
    borderColor: GroveColors.inactive,
    minHeight: 120,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: GroveBorderRadius.pill,
    backgroundColor: GroveColors.white,
    borderWidth: 2,
    borderColor: GroveColors.inactive,
  },
  chipSelected: {
    backgroundColor: GroveColors.primaryGreen,
    borderColor: GroveColors.primaryGreen,
  },
  chipText: {
    fontSize: 14,
    color: GroveColors.primaryText,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: GroveColors.white,
  },
  hint: {
    color: GroveColors.secondaryText,
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 8,
  },
  saveBtn: {
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: GroveColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
