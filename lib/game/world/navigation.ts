/**
 * Island navigation: collision, proximity triggers, depth sorting, and camera —
 * everything the game loop needs, derived from the world layout in one place.
 */

import type { IslandWorldLayout } from "@/lib/game/islandWorldLayout";
import { gardenTriggerRadii } from "@/lib/game/gardenTriggerOval";
import unifiedCollision from "@/lib/game/unifiedCollision.json";
import { CHAR_SCALE, CHAR_SCALE_INDOOR, CHAR_SIZE } from "@/components/game/world/sprites";

export const SPEED = 3.5;
export const MOVE_INTERVAL = 16;
export const DEADZONE = 0.15;

export const FEET_OFFSET_Y = CHAR_SIZE * 0.32;
const FEET_HALF_W = 12;
/** Feet / footprint vs world Y while indoors (sprite uses `CHAR_SCALE_INDOOR`). */
export const INDOOR_FEET_OFFSET_Y = FEET_OFFSET_Y * CHAR_SCALE_INDOOR;
/** Substeps per tick so diagonal slides cannot tunnel through thin furniture rects. */
const INDOOR_MOVE_SUBSTEPS = 4;
const GARDEN_PADDING = 4;

/** Props the character can stand behind (drawn over the character when feet are north of the depth line). */
export type DepthPropId =
  | "tree"
  | "shakeTree"
  | "cow"
  | "chicken"
  | "activities"
  | "bigTree"
  | "well"
  | "plant"
  | "tallBush"
  | "indoorFurniture";

type Rect = { left: number; top: number; right: number; bottom: number };

function inEllipse(dx: number, dy: number, rx: number, ry: number): boolean {
  const nx = dx / rx;
  const ny = dy / ry;
  return nx * nx + ny * ny <= 1;
}

