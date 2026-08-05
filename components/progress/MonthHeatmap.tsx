import { GroveColors } from "@/styles/theme";
import React, { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";

const CELL_GAP = 3;
const COLS = 7;
const MAX_CELL_SIZE = 22;
const MIN_CELL_SIZE = 14;
const EMPTY_CELL = GroveColors.inactive;
/** Low-opacity day numbers so the fill color stays primary. */
const DAY_NUMBER_COLOR = "rgba(45, 55, 72, 0.16)";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function interpolateColor(hex: string, intensity: number): string {
  const { r, g, b } = hexToRgb(hex);
  const white = 0xff;
  const r2 = Math.round(white + (r - white) * intensity);
  const g2 = Math.round(white + (g - white) * intensity);
  const b2 = Math.round(white + (b - white) * intensity);
  return `rgb(${r2},${g2},${b2})`;
}

export interface MonthHeatmapProps {
  year: number;
  month: number; // 0-11
  /** For each day of month (1 to lastDay), activity 0 = none, 1 = full */
  getActivity: (dayOfMonth: number, date: Date) => number;
  color: string;
}

export function MonthHeatmap({
  year,
  month,
  getActivity,
  color,
}: MonthHeatmapProps) {
  const [cellSize, setCellSize] = useState(MAX_CELL_SIZE);
  const lastDay = new Date(year, month + 1, 0).getDate();
  // Sunday-start calendar: pad leading empty cells so day 1 lands on the right weekday.
  const startOffset = new Date(year, month, 1).getDay();
  const days = Array.from({ length: lastDay }, (_, i) => i + 1);
  const fontSize = Math.max(8, Math.round(cellSize * 0.45));

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width <= 0) return;
    const next = Math.floor((width - (COLS - 1) * CELL_GAP) / COLS);
    setCellSize(Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, next)));
  };

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <View style={styles.grid}>
        {Array.from({ length: startOffset }, (_, i) => (
          <View
            key={`pad-${i}`}
            style={{ width: cellSize, height: cellSize }}
          />
        ))}
        {days.map((day) => {
          const date = new Date(year, month, day);
          const activity = getActivity(day, date);
          const bg =
            activity <= 0
              ? EMPTY_CELL
              : interpolateColor(color, 0.35 + 0.65 * activity);
          return (
            <View
              key={day}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: bg,
                },
              ]}
            >
              <Text style={[styles.dayNumber, { fontSize }]}>{day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "stretch",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CELL_GAP,
  },
  cell: {
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    color: DAY_NUMBER_COLOR,
    fontWeight: "500",
    includeFontPadding: false,
    textAlign: "center",
  },
});
