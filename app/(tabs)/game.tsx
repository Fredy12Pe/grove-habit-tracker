import { Joystick, type JoystickDelta } from "@/components/garden/Joystick";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  GARDEN_MAX_PLANTS,
  getCurrentMonthWeekIndex,
  getGardenGridDimensionsForPlantCount,
  getGardenPlantSize,
  getGridCellMetrics,
  getPlantSlotCenters,
  getWeekOfMonthDateRange,
  makeWeekKeyForPlot,
} from "@/lib/game/gardenBackupGrid";
import {
  gardenActiveWeekOvalBox,
  gardenTriggerRadii,
} from "@/lib/game/gardenTriggerOval";
import { getIslandWorldLayout } from "@/lib/game/islandWorldLayout";
import {
  FRAMES_PER_PLANT,
  getPlantDisplayName,
  getPlantIndexForHabitSlot,
  getPlantSprite,
} from "@/lib/game/plantSprites";
import unifiedCollision from "@/lib/game/unifiedCollision.json";
import {
  playDoorCloseSound,
  playDoorOpenSound,
  playCowPettingSound,
  playGameFootstep,
  playTreeChopSound,
  playTreeShakeSound,
  stopGameFootsteps,
  syncGameAmbience,
  unloadGameSounds,
} from "@/lib/gameScreenAudio";
import {
  gameImpactLight,
  gameImpactMedium,
  gameImpactRigid,
  gameSelection,
  gameSuccess,
} from "@/lib/gameHaptics";
import { useHabitStore } from "@/lib/store";
import type { CompletionDatesByHabit } from "@/lib/store/useHabitStore";
import type { Habit } from "@/lib/types";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Screen & world dimensions ────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get("window");

const {
  WORLD_H,
  WORLD_W,
  BG,
  ISLAND,
  WALK_AREA,
  ISLAND_W,
  ISLAND_H,
  ISLAND_LEFT,
  ISLAND_TOP,
  TREE_FALL_FRAMES,
  TREE_FALL_FRAME_COUNT,
  TREE_DISPLAY_H,
  TREE_DISPLAY_W,
  TREE_WORLD_X,
  TREE_WORLD_Y,
  TREE_INTERACT_CENTER_X,
  TREE_INTERACT_CENTER_Y,
  TREE_INTERACT_RADIUS,
  TREE_DEPTH_Y,
  TREE_TRUNK_HALF_W,
  TREE_TRUNK_TOP,
  COW_EATING_FRAMES,
  COW_HEART_FRAMES,
  COW_FRAME_COUNT,
  COW_HEART_FRAME_COUNT,
  COW_ANIM_INTERVAL_MS,
  COW_HEART_ANIM_INTERVAL_MS,
  COW_DISPLAY_W,
  COW_DISPLAY_H,
  COW_WORLD_X,
  COW_WORLD_Y,
  COW_DEPTH_Y,
  COW_INTERACT_CENTER_X,
  COW_INTERACT_CENTER_Y,
  COW_INTERACT_RADIUS,
  COW_TRUNK_HALF_W,
  COW_TRUNK_TOP,
  CHICKEN_IDLE_FRAMES,
  CHICKEN_IDLE_FRAME_COUNT,
  CHICKEN_PECK_FRAMES,
  CHICKEN_PECK_FRAME_COUNT,
  CHICKEN_ANIM_INTERVAL_MS,
  CHICKEN_IDLE_BEFORE_PECK_MS,
  CHICKEN_DISPLAY_W,
  CHICKEN_DISPLAY_H,
  CHICKEN_WORLD_X,
  CHICKEN_WORLD_Y,
  CHICKEN_DEPTH_Y,
  CHICKEN_TRUNK_HALF_W,
  CHICKEN_TRUNK_TOP,
  ACTIVITIES_HEADING,
  ACTIVITIES_BREATHING,
  ACTIVITIES_PUZZLES,
  ACTIVITIES_GRATITUDE,
  ACTIVITIES_CENTER_X,
  ACTIVITIES_GROUND_Y,
  ACTIVITIES_DEPTH_Y,
  ACTIVITIES_ICON_W,
  ACTIVITIES_ICON_H,
  ACTIVITIES_HEADING_LEFT,
  ACTIVITIES_HEADING_TOP,
  ACTIVITIES_HEADING_W,
  ACTIVITIES_HEADING_H,
  ACTIVITIES_ICONS_TOP,
  ACTIVITIES_BREATHING_LEFT,
  ACTIVITIES_PUZZLES_LEFT,
  ACTIVITIES_GRATITUDE_LEFT,
  isActivitiesWalkBlocking,
  isActivitiesCharBehind,
  BIG_TREE,
  BIG_TREE_DISPLAY_W,
  BIG_TREE_DISPLAY_H,
  BIG_TREE_WORLD_X,
  BIG_TREE_WORLD_Y,
  BIG_TREE_DEPTH_Y,
  BIG_TREE_TRUNK_HALF_W,
  BIG_TREE_TRUNK_TOP,
  WELL,
  WELL_DISPLAY_W,
  WELL_DISPLAY_H,
  WELL_LEFT,
  WELL_TOP,
  WELL_WORLD_X,
  WELL_WORLD_Y,
  WELL_DEPTH_Y,
  WELL_TRUNK_HALF_W,
  WELL_TRUNK_TOP,
  PLANT,
  PLANT_DISPLAY_W,
  PLANT_DISPLAY_H,
  PLANT_LEFT,
  PLANT_TOP,
  PLANT_DEPTH_Y,
  TREE_SHAKE_FRAMES,
  TREE_SHAKE_FRAME_COUNT,
  SHAKE_TREE_DISPLAY_W,
  SHAKE_TREE_DISPLAY_H,
  SHAKE_TREE_WORLD_X,
  SHAKE_TREE_WORLD_Y,
  SHAKE_TREE_INTERACT_CENTER_X,
  SHAKE_TREE_INTERACT_CENTER_Y,
  SHAKE_TREE_INTERACT_RADIUS,
  SHAKE_TREE_DEPTH_Y,
  SHAKE_TREE_TRUNK_HALF_W,
  SHAKE_TREE_TRUNK_TOP,
  HILLS,
  HILLS_SCALE,
  HILLS_W,
  HILLS_H,
  HILLS_LEFT,
  HILLS_TOP,
  HILLS_BTM1,
  HILLS_BTM2,
  HBTM1_W,
  HBTM1_H,
  HBTM2_W,
  HBTM2_H,
  HBTM1_LEFT,
  HBTM1_TOP,
  HBTM2_LEFT,
  HBTM2_TOP,
  BUSH_2,
  BUSH_2_W,
  BUSH_2_H,
  BUSH_2_LEFT,
  BUSH_2_TOP,
  ROCK,
  ROCK_W,
  ROCK_H,
  ROCK_LEFT,
  ROCK_TOP,
  TALL_BUSH,
  TALL_BUSH_DISPLAY_W,
  TALL_BUSH_DISPLAY_H,
  TALL_BUSH_LEFT,
  TALL_BUSH_TOP,
  TALL_BUSH_DEPTH_Y,
  ARROW_X,
  ARROW_Y,
  ARROW_SIZE,
  HOUSE_FRAME,
  HOUSE_FLOOR,
  HOUSE_BED,
  HOUSE_DRAWER,
  HOUSE_IMAGE,
  HOUSE_DESK,
  HOUSE_FRONT,
  HOUSE_FRONT_LEFT,
  HOUSE_FRONT_TOP,
  HOUSE_FRONT_W,
  HOUSE_FRONT_H,
  HOUSE_ROOFTOP,
  HOUSE_ROOFTOP_LEFT,
  HOUSE_ROOFTOP_TOP,
  HOUSE_ROOFTOP_W,
  HOUSE_ROOFTOP_H,
  HOUSE_W,
  HOUSE_H,
  HOUSE_LEFT,
  HOUSE_TOP,
  INTERIOR_X,
  INTERIOR_Y,
  INTERIOR_W,
  INTERIOR_H,
  HIMG_X,
  HIMG_Y,
  HIMG_W,
  HIMG_H,
  HDRAWER_X,
  HDRAWER_Y,
  HDRAWER_W,
  HDRAWER_H,
  HBED_X,
  HBED_Y,
  HBED_W,
  HBED_H,
  HDESK_X,
  HDESK_Y,
  HDESK_W,
  HDESK_H,
  HIMG_DEPTH_Y,
  HDRAWER_DEPTH_Y,
  HBED_DEPTH_Y,
  HDESK_DEPTH_Y,
  HOUSE_EXIT_X,
  HOUSE_EXIT_Y,
  HOUSE_EXIT_RX,
  HOUSE_EXIT_RY,
  HOUSE_ENTER_POS,
  HOUSE_INTERIOR_RECT,
  WALKWAY,
  WALKWAY_DISPLAY_W,
  WALKWAY_DISPLAY_H,
  WALKWAY_LEFT,
  WALKWAY_TOP,
  GARDEN_FLOOR,
  GARDEN_BACK,
  GARDEN_SIDES,
  GARDEN_FRONTS,
  G_CONTAINER_W,
  G_CONTAINER_H,
  G_FLOOR,
  G_BACK,
  G_SIDES,
  G_FRONT,
  GW,
  GH,
  GARDEN_POSITIONS,
  BACKUP_GARDEN_FLOOR_RECT,
  START_X,
  START_Y,
} = getIslandWorldLayout(H);

/** Vertical bob amplitude for the activities heading (native-driver friendly). */
const ACTIVITIES_HEADING_FLOAT_PX = Math.max(
  3,
  Math.round(ACTIVITIES_HEADING_H * 0.12),
);

/** Same horizontal padding as `isOnWalkway` / door trigger. */
const WALKWAY_PAD_X = Math.max(6, Math.round(WALKWAY_DISPLAY_W * 0.15));

/** Tree AABB intersects the screen after applying the same camera pan as the character. */
function isTreeVisibleOnScreen(
  charWorldX: number,
  charWorldY: number,
): boolean {
  const cam = getCameraOffset(charWorldX, charWorldY);
  const left = TREE_WORLD_X - TREE_DISPLAY_W / 2 + cam.x;
  const top = TREE_WORLD_Y - TREE_DISPLAY_H + cam.y;
  const right = TREE_WORLD_X + TREE_DISPLAY_W / 2 + cam.x;
  const bottom = TREE_WORLD_Y + cam.y;
  return right > 0 && left < W && bottom > 0 && top < H;
}

/** Shake tree AABB intersects the screen (same camera as character). */
function isShakeTreeVisibleOnScreen(
  charWorldX: number,
  charWorldY: number,
): boolean {
  const cam = getCameraOffset(charWorldX, charWorldY);
  const left = SHAKE_TREE_WORLD_X - SHAKE_TREE_DISPLAY_W / 2 + cam.x;
  const top = SHAKE_TREE_WORLD_Y - SHAKE_TREE_DISPLAY_H + cam.y;
  const right = SHAKE_TREE_WORLD_X + SHAKE_TREE_DISPLAY_W / 2 + cam.x;
  const bottom = SHAKE_TREE_WORLD_Y + cam.y;
  return right > 0 && left < W && bottom > 0 && top < H;
}

const CHAR_SCALE_INDOOR = 0.5;

/** How much of each grid cell the plant sprite fills (see getGardenPlantSize). */
const BACKUP_GARDEN_PLANT_FILL = 1.8;

/** Set true to show semi-transparent grid cells over the soil for layout tuning. */
const BACKUP_GARDEN_GRID_DEBUG = false;

/**
 * World + UI hit zones for tuning (walk mask, circles, button outlines). Keep false for players; set true when adjusting layout.
 */
const GAME_INTERACTION_DEBUG = false;

/** Activity kiosk zones only (always on). Garden plot zones stay under `GAME_INTERACTION_DEBUG`. */
const ACTIVITY_TRIGGER_ZONE_FILL = "rgba(255, 255, 255, 0.1)";
const ACTIVITY_TRIGGER_ZONE_STROKE = "rgba(255, 255, 255, 0.32)";

/**
 * Dev-only plant frame cycling was removed; this stub stays so stale Fast Refresh /
 * React Compiler bundles don’t reference a missing identifier.
 */
