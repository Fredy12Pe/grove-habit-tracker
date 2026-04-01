import { Card } from "@/components/ui/Card";
import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GamePreview } from "@/components/game/GamePreview";
import { useAuth } from "@/contexts/auth-context";
import { useOnboarding } from "@/contexts/onboarding-context";
import { CATALOG_ICON_MAP, HABIT_CATALOG } from "@/lib/habitCatalog";
import { useHabitStore } from "@/lib/store";
import { GroveBorderRadius, GroveColors, GroveSpacing } from "@/styles/theme";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function GardenIntroOnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, session } = useAuth();
  const {
    selectedHabitIds,
    previewHabitsSnapshot,
    setPreviewHabitsSnapshot,
    resetOnboardingState,
  } = useOnboarding();
  const applySelectedHabits = useHabitStore((s) => s.applySelectedHabits);
  const setHabits = useHabitStore((s) => s.setHabits);
  const storeHabits = useHabitStore((s) => s.habits);

  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIcons = useMemo(() => {
    const byId = new Map(storeHabits.map((h) => [h.id, h]));
    const fallback = HABIT_CATALOG[0]?.icon;
    return selectedHabitIds
      .slice(0, 8)
      .map((id) => {
        const h = byId.get(id);
        const iconKey = h?.customIconCatalogId ?? id;
        const icon = CATALOG_ICON_MAP[iconKey] ?? fallback;
        return icon ? { id, icon } : null;
      })
      .filter((x): x is { id: string; icon: number } => x != null);
  }, [selectedHabitIds, storeHabits]);

  const onStart = async () => {
    setError(null);
    setFinishing(true);
    try {
      // Apply chosen habits immediately so the Garden/Habits tabs reflect the selection.
      applySelectedHabits(selectedHabitIds);

      // Mark onboarding complete (Supabase user metadata).
      if (session) {
        const { error: err } = await completeOnboarding();
        if (err) {
          setError(err.message);
          return;
        }
      }

      resetOnboardingState();
      router.replace("/(tabs)/garden");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.headerNav}>
          <TouchableOpacity
            onPress={() => {
              if (previewHabitsSnapshot) {
                setHabits(previewHabitsSnapshot);
                setPreviewHabitsSnapshot(null);
              }
              router.back();
            }}
            style={styles.backBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={finishing}
          >
            <IconSymbol
              name="chevron.left"
              size={18}
              color={GroveColors.primaryText}
            />
            <AppText variant="paragraph" style={styles.backLabel}>
              Back
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <AppText variant="h1" style={styles.title}>
            Your garden is ready to grow
          </AppText>
          <AppText variant="paragraphRegular" style={styles.support}>
            Small daily habits grow something beautiful.
          </AppText>
        </View>

        <View style={styles.visualWrap}>
          <Card style={styles.gardenCard}>
            <GamePreview showOverlay={false} />
          </Card>
        </View>

        {selectedIcons.length > 0 ? (
          <View style={styles.iconRow}>
            {selectedIcons.map((x) => (
              <View key={x.id} style={styles.iconPill}>
                <Image source={x.icon} style={styles.icon} resizeMode="contain" />
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.footer}>
          {error ? (
            <AppText variant="small" style={styles.error}>
              {error}
            </AppText>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.primaryBtn, finishing && styles.primaryBtnDisabled]}
            onPress={onStart}
            disabled={finishing}
          >
            {finishing ? (
              <ActivityIndicator color={GroveColors.primaryText} />
            ) : (
              <AppText variant="paragraph" style={styles.primaryBtnText}>
                Start Growing
              </AppText>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 14,
    paddingBottom: 24,
  },
  headerNav: {
    marginBottom: 18,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLabel: {
    color: GroveColors.primaryText,
    fontSize: 15,
    fontWeight: "500",
  },
  header: {
    gap: 8,
    marginBottom: 14,
  },
  title: {
    color: GroveColors.primaryText,
    fontWeight: "700",
    textAlign: "center",
  },
  support: {
    color: GroveColors.secondaryText,
    textAlign: "center",
  },
  visualWrap: {
    flex: 1,
    justifyContent: "center",
  },
  gardenCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
    borderRadius: GroveBorderRadius.card,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 320,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 123, 103, 0.14)",
  },
  icon: {
    width: 34,
    height: 34,
  },
  footer: {
    gap: 10,
  },
  error: {
    color: "#B3261E",
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: GroveBorderRadius.button,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: GroveColors.primaryText,
    fontWeight: "700",
  },
});

