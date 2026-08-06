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
import { useGroveColors } from "@/hooks/useGroveColors";
import {
  CATALOG_NAME_MAP,
  getDurationOptions,
  getHabitActionType,
  type HabitActionType,
} from "@/lib/habitCatalog";
import type { HabitEntry } from "@/lib/store/useHabitStore";
import { useHabitStore } from "@/lib/store";
import { syncWidgets } from "@/lib/widgets/syncWidgets";
import { GroveBorderRadius, GroveSpacing } from "@/styles/theme";

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
  const colors = useGroveColors();
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
    if (markCompleteOnSave) {
      toggleHabit(habitId);
      syncWidgets();
    }
    onClose();
  };

  const handleMarkDone = () => {
    if (habitId) {
      toggleHabit(habitId);
      syncWidgets();
    }
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

        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.inactive }]} />
          <View style={styles.titleRow}>
            <AppText
              variant="h2"
              style={[styles.title, { color: colors.primaryText }]}
            >
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
                color={colors.secondaryText}
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
                <AppText
                  variant="small"
                  style={[styles.label, { color: colors.secondaryText }]}
                >
                  Today&apos;s entry
                </AppText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.white,
                      color: colors.primaryText,
                      borderColor: colors.inactive,
                    },
                  ]}
                  placeholder="What's on your mind?"
                  placeholderTextColor={colors.secondaryText}
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
                <AppText
                  variant="small"
                  style={[styles.label, { color: colors.secondaryText }]}
                >
                  Note (optional)
                </AppText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.white,
                      color: colors.primaryText,
                      borderColor: colors.inactive,
                    },
                  ]}
                  placeholder="e.g. What you prayed about, a verse, something you're grateful for"
                  placeholderTextColor={colors.secondaryText}
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            )}

            {actionType === "duration" && (
              <View style={styles.field}>
                <AppText
                  variant="small"
                  style={[styles.label, { color: colors.secondaryText }]}
                >
                  How long?
                </AppText>
                <View style={styles.chips}>
                  {durationOptions.map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: colors.white,
                          borderColor: colors.inactive,
                        },
                        durationMinutes === mins && {
                          backgroundColor: colors.primaryGreen,
                          borderColor: colors.primaryGreen,
                        },
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
                          {
                            color:
                              durationMinutes === mins
                                ? colors.onAccent
                                : colors.primaryText,
                          },
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
                <AppText
                  variant="small"
                  style={[styles.label, { color: colors.secondaryText }]}
                >
                  How many glasses today?
                </AppText>
                <View style={styles.chips}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: colors.white,
                          borderColor: colors.inactive,
                        },
                        count === n && {
                          backgroundColor: colors.primaryGreen,
                          borderColor: colors.primaryGreen,
                        },
                      ]}
                      onPress={() => setCount(n)}
                      activeOpacity={0.7}
                    >
                      <AppText
                        variant="paragraph"
                        style={[
                          styles.chipText,
                          {
                            color:
                              count === n
                                ? colors.onAccent
                                : colors.primaryText,
                          },
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
                <AppText
                  variant="paragraphRegular"
                  style={[styles.hint, { color: colors.secondaryText }]}
                >
                  Mark this habit as done for today.
                </AppText>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primaryGreen },
                actionType !== "checkbox_only" &&
                  !canSave &&
                  styles.saveBtnDisabled,
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
              <AppText
                variant="paragraph"
                style={[styles.saveBtnText, { color: colors.onAccent }]}
              >
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
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
    fontSize: 12,
    fontWeight: "500",
  },
  input: {
    borderRadius: GroveBorderRadius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: GroveBorderRadius.button,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
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
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  hint: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 8,
  },
  saveBtn: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