export function createIslandNavigation(
  layout: IslandWorldLayout,
  screenW: number,
  screenH: number,
) {
  const L = layout;

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  function getCameraOffset(charX: number, charY: number) {
    return {
      x: clamp(screenW / 2 - charX, screenW - L.WORLD_W, 0),
      y: clamp(screenH / 2 - charY, screenH - L.WORLD_H, 0),
    };
  }

  // ── Collision ──────────────────────────────────────────────────────────────

  const HOUSE_PAD = 2;
  const HOUSE_RECT: Rect = {
    left: L.HOUSE_LEFT + L.INTERIOR_X - HOUSE_PAD,
    top: L.HOUSE_TOP - HOUSE_PAD,
    right: L.HOUSE_LEFT + L.INTERIOR_X + L.INTERIOR_W + HOUSE_PAD,
    bottom: L.HOUSE_TOP + L.HOUSE_H + HOUSE_PAD,
  };

  const GARDEN_BOTTOM_PAD = CHAR_SIZE * CHAR_SCALE * 0.3;
  const GARDEN_RECTS: Rect[] = L.GARDEN_POSITIONS.map((pos) => {
    const left = L.ISLAND_LEFT + pos.x * L.ISLAND_W - L.GW / 2 - GARDEN_PADDING;
    const top = L.ISLAND_TOP + pos.y * L.ISLAND_H - L.GH / 2 - GARDEN_PADDING;
    return {
      left,
      top,
      right: left + L.GW + GARDEN_PADDING * 2,
      bottom: top + L.GH + GARDEN_PADDING + GARDEN_BOTTOM_PAD,
    };
  });

  function pointInAnyRect(x: number, y: number, rects: Rect[]): boolean {
    for (const r of rects) {
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return true;
      }
    }
    return false;
  }

  function isPointWalkable(worldX: number, worldY: number): boolean {
    const localX = worldX - L.ISLAND_LEFT;
    const localY = worldY - L.ISLAND_TOP;
    const imgX = (localX / L.ISLAND_W) * unifiedCollision.width;
    const imgY = (localY / L.ISLAND_H) * unifiedCollision.height;
    const col = Math.floor(imgX / unifiedCollision.cellSize);
    const row = Math.floor(imgY / unifiedCollision.cellSize);
    if (
      row < 0 ||
      row >= unifiedCollision.rows ||
      col < 0 ||
      col >= unifiedCollision.cols
    ) {
      return false;
    }
    return unifiedCollision.grid[row][col] === 0;
  }

  /**
   * Narrow "trunk" blockers: a vertical band the feet cannot pass through,
   * anchored at each prop's ground line.
   */
  const TRUNK_BLOCKERS: { x: number; halfW: number; top: number; bottom: number }[] = [
    { x: L.TREE_WORLD_X, halfW: L.TREE_TRUNK_HALF_W, top: L.TREE_TRUNK_TOP, bottom: L.TREE_WORLD_Y },
    { x: L.SHAKE_TREE_WORLD_X, halfW: L.SHAKE_TREE_TRUNK_HALF_W, top: L.SHAKE_TREE_TRUNK_TOP, bottom: L.SHAKE_TREE_WORLD_Y },
    { x: L.COW_WORLD_X, halfW: L.COW_TRUNK_HALF_W, top: L.COW_TRUNK_TOP, bottom: L.COW_WORLD_Y },
    { x: L.CHICKEN_WORLD_X, halfW: L.CHICKEN_TRUNK_HALF_W, top: L.CHICKEN_TRUNK_TOP, bottom: L.CHICKEN_WORLD_Y },
    { x: L.BIG_TREE_WORLD_X, halfW: L.BIG_TREE_TRUNK_HALF_W, top: L.BIG_TREE_TRUNK_TOP, bottom: L.BIG_TREE_WORLD_Y },
    { x: L.WELL_WORLD_X, halfW: L.WELL_TRUNK_HALF_W, top: L.WELL_TRUNK_TOP, bottom: L.WELL_WORLD_Y },
  ];

  function isTrunkBlocking(worldX: number, feetY: number): boolean {
    for (const t of TRUNK_BLOCKERS) {
      if (feetY < t.top || feetY > t.bottom) continue;
      if (worldX >= t.x - t.halfW && worldX <= t.x + t.halfW) return true;
    }
    return false;
  }

  /** Same horizontal padding as the door trigger. */
  const WALKWAY_PAD_X = Math.max(6, Math.round(L.WALKWAY_DISPLAY_W * 0.15));

  function isOnWalkway(worldX: number, feetY: number): boolean {
    return (
      worldX >= L.WALKWAY_LEFT - WALKWAY_PAD_X &&
      worldX <= L.WALKWAY_LEFT + L.WALKWAY_DISPLAY_W + WALKWAY_PAD_X &&
      feetY >= L.WALKWAY_TOP &&
      feetY <= L.WALKWAY_TOP + L.WALKWAY_DISPLAY_H
    );
  }

  /** All outdoor blockers checked at 3 foot points (center ± FEET_HALF_W). */
  function isWalkable(worldX: number, worldY: number): boolean {
    const feetY = worldY + FEET_OFFSET_Y;
    for (const fx of [worldX, worldX - FEET_HALF_W, worldX + FEET_HALF_W]) {
      if (pointInAnyRect(fx, feetY, GARDEN_RECTS)) return false;
      if (isTrunkBlocking(fx, feetY)) return false;
      if (L.isActivitiesWalkBlocking(fx, feetY)) return false;
    }
    if (
      pointInAnyRect(worldX, feetY, [HOUSE_RECT]) &&
      !isOnWalkway(worldX, feetY)
    ) {
      return false;
    }
    for (const fx of [worldX, worldX - FEET_HALF_W, worldX + FEET_HALF_W]) {
      if (!isPointWalkable(fx, feetY) && !isOnWalkway(fx, feetY)) return false;
    }
    return true;
  }

  // ── Indoor collision ───────────────────────────────────────────────────────

  /** Shift furniture hitboxes down to align with visible bases (sprites vs layout). */
  const INDOOR_FURNITURE_COLLISION_Y_OFFSET = Math.round(L.HOUSE_H * 0.045);
  /** Inflate rects so feet cannot slip past edges (same idea as outdoor FEET_HALF_W). */
  const INDOOR_FURNITURE_COLLISION_PAD = Math.max(6, Math.round(L.HOUSE_H * 0.028));

  const FURNITURE_LOCAL = [
    { x: L.HIMG_X, y: L.HIMG_Y, w: L.HIMG_W, h: L.HIMG_H, depthY: L.HIMG_DEPTH_Y },
    { x: L.HDRAWER_X, y: L.HDRAWER_Y, w: L.HDRAWER_W, h: L.HDRAWER_H, depthY: L.HDRAWER_DEPTH_Y },
    { x: L.HBED_X, y: L.HBED_Y, w: L.HBED_W, h: L.HBED_H, depthY: L.HBED_DEPTH_Y },
    { x: L.HDESK_X, y: L.HDESK_Y, w: L.HDESK_W, h: L.HDESK_H, depthY: L.HDESK_DEPTH_Y },
  ];

  const FURNITURE_COLLIDERS: Rect[] = FURNITURE_LOCAL.map((f) => ({
    left: L.HOUSE_LEFT + f.x - INDOOR_FURNITURE_COLLISION_PAD,
    top: L.HOUSE_TOP + f.y + INDOOR_FURNITURE_COLLISION_Y_OFFSET - INDOOR_FURNITURE_COLLISION_PAD,
    right: L.HOUSE_LEFT + f.x + f.w + INDOOR_FURNITURE_COLLISION_PAD,
    bottom: L.HOUSE_TOP + f.y + f.h + INDOOR_FURNITURE_COLLISION_Y_OFFSET + INDOOR_FURNITURE_COLLISION_PAD,
  }));

  function isIndoorFurnitureBlocking(worldX: number, feetY: number): boolean {
    const footL = worldX - FEET_HALF_W;
    const footR = worldX + FEET_HALF_W;
    for (const p of FURNITURE_COLLIDERS) {
      if (feetY < p.top || feetY > p.bottom) continue;
      if (footR >= p.left && footL <= p.right) return true;
    }
    return false;
  }

  function isWalkableIndoors(worldX: number, worldY: number): boolean {
    const feetY = worldY + INDOOR_FEET_OFFSET_Y;
    const headY = worldY - CHAR_SIZE * CHAR_SCALE_INDOOR * 0.9;
    const r = L.HOUSE_INTERIOR_RECT;
    if (
      !(worldX >= r.left && worldX <= r.right && headY >= r.top && feetY <= r.bottom)
    ) {
      return false;
    }
    return !isIndoorFurnitureBlocking(worldX, feetY);
  }

  // ── Depth sorting ──────────────────────────────────────────────────────────

  /** Outdoor props with a simple horizontal ground line for character depth. */
  const DEPTH_LINES: { id: DepthPropId; y: number }[] = [
    { id: "tree", y: L.TREE_DEPTH_Y },
    { id: "shakeTree", y: L.SHAKE_TREE_DEPTH_Y },
    { id: "cow", y: L.COW_DEPTH_Y },
    { id: "chicken", y: L.CHICKEN_DEPTH_Y },
    { id: "activities", y: L.ACTIVITIES_DEPTH_Y },
    { id: "bigTree", y: L.BIG_TREE_DEPTH_Y },
    { id: "well", y: L.WELL_DEPTH_Y },
    { id: "plant", y: L.PLANT_DEPTH_Y },
    { id: "tallBush", y: L.TALL_BUSH_DEPTH_Y },
  ];

  function isCharBehindIndoorFurniture(worldX: number, feetY: number): boolean {
    const footL = worldX - FEET_HALF_W;
    const footR = worldX + FEET_HALF_W;
    for (const f of FURNITURE_LOCAL) {
      const left = L.HOUSE_LEFT + f.x;
      if (footR < left || footL > left + f.w) continue;
      if (feetY < f.depthY) return true;
    }
    return false;
  }

  /** Set of props the character currently draws behind. */
  function computeBehindSet(px: number, py: number, indoor: boolean): Set<DepthPropId> {
    const set = new Set<DepthPropId>();
    if (indoor) {
      if (isCharBehindIndoorFurniture(px, py + INDOOR_FEET_OFFSET_Y)) {
        set.add("indoorFurniture");
      }
      return set;
    }
    const feetY = py + FEET_OFFSET_Y;
    for (const d of DEPTH_LINES) {
      if (feetY < d.y) set.add(d.id);
    }
    return set;
  }

  /** Static behind-set for a fixed standing position (preview). */
  function computeStaticBehindSet(worldY: number): Set<DepthPropId> {
    return computeBehindSet(0, worldY, false);
  }

  // ── Proximity triggers ─────────────────────────────────────────────────────

  const { rx: GARDEN_TRIGGER_RX, ry: GARDEN_TRIGGER_RY } = gardenTriggerRadii(L.GH);
  const GARDEN_TRIGGERS = L.GARDEN_POSITIONS.map((pos) => ({
    x: L.ISLAND_LEFT + pos.x * L.ISLAND_W,
    y: L.ISLAND_TOP + pos.y * L.ISLAND_H + L.GH / 2 + GARDEN_TRIGGER_RY * 0.65,
  }));

  /** Uses feet on the ground (worldY = feetY) so the ellipse matches where the player stands. */
  function nearGardenIndex(worldX: number, feetY: number): number {
    for (let i = 0; i < GARDEN_TRIGGERS.length; i++) {
      if (
        inEllipse(
          worldX - GARDEN_TRIGGERS[i].x,
          feetY - GARDEN_TRIGGERS[i].y,
          GARDEN_TRIGGER_RX,
          GARDEN_TRIGGER_RY,
        )
      ) {
        return i;
      }
    }
    return -1;
  }

  /** Small square in front of each activity (half-edge from center, world px). */
  const ACTIVITY_TRIGGER_HALF = Math.max(12, Math.round(L.ACTIVITIES_ICON_W * 0.34));
  /** Slightly south of icon base so the square reads "on the grass" in front. */
  const ACTIVITIES_TRIGGER_FEET_Y = Math.round(
    L.ACTIVITIES_GROUND_Y + Math.round(ACTIVITY_TRIGGER_HALF * 0.45),
  );
  const ACTIVITIES_TRIGGERS = [
    { x: L.ACTIVITIES_BREATHING_LEFT + L.ACTIVITIES_ICON_W / 2, y: ACTIVITIES_TRIGGER_FEET_Y },
    { x: L.ACTIVITIES_PUZZLES_LEFT + L.ACTIVITIES_ICON_W / 2, y: ACTIVITIES_TRIGGER_FEET_Y },
    { x: L.ACTIVITIES_GRATITUDE_LEFT + L.ACTIVITIES_ICON_W / 2, y: ACTIVITIES_TRIGGER_FEET_Y },
  ] as const;

  function nearActivityIndex(worldX: number, feetY: number): number {
    for (let i = 0; i < ACTIVITIES_TRIGGERS.length; i++) {
      const dx = Math.abs(worldX - ACTIVITIES_TRIGGERS[i].x);
      const dy = Math.abs(feetY - ACTIVITIES_TRIGGERS[i].y);
      if (dx <= ACTIVITY_TRIGGER_HALF && dy <= ACTIVITY_TRIGGER_HALF) return i;
    }
    return -1;
  }

  function isNearDoor(worldX: number, worldY: number, indoor: boolean): boolean {
    if (indoor) {
      return inEllipse(
        worldX - L.HOUSE_EXIT_X,
        worldY - L.HOUSE_EXIT_Y,
        L.HOUSE_EXIT_RX,
        L.HOUSE_EXIT_RY,
      );
    }
    return isOnWalkway(worldX, worldY + FEET_OFFSET_Y);
  }

  /** Ellipse in front of desk / bed (same anchor as door: character world x/y). */
  const HOUSE_DESK_INTERACT_CX = L.HOUSE_LEFT + L.HDESK_X + L.HDESK_W * 0.52;
  const HOUSE_DESK_INTERACT_CY =
    L.HOUSE_TOP + L.HDESK_Y + L.HDESK_H + Math.max(8, Math.round(L.HOUSE_H * 0.035));
  const HOUSE_BED_INTERACT_CX = L.HOUSE_LEFT + L.HBED_X + L.HBED_W * 0.48;
  const HOUSE_BED_INTERACT_CY =
    L.HOUSE_TOP + L.HBED_Y + L.HBED_H + Math.max(8, Math.round(L.HOUSE_H * 0.035));
  const HOUSE_FURNITURE_INTERACT_RX = Math.max(22, Math.round(L.HOUSE_EXIT_RX * 0.82));
  const HOUSE_FURNITURE_INTERACT_RY = Math.max(10, Math.round(L.HOUSE_EXIT_RY * 1.05));

  function isNearHouseDesk(worldX: number, worldY: number): boolean {
    return inEllipse(
      worldX - HOUSE_DESK_INTERACT_CX,
      worldY - HOUSE_DESK_INTERACT_CY,
      HOUSE_FURNITURE_INTERACT_RX,
      HOUSE_FURNITURE_INTERACT_RY,
    );
  }

  function isNearHouseBed(worldX: number, worldY: number): boolean {
    return inEllipse(
      worldX - HOUSE_BED_INTERACT_CX,
      worldY - HOUSE_BED_INTERACT_CY,
      HOUSE_FURNITURE_INTERACT_RX,
      HOUSE_FURNITURE_INTERACT_RY,
    );
  }

  function isNearInteractCircle(
    px: number,
    py: number,
    cx: number,
    cy: number,
    radius: number,
  ): boolean {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= radius * radius;
  }

  const isNearTree = (px: number, py: number) =>
    isNearInteractCircle(px, py, L.TREE_INTERACT_CENTER_X, L.TREE_INTERACT_CENTER_Y, L.TREE_INTERACT_RADIUS);
  const isNearShakeTree = (px: number, py: number) =>
    isNearInteractCircle(px, py, L.SHAKE_TREE_INTERACT_CENTER_X, L.SHAKE_TREE_INTERACT_CENTER_Y, L.SHAKE_TREE_INTERACT_RADIUS);
  const isNearCow = (px: number, py: number) =>
    isNearInteractCircle(px, py, L.COW_INTERACT_CENTER_X, L.COW_INTERACT_CENTER_Y, L.COW_INTERACT_RADIUS);

  // ── Visibility (used to reset one-shot animations off-screen) ──────────────

  function isRectVisibleOnScreen(
    charX: number,
    charY: number,
    centerX: number,
    groundY: number,
    w: number,
    h: number,
  ): boolean {
    const cam = getCameraOffset(charX, charY);
    const left = centerX - w / 2 + cam.x;
    const top = groundY - h + cam.y;
    const right = centerX + w / 2 + cam.x;
    const bottom = groundY + cam.y;
    return right > 0 && left < screenW && bottom > 0 && top < screenH;
  }

  const isTreeVisibleOnScreen = (charX: number, charY: number) =>
    isRectVisibleOnScreen(charX, charY, L.TREE_WORLD_X, L.TREE_WORLD_Y, L.TREE_DISPLAY_W, L.TREE_DISPLAY_H);
  const isShakeTreeVisibleOnScreen = (charX: number, charY: number) =>
    isRectVisibleOnScreen(charX, charY, L.SHAKE_TREE_WORLD_X, L.SHAKE_TREE_WORLD_Y, L.SHAKE_TREE_DISPLAY_W, L.SHAKE_TREE_DISPLAY_H);

  // ── Movement ───────────────────────────────────────────────────────────────

  /**
   * One tick of joystick movement with axis-slide fallback.
   * Indoors uses substeps so diagonal slides cannot tunnel through furniture.
   */
  function stepMovement(
    curX: number,
    curY: number,
    jx: number,
    jy: number,
    indoor: boolean,
  ): { x: number; y: number } {
    const canWalk = indoor ? isWalkableIndoors : isWalkable;
    let finalX = curX;
    let finalY = curY;

    if (indoor) {
      const stepX = (jx * SPEED) / INDOOR_MOVE_SUBSTEPS;
      const stepY = (jy * SPEED) / INDOOR_MOVE_SUBSTEPS;
      for (let s = 0; s < INDOOR_MOVE_SUBSTEPS; s++) {
        const wantX = finalX + stepX;
        const wantY = finalY + stepY;
        if (canWalk(wantX, wantY)) {
          finalX = wantX;
          finalY = wantY;
        } else if (canWalk(wantX, finalY)) {
          finalX = wantX;
        } else if (canWalk(finalX, wantY)) {
          finalY = wantY;
        }
      }
    } else {
      const wantX = curX + jx * SPEED;
      const wantY = curY + jy * SPEED;
      if (canWalk(wantX, wantY)) {
        finalX = wantX;
        finalY = wantY;
      } else if (canWalk(wantX, curY)) {
        finalX = wantX;
      } else if (canWalk(curX, wantY)) {
        finalY = wantY;
      }
    }
    return { x: finalX, y: finalY };
  }

  /** Spawn position on the walkway when stepping out of the house. */
  function getHouseExitSpawn(): { x: number; y: number } {
    const feetY = L.WALKWAY_TOP + Math.round(L.WALKWAY_DISPLAY_H * 0.58);
    return {
      x: Math.round(L.WALKWAY_LEFT + L.WALKWAY_DISPLAY_W / 2),
      y: feetY - FEET_OFFSET_Y,
    };
  }

  return {
    getCameraOffset,
    stepMovement,
    computeBehindSet,
    computeStaticBehindSet,
    nearGardenIndex,
    nearActivityIndex,
    isNearDoor,
    isNearHouseDesk,
    isNearHouseBed,
    isNearTree,
    isNearShakeTree,
    isNearCow,
    isTreeVisibleOnScreen,
    isShakeTreeVisibleOnScreen,
    getHouseExitSpawn,
    /** Trigger geometry, exposed for on-screen zone rendering / debug overlays. */
    zones: {
      gardenTriggers: GARDEN_TRIGGERS,
      gardenTriggerRx: GARDEN_TRIGGER_RX,
      gardenTriggerRy: GARDEN_TRIGGER_RY,
      activityTriggers: ACTIVITIES_TRIGGERS,
      activityTriggerHalf: ACTIVITY_TRIGGER_HALF,
      walkwayPadX: WALKWAY_PAD_X,
      deskInteract: {
        cx: HOUSE_DESK_INTERACT_CX,
        cy: HOUSE_DESK_INTERACT_CY,
        rx: HOUSE_FURNITURE_INTERACT_RX,
        ry: HOUSE_FURNITURE_INTERACT_RY,
      },
      bedInteract: {
        cx: HOUSE_BED_INTERACT_CX,
        cy: HOUSE_BED_INTERACT_CY,
        rx: HOUSE_FURNITURE_INTERACT_RX,
        ry: HOUSE_FURNITURE_INTERACT_RY,
      },
    },
  };
}

export type IslandNavigation = ReturnType<typeof createIslandNavigation>;
