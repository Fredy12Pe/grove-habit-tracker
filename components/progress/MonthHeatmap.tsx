import React from 'react';
import { StyleSheet, View } from 'react-native';

const CELL_SIZE = 14;
const CELL_GAP = 4;
const COLS = 10; // 10 columns to use width, ~3 rows for a month

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function interpolateColor(hex: string, intensity: number): string {
  const { r, g, b } = hexToRgb(hex);
  const white = 0xf9;
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

export function MonthHeatmap({ year, month, getActivity, color }: MonthHeatmapProps) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: lastDay }, (_, i) => i + 1);
  const gridWidth = COLS * CELL_SIZE + (COLS - 1) * CELL_GAP;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.grid, { width: gridWidth }]}>
        {days.map((day) => {
          const date = new Date(year, month, day);
          const activity = getActivity(day, date);
          const bg = activity <= 0 ? '#F2F1E4' : interpolateColor(color, 0.3 + 0.7 * activity);
          return <View key={day} style={[styles.cell, { backgroundColor: bg }]} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
});
