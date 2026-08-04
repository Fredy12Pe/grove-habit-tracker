import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GroveColors } from "@/styles/theme";
import React, { useState, type ReactNode } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";

export interface HabitData {
  id: string;
  name: string;
  streak: number;
  icon: ImageSourcePropType;
  completed: boolean;
  /** Optional progress summary (e.g. "3 / 8 glasses") */
  progressSummary?: string;
  /** Mon→Sun completion for the visible week */
  weekCompletion?: boolean[];
}

export type HabitCardTheme = {
  /** Dark tinted card fill */
  bg: string;
  /** Bright saturated CTA */
  accent: string;
  /** Deep shade — expanded form controls */
  accentDeep: string;
  /** Icon well */
  iconWell: string;
};

/** Index-cycled Habitz-style themes — dark wash + bright accent. */
export const HABIT_CARD_THEMES: readonly HabitCardTheme[] = [
  {
    bg: "#1E3A2F",
    accent: "#7CFF6B",
    accentDeep: "#4DB83D",
    iconWell: "#162B23",
  }, // green
  {
    bg: "#1A2744",
    accent: "#5B9DFF",
    accentDeep: "#3D7FE0",
    iconWell: "#121C33",
  }, // blue
  {
    bg: "#2A1F3D",
    accent: "#B794F6",
    accentDeep: "#8B6AD4",
    iconWell: "#1F1730",
  }, // purple
  {
    bg: "#3D2A1A",
    accent: "#FF9F43",
    accentDeep: "#E8892E",
    iconWell: "#2E1F12",
  }, // orange
  {
    bg: "#1A3030",
    accent: "#4ECDC4",
    accentDeep: "#2BB3AA",
    iconWell: "#122424",
  }, // teal
  {
    bg: "#3D1F2A",
    accent: "#FF6B9D",
    accentDeep: "#E04D7F",
    iconWell: "#2E1520",
  }, // pink
  {
    bg: "#2A301A",
    accent: "#C6E048",
    accentDeep: "#A8C230",
    iconWell: "#1F2412",
  }, // olive
  {
    bg: "#1A2438",
    accent: "#6BB3FF",
    accentDeep: "#4A95E0",
    iconWell: "#121A2B",
  }, // steel
] as const;

export function habitCardThemeAt(index: number): HabitCardTheme {
  return HABIT_CARD_THEMES[index % HABIT_CARD_THEMES.length];
}

function clampByte(n: number) {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function hexToRgb(hex: string) {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n) || full.length !== 6) {
    return { r: 124, g: 255, b: 107 };
  }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  const to = (n: number) => clampByte(n).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

function mixRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/** Build a card theme from a single accent hex (custom color picker). */
export function habitCardThemeFromAccent(accent: string): HabitCardTheme {
  const accentRgb = hexToRgb(accent);
  const bg = mixRgb(accentRgb, { r: 18, g: 22, b: 28 }, 0.78);
  const iconWell = mixRgb(accentRgb, { r: 12, g: 14, b: 18 }, 0.85);
  const accentDeep = mixRgb(accentRgb, { r: 0, g: 0, b: 0 }, 0.28);
  return {
    bg: rgbToHex(bg.r, bg.g, bg.b),
    accent: accent.startsWith("#") ? accent.toUpperCase() : `#${accent.toUpperCase()}`,
    accentDeep: rgbToHex(accentDeep.r, accentDeep.g, accentDeep.b),
    iconWell: rgbToHex(iconWell.r, iconWell.g, iconWell.b),
  };
}

/** Deep accent for expanded form controls. */
export function habitCardAccentAt(index: number): string {
  return habitCardThemeAt(index).accentDeep;
}

interface HabitRowProps {
  habit: HabitData;
  onToggle: (id: string) => void;
  /** Palette index for a distinct card theme. */
  colorIndex?: number;
  /** Custom accent hex — overrides colorIndex when set. */
  customAccent?: string;
  /** When provided, tapping the chevron opens this habit's action. */
  onOpenAction?: (habitId: string) => void;
  /** When provided and row is expanded, shows a settings button. */
  onPressSettings?: (habitId: string) => void;
  /** When provided, row expand shows this content instead of default message. Use with expanded + onExpandToggle for controlled mode. */
  expandedContent?: ReactNode;
  /** Controlled expanded state (use with onExpandToggle). */
  expanded?: boolean;
  /** Called when row or chevron is pressed to toggle expand (use for controlled mode). */
  onExpandToggle?: () => void;
}

