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
import { getIslandWorldLayout } from "@/lib/game/islandWorldLayout";
import {
  FRAMES_PER_PLANT,
  getPlantIndexForHabitSlot,
  getPlantSprite,
} from "@/lib/game/plantSprites";
import type { CompletionDatesByHabit } from "@/lib/store/useHabitStore";
import unifiedCollision from "@/lib/game/unifiedCollision.json";
import { useHabitStore } from "@/lib/store";
import type { Habit } from "@/lib/types";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
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
  TREE_INTERACT_RADIUS,
  TREE_DEPTH_Y,
  TREE_TRUNK_HALF_W,
  TREE_TRUNK_TOP,
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
  ARROW_X,
  ARROW_Y,
  ARROW_SIZE,
  HOUSE_FRAME,
  HOUSE_FLOOR,
  HOUSE_BED,
  HOUSE_DRAWER,
  HOUSE_IMAGE,
  HOUSE_DESK,
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
  HOUSE_DOOR_X,
  HOUSE_DOOR_Y,
  HOUSE_DOOR_RADIUS,
  HOUSE_EXIT_X,
  HOUSE_EXIT_Y,
  HOUSE_EXIT_RADIUS,
  HOUSE_ENTER_POS,
  HOUSE_INTERIOR_RECT,
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

/** Tree AABB intersects the screen after applying the same camera pan as the character. */
function isTreeVisibleOnScreen(charWorldX: number, charWorldY: number): boolean {
  const cam = getCameraOffset(charWorldX, charWorldY);
  const left = TREE_WORLD_X - TREE_DISPLAY_W / 2 + cam.x;
  const top = TREE_WORLD_Y - TREE_DISPLAY_H + cam.y;
  const right = TREE_WORLD_X + TREE_DISPLAY_W / 2 + cam.x;
  const bottom = TREE_WORLD_Y + cam.y;
  return right > 0 && left < W && bottom > 0 && top < H;
}

const CHAR_SCALE_INDOOR = 0.5;

/** How much of each grid cell the plant sprite fills (see getGardenPlantSize). */
const BACKUP_GARDEN_PLANT_FILL = 1.8;

/** Set true to show semi-transparent grid cells over the soil for layout tuning. */
const BACKUP_GARDEN_GRID_DEBUG = false;

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

const CHARACTER_ATLAS = require("@/assets/game/character-atlas.png");
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

function isWalkable(worldX: number, worldY: number): boolean {
  const feetY = worldY + FEET_OFFSET_Y;
  if (
    isInsideGarden(worldX, feetY) ||
    isInsideGarden(worldX - FEET_HALF_W, feetY) ||
    isInsideGarden(worldX + FEET_HALF_W, feetY)
  )
    return false;
  if (isInsideHouse(worldX, feetY)) return false;
  if (
    isTreeTrunkBlocking(worldX, feetY) ||
    isTreeTrunkBlocking(worldX - FEET_HALF_W, feetY) ||
    isTreeTrunkBlocking(worldX + FEET_HALF_W, feetY)
  )
    return false;
  return (
    isPointWalkable(worldX, feetY) &&
    isPointWalkable(worldX - FEET_HALF_W, feetY) &&
    isPointWalkable(worldX + FEET_HALF_W, feetY)
  );
}

function isWalkableIndoors(worldX: number, worldY: number): boolean {
  const feetY = worldY + FEET_OFFSET_Y;
  const headY = worldY - CHAR_SIZE * CHAR_SCALE_INDOOR * 0.9;
  const r = HOUSE_INTERIOR_RECT;
  return (
    worldX >= r.left && worldX <= r.right && headY >= r.top && feetY <= r.bottom
  );
}

const GARDEN_TRIGGER_RADIUS = GH * 0.35;
const GARDEN_TRIGGERS = GARDEN_POSITIONS.map((pos) => ({
  x: ISLAND_LEFT + pos.x * ISLAND_W,
  y: ISLAND_TOP + pos.y * ISLAND_H + GH / 2 + GARDEN_TRIGGER_RADIUS * 0.6,
}));

function nearGardenIndex(worldX: number, worldY: number): number {
  const r2 = GARDEN_TRIGGER_RADIUS * GARDEN_TRIGGER_RADIUS;
  for (let i = 0; i < GARDEN_TRIGGERS.length; i++) {
    const dx = worldX - GARDEN_TRIGGERS[i].x;
    const dy = worldY - GARDEN_TRIGGERS[i].y;
    if (dx * dx + dy * dy <= r2) return i;
  }
  return -1;
}