/**
 * Count how many dates in completionDates[habitId] fall within [start, end] (ISO strings).
 */
function getWeekCompletionCount(
  habitId: string,
  completionDates: CompletionDatesByHabit,
  start: string,
  end: string,
): number {
  const dates = completionDates[habitId];
  if (!dates) return 0;
  return dates.filter((d) => d >= start && d <= end).length;
}

// ─── Character ────────────────────────────────────────────────────────────────

const CHAR_SIZE = 96;
const CHAR_SCALE = 0.67;
const SPEED = 3.5;
const ANIM_FPS = 8;
const MOVE_INTERVAL = 16;
/** When idle, refresh facing animation only every Nth tick (proximity still runs every tick). */
const IDLE_PROXIMITY_TICK_MOD = 3;
const DEADZONE = 0.15;

type AnimKey =
  | "idle"
  | "north"
  | "south"
  | "east"
  | "west"
  | "north-east"
  | "north-west"
  | "south-east"
  | "south-west";

const CHARACTER_ATLAS = require("@/assets/Game/character-atlas.png");
const ATLAS_CELL = 96;
const ATLAS_COLS = 6;
const ATLAS_ROWS = 9;
const ATLAS_W = ATLAS_COLS * ATLAS_CELL;
const ATLAS_H = ATLAS_ROWS * ATLAS_CELL;

const ANIM_KEY_TO_ROW: Record<AnimKey, number> = {
  idle: 0,
  north: 1,
  south: 2,
  east: 3,
  west: 4,
  "north-east": 5,
  "north-west": 6,
  "south-east": 7,
  "south-west": 8,
};

