import { AddCustomHabitRow } from '@/components/habits/AddCustomHabitRow';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useGroveColors } from '@/hooks/useGroveColors';
import { GroveBorderRadius, GroveSpacing } from '@/styles/theme';
import {
  CATALOG_ICON_MAP,
  CATALOG_ID_SET,
  HABIT_SECTIONS,
} from '@/lib/habitCatalog';
import { markReopenAddHabitSheetFromSheet } from '@/lib/reopenAddHabitSheetFromSheet';
import { useHabitStore } from '@/lib/store';
import type { HabitCustomCategory } from '@/lib/types/habit';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.82;
const MAX_ACTIVE_HABITS = 8;

type SheetHabit = {
  id: string;
  name: string;
  icon: ImageSourcePropType;
};

interface AddHabitSheetProps {
  activeHabitIds: string[];
  onClose: () => void;
  onUpdate: (selectedIds: string[]) => void;
}

/**
 * Mount only while the sheet should be on screen (parent gates with `sheetVisible`).
 * Avoids leaving a mounted Modal with `visible={false}`, which can block touches on some platforms.
 */
export function AddHabitSheet({ activeHabitIds, onClose, onUpdate }: AddHabitSheetProps) {
  const colors = useGroveColors();
  const router = useRouter();
  const storeHabits = useHabitStore((s) => s.habits);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(activeHabitIds),
  );

  useEffect(() => {
    setSelected(new Set(activeHabitIds));
  }, [activeHabitIds]);

  const sections = useMemo(() => {
    const customByCategory = new Map<HabitCustomCategory, SheetHabit[]>();
    for (const h of storeHabits) {
      if (CATALOG_ID_SET.has(h.id)) continue;
      const category: HabitCustomCategory = h.customCategory ?? 'Well Being';
      const iconId = h.customIconCatalogId ?? 'pray';
      const icon = CATALOG_ICON_MAP[iconId] ?? CATALOG_ICON_MAP.pray;
      const list = customByCategory.get(category) ?? [];
      list.push({ id: h.id, name: h.name, icon });
      customByCategory.set(category, list);
    }

    return HABIT_SECTIONS.map((section) => {
      const title = section.title as HabitCustomCategory;
      return {
        title: section.title,
        habits: [
          ...section.habits.map((habit) => ({
            id: habit.id,
            name: habit.name,
            icon: habit.icon,
          })),
          ...(customByCategory.get(title) ?? []),
        ] as SheetHabit[],
      };
    });
  }, [storeHabits]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= MAX_ACTIVE_HABITS) {
          Alert.alert(
            'Limit reached',
            `You can only have ${MAX_ACTIVE_HABITS} habits. To add a new one, remove an existing habit first.`,
            [{ text: 'OK' }],
          );
          return next;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleUpdate = () => {
    onUpdate([...selected]);
    onClose();
  };

  const openAddCustom = () => {
    markReopenAddHabitSheetFromSheet();
    onClose();
    router.push('/add-custom-habit');
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.white }]}>
          <View style={[styles.handle, { backgroundColor: colors.inactive }]} />

          <View style={styles.titleRow}>
            <AppText variant="h2" style={[styles.title, { color: colors.deepText }]}>
              Add Habits
            </AppText>
            <AppText variant="small" style={[styles.counter, { color: colors.secondaryText }]}>
              {Math.min(MAX_ACTIVE_HABITS, selected.size)}/{MAX_ACTIVE_HABITS}
            </AppText>
            <View style={styles.titleActions}>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="xmark" size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AddCustomHabitRow
              style={{ ...styles.addCustomHabitInSheet, backgroundColor: colors.softSurface }}
              onPress={openAddCustom}
            />
            {sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AppText variant="paragraph" style={[styles.sectionTitle, { color: colors.deepText }]}>
                    {section.title}
                  </AppText>
                  <IconSymbol name="chevron.right" size={14} color={colors.secondaryText} />
                </View>

                <View style={[styles.habitList, { backgroundColor: colors.softSurface }]}>
                  {section.habits.map((habit) => {
                    const isChecked = selected.has(habit.id);
                    return (
                      <TouchableOpacity
                        key={habit.id}
                        style={[styles.habitRow, { borderBottomColor: colors.divider }]}
                        onPress={() => toggle(habit.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconWrap, { backgroundColor: colors.white }]}>
                          <Image source={habit.icon} style={styles.icon} resizeMode="contain" />
                        </View>
                        <AppText variant="paragraph" style={[styles.habitName, { color: colors.deepText }]}>
                          {habit.name}
                        </AppText>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: colors.inactive,
                              backgroundColor: colors.white,
                            },
                            isChecked && {
                              backgroundColor: colors.primaryGreen,
                              borderColor: colors.primaryGreen,
                            },
                          ]}
                        >
                          {isChecked && (
                            <IconSymbol
                              name="checkmark"
                              size={12}
                              color={colors.onAccent}
                              weight="bold"
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.updateBtn, { backgroundColor: colors.primaryGreen }]}
              onPress={handleUpdate}
              activeOpacity={0.85}
            >
              <AppText variant="paragraph" style={[styles.updateBtnText, { color: colors.onAccent }]}>
                Update
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 0,
  },
  sheet: {
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 32,
    zIndex: 1,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingVertical: 14,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  counter: {
    marginRight: 6,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addCustomHabitInSheet: {
    marginBottom: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  habitList: {
    borderRadius: GroveBorderRadius.card,
    overflow: 'hidden',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 36,
    height: 36,
  },
  habitName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 12,
  },
  updateBtn: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