function isNearDoor(worldX: number, worldY: number, indoor: boolean): boolean {
  if (indoor) {
    const dx = worldX - HOUSE_EXIT_X;
    const dy = worldY - HOUSE_EXIT_Y;
    return dx * dx + dy * dy <= HOUSE_EXIT_RADIUS * HOUSE_EXIT_RADIUS;
  }
  const dx = worldX - HOUSE_DOOR_X;
  const dy = worldY - HOUSE_DOOR_Y;
  return dx * dx + dy * dy <= HOUSE_DOOR_RADIUS * HOUSE_DOOR_RADIUS;
}

// ─── Game screen ──────────────────────────────────────────────────────────────

export default function GameScreen() {
  const router = useRouter();
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
  const [spriteError, setSpriteError] = useState(false);

  const [insideHouse, setInsideHouse] = useState(false);
  const [nearDoor, setNearDoor] = useState(false);
  const [nearGarden, setNearGarden] = useState(-1);
  const [nearTree, setNearTree] = useState(false);
  const [charBehindTree, setCharBehindTree] = useState(false);
  const [gardenPopupIndex, setGardenPopupIndex] = useState(-1);
  const [treeFallFrameIndex, setTreeFallFrameIndex] = useState(0);
  const [treeFallPlaying, setTreeFallPlaying] = useState(false);
  const treeHasFallenRef = useRef(false);
  const treeFallAnimatingRef = useRef(false);
  const treeWasOnScreenRef = useRef(false);
  const charBehindTreeRef = useRef(false);
  const insideHouseRef = useRef(false);

  const arrowAnim = useRef(new Animated.Value(0)).current;
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
    charAnim.setValue({
      x: START_X - CHAR_SIZE / 2,
      y: START_Y - CHAR_SIZE / 2,
    });
    cameraAnim.setValue(getCameraOffset(START_X, START_Y));
  }, [charAnim, cameraAnim]);

  useFocusEffect(
    useCallback(() => {
      ensureDayReset();
      worldPosRef.current = { x: START_X, y: START_Y };
      charAnim.setValue({
        x: START_X - CHAR_SIZE / 2,
        y: START_Y - CHAR_SIZE / 2,
      });
      cameraAnim.setValue(getCameraOffset(START_X, START_Y));
      dirRef.current = "idle";
      setAnimKey("idle");
      setFrame(0);
      insideHouseRef.current = false;
      setInsideHouse(false);
      setNearDoor(false);
      // Tree chop state is intentionally NOT reset here — useFocusEffect can re-run when
      // callback deps change while focused, which was resetting the tree to frame 0.
    }, [charAnim, cameraAnim, ensureDayReset]),
  );

  const handleChopTree = useCallback(() => {
    if (treeHasFallenRef.current || treeFallAnimatingRef.current) return;
    treeFallAnimatingRef.current = true;
    setTreeFallPlaying(true);
  }, []);

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

  const handleMove = useCallback((delta: JoystickDelta) => {
    joystickRef.current = delta;
  }, []);

  const handleEnd = useCallback(() => {
    joystickRef.current = { x: 0, y: 0 };
  }, []);

  const handleEnterHouse = useCallback(() => {
    insideHouseRef.current = true;
    setInsideHouse(true);
    const pos = HOUSE_ENTER_POS;
    worldPosRef.current = { x: pos.x, y: pos.y };
    charAnim.setValue({ x: pos.x - CHAR_SIZE / 2, y: pos.y - CHAR_SIZE / 2 });
    cameraAnim.setValue(getCameraOffset(pos.x, pos.y));
  }, [charAnim, cameraAnim]);

  const handleExitHouse = useCallback(() => {
    insideHouseRef.current = false;
    setInsideHouse(false);
    const x = HOUSE_DOOR_X;
    const y = HOUSE_DOOR_Y;
    worldPosRef.current = { x, y };
    charAnim.setValue({ x: x - CHAR_SIZE / 2, y: y - CHAR_SIZE / 2 });
    cameraAnim.setValue(getCameraOffset(x, y));
  }, [charAnim, cameraAnim]);

  useEffect(() => {
    const id = setInterval(() => {
      const { x: jx, y: jy } = joystickRef.current;
      const isMoving = Math.abs(jx) > DEADZONE || Math.abs(jy) > DEADZONE;
      const indoor = insideHouseRef.current;
      const canWalk = indoor ? isWalkableIndoors : isWalkable;

      if (isMoving) {
        const { x: curX, y: curY } = worldPosRef.current;
        const wantX = curX + jx * SPEED;
        const wantY = curY + jy * SPEED;

        let finalX = curX;
        let finalY = curY;

        if (canWalk(wantX, wantY)) {
          finalX = wantX;
          finalY = wantY;
        } else if (canWalk(wantX, curY)) {
          finalX = wantX;
        } else if (canWalk(curX, wantY)) {
          finalY = wantY;
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

      const treeOnScreen = isTreeVisibleOnScreen(px, py);
      if (treeWasOnScreenRef.current && !treeOnScreen) {
        treeHasFallenRef.current = false;
        treeFallAnimatingRef.current = false;
        setTreeFallFrameIndex(0);
        setTreeFallPlaying(false);
        setNearTree(false);
      }
      treeWasOnScreenRef.current = treeOnScreen;

      const near = isNearDoor(px, py, indoor);
      setNearDoor(near);
      if (!indoor) {
        setNearGarden(nearGardenIndex(px, py));
        const tdx = px - TREE_WORLD_X;
        const tdy = py - TREE_WORLD_Y;
        const tr2 = TREE_INTERACT_RADIUS * TREE_INTERACT_RADIUS;
        const inTreeZone = tdx * tdx + tdy * tdy <= tr2;
        setNearTree(
          inTreeZone &&
            !treeHasFallenRef.current &&
            !treeFallAnimatingRef.current,
        );
      } else {
        setNearTree(false);
      }

      const newDir = getAnimKey(jx, jy);
      if (newDir !== dirRef.current) {
        dirRef.current = newDir;
        setAnimKey(newDir);
        setFrame(0);
      }
    }, MOVE_INTERVAL);

    return () => clearInterval(id);
  }, [cameraAnim, charAnim]);

  useEffect(() => {
    const count = FRAME_COUNTS[animKey];
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % count);
    }, 1000 / ANIM_FPS);
    return () => clearInterval(id);
  }, [animKey]);

  const animRow = ANIM_KEY_TO_ROW[animKey];
  const frameCount = FRAME_COUNTS[animKey];
  const safeFrame = frame % frameCount;

  const isWalking = animKey !== "idle";
  const shadowScale = isWalking
    ? 1 + 0.12 * Math.sin((safeFrame / Math.max(1, frameCount)) * Math.PI * 2)
    : 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/garden")}
        style={[
          styles.homeButton,
          { top: insets.top + 10, left: insets.left + 12 },
        ]}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Back to Garden"
      >
        <IconSymbol name="house.fill" size={22} color="#3a5a20" />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.world,
          { transform: cameraAnim.getTranslateTransform() },
        ]}
      >
        {/* Background */}
        <Image
          source={BG}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
          }}
          resizeMode="cover"
        />

        {/* Island */}
        <Image
          source={ISLAND}
          style={{
            position: "absolute",
            left: ISLAND_LEFT,
            top: ISLAND_TOP,
            width: ISLAND_W,
            height: ISLAND_H,
          }}
          resizeMode="contain"
        />

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
              {/* Plants: current week uses completion-based frames; past weeks fully grown; future weeks empty */}
              {i <= currentWeekPlot &&
                habits
                  .slice(0, GARDEN_MAX_PLANTS)
                  .map((habit, habitIndex) => {
                    const slot = backupGardenLayout.slotCenters[habitIndex];
                    if (!slot) return null;
                    const weekKey = makeWeekKeyForPlot(new Date(), i);
                    const plantIndex = getPlantIndexForHabitSlot(
                      habitIndex,
                      weekKey,
                    );
                    let frame: number;
                    if (i < currentWeekPlot) {
                      frame = FRAMES_PER_PLANT - 1;
                    } else {
                      const weekRange = getWeekOfMonthDateRange(i);
                      const count = getWeekCompletionCount(
                        habit.id,
                        completionDates,
                        weekRange.start,
                        weekRange.end,
                      );
                      frame = Math.min(count, FRAMES_PER_PLANT - 1);
                    }
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

        {/* House floor (behind character when inside) */}
        <Image
          source={HOUSE_FLOOR}
          style={{
            position: "absolute",
            left: HOUSE_LEFT + INTERIOR_X,
            top: HOUSE_TOP + INTERIOR_Y,
            width: INTERIOR_W,
            height: INTERIOR_H,
            zIndex: 1,
          }}
          resizeMode="stretch"
        />

        {/* House frame + furniture (above character when inside) */}
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
          <Image
            source={HOUSE_IMAGE}
            style={{
              position: "absolute",
              left: HIMG_X,
              top: HIMG_Y,
              width: HIMG_W,
              height: HIMG_H,
            }}
            resizeMode="stretch"
          />
          <Image
            source={HOUSE_DRAWER}
            style={{
              position: "absolute",
              left: HDRAWER_X,
              top: HDRAWER_Y,
              width: HDRAWER_W,
              height: HDRAWER_H,
            }}
            resizeMode="stretch"
          />
          <Image
            source={HOUSE_BED}
            style={{
              position: "absolute",
              left: HBED_X,
              top: HBED_Y,
              width: HBED_W,
              height: HBED_H,
            }}
            resizeMode="stretch"
          />
          <Image
            source={HOUSE_DESK}
            style={{
              position: "absolute",
              left: HDESK_X,
              top: HDESK_Y,
              width: HDESK_W,
              height: HDESK_H,
            }}
            resizeMode="stretch"
          />
        </View>

        {/* House entrance trigger circle */}
        <View
          style={{
            position: "absolute",
            left: HOUSE_DOOR_X - HOUSE_DOOR_RADIUS,
            top: HOUSE_DOOR_Y - HOUSE_DOOR_RADIUS,
            width: HOUSE_DOOR_RADIUS * 2,
            height: HOUSE_DOOR_RADIUS * 2,
            borderRadius: HOUSE_DOOR_RADIUS,
            backgroundColor: "rgba(255,255,255,0.3)",
            opacity: 0,
          }}
        />

        {/* Hill cliff bottoms (behind hills) */}
        <Image
          source={HILLS_BTM1}
          style={{
            position: "absolute",
            left: HBTM1_LEFT,
            top: HBTM1_TOP,
            width: HBTM1_W,
            height: HBTM1_H,
          }}
          resizeMode="stretch"
        />
        <Image
          source={HILLS_BTM2}
          style={{
            position: "absolute",
            left: HBTM2_LEFT,
            top: HBTM2_TOP,
            width: HBTM2_W,
            height: HBTM2_H,
          }}
          resizeMode="stretch"
        />

        {/* Hills */}
        <Image
          source={HILLS}
          style={{
            position: "absolute",
            left: HILLS_LEFT,
            top: HILLS_TOP,
            width: HILLS_W,
            height: HILLS_H,
          }}
          resizeMode="stretch"
        />

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
        <Image
          source={WALK_AREA}
          style={{
            position: "absolute",
            left: ISLAND_LEFT,
            top: ISLAND_TOP,
            width: ISLAND_W,
            height: ISLAND_H,
            opacity: 0,
          }}
          resizeMode="contain"
        />

        {/* Character */}
        <Animated.View
          style={[
            styles.character,
            {
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
      </Animated.View>

      {nearDoor && (
        <TouchableOpacity
          onPress={insideHouse ? handleExitHouse : handleEnterHouse}
          style={styles.doorButton}
          activeOpacity={0.8}
        >
          <Text style={styles.doorButtonText}>
            {insideHouse ? "Exit" : "Enter"}
          </Text>
        </TouchableOpacity>
      )}

      {nearGarden >= 0 && !insideHouse && (
        <TouchableOpacity
          onPress={() => setGardenPopupIndex(nearGarden)}
          style={styles.gardenButton}
          activeOpacity={0.8}
        >
          <Text style={styles.gardenButtonText}>View Garden</Text>
        </TouchableOpacity>
      )}

      {nearTree && !insideHouse && (
        <TouchableOpacity
          onPress={handleChopTree}
          style={styles.chopTreeButton}
          activeOpacity={0.8}
        >
          <Text style={styles.chopTreeButtonText}>Chop tree</Text>
        </TouchableOpacity>
      )}

      <GardenDetailsModal
        visible={gardenPopupIndex >= 0}
        plotIndex={gardenPopupIndex}
        habits={habits}
        completionDates={completionDates}
        currentWeekPlot={currentWeekPlot}
        onClose={() => setGardenPopupIndex(-1)}
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
  const isPast = safeIndex < currentWeekPlot;
  const weekKey = makeWeekKeyForPlot(new Date(), safeIndex);
  const weekRange = getWeekOfMonthDateRange(safeIndex);
  const gardenHabits = habits.slice(0, GARDEN_MAX_PLANTS);

  const habitCompletions = gardenHabits.map((h) =>
    isPast
      ? FRAMES_PER_PLANT - 1
      : getWeekCompletionCount(h.id, completionDates, weekRange.start, weekRange.end),
  );
  const totalCompletions = habitCompletions.reduce((a, b) => a + b, 0);
  const maxPossible = gardenHabits.length * 7;
  const pct = maxPossible > 0 ? Math.round((totalCompletions / maxPossible) * 100) : 0;

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
                      <Text style={modalStyles.plantName} numberOfLines={1}>
                        {habit.name}
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
  homeButton: {
    position: "absolute",
    zIndex: 30,
    elevation: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.92)",
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
    bottom: 180,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
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
    bottom: 180,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
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
  chopTreeButton: {
    position: "absolute",
    bottom: 245,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
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
});
