/**
 * Garden plot layout for the island game: aligns plant slots to the soil area
 * (garden-floor.png) inside each garden container.
 *
 * Ratios MUST match app/(tabs)/game.tsx (G_CONTAINER_*, G_FLOOR).
 */

/** Max plant slots per plot; habits beyond this are omitted until Phase 2 (denser grid / scroll). */
export const GARDEN_MAX_PLANTS = 25;

const G_CONTAINER_W = 144;
const G_CONTAINER_H = 111;
const G_FLOOR_W = 125;
const G_FLOOR_H = 83;

const DEFAULT_INSET = 0.06;

export type GardenFloorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Soil rect in garden-local coordinates (same math as the floor Image in game.tsx). */
export function getGardenFloorRect(gw: number, gh: number): GardenFloorRect {
  return {
    left: ((G_CONTAINER_W - G_FLOOR_W) / 2 / G_CONTAINER_W) * gw,
    top: ((G_CONTAINER_H - G_FLOOR_H) / 2 / G_CONTAINER_H) * gh,
    width: (G_FLOOR_W / G_CONTAINER_W) * gw,
    height: (G_FLOOR_H / G_CONTAINER_H) * gh,
  };
}

/** Row-major cell centers inside the floor, with inset from edges (ratio of floor width/height). */
export function getPlantSlotCenters(
  floor: GardenFloorRect,
  cols: number,
  rows: number,
  insetRatio = DEFAULT_INSET,
): { x: number; y: number }[] {
  const insetX = floor.width * insetRatio;
  const insetY = floor.height * insetRatio;
  const innerW = floor.width - 2 * insetX;
  const innerH = floor.height - 2 * insetY;
  const cellW = innerW / cols;
  const cellH = innerH / rows;
  const centers: { x: number; y: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      centers.push({
        x: floor.left + insetX + (col + 0.5) * cellW,
        y: floor.top + insetY + (row + 0.5) * cellH,
      });
    }
  }
  return centers;
}

/**
 * Pick cols × rows so row-major slots match the soil shape: few habits use a small grid
 * (large sprites); more habits use a denser grid. Avoids a single long row when n is small.
 * Habits map to centers in row-major order (see getPlantSlotCenters).
 */
export function getGardenGridDimensionsForPlantCount(
  n: number,
  floor: GardenFloorRect,
  maxPlants: number = GARDEN_MAX_PLANTS,
): { cols: number; rows: number } {
  const nClamped = Math.max(0, Math.min(n, maxPlants));
  if (nClamped === 0) {
    return { cols: 1, rows: 1 };
  }

  const targetAspect = floor.width / floor.height;
  let bestCols = 1;
  let bestRows = nClamped;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let cols = 1; cols <= nClamped; cols++) {
    const rows = Math.ceil(nClamped / cols);
    const cells = cols * rows;
    const waste = cells - nClamped;
    const aspectRatio = cols / rows;
    const aspectDiff = Math.abs(aspectRatio - targetAspect);

    let linePenalty = 0;
    if (nClamped >= 3 && (cols === 1 || rows === 1)) {
      linePenalty = 500_000;
    }

    const score =
      cells * 10_000 + waste * 100 + aspectDiff * 500 + linePenalty;

    if (score < bestScore) {
      bestScore = score;
      bestCols = cols;
      bestRows = rows;
    }
  }

  return { cols: bestCols, rows: bestRows };
}

/** Cell size and origin for aligning debug overlays to the same grid as slot centers. */
export function getGridCellMetrics(
  floor: GardenFloorRect,
  cols: number,
  rows: number,
  insetRatio = DEFAULT_INSET,
) {
  const insetX = floor.width * insetRatio;
  const insetY = floor.height * insetRatio;
  const innerW = floor.width - 2 * insetX;
  const innerH = floor.height - 2 * insetY;
  return {
    insetX,
    insetY,
    cellW: innerW / cols,
    cellH: innerH / rows,
    originLeft: floor.left + insetX,
    originTop: floor.top + insetY,
  };
}

/** Which week-of-month bucket (0–3) the calendar date falls in (days 1–7 → 0, … 22+ → 3). */
export function getCurrentMonthWeekIndex(date: Date = new Date()): number {
  const dayOfMonth = date.getDate();
  return Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
}

/**
 * ISO date range (YYYY-MM-DD) for a week-of-month bucket (0–3).
 * Week 0 = days 1–7, week 1 = days 8–14, …, week 3 = days 22–end-of-month.
 */
export function getWeekOfMonthDateRange(
  weekIndex: number,
  refDate: Date = new Date(),
): { start: string; end: string; startDate: Date; endDate: Date } {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const startDay = weekIndex * 7 + 1;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const endDay = weekIndex === 3 ? lastDay : Math.min(startDay + 6, lastDay);
  const startDate = new Date(y, m, startDay);
  const endDate = new Date(y, m, endDay);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(startDate), end: iso(endDate), startDate, endDate };
}

/**
 * Synthetic key per plot so each of the four gardens gets different plant varieties
 * from getPlantIndexForHabitSlot while habits list is shared.
 */
export function makeWeekKeyForPlot(date: Date, plotIndex: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-plot${plotIndex}`;
}

/** Suggested plant sprite size from floor + grid (matches getPlantSlotCenters inset). */
export function getGardenPlantSize(
  floor: GardenFloorRect,
  cols: number,
  rows: number,
  fillRatio = 0.72,
  insetRatio = DEFAULT_INSET,
): number {
  const innerW = floor.width * (1 - 2 * insetRatio);
  const innerH = floor.height * (1 - 2 * insetRatio);
  const cellW = innerW / cols;
  const cellH = innerH / rows;
  return Math.round(Math.min(cellW, cellH) * fillRatio);
}
