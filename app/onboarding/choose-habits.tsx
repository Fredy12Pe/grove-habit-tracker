import { AddCustomHabitRow } from "@/components/habits/AddCustomHabitRow";
import { HabitSelectRow, type HabitSelectData } from "@/components/habits/HabitSelectRow";
import { AppText } from "@/components/ui/AppText";
import { useOnboarding } from "@/contexts/onboarding-context";
import { CATALOG_ICON_MAP, CATALOG_ID_SET, CATALOG_NAME_MAP } from "@/lib/habitCatalog";
import { ONBOARDING_HABIT_SECTIONS } from "@/lib/onboarding-habit-sections";
import { useHabitStore } from "@/lib/store";
import { GroveBorderRadius, GroveColors, GroveSpacing } from "@/styles/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const MAX_SELECTION = 8;

export default function ChooseHabitsOnboardingScreen() {
  const router = useRouter();
  const {
    selectedHabitIds,
    setSelectedHabitIds,
    previewHabitsSnapshot,
    setPreviewHabitsSnapshot,
  } = useOnboarding();
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const storeHabits = useHabitStore((s) => s.habits);
  const applySelectedHabits = useHabitStore((s) => s.applySelectedHabits);
  const lastCustomAlertKeyRef = useRef<string>("");

  const selectedSet = useMemo(
    () => new Set(selectedHabitIds),
    [selectedHabitIds],
  );

  useEffect(() => {
    const customIds = storeHabits
      .filter((h) => !CATALOG_ID_SET.has(h.id))
      .map((h) => h.id);

    if (customIds.length === 0) return;

    // Auto-select custom habits when possible; if user is already at the limit,
    // do NOT auto-uncheck anything — prompt them to swap instead.
    setSelectedHabitIds((prev) => {
      const prevSet = new Set(prev);
      const missingCustom = customIds.filter((id) => !prevSet.has(id));
      if (missingCustom.length === 0) return prev;

      if (prev.length >= MAX_SELECTION) {
        const key = [...missingCustom].sort().join("|");
        if (lastCustomAlertKeyRef.current !== key) {
          lastCustomAlertKeyRef.current = key;
          Alert.alert(
            "Custom habit added",
            "Sorry, you're currently only allowed 8 habits. To add a new one, uncheck one of your current habits.",
            [{ text: "OK" }],
          );
        }
        return prev;
      }

      const next = [...prev];
      for (const id of missingCustom) {
        if (next.length >= MAX_SELECTION) break;
        next.push(id);
      }

      return next;
    });
  }, [setSelectedHabitIds, storeHabits]);

  const sections = useMemo(() => {
    const customHabits = storeHabits.filter((h) => !CATALOG_ID_SET.has(h.id));

    const mapCustomCategoryToOnboarding = (cat: string | undefined) => {
      if (cat === "Faith") return "Spiritual";
      if (cat === "Fitness") return "Health";
      return "Discipline";
    };

    const customBySection = new Map<string, HabitSelectData[]>();
    for (const h of customHabits) {
      const sectionTitle = mapCustomCategoryToOnboarding(h.customCategory);
      const iconId = h.customIconCatalogId ?? "pray";
      const icon = CATALOG_ICON_MAP[iconId] ?? CATALOG_ICON_MAP.pray;
      const list = customBySection.get(sectionTitle) ?? [];
      list.push({ id: h.id, name: h.name, icon });
      customBySection.set(sectionTitle, list);
    }

    return ONBOARDING_HABIT_SECTIONS.map((s) => ({
      title: s.title,
      habits: [
        ...s.habitIds
        .map((id) => ({
          id,
          name: CATALOG_NAME_MAP[id] ?? id,
          icon: CATALOG_ICON_MAP[id],
        }))
        .filter((h): h is HabitSelectData => Boolean(h.icon)),
        ...(customBySection.get(s.title) ?? []),
      ],
    }));
  }, [storeHabits]);

  const toggle = (id: string) => {
    setLimitMessage(null);
    setSelectedHabitIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) {
        set.delete(id);
        return Array.from(set);
      }
      if (set.size >= MAX_SELECTION) {
        Alert.alert(
          "Limit reached",
          "Sorry, you're currently only allowed 8 habits. To add a new one, uncheck one of your current habits.",
          [{ text: "OK" }],
        );
        return prev;
      }
      set.add(id);
      return Array.from(set);
    });
  };

  const canContinue = selectedHabitIds.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <AppText variant="h1" style={styles.title}>
              What do you want to grow?
            </AppText>
            <AppText variant="paragraphRegular" style={styles.support}>
              Choose up to {MAX_SELECTION} habits to begin your garden.
            </AppText>
            <AppText variant="small" style={styles.note}>
              Each habit becomes a plant in your garden.
            </AppText>
          </View>

          <AddCustomHabitRow
            style={styles.addCustomRowWrap}
            onPress={() => router.push("/add-custom-habit")}
          />

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <AppText variant="paragraphRegular" style={styles.sectionLabel}>
                {section.title}
              </AppText>
              {section.habits.map((h) => (
                <HabitSelectRow
                  key={h.id}
                  habit={h}
                  selected={selectedSet.has(h.id)}
                  disabled={false}
                  onPress={toggle}
                />
              ))}
            </View>
          ))}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <AppText variant="small" style={styles.counter}>
              {selectedHabitIds.length}/{MAX_SELECTION} selected
            </AppText>
            {limitMessage ? (
              <AppText variant="small" style={styles.limit}>
                {limitMessage}
              </AppText>
            ) : null}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]}
            disabled={!canContinue}
            onPress={() => {
              if (!previewHabitsSnapshot) {
                setPreviewHabitsSnapshot(storeHabits);
              }
              applySelectedHabits(selectedHabitIds);
              router.push("/onboarding/profile-setup");
            }}
          >
            <AppText variant="paragraph" style={styles.primaryBtnText}>
              Continue
            </AppText>
          </TouchableOpacity>

          {!canContinue ? (
            <AppText variant="small" style={styles.helper}>
              Select at least 1 habit.
            </AppText>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GroveColors.background,
  },
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 24,
  },
  header: {
    marginBottom: 20,
    gap: 8,
  },
  title: {
    color: GroveColors.primaryText,
    fontWeight: "700",
  },
  support: {
    color: GroveColors.secondaryText,
  },
  note: {
    color: GroveColors.secondaryText,
    opacity: 0.9,
  },
  section: {
    marginBottom: 18,
  },
  addCustomRowWrap: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    color: GroveColors.secondaryText,
    marginBottom: 10,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 24,
  },
  footer: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: GroveColors.divider,
    backgroundColor: GroveColors.background,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  counter: {
    color: GroveColors.secondaryText,
  },
  limit: {
    color: GroveColors.secondaryText,
    textAlign: "right",
  },
  primaryBtn: {
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: GroveBorderRadius.button,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: GroveColors.white,
    fontWeight: "700",
  },
  helper: {
    color: GroveColors.secondaryText,
    textAlign: "center",
    marginTop: 10,
  },
});

