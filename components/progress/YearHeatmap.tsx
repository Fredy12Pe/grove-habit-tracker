import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const CELL_SIZE = 10;
const CELL_GAP = 2;
const DAYS_PER_WEEK = 7;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Returns [dayOfYear (0-364/365), weekCol (0-52), dayRow (0-6 Mon-Sun)] for each day of the year. */
function getDaysInYear(year: number): { dayOfYear: number; weekCol: number; dayRow: number }[] {
  const days: { dayOfYear: number; weekCol: number; dayRow: number }[] = [];
  const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const total = isLeap(year) ? 366 : 365;
  for (let d = 0; d < total; d++) {
    const date = new Date(year, 0, 1 + d);
    const dayOfWeek = date.getDay();
    const monBased = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekCol = Math.floor(d / DAYS_PER_WEEK);
    const dayRow = monBased;
    days.push({ dayOfYear: d, weekCol, dayRow });
  }
  return days;
}

/** Week index where each month starts (column for month label). */
function getMonthColumns(year: number): { month: number; col: number }[] {
  const result: { month: number; col: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const first = new Date(year, m, 1);
    const startDay = first.getDay();
    const monBased = startDay === 0 ? 6 : startDay - 1;
    const dayOfYear = Math.floor((first.getTime() - new Date(year, 0, 1).getTime()) / (24 * 60 * 60 * 1000));
    const weekCol = Math.floor(dayOfYear / DAYS_PER_WEEK);
    result.push({ month: m, col: weekCol });
  }
  return result;
}

export interface YearHeatmapProps {
  year: number;
  /** For each day of year (0-364/365), activity 0 = none, 1 = full */
  getActivity: (dayOfYear: number, date: Date) => number;
  /** Base color for filled cells (e.g. '#A7DE33' for green). Lightened for low activity. */
  color: string;
}

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

export function YearHeatmap({ year, getActivity, color }: YearHeatmapProps) {
  const days = getDaysInYear(year);
  const monthCols = getMonthColumns(year);
  const maxWeek = Math.max(...days.map((d) => d.weekCol), 52);
  const gridRows = DAYS_PER_WEEK;
  const gridCols = maxWeek + 1;

  const cellByKey: Record<string, number> = {};
  days.forEach(({ dayOfYear, weekCol, dayRow }) => {
    const date = new Date(year, 0, 1 + dayOfYear);
    const activity = getActivity(dayOfYear, date);
    const key = `${dayRow}-${weekCol}`;
    if (!(key in cellByKey) || activity > cellByKey[key]) cellByKey[key] = activity;
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <View style={styles.dayLabelsPlaceholder} />
        <View style={[styles.monthRow, { width: gridCols * (CELL_SIZE + CELL_GAP) }]}>
          {monthCols.map(({ month, col }) => (
            <Text
              key={month}
              style={[styles.monthLabel, { left: col * (CELL_SIZE + CELL_GAP) }]}
            >
              {MONTHS[month]}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.rowWrapper}>
        <View style={styles.dayLabels}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => (
            <View key={i} style={styles.dayLabelCell}>
              <Text style={styles.dayLabelText}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.grid, { width: gridCols * (CELL_SIZE + CELL_GAP), height: gridRows * (CELL_SIZE + CELL_GAP) }]}>
          {Array.from({ length: gridRows * gridCols }).map((_, i) => {
            const row = Math.floor(i / gridCols);
            const col = i % gridCols;
            const activity = cellByKey[`${row}-${col}`] ?? 0;
            const bg = activity <= 0 ? '#F2F1E4' : interpolateColor(color, 0.3 + 0.7 * activity);
            return (
              <View
                key={i}
                style={[
                  styles.cell,
                  {
                    left: col * (CELL_SIZE + CELL_GAP),
                    top: row * (CELL_SIZE + CELL_GAP),
                    backgroundColor: bg,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  topRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabelsPlaceholder: {
    width: 14,
    marginRight: 6,
  },
  monthRow: {
    position: 'relative',
    height: 14,
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#807E71',
    fontWeight: '500',
  } as const,
  rowWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dayLabels: {
    width: 14,
    marginRight: 6,
  },
  dayLabelCell: {
    height: CELL_SIZE + CELL_GAP,
    justifyContent: 'center',
  },
  dayLabelText: {
    fontSize: 10,
    color: '#807E71',
    fontWeight: '500',
  },
  grid: {
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
});