const FRAME_COUNTS: Record<AnimKey, number> = {
  idle: 4,
  north: 6,
  south: 6,
  east: 6,
  west: 6,
  "north-east": 6,
  "north-west": 6,
  "south-east": 6,
  "south-west": 6,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function getAnimKey(jx: number, jy: number): AnimKey {
  if (Math.abs(jx) < DEADZONE && Math.abs(jy) < DEADZONE) return "idle";
  const angle = Math.atan2(jy, jx) * (180 / Math.PI);
  if (angle >= -22.5 && angle < 22.5) return "east";
  if (angle >= 22.5 && angle < 67.5) return "south-east";
  if (angle >= 67.5 && angle < 112.5) return "south";
  if (angle >= 112.5 && angle < 157.5) return "south-west";
  if (angle >= 157.5 || angle < -157.5) return "west";
  if (angle >= -157.5 && angle < -112.5) return "north-west";
  if (angle >= -112.5 && angle < -67.5) return "north";
  return "north-east";
}

function getCameraOffset(charX: number, charY: number) {
  return {
    x: clamp(W / 2 - charX, W - WORLD_W, 0),
    y: clamp(H / 2 - charY, H - WORLD_H, 0),
  };
}

// ─── Island collision ────────────────────────────────────────────────────────

const FEET_OFFSET_Y = CHAR_SIZE * 0.32;
const FEET_HALF_W = 12;
/** Feet / footprint vs world Y while indoors (sprite uses `CHAR_SCALE_INDOOR`). */
const INDOOR_FEET_OFFSET_Y = FEET_OFFSET_Y * CHAR_SCALE_INDOOR;
/** Shift furniture hitboxes down to align with visible bases (sprites vs layout). */
const INDOOR_FURNITURE_COLLISION_Y_OFFSET = Math.round(HOUSE_H * 0.045);
/** Inflate rects so feet cannot slip past edges (same idea as outdoor FEET_HALF_W). */
const INDOOR_FURNITURE_COLLISION_PAD = Math.max(6, Math.round(HOUSE_H * 0.028));
/** Substeps per tick so diagonal slides cannot tunnel through thin furniture rects. */
/** Fewer = cheaper; raise if indoor collision tunnels. */
const INDOOR_MOVE_SUBSTEPS = 4;
const GARDEN_PADDING = 4;

// House collision rect (the main rectangular body of the frame)
const HOUSE_PAD = 2;
const HOUSE_RECT = {
  left: HOUSE_LEFT + INTERIOR_X - HOUSE_PAD,
  top: HOUSE_TOP - HOUSE_PAD,
  right: HOUSE_LEFT + INTERIOR_X + INTERIOR_W + HOUSE_PAD,
  bottom: HOUSE_TOP + HOUSE_H * 1 + HOUSE_PAD,
};

function isInsideHouse(worldX: number, worldY: number): boolean {
  return (
    worldX >= HOUSE_RECT.left &&
    worldX <= HOUSE_RECT.right &&
    worldY >= HOUSE_RECT.top &&
    worldY <= HOUSE_RECT.bottom
  );
}

const GARDEN_BOTTOM_PAD = CHAR_SIZE * CHAR_SCALE * 0.3;
const GARDEN_RECTS = GARDEN_POSITIONS.map((pos) => {
  const left = ISLAND_LEFT + pos.x * ISLAND_W - GW / 2 - GARDEN_PADDING;
  const top = ISLAND_TOP + pos.y * ISLAND_H - GH / 2 - GARDEN_PADDING;
  return {
    left,
    top,
    right: left + GW + GARDEN_PADDING * 2,
    bottom: top + GH + GARDEN_PADDING + GARDEN_BOTTOM_PAD,
  };
});

function isInsideGarden(worldX: number, worldY: number): boolean {
  for (const r of GARDEN_RECTS) {
    if (
      worldX >= r.left &&
      worldX <= r.right &&
      worldY >= r.top &&
      worldY <= r.bottom
    ) {
      return true;
    }
  }
  return false;
}

function isPointWalkable(worldX: number, worldY: number): boolean {
  const localX = worldX - ISLAND_LEFT;
  const localY = worldY - ISLAND_TOP;
  const imgX = (localX / ISLAND_W) * unifiedCollision.width;
  const imgY = (localY / ISLAND_H) * unifiedCollision.height;
  const col = Math.floor(imgX / unifiedCollision.cellSize);
  const row = Math.floor(imgY / unifiedCollision.cellSize);
  if (
    row < 0 ||
    row >= unifiedCollision.rows ||
    col < 0 ||
    col >= unifiedCollision.cols
  )
    return false;
  return unifiedCollision.grid[row][col] === 0;
}

function isTreeTrunkBlocking(worldX: number, feetY: number): boolean {
  if (feetY < TREE_TRUNK_TOP || feetY > TREE_WORLD_Y) return false;
  return (
    worldX >= TREE_WORLD_X - TREE_TRUNK_HALF_W &&
    worldX <= TREE_WORLD_X + TREE_TRUNK_HALF_W
  );
}

function isShakeTreeTrunkBlocking(worldX: number, feetY: number): boolean {
  if (feetY < SHAKE_TREE_TRUNK_TOP || feetY > SHAKE_TREE_WORLD_Y) return false;
  return (
    worldX >= SHAKE_TREE_WORLD_X - SHAKE_TREE_TRUNK_HALF_W &&
    worldX <= SHAKE_TREE_WORLD_X + SHAKE_TREE_TRUNK_HALF_W
  );
}

function isCowBodyBlocking(worldX: number, feetY: number): boolean {
  if (feetY < COW_TRUNK_TOP || feetY > COW_WORLD_Y) return false;
  return (
    worldX >= COW_WORLD_X - COW_TRUNK_HALF_W &&
    worldX <= COW_WORLD_X + COW_TRUNK_HALF_W
  );
}

function isChickenBodyBlocking(worldX: number, feetY: number): boolean {
  if (feetY < CHICKEN_TRUNK_TOP || feetY > CHICKEN_WORLD_Y) return false;
  return (
    worldX >= CHICKEN_WORLD_X - CHICKEN_TRUNK_HALF_W &&
    worldX <= CHICKEN_WORLD_X + CHICKEN_TRUNK_HALF_W
  );
}

function isBigTreeTrunkBlocking(worldX: number, feetY: number): boolean {
  if (feetY < BIG_TREE_TRUNK_TOP || feetY > BIG_TREE_WORLD_Y) return false;
  return (
    worldX >= BIG_TREE_WORLD_X - BIG_TREE_TRUNK_HALF_W &&
    worldX <= BIG_TREE_WORLD_X + BIG_TREE_TRUNK_HALF_W
  );
}

function isWellTrunkBlocking(worldX: number, feetY: number): boolean {
  if (feetY < WELL_TRUNK_TOP || feetY > WELL_WORLD_Y) return false;
  return (
    worldX >= WELL_WORLD_X - WELL_TRUNK_HALF_W &&
    worldX <= WELL_WORLD_X + WELL_TRUNK_HALF_W
  );
}

function isWalkable(worldX: number, worldY: number): boolean {
  const feetY = worldY + FEET_OFFSET_Y;
  if (
    isInsideGarden(worldX, feetY) ||
    isInsideGarden(worldX - FEET_HALF_W, feetY) ||
    isInsideGarden(worldX + FEET_HALF_W, feetY)
  )
    return false;
  if (isInsideHouse(worldX, feetY) && !isOnWalkway(worldX, feetY)) return false;
  if (
    isCowBodyBlocking(worldX, feetY) ||
    isCowBodyBlocking(worldX - FEET_HALF_W, feetY) ||
    isCowBodyBlocking(worldX + FEET_HALF_W, feetY)
  )
    return false;
  if (
    isActivitiesWalkBlocking(worldX, feetY) ||
    isActivitiesWalkBlocking(worldX - FEET_HALF_W, feetY) ||
    isActivitiesWalkBlocking(worldX + FEET_HALF_W, feetY)
  )
    return false;
  if (
    isChickenBodyBlocking(worldX, feetY) ||
    isChickenBodyBlocking(worldX - FEET_HALF_W, feetY) ||
    isChickenBodyBlocking(worldX + FEET_HALF_W, feetY)
  )
    return false;
  if (
    isBigTreeTrunkBlocking(worldX, feetY) ||
    isBigTreeTrunkBlocking(worldX - FEET_HALF_W, feetY) ||
    isBigTreeTrunkBlocking(worldX + FEET_HALF_W, feetY)
  )
    return false;
  if (
    isWellTrunkBlocking(worldX, feetY) ||
    isWellTrunkBlocking(worldX - FEET_HALF_W, feetY) ||
    isWellTrunkBlocking(worldX + FEET_HALF_W, feetY)
  )
    return false;
  if (
    isShakeTreeTrunkBlocking(worldX, feetY) ||
    isShakeTreeTrunkBlocking(worldX - FEET_HALF_W, feetY) ||
    isShakeTreeTrunkBlocking(worldX + FEET_HALF_W, feetY)
  )
    return false;
  if (
    isTreeTrunkBlocking(worldX, feetY) ||
    isTreeTrunkBlocking(worldX - FEET_HALF_W, feetY) ||
    isTreeTrunkBlocking(worldX + FEET_HALF_W, feetY)
  )
    return false;
  const footWalkMesh = (wx: number) =>
    isPointWalkable(wx, feetY) || isOnWalkway(wx, feetY);
  return (
    footWalkMesh(worldX) &&
    footWalkMesh(worldX - FEET_HALF_W) &&
    footWalkMesh(worldX + FEET_HALF_W)
  );
}

function isIndoorFurnitureBlocking(worldX: number, feetY: number): boolean {
  const oy = INDOOR_FURNITURE_COLLISION_Y_OFFSET;
  const pad = INDOOR_FURNITURE_COLLISION_PAD;
  const pieces: { left: number; top: number; right: number; bottom: number }[] =
    [
      {
        left: HOUSE_LEFT + HIMG_X - pad,
        top: HOUSE_TOP + HIMG_Y + oy - pad,
        right: HOUSE_LEFT + HIMG_X + HIMG_W + pad,
        bottom: HOUSE_TOP + HIMG_Y + HIMG_H + oy + pad,
      },
      {
        left: HOUSE_LEFT + HDRAWER_X - pad,
        top: HOUSE_TOP + HDRAWER_Y + oy - pad,
        right: HOUSE_LEFT + HDRAWER_X + HDRAWER_W + pad,
        bottom: HOUSE_TOP + HDRAWER_Y + HDRAWER_H + oy + pad,
      },
      {
        left: HOUSE_LEFT + HBED_X - pad,
        top: HOUSE_TOP + HBED_Y + oy - pad,
        right: HOUSE_LEFT + HBED_X + HBED_W + pad,
        bottom: HOUSE_TOP + HBED_Y + HBED_H + oy + pad,
      },
      {
        left: HOUSE_LEFT + HDESK_X - pad,
        top: HOUSE_TOP + HDESK_Y + oy - pad,
        right: HOUSE_LEFT + HDESK_X + HDESK_W + pad,
        bottom: HOUSE_TOP + HDESK_Y + HDESK_H + oy + pad,
      },
    ];
  const footL = worldX - FEET_HALF_W;
  const footR = worldX + FEET_HALF_W;
  for (const p of pieces) {
    if (feetY < p.top || feetY > p.bottom) continue;
    if (footR >= p.left && footL <= p.right) return true;
  }
  return false;
}

function isWalkableIndoors(worldX: number, worldY: number): boolean {
  const feetY = worldY + INDOOR_FEET_OFFSET_Y;
  const headY = worldY - CHAR_SIZE * CHAR_SCALE_INDOOR * 0.9;
  const r = HOUSE_INTERIOR_RECT;
  if (
    !(
      worldX >= r.left &&
      worldX <= r.right &&
      headY >= r.top &&
      feetY <= r.bottom
    )
  ) {
    return false;
  }
  if (isIndoorFurnitureBlocking(worldX, feetY)) return false;
  return true;
}

/**
 * When feet are north of a prop's sprite bottom (smaller Y) and overlap it on X,
 * the character should draw below that furniture (same idea as TREE_DEPTH_Y).
 */
function isCharBehindIndoorFurniture(worldX: number, feetY: number): boolean {
  const footL = worldX - FEET_HALF_W;
  const footR = worldX + FEET_HALF_W;
  const pieces: { left: number; right: number; depthY: number }[] = [
    {
      left: HOUSE_LEFT + HIMG_X,
      right: HOUSE_LEFT + HIMG_X + HIMG_W,
      depthY: HIMG_DEPTH_Y,
    },
    {
      left: HOUSE_LEFT + HDRAWER_X,
      right: HOUSE_LEFT + HDRAWER_X + HDRAWER_W,
      depthY: HDRAWER_DEPTH_Y,
    },
    {
      left: HOUSE_LEFT + HBED_X,
      right: HOUSE_LEFT + HBED_X + HBED_W,
      depthY: HBED_DEPTH_Y,
    },
    {
      left: HOUSE_LEFT + HDESK_X,
      right: HOUSE_LEFT + HDESK_X + HDESK_W,
      depthY: HDESK_DEPTH_Y,
    },
  ];
  for (const p of pieces) {
    if (footR < p.left || footL > p.right) continue;
    if (feetY < p.depthY) return true;
  }
  return false;
}

/** Elliptical garden interaction zones (world px): wider than tall. */
const { rx: GARDEN_TRIGGER_RX, ry: GARDEN_TRIGGER_RY } = gardenTriggerRadii(GH);
const GARDEN_TRIGGERS = GARDEN_POSITIONS.map((pos) => ({
  x: ISLAND_LEFT + pos.x * ISLAND_W,
  y: ISLAND_TOP + pos.y * ISLAND_H + GH / 2 + GARDEN_TRIGGER_RY * 0.65,
}));

/** Uses feet on the ground (worldY = feetY) so the ellipse matches where the player stands. */
function nearGardenIndex(worldX: number, worldY: number): number {
  for (let i = 0; i < GARDEN_TRIGGERS.length; i++) {
    const dx = worldX - GARDEN_TRIGGERS[i].x;
    const dy = worldY - GARDEN_TRIGGERS[i].y;
    const nx = dx / GARDEN_TRIGGER_RX;
    const ny = dy / GARDEN_TRIGGER_RY;
    if (nx * nx + ny * ny <= 1) return i;
  }
  return -1;
}

/** Small square in front of each activity (half-edge from center, world px). */
const ACTIVITY_TRIGGER_HALF = Math.max(
  12,
  Math.round(ACTIVITIES_ICON_W * 0.34),
);

/** Slightly south of icon base so the square reads “on the grass” in front. */
const ACTIVITIES_TRIGGER_FEET_Y = Math.round(
  ACTIVITIES_GROUND_Y + Math.round(ACTIVITY_TRIGGER_HALF * 0.45),
);
const ACTIVITIES_TRIGGERS = [
  {
    x: ACTIVITIES_BREATHING_LEFT + ACTIVITIES_ICON_W / 2,
    y: ACTIVITIES_TRIGGER_FEET_Y,
  },
  {
    x: ACTIVITIES_PUZZLES_LEFT + ACTIVITIES_ICON_W / 2,
    y: ACTIVITIES_TRIGGER_FEET_Y,
  },
  {
    x: ACTIVITIES_GRATITUDE_LEFT + ACTIVITIES_ICON_W / 2,
    y: ACTIVITIES_TRIGGER_FEET_Y,
  },
] as const;

/** Axis-aligned square zones in front of each activity icon. */
function nearActivityIndex(worldX: number, feetY: number): number {
  const h = ACTIVITY_TRIGGER_HALF;
  for (let i = 0; i < ACTIVITIES_TRIGGERS.length; i++) {
    const dx = Math.abs(worldX - ACTIVITIES_TRIGGERS[i].x);
    const dy = Math.abs(feetY - ACTIVITIES_TRIGGERS[i].y);
    if (dx <= h && dy <= h) return i;
  }
  return -1;
}

const ACTIVITY_ACTION_LABELS = ["Breathing", "Puzzles", "Gratitude"] as const;

const ACTIVITY_ROUTES = [
  "/breathe",
  "/puzzles",
  "/gratitude",
] as const;

function isOnWalkway(worldX: number, feetY: number): boolean {
  return (
    worldX >= WALKWAY_LEFT - WALKWAY_PAD_X &&
    worldX <= WALKWAY_LEFT + WALKWAY_DISPLAY_W + WALKWAY_PAD_X &&
    feetY >= WALKWAY_TOP &&
    feetY <= WALKWAY_TOP + WALKWAY_DISPLAY_H
  );
}

function isNearDoor(worldX: number, worldY: number, indoor: boolean): boolean {
  if (indoor) {
    const dx = worldX - HOUSE_EXIT_X;
    const dy = worldY - HOUSE_EXIT_Y;
    const nx = dx / HOUSE_EXIT_RX;
    const ny = dy / HOUSE_EXIT_RY;
    return nx * nx + ny * ny <= 1;
  }
  return isOnWalkway(worldX, worldY + FEET_OFFSET_Y);
}

/** Ellipse in front of desk / bed (same anchor as door: `worldPosRef` x/y). */
const HOUSE_DESK_INTERACT_CX = HOUSE_LEFT + HDESK_X + HDESK_W * 0.52;
const HOUSE_DESK_INTERACT_CY =
  HOUSE_TOP + HDESK_Y + HDESK_H + Math.max(8, Math.round(HOUSE_H * 0.035));
const HOUSE_BED_INTERACT_CX = HOUSE_LEFT + HBED_X + HBED_W * 0.48;
const HOUSE_BED_INTERACT_CY =
  HOUSE_TOP + HBED_Y + HBED_H + Math.max(8, Math.round(HOUSE_H * 0.035));
const HOUSE_FURNITURE_INTERACT_RX = Math.max(22, Math.round(HOUSE_EXIT_RX * 0.82));
const HOUSE_FURNITURE_INTERACT_RY = Math.max(10, Math.round(HOUSE_EXIT_RY * 1.05));

function isNearHouseDesk(worldX: number, worldY: number): boolean {
  const dx = worldX - HOUSE_DESK_INTERACT_CX;
  const dy = worldY - HOUSE_DESK_INTERACT_CY;
  const nx = dx / HOUSE_FURNITURE_INTERACT_RX;
  const ny = dy / HOUSE_FURNITURE_INTERACT_RY;
  return nx * nx + ny * ny <= 1;
}

function isNearHouseBed(worldX: number, worldY: number): boolean {
  const dx = worldX - HOUSE_BED_INTERACT_CX;
  const dy = worldY - HOUSE_BED_INTERACT_CY;
  const nx = dx / HOUSE_FURNITURE_INTERACT_RX;
  const ny = dy / HOUSE_FURNITURE_INTERACT_RY;
  return nx * nx + ny * ny <= 1;
}

// ─── Game screen ──────────────────────────────────────────────────────────────

export default function GameScreen() {
  const router = useRouter();
  const { resetFromHome, resetHouseInterior } = useLocalSearchParams<{
    resetFromHome?: string;
    resetHouseInterior?: string;
  }>();
  const insets = useSafeAreaInsets();
  const habits = useHabitStore((s) => s.habits);
  const completionDates = useHabitStore((s) => s.completionDates);
  const ensureDayReset = useHabitStore((s) => s.ensureDayReset);
  const currentWeekPlot = getCurrentMonthWeekIndex();

  const habitCountForGarden = Math.min(habits.length, GARDEN_MAX_PLANTS);
  const backupGardenLayout = useMemo(() => {
    const { cols, rows } = getGardenGridDimensionsForPlantCount(
      habitCountForGarden,
      BACKUP_GARDEN_FLOOR_RECT,
    );
    return {
      cols,
      rows,
      slotCenters: getPlantSlotCenters(BACKUP_GARDEN_FLOOR_RECT, cols, rows),
      plantSize: getGardenPlantSize(
        BACKUP_GARDEN_FLOOR_RECT,
        cols,
        rows,
        BACKUP_GARDEN_PLANT_FILL,
      ),
      cellMetrics: getGridCellMetrics(BACKUP_GARDEN_FLOOR_RECT, cols, rows),
    };
  }, [habitCountForGarden]);

  const joystickRef = useRef<JoystickDelta>({ x: 0, y: 0 });
  const worldPosRef = useRef({ x: START_X, y: START_Y });

  const initialCam = getCameraOffset(START_X, START_Y);
  const cameraAnim = useRef(new Animated.ValueXY(initialCam)).current;
  const charAnim = useRef(
    new Animated.ValueXY({
      x: START_X - CHAR_SIZE / 2,
      y: START_Y - CHAR_SIZE / 2,
    }),
  ).current;

  const dirRef = useRef<AnimKey>("idle");
  const [animKey, setAnimKey] = useState<AnimKey>("idle");
  const [frame, setFrame] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const lastFootstepFrameRef = useRef<number | null>(null);
  const [spriteError, setSpriteError] = useState(false);

  const [insideHouse, setInsideHouse] = useState(false);
  const [nearDoor, setNearDoor] = useState(false);
  const [nearHouseDesk, setNearHouseDesk] = useState(false);
  const [nearHouseBed, setNearHouseBed] = useState(false);
  const [nearGarden, setNearGarden] = useState(-1);
  const [nearActivity, setNearActivity] = useState(-1);
  const [nearTree, setNearTree] = useState(false);
  const [nearShakeTree, setNearShakeTree] = useState(false);
  const [nearCow, setNearCow] = useState(false);
  const [charBehindTree, setCharBehindTree] = useState(false);
  const [charBehindShakeTree, setCharBehindShakeTree] = useState(false);
  const [charBehindCow, setCharBehindCow] = useState(false);
  const [charBehindActivities, setCharBehindActivities] = useState(false);
  const [charBehindChicken, setCharBehindChicken] = useState(false);
  const [charBehindBigTree, setCharBehindBigTree] = useState(false);
  const [charBehindWell, setCharBehindWell] = useState(false);
  const [charBehindPlant, setCharBehindPlant] = useState(false);
  const [charBehindTallBush, setCharBehindTallBush] = useState(false);
  const [charBehindIndoorFurniture, setCharBehindIndoorFurniture] =
    useState(false);
  const [gardenPopupIndex, setGardenPopupIndex] = useState(-1);
  const [treeFallFrameIndex, setTreeFallFrameIndex] = useState(0);
  const [treeFallPlaying, setTreeFallPlaying] = useState(false);
  const [cowFrameIndex, setCowFrameIndex] = useState(0);
  const [cowPetPlaying, setCowPetPlaying] = useState(false);
  const [cowHeartFrameIndex, setCowHeartFrameIndex] = useState(0);
  const [chickenIdleFrameIndex, setChickenIdleFrameIndex] = useState(0);
  const [chickenPeckFrameIndex, setChickenPeckFrameIndex] = useState(0);
  const [chickenPeckPlaying, setChickenPeckPlaying] = useState(false);
  const [shakeTreeFrameIndex, setShakeTreeFrameIndex] = useState(0);
  const shakeTreeSeqRef = useRef(false);
  const treeHasFallenRef = useRef(false);
  const treeFallAnimatingRef = useRef(false);
  const treeWasOnScreenRef = useRef(false);
  const shakeTreeWasOnScreenRef = useRef(false);
  const charBehindTreeRef = useRef(false);
  const charBehindShakeTreeRef = useRef(false);
  const charBehindCowRef = useRef(false);
  const charBehindActivitiesRef = useRef(false);
  const charBehindChickenRef = useRef(false);
  const charBehindBigTreeRef = useRef(false);
  const charBehindWellRef = useRef(false);
  const charBehindPlantRef = useRef(false);
  const charBehindTallBushRef = useRef(false);
  const charBehindIndoorFurnitureRef = useRef(false);
  const insideHouseRef = useRef(false);
  const nearDoorRef = useRef(false);
  const nearHouseDeskRef = useRef(false);
  const nearHouseBedRef = useRef(false);
  const nearGardenRef = useRef(-1);
  const nearActivityRef = useRef(-1);
  const nearTreeRef = useRef(false);
  const nearShakeTreeRef = useRef(false);
  const nearCowRef = useRef(false);
  const idleProximityPhaseRef = useRef(0);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (Platform.OS === "web") return;
    return () => {
      void unloadGameSounds();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    void syncGameAmbience(soundEnabled, isFocused);
  }, [soundEnabled, isFocused]);

  useEffect(() => {
    if (
      Platform.OS === "web" ||
      !soundEnabled ||
      !isFocused ||
      animKey === "idle"
    ) {
      lastFootstepFrameRef.current = null;
      return;
    }
    if (frame !== 0 && frame !== 3) {
      lastFootstepFrameRef.current = frame;
      return;
    }
    if (lastFootstepFrameRef.current === frame) return;
    lastFootstepFrameRef.current = frame;
    void playGameFootstep(insideHouseRef.current);
  }, [frame, animKey, soundEnabled, isFocused]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (animKey === "idle" || !soundEnabled || !isFocused) {
      stopGameFootsteps();
    }
  }, [animKey, soundEnabled, isFocused]);

  const arrowAnim = useRef(new Animated.Value(0)).current;
  const activitiesHeadingFloat = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [arrowAnim]);

  useEffect(() => {
    if (!isFocused) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(activitiesHeadingFloat, {
          toValue: 1,
          duration: 1250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(activitiesHeadingFloat, {
          toValue: 0,
          duration: 1250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [activitiesHeadingFloat, isFocused]);

  useEffect(() => {
    charAnim.setValue({
      x: START_X - CHAR_SIZE / 2,
      y: START_Y - CHAR_SIZE / 2,
    });
    cameraAnim.setValue(getCameraOffset(START_X, START_Y));
  }, [charAnim, cameraAnim]);

  const resetToStartRef = useRef<string | null>(null);
  const resetCharacterToStart = useCallback(() => {
    joystickRef.current = { x: 0, y: 0 };
    insideHouseRef.current = false;
    setInsideHouse(false);
    const start = { x: START_X, y: START_Y };
    worldPosRef.current = start;
    charAnim.setValue({
      x: start.x - CHAR_SIZE / 2,
      y: start.y - CHAR_SIZE / 2,
    });
    cameraAnim.setValue(getCameraOffset(start.x, start.y));
  }, [cameraAnim, charAnim]);

  const resetCharacterToHouseEntry = useCallback(() => {
    joystickRef.current = { x: 0, y: 0 };
    insideHouseRef.current = true;
    setInsideHouse(true);
    const pos = HOUSE_ENTER_POS;
    worldPosRef.current = { x: pos.x, y: pos.y };
    charAnim.setValue({
      x: pos.x - CHAR_SIZE / 2,
      y: pos.y - CHAR_SIZE / 2,
    });
    cameraAnim.setValue(getCameraOffset(pos.x, pos.y));
  }, [cameraAnim, charAnim]);

  const resetHouseEntryRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isFocused) return;
    if (!resetFromHome) return;
    if (resetToStartRef.current === resetFromHome) return;
    resetToStartRef.current = resetFromHome;
    resetCharacterToStart();
    router.setParams({ resetFromHome: undefined });
  }, [isFocused, resetCharacterToStart, resetFromHome, router]);

  useEffect(() => {
    if (!isFocused) return;
    if (!resetHouseInterior) return;
    if (resetHouseEntryRef.current === resetHouseInterior) return;
    resetHouseEntryRef.current = resetHouseInterior;
    resetCharacterToHouseEntry();
    router.setParams({ resetHouseInterior: undefined });
  }, [isFocused, resetCharacterToHouseEntry, resetHouseInterior, router]);

  useFocusEffect(
    useCallback(() => {
      ensureDayReset();
      // Do not reset world position, camera, or proximity here — that runs on every
      // focus, including when returning from stack routes (breathe, gratitude, etc.).
      // Spawn / remount still uses START_* via initial refs + the mount effect below.
      // Tree chop state is intentionally NOT reset here — useFocusEffect can re-run when
      // callback deps change while focused, which was resetting the tree to frame 0.
      // Always start silent when the island is shown (tab focus or return from activities).
      setSoundEnabled(false);
      if (Platform.OS !== "web") {
        stopGameFootsteps();
        void syncGameAmbience(false, true);
      }
      return () => {
        if (Platform.OS !== "web") {
          stopGameFootsteps();
          void syncGameAmbience(false, false);
        }
      };
    }, [ensureDayReset]),
  );

  const handleChopTree = useCallback(() => {
    if (treeHasFallenRef.current || treeFallAnimatingRef.current) return;
    gameImpactMedium();
    if (soundEnabled) {
      void playTreeChopSound();
    }
    treeFallAnimatingRef.current = true;
    setTreeFallPlaying(true);
  }, [soundEnabled]);

  useEffect(() => {
    if (!treeFallPlaying) return;
    const id = setInterval(() => {
      setTreeFallFrameIndex((i) => {
        if (i >= TREE_FALL_FRAME_COUNT - 1) {
          treeHasFallenRef.current = true;
          treeFallAnimatingRef.current = false;
          setTreeFallPlaying(false);
          return TREE_FALL_FRAME_COUNT - 1;
        }
        return i + 1;
      });
    }, 55);
    return () => clearInterval(id);
  }, [treeFallPlaying]);

  useEffect(() => {
    if (cowPetPlaying) return;
    const id = setInterval(() => {
      setCowFrameIndex((i) => (i + 1) % COW_FRAME_COUNT);
    }, COW_ANIM_INTERVAL_MS);
    return () => clearInterval(id);
  }, [cowPetPlaying, COW_FRAME_COUNT, COW_ANIM_INTERVAL_MS]);

  useEffect(() => {
    if (!cowPetPlaying) return;
    const id = setInterval(() => {
      setCowHeartFrameIndex((prev) => {
        if (prev >= COW_HEART_FRAME_COUNT - 1) {
          clearInterval(id);
          setCowPetPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, COW_HEART_ANIM_INTERVAL_MS);
    return () => clearInterval(id);
  }, [cowPetPlaying, COW_HEART_FRAME_COUNT, COW_HEART_ANIM_INTERVAL_MS]);

  const handlePetCow = useCallback(() => {
    if (cowPetPlaying) return;
    gameImpactLight();
    if (soundEnabled) {
      void playCowPettingSound();
    }
    setCowHeartFrameIndex(0);
    setCowPetPlaying(true);
  }, [cowPetPlaying, soundEnabled]);

  useEffect(() => {
    if (chickenPeckPlaying) return;
    const id = setInterval(() => {
      setChickenIdleFrameIndex((i) => (i + 1) % CHICKEN_IDLE_FRAME_COUNT);
    }, CHICKEN_ANIM_INTERVAL_MS);
    return () => clearInterval(id);
  }, [chickenPeckPlaying, CHICKEN_IDLE_FRAME_COUNT, CHICKEN_ANIM_INTERVAL_MS]);

  useEffect(() => {
    if (!chickenPeckPlaying) return;
    setChickenPeckFrameIndex(0);
    const id = setInterval(() => {
      setChickenPeckFrameIndex((prev) => {
        if (prev >= CHICKEN_PECK_FRAME_COUNT - 1) {
          clearInterval(id);
          setChickenPeckPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, CHICKEN_ANIM_INTERVAL_MS);
    return () => clearInterval(id);
  }, [chickenPeckPlaying, CHICKEN_PECK_FRAME_COUNT, CHICKEN_ANIM_INTERVAL_MS]);

  useEffect(() => {
    if (chickenPeckPlaying) return;
    const t = setTimeout(() => {
      setChickenPeckPlaying(true);
    }, CHICKEN_IDLE_BEFORE_PECK_MS);
    return () => clearTimeout(t);
  }, [chickenPeckPlaying, CHICKEN_IDLE_BEFORE_PECK_MS]);

  const treeFallPlayingRef = useRef(false);
  useEffect(() => {
    if (
      treeFallPlayingRef.current &&
      !treeFallPlaying &&
      treeHasFallenRef.current
    ) {
      gameImpactMedium();
    }
    treeFallPlayingRef.current = treeFallPlaying;
  }, [treeFallPlaying]);

  const cowPetPlayingRef = useRef(false);
  useEffect(() => {
    if (cowPetPlayingRef.current && !cowPetPlaying) {
      gameSuccess();
    }
    cowPetPlayingRef.current = cowPetPlaying;
  }, [cowPetPlaying]);

  const handleShakeTree = useCallback(() => {
    if (shakeTreeSeqRef.current) return;
    gameImpactRigid();
    if (soundEnabled) {
      void playTreeShakeSound();
    }
    shakeTreeSeqRef.current = true;
    setShakeTreeFrameIndex(0);
    const id = setInterval(() => {
      setShakeTreeFrameIndex((prev) => {
        if (prev >= TREE_SHAKE_FRAME_COUNT - 1) {
          clearInterval(id);
          shakeTreeSeqRef.current = false;
          return TREE_SHAKE_FRAME_COUNT - 1;
        }
        return prev + 1;
      });
    }, 72);
  }, [soundEnabled]);

  const handleMove = useCallback((delta: JoystickDelta) => {
    joystickRef.current = delta;
  }, []);

  const handleEnd = useCallback(() => {
    joystickRef.current = { x: 0, y: 0 };
  }, []);

  const handleEnterHouse = useCallback(() => {
    if (soundEnabled) {
      void playDoorOpenSound();
    }
    insideHouseRef.current = true;
    setInsideHouse(true);
    const pos = HOUSE_ENTER_POS;
    worldPosRef.current = { x: pos.x, y: pos.y };
    charAnim.setValue({ x: pos.x - CHAR_SIZE / 2, y: pos.y - CHAR_SIZE / 2 });
    cameraAnim.setValue(getCameraOffset(pos.x, pos.y));
  }, [cameraAnim, charAnim, soundEnabled]);

  const handleExitHouse = useCallback(() => {
    if (soundEnabled) {
      void playDoorCloseSound();
    }
    insideHouseRef.current = false;
    setInsideHouse(false);
    const feetY = WALKWAY_TOP + Math.round(WALKWAY_DISPLAY_H * 0.58);
    const x = Math.round(WALKWAY_LEFT + WALKWAY_DISPLAY_W / 2);
    const y = feetY - FEET_OFFSET_Y;
    worldPosRef.current = { x, y };
    charAnim.setValue({ x: x - CHAR_SIZE / 2, y: y - CHAR_SIZE / 2 });
    cameraAnim.setValue(getCameraOffset(x, y));
  }, [cameraAnim, charAnim, soundEnabled]);

  useEffect(() => {
    if (!isFocused) return;
    const id = setInterval(() => {
      const { x: jx, y: jy } = joystickRef.current;
      const isMoving = Math.abs(jx) > DEADZONE || Math.abs(jy) > DEADZONE;
      const indoor = insideHouseRef.current;
      const canWalk = indoor ? isWalkableIndoors : isWalkable;

      if (isMoving) {
        idleProximityPhaseRef.current = 0;
      } else {
        idleProximityPhaseRef.current += 1;
        if (idleProximityPhaseRef.current % IDLE_PROXIMITY_TICK_MOD !== 0) {
          const newDirEarly = getAnimKey(jx, jy);
          if (newDirEarly !== dirRef.current) {
            dirRef.current = newDirEarly;
            setAnimKey(newDirEarly);
            setFrame(0);
          }
        }
      }

      if (isMoving) {
        const { x: curX, y: curY } = worldPosRef.current;
        const stepX = (jx * SPEED) / INDOOR_MOVE_SUBSTEPS;
        const stepY = (jy * SPEED) / INDOOR_MOVE_SUBSTEPS;

        let finalX = curX;
        let finalY = curY;

        if (indoor) {
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

        worldPosRef.current = { x: finalX, y: finalY };
        charAnim.setValue({
          x: finalX - CHAR_SIZE / 2,
          y: finalY - CHAR_SIZE / 2,
        });
        cameraAnim.setValue(getCameraOffset(finalX, finalY));
      }

      const { x: px, y: py } = worldPosRef.current;
      const feetY = py + FEET_OFFSET_Y;
      const behind = !indoor && feetY < TREE_DEPTH_Y;
      if (behind !== charBehindTreeRef.current) {
        charBehindTreeRef.current = behind;
        setCharBehindTree(behind);
      }

      const behindShake = !indoor && feetY < SHAKE_TREE_DEPTH_Y;
      if (behindShake !== charBehindShakeTreeRef.current) {
        charBehindShakeTreeRef.current = behindShake;
        setCharBehindShakeTree(behindShake);
      }

      const behindCow = !indoor && feetY < COW_DEPTH_Y;
      if (behindCow !== charBehindCowRef.current) {
        charBehindCowRef.current = behindCow;
        setCharBehindCow(behindCow);
      }

      const behindActivities = !indoor && isActivitiesCharBehind(px, feetY);
      if (behindActivities !== charBehindActivitiesRef.current) {
        charBehindActivitiesRef.current = behindActivities;
        setCharBehindActivities(behindActivities);
      }

      const behindChicken = !indoor && feetY < CHICKEN_DEPTH_Y;
      if (behindChicken !== charBehindChickenRef.current) {
        charBehindChickenRef.current = behindChicken;
        setCharBehindChicken(behindChicken);
      }

      const behindBigTree = !indoor && feetY < BIG_TREE_DEPTH_Y;
      if (behindBigTree !== charBehindBigTreeRef.current) {
        charBehindBigTreeRef.current = behindBigTree;
        setCharBehindBigTree(behindBigTree);
      }

      const behindWell = !indoor && feetY < WELL_DEPTH_Y;
      if (behindWell !== charBehindWellRef.current) {
        charBehindWellRef.current = behindWell;
        setCharBehindWell(behindWell);
      }

      const behindPlant = !indoor && feetY < PLANT_DEPTH_Y;
      if (behindPlant !== charBehindPlantRef.current) {
        charBehindPlantRef.current = behindPlant;
        setCharBehindPlant(behindPlant);
      }

      const behindTallBush = !indoor && feetY < TALL_BUSH_DEPTH_Y;
      if (behindTallBush !== charBehindTallBushRef.current) {
        charBehindTallBushRef.current = behindTallBush;
        setCharBehindTallBush(behindTallBush);
      }

      const feetYIndoor = py + INDOOR_FEET_OFFSET_Y;
      const behindIndoorFurniture =
        indoor && isCharBehindIndoorFurniture(px, feetYIndoor);
      if (behindIndoorFurniture !== charBehindIndoorFurnitureRef.current) {
        charBehindIndoorFurnitureRef.current = behindIndoorFurniture;
        setCharBehindIndoorFurniture(behindIndoorFurniture);
      }

      const treeOnScreen = isTreeVisibleOnScreen(px, py);
      if (treeWasOnScreenRef.current && !treeOnScreen) {
        treeHasFallenRef.current = false;
        treeFallAnimatingRef.current = false;
        setTreeFallFrameIndex(0);
        setTreeFallPlaying(false);
        if (nearTreeRef.current) {
          nearTreeRef.current = false;
          setNearTree(false);
        }
      }
      treeWasOnScreenRef.current = treeOnScreen;

      const shakeTreeOnScreen = isShakeTreeVisibleOnScreen(px, py);
      if (shakeTreeWasOnScreenRef.current && !shakeTreeOnScreen) {
        setShakeTreeFrameIndex(0);
        shakeTreeSeqRef.current = false;
        if (nearShakeTreeRef.current) {
          nearShakeTreeRef.current = false;
          setNearShakeTree(false);
        }
      }
      shakeTreeWasOnScreenRef.current = shakeTreeOnScreen;

      const near = isNearDoor(px, py, indoor);
      if (near !== nearDoorRef.current) {
        const wasNearDoor = nearDoorRef.current;
        nearDoorRef.current = near;
        setNearDoor(near);
        if (near && !wasNearDoor) {
          gameImpactLight();
        }
      }

      if (indoor) {
        const nearDesk = isNearHouseDesk(px, py);
        if (nearDesk !== nearHouseDeskRef.current) {
          const was = nearHouseDeskRef.current;
          nearHouseDeskRef.current = nearDesk;
          setNearHouseDesk(nearDesk);
          if (nearDesk && !was) {
            gameImpactLight();
          }
        }
        const nearBed = isNearHouseBed(px, py);
        if (nearBed !== nearHouseBedRef.current) {
          const was = nearHouseBedRef.current;
          nearHouseBedRef.current = nearBed;
          setNearHouseBed(nearBed);
          if (nearBed && !was) {
            gameImpactLight();
          }
        }
      } else {
        if (nearHouseDeskRef.current) {
          nearHouseDeskRef.current = false;
          setNearHouseDesk(false);
        }
        if (nearHouseBedRef.current) {
          nearHouseBedRef.current = false;
          setNearHouseBed(false);
        }
      }

      if (!indoor) {
        const ng = nearGardenIndex(px, feetY);
        if (ng !== nearGardenRef.current) {
          const prevNg = nearGardenRef.current;
          nearGardenRef.current = ng;
          setNearGarden(ng);
          if (ng >= 0 && prevNg < 0) {
            gameImpactLight();
          }
        }
        const na = nearActivityIndex(px, feetY);
        if (na !== nearActivityRef.current) {
          const prevA = nearActivityRef.current;
          nearActivityRef.current = na;
          setNearActivity(na);
          if (na >= 0 && prevA < 0) {
            gameImpactLight();
          }
        }
        const tdx = px - TREE_INTERACT_CENTER_X;
        const tdy = py - TREE_INTERACT_CENTER_Y;
        const tr2 = TREE_INTERACT_RADIUS * TREE_INTERACT_RADIUS;
        const inTreeZone = tdx * tdx + tdy * tdy <= tr2;
        const wantNearTree =
          inTreeZone &&
          !treeHasFallenRef.current &&
          !treeFallAnimatingRef.current;
        if (wantNearTree !== nearTreeRef.current) {
          const wasNear = nearTreeRef.current;
          nearTreeRef.current = wantNearTree;
          setNearTree(wantNearTree);
          if (wantNearTree && !wasNear) {
            gameImpactLight();
          }
        }
        const sdx = px - SHAKE_TREE_INTERACT_CENTER_X;
        const sdy = py - SHAKE_TREE_INTERACT_CENTER_Y;
        const sr2 = SHAKE_TREE_INTERACT_RADIUS * SHAKE_TREE_INTERACT_RADIUS;
        const wantNearShake = sdx * sdx + sdy * sdy <= sr2;
        if (wantNearShake !== nearShakeTreeRef.current) {
          const wasNear = nearShakeTreeRef.current;
          nearShakeTreeRef.current = wantNearShake;
          setNearShakeTree(wantNearShake);
          if (wantNearShake && !wasNear) {
            gameImpactLight();
          }
        }
        const cdx = px - COW_INTERACT_CENTER_X;
        const cdy = py - COW_INTERACT_CENTER_Y;
        const cr2 = COW_INTERACT_RADIUS * COW_INTERACT_RADIUS;
        const wantNearCow = cdx * cdx + cdy * cdy <= cr2;
        if (wantNearCow !== nearCowRef.current) {
          const wasNear = nearCowRef.current;
          nearCowRef.current = wantNearCow;
          setNearCow(wantNearCow);
          if (wantNearCow && !wasNear) {
            gameImpactLight();
          }
        }
      } else {
        if (nearTreeRef.current) {
          nearTreeRef.current = false;
          setNearTree(false);
        }
        if (nearShakeTreeRef.current) {
          nearShakeTreeRef.current = false;
          setNearShakeTree(false);
        }
        if (nearCowRef.current) {
          nearCowRef.current = false;
          setNearCow(false);
        }
        if (nearActivityRef.current >= 0) {
          nearActivityRef.current = -1;
          setNearActivity(-1);
        }
      }

      const newDir = getAnimKey(jx, jy);
      if (newDir !== dirRef.current) {
        dirRef.current = newDir;
        setAnimKey(newDir);
        setFrame(0);
      }
    }, MOVE_INTERVAL);

    return () => clearInterval(id);
  }, [cameraAnim, charAnim, isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    const count = FRAME_COUNTS[animKey];
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % count);
    }, 1000 / ANIM_FPS);
    return () => clearInterval(id);
  }, [animKey, isFocused]);

  const animRow = ANIM_KEY_TO_ROW[animKey];
  const frameCount = FRAME_COUNTS[animKey];
  const safeFrame = frame % frameCount;

  const isWalking = animKey !== "idle";
  const shadowScale = isWalking
    ? 1 + 0.12 * Math.sin((safeFrame / Math.max(1, frameCount)) * Math.PI * 2)
    : 1;

  const activitiesHeaderLabel =
    !insideHouse && nearActivity >= 0
      ? ACTIVITY_ACTION_LABELS[nearActivity]
      : "Activities";

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          gameSelection();
          router.replace("/(tabs)/garden");
        }}
        style={[
          styles.homeButton,
          { top: insets.top + 10, left: insets.left + 12 },
          GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
        ]}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel="Back to Garden"
      >
        <IconSymbol name="house.fill" size={22} color="#3a5a20" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          gameSelection();
          setSoundEnabled((prev) => !prev);
        }}
        style={[
          styles.homeButton,
          {
            top: insets.top + 10,
            left: insets.left + 12 + 44 + 8,
            opacity: soundEnabled ? 1 : 0.38,
          },
          GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
        ]}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={soundEnabled ? "Sound on" : "Sound off"}
        accessibilityState={{ selected: soundEnabled }}
      >
        <IconSymbol
          name={soundEnabled ? "speaker.wave.2.fill" : "speaker.slash.fill"}
          size={22}
          color="#3a5a20"
        />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.world,
          { transform: cameraAnim.getTranslateTransform() },
        ]}
      >
        {/* Background */}
        <ExpoImage
          source={BG}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        {/* Island */}
        <ExpoImage
          source={ISLAND}
          style={{
            position: "absolute",
            left: ISLAND_LEFT,
            top: ISLAND_TOP,
            width: ISLAND_W,
            height: ISLAND_H,
          }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />

        {/* Big tree — left of the house */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: BIG_TREE_WORLD_X - BIG_TREE_DISPLAY_W / 2,
            top: BIG_TREE_WORLD_Y - BIG_TREE_DISPLAY_H,
            width: BIG_TREE_DISPLAY_W,
            height: BIG_TREE_DISPLAY_H,
            zIndex: charBehindBigTree && !insideHouse ? 26 : 0,
            elevation:
              Platform.OS === "android" && charBehindBigTree && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={BIG_TREE}
            style={{
              width: BIG_TREE_DISPLAY_W,
              height: BIG_TREE_DISPLAY_H,
            }}
            resizeMode="contain"
          />
        </View>

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: WELL_LEFT,
            top: WELL_TOP,
            width: WELL_DISPLAY_W,
            height: WELL_DISPLAY_H,
            zIndex: charBehindWell && !insideHouse ? 26 : 1,
            elevation:
              Platform.OS === "android" && charBehindWell && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={WELL}
            style={{
              width: WELL_DISPLAY_W,
              height: WELL_DISPLAY_H,
            }}
            resizeMode="contain"
          />
        </View>

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: PLANT_LEFT,
            top: PLANT_TOP,
            width: PLANT_DISPLAY_W,
            height: PLANT_DISPLAY_H,
            zIndex: charBehindPlant && !insideHouse ? 26 : 2,
            elevation:
              Platform.OS === "android" && charBehindPlant && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={PLANT}
            style={{
              width: PLANT_DISPLAY_W,
              height: PLANT_DISPLAY_H,
            }}
            resizeMode="contain"
          />
        </View>

        {/* East grass: activities kiosk (former cow spot); shake tree + chicken to the right */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: ACTIVITIES_HEADING_LEFT,
            top: ACTIVITIES_HEADING_TOP,
            width: ACTIVITIES_HEADING_W,
            height: ACTIVITIES_HEADING_H,
            overflow: "visible",
            zIndex: charBehindActivities && !insideHouse ? 26 : 10,
            elevation:
              Platform.OS === "android" && charBehindActivities && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Animated.View
            style={{
              width: ACTIVITIES_HEADING_W,
              height: ACTIVITIES_HEADING_H,
              transform: [
                {
                  translateY: activitiesHeadingFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -ACTIVITIES_HEADING_FLOAT_PX],
                  }),
                },
              ],
            }}
          >
            <Image
              source={ACTIVITIES_HEADING}
              style={{
                width: ACTIVITIES_HEADING_W,
                height: ACTIVITIES_HEADING_H,
              }}
              resizeMode="contain"
            />
            <View style={styles.activitiesHeadingTextWrap} pointerEvents="none">
              <Text
                accessibilityRole="header"
                accessibilityLabel={activitiesHeaderLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={[
                  styles.activitiesHeadingText,
                  {
                    fontSize: Math.min(
                      18,
                      Math.max(11, Math.round(ACTIVITIES_HEADING_H * 0.42)),
                    ),
                  },
                ]}
              >
                {activitiesHeaderLabel}
              </Text>
            </View>
          </Animated.View>
        </View>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: ACTIVITIES_BREATHING_LEFT,
            top: ACTIVITIES_ICONS_TOP,
            width: ACTIVITIES_ICON_W,
            height: ACTIVITIES_ICON_H,
            zIndex: charBehindActivities && !insideHouse ? 26 : 10,
            elevation:
              Platform.OS === "android" && charBehindActivities && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={ACTIVITIES_BREATHING}
            style={{
              width: ACTIVITIES_ICON_W,
              height: ACTIVITIES_ICON_H,
            }}
            resizeMode="contain"
          />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: ACTIVITIES_PUZZLES_LEFT,
            top: ACTIVITIES_ICONS_TOP,
            width: ACTIVITIES_ICON_W,
            height: ACTIVITIES_ICON_H,
            zIndex: charBehindActivities && !insideHouse ? 26 : 10,
            elevation:
              Platform.OS === "android" && charBehindActivities && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={ACTIVITIES_PUZZLES}
            style={{
              width: ACTIVITIES_ICON_W,
              height: ACTIVITIES_ICON_H,
            }}
            resizeMode="contain"
          />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: ACTIVITIES_GRATITUDE_LEFT,
            top: ACTIVITIES_ICONS_TOP,
            width: ACTIVITIES_ICON_W,
            height: ACTIVITIES_ICON_H,
            zIndex: charBehindActivities && !insideHouse ? 26 : 10,
            elevation:
              Platform.OS === "android" && charBehindActivities && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={ACTIVITIES_GRATITUDE}
            style={{
              width: ACTIVITIES_ICON_W,
              height: ACTIVITIES_ICON_H,
            }}
            resizeMode="contain"
          />
        </View>

        {/* Hills-adjacent: cow (layout on hills art); right: shake tree + chicken */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: SHAKE_TREE_WORLD_X - SHAKE_TREE_DISPLAY_W / 2,
            top: SHAKE_TREE_WORLD_Y - SHAKE_TREE_DISPLAY_H,
            width: SHAKE_TREE_DISPLAY_W,
            height: SHAKE_TREE_DISPLAY_H,
            overflow: "hidden",
            zIndex: charBehindShakeTree && !insideHouse ? 26 : 11,
            elevation:
              Platform.OS === "android" && charBehindShakeTree && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={TREE_SHAKE_FRAMES[shakeTreeFrameIndex]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: SHAKE_TREE_DISPLAY_W,
              height: SHAKE_TREE_DISPLAY_H,
            }}
            resizeMode="cover"
          />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: COW_WORLD_X - COW_DISPLAY_W / 2,
            top: COW_WORLD_Y - COW_DISPLAY_H,
            width: COW_DISPLAY_W,
            height: COW_DISPLAY_H,
            overflow: "hidden",
            zIndex: charBehindCow && !insideHouse ? 26 : 12,
            elevation:
              Platform.OS === "android" && charBehindCow && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={
              cowPetPlaying
                ? COW_HEART_FRAMES[cowHeartFrameIndex]
                : COW_EATING_FRAMES[cowFrameIndex]
            }
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: COW_DISPLAY_W,
              height: COW_DISPLAY_H,
            }}
            resizeMode="contain"
          />
        </View>

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: CHICKEN_WORLD_X - CHICKEN_DISPLAY_W / 2,
            top: CHICKEN_WORLD_Y - CHICKEN_DISPLAY_H,
            width: CHICKEN_DISPLAY_W,
            height: CHICKEN_DISPLAY_H,
            overflow: "hidden",
            zIndex: charBehindChicken && !insideHouse ? 26 : 13,
            elevation:
              Platform.OS === "android" && charBehindChicken && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={
              chickenPeckPlaying
                ? CHICKEN_PECK_FRAMES[chickenPeckFrameIndex]
                : CHICKEN_IDLE_FRAMES[chickenIdleFrameIndex]
            }
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: CHICKEN_DISPLAY_W,
              height: CHICKEN_DISPLAY_H,
            }}
            resizeMode="contain"
          />
        </View>

        {/* Interactive tree (falls when character walks into trigger radius) */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: TREE_WORLD_X - TREE_DISPLAY_W / 2,
            top: TREE_WORLD_Y - TREE_DISPLAY_H,
            width: TREE_DISPLAY_W,
            height: TREE_DISPLAY_H,
            alignItems: "center",
            justifyContent: "flex-end",
            zIndex: charBehindTree && !insideHouse ? 26 : 12,
            elevation:
              Platform.OS === "android" && charBehindTree && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={TREE_FALL_FRAMES[treeFallFrameIndex]}
            style={{
              width: TREE_DISPLAY_W,
              height: TREE_DISPLAY_H,
            }}
            resizeMode="contain"
          />
        </View>

        {/* Gardens */}
        {GARDEN_POSITIONS.map((pos, i) => {
          const gLeft = ISLAND_LEFT + pos.x * ISLAND_W - GW / 2;
          const gTop = ISLAND_TOP + pos.y * ISLAND_H - GH / 2;
          return (
            <View
              key={i}
              style={{
                position: "absolute",
                left: gLeft,
                top: gTop,
                width: GW,
                height: GH,
              }}
            >
              {/* 1. Floor */}
              <Image
                source={GARDEN_FLOOR}
                style={{
                  position: "absolute",
                  left: ((G_CONTAINER_W - G_FLOOR.w) / 2 / G_CONTAINER_W) * GW,
                  top: ((G_CONTAINER_H - G_FLOOR.h) / 2 / G_CONTAINER_H) * GH,
                  width: (G_FLOOR.w / G_CONTAINER_W) * GW,
                  height: (G_FLOOR.h / G_CONTAINER_H) * GH,
                }}
                resizeMode="stretch"
              />
              {/* 2. Back fence */}
              <Image
                source={GARDEN_BACK}
                style={{
                  position: "absolute",
                  left: ((G_CONTAINER_W - G_BACK.w) / 2 / G_CONTAINER_W) * GW,
                  top: 0,
                  width: (G_BACK.w / G_CONTAINER_W) * GW,
                  height: (G_BACK.h / G_CONTAINER_H) * GH,
                }}
                resizeMode="stretch"
              />
              {/* 3. Sides */}
              <Image
                source={GARDEN_SIDES}
                style={{
                  position: "absolute",
                  left: ((G_CONTAINER_W - G_SIDES.w) / 2 / G_CONTAINER_W) * GW,
                  top: 0,
                  width: (G_SIDES.w / G_CONTAINER_W) * GW,
                  height: (G_SIDES.h / G_CONTAINER_H) * GH,
                }}
                resizeMode="stretch"
              />
              {/* Plants: each plot shows that week-of-month's completions; future weeks empty; current week oval highlights "now" */}
              {i <= currentWeekPlot &&
                habits.slice(0, GARDEN_MAX_PLANTS).map((habit, habitIndex) => {
                  const slot = backupGardenLayout.slotCenters[habitIndex];
                  if (!slot) return null;
                  const weekKey = makeWeekKeyForPlot(new Date(), i);
                  const plantIndex = getPlantIndexForHabitSlot(
                    habitIndex,
                    weekKey,
                  );
                  const weekRange = getWeekOfMonthDateRange(i);
                  const count = getWeekCompletionCount(
                    habit.id,
                    completionDates,
                    weekRange.start,
                    weekRange.end,
                  );
                  const frame = Math.min(count, FRAMES_PER_PLANT - 1);
                  const source = getPlantSprite(plantIndex, frame);
                  const ps = backupGardenLayout.plantSize;
                  return (
                    <Image
                      key={`${i}-${habit.id}`}
                      source={source}
                      style={{
                        position: "absolute",
                        left: slot.x - ps / 2,
                        top: slot.y - ps / 2,
                        width: ps,
                        height: ps,
                        zIndex: 2,
                      }}
                      resizeMode="contain"
                    />
                  );
                })}
              {i === currentWeekPlot && !insideHouse ? (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    ...gardenActiveWeekOvalBox(GW, GH),
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    zIndex: 12,
                  }}
                />
              ) : null}
              {BACKUP_GARDEN_GRID_DEBUG &&
                Array.from(
                  {
                    length: backupGardenLayout.cols * backupGardenLayout.rows,
                  },
                  (_, idx) => {
                    const col = idx % backupGardenLayout.cols;
                    const row = Math.floor(idx / backupGardenLayout.cols);
                    const m = backupGardenLayout.cellMetrics;
                    return (
                      <View
                        key={`gdbg-${i}-${idx}`}
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          left: m.originLeft + col * m.cellW,
                          top: m.originTop + row * m.cellH,
                          width: m.cellW,
                          height: m.cellH,
                          borderWidth: StyleSheet.hairlineWidth,
                          borderColor: "rgba(0, 160, 0, 0.45)",
                          opacity: 0.35,
                          zIndex: 5,
                        }}
                      />
                    );
                  },
                )}
              {/* 4. Front fence — must draw above plants (Android needs elevation + wrapper for z-order). */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: ((G_CONTAINER_W - G_FRONT.w) / 2 / G_CONTAINER_W) * GW,
                  top: GH - (G_FRONT.h / G_CONTAINER_H) * GH,
                  width: (G_FRONT.w / G_CONTAINER_W) * GW,
                  height: (G_FRONT.h / G_CONTAINER_H) * GH,
                  zIndex: 20,
                  elevation: Platform.OS === "android" ? 16 : 0,
                }}
              >
                <Image
                  source={GARDEN_FRONTS[i]}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="stretch"
                />
              </View>
            </View>
          );
        })}

        {/* Walkway from door (under house frame; hidden when inside) */}
        {!insideHouse && (
          <ExpoImage
            source={WALKWAY}
            style={{
              position: "absolute",
              left: WALKWAY_LEFT,
              top: WALKWAY_TOP,
              width: WALKWAY_DISPLAY_W,
              height: WALKWAY_DISPLAY_H,
              zIndex: 0,
            }}
            contentFit="fill"
            cachePolicy="memory-disk"
          />
        )}

        {/* House floor (behind character when inside) */}
        <ExpoImage
          source={HOUSE_FLOOR}
          style={{
            position: "absolute",
            left: HOUSE_LEFT + INTERIOR_X,
            top: HOUSE_TOP + INTERIOR_Y,
            width: INTERIOR_W,
            height: INTERIOR_H,
            zIndex: 1,
          }}
          contentFit="fill"
          cachePolicy="memory-disk"
        />

        {/* House frame only; furniture drawn above frame (z16) when inside */}
        <View
          style={{
            position: "absolute",
            left: HOUSE_LEFT,
            top: HOUSE_TOP,
            width: HOUSE_W,
            height: HOUSE_H,
            zIndex: insideHouse ? 15 : 1,
            elevation: insideHouse ? 15 : 1,
          }}
        >
          <Image
            source={HOUSE_FRAME}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: HOUSE_W,
              height: HOUSE_H,
            }}
            resizeMode="stretch"
          />
        </View>

        {!insideHouse && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: HOUSE_ROOFTOP_LEFT,
              top: HOUSE_ROOFTOP_TOP,
              width: HOUSE_ROOFTOP_W,
              height: HOUSE_ROOFTOP_H,
              zIndex: 2,
              elevation: Platform.OS === "android" ? 2 : 0,
            }}
          >
            <Image
              source={HOUSE_ROOFTOP}
              style={{ width: "100%", height: "100%" }}
              resizeMode="stretch"
            />
          </View>
        )}

        {/* Interior furniture — z16 when inside (above frame 15, above char 14); single-frame tradeoff */}
        <Image
          source={HOUSE_IMAGE}
          style={{
            position: "absolute",
            left: HOUSE_LEFT + HIMG_X,
            top: HOUSE_TOP + HIMG_Y,
            width: HIMG_W,
            height: HIMG_H,
            ...(insideHouse && {
              zIndex: 16,
              elevation: Platform.OS === "android" ? 16 : 0,
            }),
          }}
          resizeMode="stretch"
        />
        <Image
          source={HOUSE_DRAWER}
          style={{
            position: "absolute",
            left: HOUSE_LEFT + HDRAWER_X,
            top: HOUSE_TOP + HDRAWER_Y,
            width: HDRAWER_W,
            height: HDRAWER_H,
            ...(insideHouse && {
              zIndex: 16,
              elevation: Platform.OS === "android" ? 16 : 0,
            }),
          }}
          resizeMode="stretch"
        />
        <Image
          source={HOUSE_BED}
          style={{
            position: "absolute",
            left: HOUSE_LEFT + HBED_X,
            top: HOUSE_TOP + HBED_Y,
            width: HBED_W,
            height: HBED_H,
            ...(insideHouse && {
              zIndex: 16,
              elevation: Platform.OS === "android" ? 16 : 0,
            }),
          }}
          resizeMode="stretch"
        />
        <Image
          source={HOUSE_DESK}
          style={{
            position: "absolute",
            left: HOUSE_LEFT + HDESK_X,
            top: HOUSE_TOP + HDESK_Y,
            width: HDESK_W,
            height: HDESK_H,
            ...(insideHouse && {
              zIndex: 16,
              elevation: Platform.OS === "android" ? 16 : 0,
            }),
          }}
          resizeMode="stretch"
        />

        {/* Hill cliff bottoms (behind hills) */}
        <ExpoImage
          source={HILLS_BTM1}
          style={{
            position: "absolute",
            left: HBTM1_LEFT,
            top: HBTM1_TOP,
            width: HBTM1_W,
            height: HBTM1_H,
          }}
          contentFit="fill"
          cachePolicy="memory-disk"
        />
        <ExpoImage
          source={HILLS_BTM2}
          style={{
            position: "absolute",
            left: HBTM2_LEFT,
            top: HBTM2_TOP,
            width: HBTM2_W,
            height: HBTM2_H,
          }}
          contentFit="fill"
          cachePolicy="memory-disk"
        />

        {/* Hills */}
        <ExpoImage
          source={HILLS}
          style={{
            position: "absolute",
            left: HILLS_LEFT,
            top: HILLS_TOP,
            width: HILLS_W,
            height: HILLS_H,
          }}
          contentFit="fill"
          cachePolicy="memory-disk"
        />

        <Image
          source={BUSH_2}
          style={{
            position: "absolute",
            left: BUSH_2_LEFT,
            top: BUSH_2_TOP,
            width: BUSH_2_W,
            height: BUSH_2_H,
            zIndex: 2,
          }}
          resizeMode="contain"
        />

        <Image
          source={ROCK}
          style={{
            position: "absolute",
            left: ROCK_LEFT,
            top: ROCK_TOP,
            width: ROCK_W,
            height: ROCK_H,
            zIndex: 2,
          }}
          resizeMode="contain"
        />

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: TALL_BUSH_LEFT,
            top: TALL_BUSH_TOP,
            width: TALL_BUSH_DISPLAY_W,
            height: TALL_BUSH_DISPLAY_H,
            zIndex: charBehindTallBush && !insideHouse ? 26 : 2,
            elevation:
              Platform.OS === "android" && charBehindTallBush && !insideHouse
                ? 26
                : 0,
          }}
        >
          <Image
            source={TALL_BUSH}
            style={{
              width: TALL_BUSH_DISPLAY_W,
              height: TALL_BUSH_DISPLAY_H,
            }}
            resizeMode="contain"
          />
        </View>

        {/* Entrance arrow */}
        <Animated.View
          style={{
            position: "absolute",
            left: ARROW_X - ARROW_SIZE / 2,
            top: ARROW_Y,
            width: ARROW_SIZE,
            height: ARROW_SIZE,
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.8,
            transform: [
              {
                translateY: arrowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -ARROW_SIZE * 0.4],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: ARROW_SIZE * 0.4,
              borderRightWidth: ARROW_SIZE * 0.4,
              borderBottomWidth: ARROW_SIZE * 0.6,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: "rgba(255,255,255,0.8)",
            }}
          />
        </Animated.View>

        {/* Walk area overlays */}
        <ExpoImage
          source={WALK_AREA}
          style={{
            position: "absolute",
            left: ISLAND_LEFT,
            top: ISLAND_TOP,
            width: ISLAND_W,
            height: ISLAND_H,
            opacity: GAME_INTERACTION_DEBUG ? 1 : 0,
          }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />

        {/* Character — inside: z14 when north of props (behind), z17 when south (in front); frame z15, props z16 */}
        <Animated.View
          style={[
            styles.character,
            {
              zIndex: insideHouse ? (charBehindIndoorFurniture ? 14 : 17) : 25,
              elevation:
                Platform.OS === "android"
                  ? insideHouse
                    ? charBehindIndoorFurniture
                      ? 14
                      : 17
                    : 25
                  : 0,
              transform: [
                ...charAnim.getTranslateTransform(),
                { scale: insideHouse ? CHAR_SCALE_INDOOR : CHAR_SCALE },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.shadow,
              {
                transform: [{ scaleY: 0.28 }, { scale: shadowScale }],
              },
            ]}
          />
          {spriteError ? (
            <View style={[styles.sprite, styles.spriteFallback]} />
          ) : (
            <View style={styles.atlasCrop}>
              <Image
                source={CHARACTER_ATLAS}
                style={[
                  styles.atlasImage,
                  {
                    width: ATLAS_W,
                    height: ATLAS_H,
                    left: -safeFrame * ATLAS_CELL,
                    top: -animRow * ATLAS_CELL,
                  },
                ]}
                resizeMode="stretch"
                onError={() => setSpriteError(true)}
              />
            </View>
          )}
        </Animated.View>

        {!insideHouse &&
          ACTIVITIES_TRIGGERS.map((g, i) => {
            const side = ACTIVITY_TRIGGER_HALF * 2;
            return (
              <View
                key={`activity-trigger-zone-${i}`}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: g.x - ACTIVITY_TRIGGER_HALF,
                  top: g.y - ACTIVITY_TRIGGER_HALF,
                  width: side,
                  height: side,
                  borderRadius: 2,
                  borderWidth: 2,
                  borderColor: ACTIVITY_TRIGGER_ZONE_STROKE,
                  backgroundColor: ACTIVITY_TRIGGER_ZONE_FILL,
                  zIndex: 12,
                  elevation: Platform.OS === "android" ? 12 : 0,
                }}
              />
            );
          })}

        {GAME_INTERACTION_DEBUG ? (
          <>
            {!insideHouse ? (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: WALKWAY_LEFT - WALKWAY_PAD_X,
                  top: WALKWAY_TOP,
                  width: WALKWAY_DISPLAY_W + 2 * WALKWAY_PAD_X,
                  height: WALKWAY_DISPLAY_H,
                  borderWidth: 2,
                  borderColor: "#1565C0",
                  backgroundColor: "rgba(21, 101, 192, 0.22)",
                  zIndex: 26,
                  elevation: 26,
                }}
              />
            ) : (
              <>
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: HOUSE_EXIT_X - HOUSE_EXIT_RX,
                    top: HOUSE_EXIT_Y - HOUSE_EXIT_RY,
                    width: HOUSE_EXIT_RX * 2,
                    height: HOUSE_EXIT_RY * 2,
                    borderRadius: HOUSE_EXIT_RY,
                    borderWidth: 2,
                    borderColor: "#6A1B9A",
                    backgroundColor: "rgba(106, 27, 154, 0.22)",
                    zIndex: 26,
                    elevation: 26,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: HOUSE_DESK_INTERACT_CX - HOUSE_FURNITURE_INTERACT_RX,
                    top: HOUSE_DESK_INTERACT_CY - HOUSE_FURNITURE_INTERACT_RY,
                    width: HOUSE_FURNITURE_INTERACT_RX * 2,
                    height: HOUSE_FURNITURE_INTERACT_RY * 2,
                    borderRadius: HOUSE_FURNITURE_INTERACT_RY,
                    borderWidth: 2,
                    borderColor: "#00695C",
                    backgroundColor: "rgba(0, 105, 92, 0.2)",
                    zIndex: 26,
                    elevation: 26,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: HOUSE_BED_INTERACT_CX - HOUSE_FURNITURE_INTERACT_RX,
                    top: HOUSE_BED_INTERACT_CY - HOUSE_FURNITURE_INTERACT_RY,
                    width: HOUSE_FURNITURE_INTERACT_RX * 2,
                    height: HOUSE_FURNITURE_INTERACT_RY * 2,
                    borderRadius: HOUSE_FURNITURE_INTERACT_RY,
                    borderWidth: 2,
                    borderColor: "#C62828",
                    backgroundColor: "rgba(198, 40, 40, 0.18)",
                    zIndex: 26,
                    elevation: 26,
                  }}
                />
              </>
            )}
            {!insideHouse &&
              GARDEN_TRIGGERS.map((g, i) => (
                <View
                  key={`dbg-garden-${i}`}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: g.x - GARDEN_TRIGGER_RX,
                    top: g.y - GARDEN_TRIGGER_RY,
                    width: GARDEN_TRIGGER_RX * 2,
                    height: GARDEN_TRIGGER_RY * 2,
                    borderRadius: GARDEN_TRIGGER_RY,
                    borderWidth: 2,
                    borderColor: "#2E7D32",
                    backgroundColor: "rgba(46, 125, 50, 0.2)",
                    zIndex: 26,
                    elevation: 26,
                  }}
                />
              ))}
            {!insideHouse ? (
              <>
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: TREE_INTERACT_CENTER_X - TREE_INTERACT_RADIUS,
                    top: TREE_INTERACT_CENTER_Y - TREE_INTERACT_RADIUS,
                    width: TREE_INTERACT_RADIUS * 2,
                    height: TREE_INTERACT_RADIUS * 2,
                    borderRadius: TREE_INTERACT_RADIUS,
                    borderWidth: 2,
                    borderColor: "#E65100",
                    backgroundColor: "rgba(230, 81, 0, 0.2)",
                    zIndex: 26,
                    elevation: 26,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left:
                      SHAKE_TREE_INTERACT_CENTER_X - SHAKE_TREE_INTERACT_RADIUS,
                    top:
                      SHAKE_TREE_INTERACT_CENTER_Y - SHAKE_TREE_INTERACT_RADIUS,
                    width: SHAKE_TREE_INTERACT_RADIUS * 2,
                    height: SHAKE_TREE_INTERACT_RADIUS * 2,
                    borderRadius: SHAKE_TREE_INTERACT_RADIUS,
                    borderWidth: 2,
                    borderColor: "#5D4037",
                    backgroundColor: "rgba(93, 64, 55, 0.2)",
                    zIndex: 26,
                    elevation: 26,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: COW_INTERACT_CENTER_X - COW_INTERACT_RADIUS,
                    top: COW_INTERACT_CENTER_Y - COW_INTERACT_RADIUS,
                    width: COW_INTERACT_RADIUS * 2,
                    height: COW_INTERACT_RADIUS * 2,
                    borderRadius: COW_INTERACT_RADIUS,
                    borderWidth: 2,
                    borderColor: "#C2185B",
                    backgroundColor: "rgba(194, 24, 91, 0.2)",
                    zIndex: 26,
                    elevation: 26,
                  }}
                />
              </>
            ) : null}
          </>
        ) : null}

        {insideHouse && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: HOUSE_FRONT_LEFT,
              top: HOUSE_FRONT_TOP,
              width: HOUSE_FRONT_W,
              height: HOUSE_FRONT_H,
              zIndex: 18,
              elevation: Platform.OS === "android" ? 18 : 0,
            }}
          >
            <Image
              source={HOUSE_FRONT}
              style={{ width: "100%", height: "100%" }}
              resizeMode="stretch"
            />
          </View>
        )}
      </Animated.View>

      {nearDoor && (
        <TouchableOpacity
          onPress={() => {
            (insideHouse ? handleExitHouse : handleEnterHouse)();
          }}
          style={[
            styles.doorButton,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.doorButtonText}>
            {insideHouse ? "Exit" : "Enter"}
          </Text>
        </TouchableOpacity>
      )}

      {nearHouseDesk && insideHouse && (
        <TouchableOpacity
          onPress={() => {
            gameSelection();
            router.push("/house-desk" as Href);
          }}
          style={[
            styles.activityButton,
            nearDoor && styles.activityButtonOffset,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.activityButtonText}>Pomodoro</Text>
        </TouchableOpacity>
      )}

      {nearHouseBed && insideHouse && (
        <TouchableOpacity
          onPress={() => {
            gameSelection();
            router.push("/house-bed" as Href);
          }}
          style={[
            styles.activityButton,
            (nearDoor || nearHouseDesk) && styles.activityButtonOffset,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.activityButtonText}>Rest</Text>
        </TouchableOpacity>
      )}

      {nearGarden >= 0 && !insideHouse && (
        <TouchableOpacity
          onPress={() => {
            setGardenPopupIndex(nearGarden);
          }}
          style={[
            styles.gardenButton,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.gardenButtonText}>View Garden</Text>
        </TouchableOpacity>
      )}

      {nearActivity >= 0 && !insideHouse && (
        <TouchableOpacity
          onPress={() => {
            gameSelection();
            router.push(ACTIVITY_ROUTES[nearActivity]);
          }}
          style={[
            styles.activityButton,
            nearGarden >= 0 && styles.activityButtonOffset,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.activityButtonText}>
            {ACTIVITY_ACTION_LABELS[nearActivity]}
          </Text>
        </TouchableOpacity>
      )}

      {nearTree && !insideHouse && (
        <TouchableOpacity
          onPress={handleChopTree}
          style={[
            styles.chopTreeButton,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.chopTreeButtonText}>Chop tree</Text>
        </TouchableOpacity>
      )}

      {nearShakeTree && !insideHouse && (
        <TouchableOpacity
          onPress={handleShakeTree}
          style={[
            styles.shakeTreeButton,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.shakeTreeButtonText}>Shake tree</Text>
        </TouchableOpacity>
      )}

      {nearCow && !insideHouse && (
        <TouchableOpacity
          onPress={handlePetCow}
          style={[
            styles.petCowButton,
            cowPetPlaying && styles.petCowButtonDisabled,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
          disabled={cowPetPlaying}
        >
          <Text style={styles.petCowButtonText}>Pet cow</Text>
        </TouchableOpacity>
      )}

      <GardenDetailsModal
        visible={gardenPopupIndex >= 0}
        plotIndex={gardenPopupIndex}
        habits={habits}
        completionDates={completionDates}
        currentWeekPlot={currentWeekPlot}
        onClose={() => {
          gameSelection();
          setGardenPopupIndex(-1);
        }}
      />

      <Joystick onMove={handleMove} onEnd={handleEnd} />
    </View>
  );
}

// ─── Garden Details Modal ─────────────────────────────────────────────────────

const GARDEN_NAMES = [
  "Sunrise Garden",
  "Moonlight Garden",
  "River Garden",
  "Twilight Garden",
];

function getWeekRangeLabel(weekIndex: number): string {
  const { startDate, endDate } = getWeekOfMonthDateRange(weekIndex);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Week of ${fmt(startDate)}\u2013${fmt(endDate)}`;
}

function getGrowthLabel(completionCount: number): string {
  if (completionCount >= 5) return "Blooming";
  if (completionCount >= 3) return "Growing";
  if (completionCount >= 1) return "Sprouting";
  return "Seed";
}

function GardenDetailsModal({
  visible,
  plotIndex,
  habits,
  completionDates,
  currentWeekPlot,
  onClose,
}: {
  visible: boolean;
  plotIndex: number;
  habits: Habit[];
  completionDates: CompletionDatesByHabit;
  currentWeekPlot: number;
  onClose: () => void;
}) {
  const safeIndex = Math.max(plotIndex, 0);
  const isFuture = safeIndex > currentWeekPlot;
  const weekKey = makeWeekKeyForPlot(new Date(), safeIndex);
  const weekRange = getWeekOfMonthDateRange(safeIndex);
  const gardenHabits = habits.slice(0, GARDEN_MAX_PLANTS);

  const habitCompletions = gardenHabits.map((h) =>
    getWeekCompletionCount(
      h.id,
      completionDates,
      weekRange.start,
      weekRange.end,
    ),
  );
  const totalCompletions = habitCompletions.reduce((a, b) => a + b, 0);
  const maxPossible = gardenHabits.length * 7;
  const pct =
    maxPossible > 0 ? Math.round((totalCompletions / maxPossible) * 100) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <View>
              <Text style={modalStyles.title}>
                {GARDEN_NAMES[plotIndex] ?? "Garden"}
              </Text>
              <Text style={modalStyles.subtitle}>
                {getWeekRangeLabel(safeIndex)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={modalStyles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {isFuture ? (
            <View style={modalStyles.emptyState}>
              <Text style={modalStyles.emptyText}>
                This week hasn't started yet.
              </Text>
              <Text style={modalStyles.emptySubtext}>
                Check back when the week begins to see your garden grow.
              </Text>
            </View>
          ) : (
            <>
              <View style={modalStyles.statsRow}>
                <View style={modalStyles.statBadge}>
                  <Text style={modalStyles.statValue}>{pct}%</Text>
                  <Text style={modalStyles.statLabel}>Complete</Text>
                </View>
                <View style={modalStyles.statBadge}>
                  <Text style={modalStyles.statValue}>
                    {totalCompletions}/{maxPossible}
                  </Text>
                  <Text style={modalStyles.statLabel}>This Week</Text>
                </View>
              </View>

              <Text style={modalStyles.sectionTitle}>This Week's Plants</Text>

              <ScrollView
                style={modalStyles.plantList}
                contentContainerStyle={modalStyles.plantGrid}
              >
                {gardenHabits.map((habit, idx) => {
                  const plantIndex = getPlantIndexForHabitSlot(idx, weekKey);
                  const count = habitCompletions[idx];
                  const frame = Math.min(count, FRAMES_PER_PLANT - 1);
                  const sprite = getPlantSprite(plantIndex, frame);
                  const growthLabel = getGrowthLabel(count);
                  return (
                    <View key={habit.id} style={modalStyles.plantCard}>
                      <Image
                        source={sprite}
                        style={modalStyles.plantImage}
                        resizeMode="contain"
                      />
                      <Text style={modalStyles.plantName} numberOfLines={2}>
                        {habit.name}
                      </Text>
                      <Text
                        style={modalStyles.plantVarietyName}
                        numberOfLines={2}
                      >
                        {getPlantDisplayName(plantIndex)}
                      </Text>
                      <Text style={modalStyles.plantStatus}>{growthLabel}</Text>
                      <Text style={modalStyles.plantStreak}>
                        {count}/7 days
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}

          <TouchableOpacity
            onPress={onClose}
            style={modalStyles.closeButton}
            activeOpacity={0.8}
          >
            <Text style={modalStyles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 22,
    color: "#aaa",
    fontWeight: "600",
    paddingLeft: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statBadge: {
    flex: 1,
    backgroundColor: "#f4f7f0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3a5a20",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  plantList: {
    maxHeight: 300,
  },
  plantGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  plantCard: {
    width: "47%",
    backgroundColor: "#f9faf6",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8ecdf",
  },
  plantImage: {
    width: 56,
    height: 56,
    marginBottom: 6,
  },
  plantName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2a2a2a",
    textAlign: "center",
  },
  plantVarietyName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#5a7d4a",
    textAlign: "center",
    marginTop: 2,
  },
  plantStatus: {
    fontSize: 12,
    color: "#6a9a3a",
    marginTop: 2,
  },
  plantStreak: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#555",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: "#3a5a20",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C5E8A0",
    overflow: "hidden",
  },
  activitiesHeadingTextWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  activitiesHeadingText: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  /** Visible when `GAME_INTERACTION_DEBUG` — screen-space action button bounds. */
  interactionDebugUiOutline: {
    borderWidth: 2,
    borderColor: "#F50057",
  },
  homeButton: {
    position: "absolute",
    zIndex: 30,
    elevation: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  world: {
    position: "absolute",
    width: WORLD_W,
    height: WORLD_H,
  },
  character: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CHAR_SIZE,
    height: CHAR_SIZE,
    zIndex: 25,
    elevation: 25,
  },
  shadow: {
    position: "absolute",
    bottom: -18,
    left: (CHAR_SIZE - 56) / 2,
    width: 56,
    height: 60,
    borderRadius: 28,
    backgroundColor: "rgba(80,110,40,0.25)",
    transform: [{ scaleY: 0.28 }],
  },
  sprite: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CHAR_SIZE,
    height: CHAR_SIZE,
  },
  atlasCrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CHAR_SIZE,
    height: CHAR_SIZE,
    overflow: "hidden",
  },
  atlasImage: {
    position: "absolute",
  },
  spriteFallback: {
    backgroundColor: "rgba(255,100,100,0.8)",
  },
  doorButton: {
    position: "absolute",
    bottom: 228,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
    elevation: 20,
  },
  doorButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3a5a20",
  },
  gardenButton: {
    position: "absolute",
    bottom: 228,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
    elevation: 20,
  },
  gardenButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3a5a20",
  },
  activityButton: {
    position: "absolute",
    bottom: 228,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
    elevation: 20,
  },
  activityButtonOffset: {
    bottom: 308,
  },
  activityButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3a5a20",
  },
  chopTreeButton: {
    position: "absolute",
    bottom: 293,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 21,
    elevation: 21,
  },
  chopTreeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5a3d20",
  },
  shakeTreeButton: {
    position: "absolute",
    bottom: 228,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 21,
    elevation: 21,
  },
  shakeTreeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3d4a20",
  },
  petCowButton: {
    position: "absolute",
    bottom: 228,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 21,
    elevation: 21,
  },
  petCowButtonDisabled: {
    backgroundColor: "#E8E8E8",
  },
  petCowButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4a3d2a",
  },
});
