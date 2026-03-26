import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GroveBorderRadius, GroveColors, GroveSpacing } from '@/styles/theme';
import { CATALOG_ID_SET, HABIT_SECTIONS } from '@/lib/habitCatalog';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.82;

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
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(activeHabitIds.filter((id) => CATALOG_ID_SET.has(id))),
  );

  useEffect(() => {
    const catalogOnly = activeHabitIds.filter((id) => CATALOG_ID_SET.has(id));
    setSelected(new Set(catalogOnly));
  }, [activeHabitIds]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpdate = () => {
    onUpdate([...selected]);
    onClose();
  };

  const openAddCustom = () => {
    onClose();
    router.push('/add-custom-habit');
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <AppText variant="h2" style={styles.title}>
              Add Habits
            </AppText>
            <View style={styles.titleActions}>
              <Pressable
                onPress={openAddCustom}
                style={({ pressed }) => [styles.addCustomBtn, pressed && styles.addCustomBtnPressed]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Add a custom habit"
              >
                <AppText style={styles.addCustomBtnText}>+</AppText>
              </Pressable>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="xmark" size={18} color={GroveColors.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {HABIT_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AppText variant="paragraph" style={styles.sectionTitle}>
                    {section.title}
                  </AppText>
                  <IconSymbol name="chevron.right" size={14} color={GroveColors.secondaryText} />
                </View>

                <View style={styles.habitList}>
                  {section.habits.map((habit) => {
                    const isChecked = selected.has(habit.id);
                    return (
                      <TouchableOpacity
                        key={habit.id}
                        style={styles.habitRow}
                        onPress={() => toggle(habit.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.iconWrap}>
                          <Image source={habit.icon} style={styles.icon} resizeMode="contain" />
                        </View>
                        <AppText variant="paragraph" style={styles.habitName}>
                          {habit.name}
                        </AppText>
                        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                          {isChecked && (
                            <IconSymbol
                              name="checkmark"
                              size={12}
                              color={GroveColors.white}
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
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} activeOpacity={0.85}>
              <AppText variant="paragraph" style={styles.updateBtnText}>
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
    backgroundColor: GroveColors.background,
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
    backgroundColor: GroveColors.inactive,
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
    color: GroveColors.primaryText,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addCustomBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GroveColors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomBtnPressed: {
    opacity: 0.75,
  },
  addCustomBtnText: {
    fontSize: 22,
    color: GroveColors.primaryGreen,
    fontWeight: '400',
    lineHeight: 26,
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
    color: GroveColors.primaryText,
  },
  habitList: {
    backgroundColor: GroveColors.white,
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
    borderBottomColor: GroveColors.inactive,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: GroveColors.cardBackground,
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
    color: GroveColors.primaryText,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: GroveColors.inactive,
    backgroundColor: GroveColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: GroveColors.primaryGreen,
    borderColor: GroveColors.primaryGreen,
  },
  footer: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 12,
  },
  updateBtn: {
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateBtnText: {
    color: GroveColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
