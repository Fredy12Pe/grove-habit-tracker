import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useGroveColors } from "@/hooks/useGroveColors";
import { GroveSpacing } from "@/styles/theme";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type HabitColorPickerModalProps = {
  visible: boolean;
  initialColor: string;
  onClose: () => void;
  onSelect: (hex: string) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hsvToHex(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (n: number) =>
    clamp(Math.round((n + m) * 255), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Dense palette grid: hue columns × value/saturation rows. */
function buildColorGrid(): string[] {
  const hues = [0, 25, 45, 70, 100, 145, 175, 200, 225, 255, 290, 320];
  const rows: Array<{ s: number; v: number }> = [
    { s: 0.35, v: 1 },
    { s: 0.55, v: 1 },
    { s: 0.75, v: 1 },
    { s: 0.9, v: 0.92 },
    { s: 0.95, v: 0.72 },
    { s: 1, v: 0.5 },
  ];
  const colors: string[] = [];
  for (const row of rows) {
    for (const h of hues) {
      colors.push(hsvToHex(h, row.s, row.v));
    }
  }
  colors.push(
    "#FFFFFF",
    "#F2F2F2",
    "#D9D9D9",
    "#B3B3B3",
    "#808080",
    "#4D4D4D",
    "#2B2B2B",
    "#1A1A1A",
    "#111111",
    "#000000",
    "#F5E6D3",
    "#E8D5B7",
  );
  return colors;
}

const COLOR_GRID = buildColorGrid();
const COLUMNS = 12;
const CELL_GAP = 4;
const GRID_WIDTH =
  Dimensions.get("window").width - GroveSpacing.screenPaddingHorizontal * 2;
const CELL_SIZE = (GRID_WIDTH - CELL_GAP * (COLUMNS - 1)) / COLUMNS;

const LIGHT_HEX = new Set(["#FFFFFF", "#F2F2F2", "#F5E6D3", "#E8D5B7", "#D9D9D9"]);

export function HabitColorPickerModal({
  visible,
  initialColor,
  onClose,
  onSelect,
}: HabitColorPickerModalProps) {
  const colors = useGroveColors();
  const [selected, setSelected] = useState(initialColor.toUpperCase());

  useEffect(() => {
    if (!visible) return;
    setSelected(initialColor.toUpperCase());
  }, [visible, initialColor]);

  const cells = useMemo(() => COLOR_GRID, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...(Platform.OS === "ios"
        ? { presentationStyle: "overFullScreen" as const }
        : {})}
    >
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.white }]}>
          <View style={styles.header}>
            <AppText
              variant="h2"
              style={[styles.title, { color: colors.deepText }]}
            >
              Pick a color
            </AppText>
            <View
              style={[
                styles.preview,
                {
                  backgroundColor: selected,
                  borderColor: colors.white,
                },
              ]}
            />
          </View>

          <View style={styles.grid}>
            {cells.map((hex) => {
              const isSelected = selected === hex;
              return (
                <Pressable
                  key={hex}
                  onPress={() => setSelected(hex)}
                  style={[
                    styles.cell,
                    { backgroundColor: hex },
                    isSelected && {
                      borderWidth: 2,
                      borderColor: colors.deepText,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Color ${hex}`}
                >
                  {isSelected ? (
                    <IconSymbol
                      name="checkmark"
                      size={12}
                      color={
                        LIGHT_HEX.has(hex) ? colors.deepText : colors.onAccent
                      }
                      weight="bold"
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: colors.softSurface }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <AppText
                variant="paragraph"
                style={[styles.cancelText, { color: colors.deepText }]}
              >
                Cancel
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primaryGreen }]}
              onPress={() => onSelect(selected)}
              activeOpacity={0.85}
            >
              <AppText
                variant="paragraph"
                style={[styles.doneText, { color: colors.onAccent }]}
              >
                Use color
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 18,
    paddingBottom: 34,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  preview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CELL_GAP,
    marginBottom: 20,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontWeight: "600",
  },
  doneBtn: {
    flex: 1.4,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneText: {
    fontWeight: "600",
  },
});