export function HabitRow({
  habit,
  onToggle,
  colorIndex = 0,
  customAccent,
  onOpenAction,
  onPressSettings,
  expandedContent,
  expanded: expandedProp,
  onExpandToggle,
}: HabitRowProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isControlled =
    expandedProp !== undefined && onExpandToggle !== undefined;
  const expanded = isControlled ? expandedProp : internalExpanded;
  const theme = customAccent
    ? habitCardThemeFromAccent(customAccent)
    : habitCardThemeAt(colorIndex);
  const week = habit.weekCompletion ?? [];

  const toggleExpand = () => {
    if (onOpenAction) {
      onOpenAction(habit.id);
      return;
    }
    if (isControlled) onExpandToggle();
    else setInternalExpanded((v) => !v);
  };

  const progressLabel =
    habit.progressSummary?.trim() ||
    (habit.completed ? "Done" : `Streak ${habit.streak}`);

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.bg }]}>
      <TouchableOpacity
        style={[styles.cardFace, expanded && styles.cardFaceExpanded]}
        onPress={toggleExpand}
        activeOpacity={0.85}
      >
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: theme.iconWell }]}>
            <Image
              source={habit.icon}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.checkBtn,
              habit.completed
                ? { backgroundColor: theme.accent, borderColor: theme.accent }
                : styles.checkBtnOutline,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onToggle(habit.id);
            }}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: habit.completed }}
            accessibilityLabel={
              habit.completed ? "Mark incomplete" : "Mark complete"
            }
          >
            {habit.completed ? (
              <IconSymbol
                name="checkmark"
                size={18}
                color={GroveColors.white}
                weight="bold"
              />
            ) : null}
          </TouchableOpacity>
        </View>

        <View style={styles.textBlock}>
          <AppText variant="h2" style={styles.name} numberOfLines={2}>
            {habit.name}
          </AppText>
          <AppText variant="small" style={styles.progress} numberOfLines={1}>
            {progressLabel}
          </AppText>
        </View>

        <View style={styles.weekRow}>
          {Array.from({ length: 7 }).map((_, i) => {
            const filled = week[i] === true;
            return (
              <View
                key={i}
                style={[
                  styles.weekDot,
                  filled
                    ? { backgroundColor: theme.accent }
                    : styles.weekDotEmpty,
                ]}
              />
            );
          })}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedArea}>
          {onPressSettings ? (
            <View style={styles.expandedHeaderRow}>
              <View style={styles.expandedHeaderSpacer} />
              <TouchableOpacity
                onPress={() => onPressSettings(habit.id)}
                style={styles.settingsBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <IconSymbol
                  name="ellipsis"
                  size={18}
                  color={GroveColors.secondaryText}
                  style={
                    Platform.OS === "ios"
                      ? { transform: [{ rotate: "90deg" }] }
                      : undefined
                  }
                />
              </TouchableOpacity>
            </View>
          ) : null}
          {expandedContent ?? (
            <AppText variant="small" style={styles.expandedText}>
              Keep going! Complete this habit to grow your garden.
            </AppText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    marginBottom: 0,
    overflow: "hidden",
    flex: 1,
  },
  cardFace: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 16,
    minHeight: 168,
    justifyContent: "space-between",
  },
  cardFaceExpanded: {
    minHeight: 148,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  icon: {
    width: 34,
    height: 34,
  },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
  },
  checkBtnOutline: {
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.45)",
  },
  textBlock: {
    marginTop: 18,
    gap: 4,
    paddingRight: 4,
  },
  name: {
    color: GroveColors.white,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  progress: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "500",
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 16,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekDotEmpty: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  expandedArea: {
    backgroundColor: GroveColors.softSurface,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  expandedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 6,
    paddingBottom: 8,
  },
  expandedHeaderSpacer: {
    flex: 1,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  expandedText: {
    color: GroveColors.secondaryText,
    fontSize: 12,
    lineHeight: 16,
  },
});
