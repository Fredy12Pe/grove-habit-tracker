import { Joystick, type JoystickDelta } from "@/components/garden/Joystick";
import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getFrameIndexForDay,
  getPlantIndexForHabitSlot,
  getPlantSprite,
  getWeekKey,
} from "@/lib/game/plantSprites";
import { useHabitStore } from "@/lib/store";
import { useFocusEffect } from "@react-navigation/native";
import { Canvas, Group, Path } from "@shopify/react-native-skia";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Screen & world dimensions ────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get("window");

// Background is 2181×3072 — display at 1/3 scale
const SCALE = 1 / 3;
const WORLD_W = Math.round(2181 * SCALE); // 727
const WORLD_H = Math.round(3072 * SCALE); // 1024

// ─── Character ────────────────────────────────────────────────────────────────

const CHAR_SIZE = 96;
const SPEED = 3.5;
const ANIM_FPS = 8;
const MOVE_INTERVAL = 16; // ~60 fps
const DEADZONE = 0.15;

// ─── Character sprite sheet (single atlas = one load, no per-frame source changes) ─

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

// ─── World assets (all static requires) ───────────────────────────────────────

// Optimized assets (resized + compressed via npm run optimize-game-assets) for faster load
const BG = require("@/assets/game/optimized/Background.png");
const BUSH_TOP_LEFT = require("@/assets/game/optimized/Bushes-top-left.png");
const GARDEN_TOP_LEFT = require("@/assets/game/optimized/Garden-top-left.png");
const GARDEN_TOP_RIGHT = require("@/assets/game/optimized/Garden-top-right.png");
const GARDEN_BOTTOM_LEFT = require("@/assets/game/optimized/Garden-Bottom-left.png");
const GARDEN_BOTTOM_RIGHT = require("@/assets/game/optimized/Garden-Bottom-right.png");
const HOUSE = require("@/assets/game/optimized/house.png");
const POND = require("@/assets/game/optimized/pond.png");

// Minimal set to show full scene + character (one atlas image for character)
const CRITICAL_IMAGES: number[] = [
  BG,
  BUSH_TOP_LEFT,
  GARDEN_TOP_LEFT,
  GARDEN_TOP_RIGHT,
  GARDEN_BOTTOM_LEFT,
  GARDEN_BOTTOM_RIGHT,
  HOUSE,
  POND,
  CHARACTER_ATLAS,
];

const REST_OF_IMAGES: number[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function prefetchOne(assetRef: number): Promise<void> {
  try {
    const resolved = Image.resolveAssetSource(assetRef as number);
    if (resolved?.uri) {
      return Image.prefetch(resolved.uri).then(
        () => {},
        () => {},
      );
    }
  } catch (_) {
    // ignore
  }
  return Promise.resolve();
}

/** Preload only critical assets so the game can show quickly. */
function preloadCritical(): Promise<void> {
  return Promise.all(CRITICAL_IMAGES.map(prefetchOne)).then(() => {});
}

/** Preload remaining assets in background (don't block). */
function preloadRestInBackground(): void {
  REST_OF_IMAGES.forEach((ref) => prefetchOne(ref));
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

// ─── Collision (from custom collision-shape PNGs) ─────────────────────────────

const COLLISION_DATA = require("@/lib/game/collisionData.json") as {
  cellSize: number;
  layers: { x: number; y: number; w: number; h: number; grid: number[][] }[];
};

const FEET_OFFSET_Y = 30;

// House only: top portion is pass-through so character can walk behind the roof
const HOUSE_ROOF_PASS_HEIGHT = 200;
const HOUSE_LAYER_RECT = { x: 365, y: 0, w: 349, h: 310 };
const HOUSE_BASE_TOP = 15 + HOUSE_ROOF_PASS_HEIGHT; // world Y where base starts
const HOUSE_BASE_HEIGHT = HOUSE_LAYER_RECT.h - HOUSE_ROOF_PASS_HEIGHT; // 110

function isColliding(cx: number, cy: number): boolean {
  const fx = cx;
  const fy = cy + FEET_OFFSET_Y;
  const cs = COLLISION_DATA.cellSize;

  for (const layer of COLLISION_DATA.layers) {
    if (
      fx < layer.x ||
      fx >= layer.x + layer.w ||
      fy < layer.y ||
      fy >= layer.y + layer.h
    )
      continue;

    // House: allow pass-through in the roof zone (go behind the house)
    if (
      layer.x === HOUSE_LAYER_RECT.x &&
      layer.y === HOUSE_LAYER_RECT.y &&
      layer.w === HOUSE_LAYER_RECT.w
    ) {
      if (fy - layer.y < HOUSE_ROOF_PASS_HEIGHT) continue;
    }

    const cellX = Math.floor((fx - layer.x) / cs);
    const cellY = Math.floor((fy - layer.y) / cs);
    const gw = layer.grid[0]?.length ?? 0;
    const gh = layer.grid.length;
    if (cellX < 0 || cellX >= gw || cellY < 0 || cellY >= gh) continue;
    if (layer.grid[cellY][cellX] === 1) return true;
  }
  return false;
}

// Collision debug: show collision shapes at 60% opacity (same order as COLLISION_DATA.layers)
const SHOW_COLLISION_DEBUG = true;
const COLLISION_DEBUG_IMAGES = [
  require("@/assets/game/Collision-shapes/house.png"),
  require("@/assets/game/Collision-shapes/Bushes-top-left.png"),
  require("@/assets/game/Collision-shapes/Ellipse 43.png"),
  require("@/assets/game/Collision-shapes/Garden-top-left.png"),
  require("@/assets/game/Collision-shapes/Garden-top-right.png"),
  require("@/assets/game/Collision-shapes/Garden-Bottom-left.png"),
  require("@/assets/game/Collision-shapes/Garden-Bottom-right.png"),
  require("@/assets/game/Collision-shapes/Bushes-foreground-left.png"),
  require("@/assets/game/Collision-shapes/Bushes-foreground-right.png"),
];

// ─── Asset layout (positions in world-space, scaled at SCALE from source px) ──

// All values derived from source image (2181×3072) divided by 3
const A = {
  bg: { left: 0, top: 0, width: WORLD_W, height: WORLD_H },
  bushTopLeft: {
    left: 0,
    top: 0,
    width: Math.round(825 * SCALE),
    height: Math.round(381 * SCALE),
  }, // 275×127
  house: {
    left: 365,
    top: 15,
    width: Math.round(1047 * SCALE),
    height: Math.round(929 * SCALE),
  }, // 349×310
  pond: {
    left: 135,
    top: 200,
    width: Math.round(360 * SCALE),
    height: Math.round(231 * SCALE),
  }, // 120×77
  gardenTopLeft: {
    left: 5,
    top: 340,
    width: Math.round(870 * SCALE),
    height: Math.round(495 * SCALE),
  }, // 290×165
  gardenTopRight: {
    left: 380,
    top: 340,
    width: Math.round(870 * SCALE),
    height: Math.round(495 * SCALE),
  }, // 290×165
  gardenBotLeft: {
    left: 5,
    top: 510,
    width: Math.round(870 * SCALE),
    height: Math.round(495 * SCALE),
  }, // 290×165
  gardenBotRight: {
    left: 380,
    top: 510,
    width: Math.round(870 * SCALE),
    height: Math.round(495 * SCALE),
  }, // 290×165
};

// 5×5 grid per garden area. Each box = one week: top-left=week1, top-right=week2, bottom-left=week3, bottom-right=week4
const GARDEN_AREAS = [
  A.gardenTopLeft,
  A.gardenTopRight,
  A.gardenBotLeft,
  A.gardenBotRight,
] as const;
const SLOTS_PER_AREA = 25;
const COLS = 5;
const ROWS = 5;

/** Current week-of-month 0–3 → which garden box to show plants in (week 1–4). Week 1 = top-left. */
function getCurrentWeekBoxIndex(date: Date = new Date()): number {
  const dayOfMonth = date.getDate();
  return Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
}

// Diamond from Plants-ground-grid.svg (viewBox 0 0 196 96) — grid fixed to SVG native size
const DIAMOND_PATH = "M96.5 0L195.5 48L96.5 95.5L0 48L96.5 0Z";
const DIAMOND_SVG_W = 196;
const DIAMOND_SVG_H = 96;
const GRID_FILL = "#E7F069";

// Grid dimensions — smaller than SVG so it sits inside the stone walls comfortably
const GRID_W = 140;
const GRID_H = 60;
// The isometric top wall is thick, so bias the grid toward the lower-center of the area
const GRID_TOP_BIAS = 0.25;

/** Grid rect: biased down to clear the thick top stone wall */
function getGridRect(area: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return {
    left: area.left + (area.width - GRID_W) / 2,
    top: area.top + area.height * GRID_TOP_BIAS,
    width: GRID_W,
    height: GRID_H,
    cellW: GRID_W / COLS,
    cellH: GRID_H / ROWS,
  };
}

function getGardenSlotPosition(slotIndex: number): { x: number; y: number } {
  const areaIndex = Math.floor(slotIndex / SLOTS_PER_AREA);
  const cellIndex = slotIndex % SLOTS_PER_AREA;
  const area = GARDEN_AREAS[areaIndex];
  const grid = getGridRect(area);
  const row = Math.floor(cellIndex / COLS);
  const col = cellIndex % COLS;
  return {
    x: grid.left + (col + 0.5) * grid.cellW,
    y: grid.top + (row + 0.5) * grid.cellH,
  };
}

/** 2×2 grid of diamond “plant boxes” (Plants-ground-grid.svg) for one garden area */
function GardenGridCells({
  area,
}: {
  area: { left: number; top: number; width: number; height: number };
}) {
  const grid = getGridRect(area);
  const scaleX = grid.cellW / DIAMOND_SVG_W;
  const scaleY = grid.cellH / DIAMOND_SVG_H;

  return (
    <View
      style={[
        styles.gardenGridWrap,
        {
          left: grid.left,
          top: grid.top,
          width: grid.width,
          height: grid.height,
        },
      ]}
      pointerEvents="none"
    >
      <Canvas style={{ width: grid.width, height: grid.height }}>
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          return (
            <Group
              key={i}
              transform={[
                { translateX: col * grid.cellW },
                { translateY: row * grid.cellH },
                { scaleX },
                { scaleY },
              ]}
            >
              <Path path={DIAMOND_PATH} color={GRID_FILL} opacity={0} />
            </Group>
          );
        })}
      </Canvas>
    </View>
  );
}

const PLANT_SIZE = 80;

// ─── Garden trigger circles (in front of each garden's bottom opening) ────────

const TRIGGER_RADIUS = 26;
const TRIGGER_PROXIMITY = 40;

const GARDEN_TRIGGERS = GARDEN_AREAS.map((area, i) => {
  const isLeft = i === 0 || i === 2;
  return {
    x: isLeft ? area.left + area.width * 0.75 : area.left + area.width * 0.18,
    y: isLeft ? area.top + area.height * 0.82 : area.top + area.height * 0.74,
  };
});

function getActiveGardenIndex(playerX: number, playerY: number): number {
  for (let i = 0; i < GARDEN_TRIGGERS.length; i++) {
    const t = GARDEN_TRIGGERS[i];
    const dx = playerX - t.x;
    const dy = playerY - t.y;
    if (Math.sqrt(dx * dx + dy * dy) <= TRIGGER_PROXIMITY) return i;
  }
  return -1;
}

// ─── Game screen ──────────────────────────────────────────────────────────────

const START_X = WORLD_W / 2;
const START_Y = WORLD_H / 2 - 50;

export default function GameScreen() {
  const router = useRouter();

  // Joystick input
  const joystickRef = useRef<JoystickDelta>({ x: 0, y: 0 });

  // World position (character's feet center in world coords)
  const worldPosRef = useRef({ x: START_X, y: START_Y });

  // Animated: world (camera) transform + character position inside world
  const initialCam = getCameraOffset(START_X, START_Y);
  const cameraAnim = useRef(new Animated.ValueXY(initialCam)).current;
  const charAnim = useRef(
    new Animated.ValueXY({
      x: START_X - CHAR_SIZE / 2,
      y: START_Y - CHAR_SIZE / 2,
    }),
  ).current;

  // Animation state
  const dirRef = useRef<AnimKey>("idle");
  const [animKey, setAnimKey] = useState<AnimKey>("idle");
  const [frame, setFrame] = useState(0);
  const [spriteError, setSpriteError] = useState(false);
  const [gameAssetsReady, setGameAssetsReady] = useState(false);
  const [activeGarden, setActiveGarden] = useState(-1);
  const [gardenOverlayIdx, setGardenOverlayIdx] = useState(-1);
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const habits = useHabitStore((s) => s.habits);
  const weekKey = getWeekKey();
  const dayFrame = getFrameIndexForDay();
  const weekBoxIndex = 0; // Week 1 only: plants always in top-left box

  // Force initial character position (Expo Go sometimes doesn't apply Animated.ValueXY initial value)
  useEffect(() => {
    const initialChar = {
      x: START_X - CHAR_SIZE / 2,
      y: START_Y - CHAR_SIZE / 2,
    };
    charAnim.setValue(initialChar);
    cameraAnim.setValue(getCameraOffset(START_X, START_Y));
  }, [charAnim, cameraAnim]);

  // Always start at the middle when the game screen is shown (e.g. opening from preview or switching tabs)
  useFocusEffect(
    useCallback(() => {
      worldPosRef.current = { x: START_X, y: START_Y };
      charAnim.setValue({
        x: START_X - CHAR_SIZE / 2,
        y: START_Y - CHAR_SIZE / 2,
      });
      cameraAnim.setValue(getCameraOffset(START_X, START_Y));
      dirRef.current = "idle";
      setAnimKey("idle");
      setFrame(0);
    }, [charAnim, cameraAnim]),
  );

  // Show game as soon as background + one character frame are ready; load rest in background
  useEffect(() => {
    let cancelled = false;
    preloadCritical().then(() => {
      if (!cancelled) setGameAssetsReady(true);
      preloadRestInBackground();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMove = useCallback((delta: JoystickDelta) => {
    joystickRef.current = delta;
  }, []);

  const handleEnd = useCallback(() => {
    joystickRef.current = { x: 0, y: 0 };
  }, []);

  // Movement loop ~60fps — updates Animated values without re-renders
  useEffect(() => {
    const id = setInterval(() => {
      const { x: jx, y: jy } = joystickRef.current;
      const isMoving = Math.abs(jx) > DEADZONE || Math.abs(jy) > DEADZONE;

      if (isMoving) {
        const { x: curX, y: curY } = worldPosRef.current;
        const tryX = clamp(curX + jx * SPEED, 0, WORLD_W);
        const tryY = clamp(curY + jy * SPEED, 0, WORLD_H);

        let finalX = curX;
        let finalY = curY;
        if (!isColliding(tryX, tryY)) {
          finalX = tryX;
          finalY = tryY;
        } else if (!isColliding(tryX, curY)) {
          finalX = tryX;
        } else if (!isColliding(curX, tryY)) {
          finalY = tryY;
        }

        worldPosRef.current = { x: finalX, y: finalY };
        charAnim.setValue({
          x: finalX - CHAR_SIZE / 2,
          y: finalY - CHAR_SIZE / 2,
        });
        cameraAnim.setValue(getCameraOffset(finalX, finalY));
      }

      const newDir = getAnimKey(jx, jy);
      if (newDir !== dirRef.current) {
        dirRef.current = newDir;
        setAnimKey(newDir);
        setFrame(0);
      }

      const nearIdx = getActiveGardenIndex(
        worldPosRef.current.x,
        worldPosRef.current.y,
      );
      setActiveGarden(nearIdx);
    }, MOVE_INTERVAL);

    return () => clearInterval(id);
  }, [cameraAnim, charAnim]);

  // Animation loop
  useEffect(() => {
    const count = FRAME_COUNTS[animKey];
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % count);
    }, 1000 / ANIM_FPS);
    return () => clearInterval(id);
  }, [animKey]);

  const openGardenOverlay = useCallback(
    (idx: number) => {
      setGardenOverlayIdx(idx);
      Animated.spring(overlayAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    },
    [overlayAnim],
  );

  const closeGardenOverlay = useCallback(() => {
    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setGardenOverlayIdx(-1));
  }, [overlayAnim]);

  const animRow = ANIM_KEY_TO_ROW[animKey];
  const frameCount = FRAME_COUNTS[animKey];
  const safeFrame = frame % frameCount;

  // Shadow shrinks/grows slightly in sync with walk cycle (idle = no pulse)
  const isWalking = animKey !== "idle";
  const shadowScale = isWalking
    ? 1 + 0.12 * Math.sin((safeFrame / Math.max(1, frameCount)) * Math.PI * 2)
    : 1;

  return (
    <View style={styles.container}>
      {/* ── World (camera-translated) ── */}
      <Animated.View
        style={[
          styles.world,
          { transform: cameraAnim.getTranslateTransform() },
        ]}
      >
        {/* Background */}
        <Image source={BG} style={[styles.asset, A.bg]} resizeMode="cover" />

        {/* Mid-ground assets (behind character) */}
        <Image
          source={BUSH_TOP_LEFT}
          style={[styles.asset, A.bushTopLeft]}
          resizeMode="contain"
        />
        <Image
          source={POND}
          style={[styles.asset, A.pond]}
          resizeMode="contain"
        />
        {/* House lower part (drawn before character so character can be in front of it) */}
        <View
          style={[
            styles.asset,
            styles.houseClip,
            {
              left: A.house.left,
              top: HOUSE_BASE_TOP,
              width: A.house.width,
              height: HOUSE_BASE_HEIGHT,
            },
          ]}
          pointerEvents="none"
        >
          <Image
            source={HOUSE}
            style={[
              styles.houseClipImage,
              {
                width: A.house.width,
                height: A.house.height,
                top: -HOUSE_ROOF_PASS_HEIGHT,
              },
            ]}
            resizeMode="contain"
          />
        </View>
        <Image
          source={GARDEN_TOP_LEFT}
          style={[styles.asset, A.gardenTopLeft]}
          resizeMode="contain"
        />
        <Image
          source={GARDEN_TOP_RIGHT}
          style={[styles.asset, A.gardenTopRight]}
          resizeMode="contain"
        />
        <Image
          source={GARDEN_BOTTOM_LEFT}
          style={[styles.asset, A.gardenBotLeft]}
          resizeMode="contain"
        />
        <Image
          source={GARDEN_BOTTOM_RIGHT}
          style={[styles.asset, A.gardenBotRight]}
          resizeMode="contain"
        />

        {/* Plants-ground-grid: 2×2 diamond boxes inside each garden area */}
        {GARDEN_AREAS.map((area, idx) => (
          <GardenGridCells key={idx} area={area} />
        ))}

        {/* Plants: clipped to active garden area so they never escape the stone walls */}
        {(() => {
          const activeArea = GARDEN_AREAS[weekBoxIndex];
          return (
            <View
              style={[
                styles.gardenClip,
                {
                  left: activeArea.left,
                  top: activeArea.top,
                  width: activeArea.width,
                  height: activeArea.height,
                },
              ]}
              pointerEvents="none"
            >
              {habits.slice(0, SLOTS_PER_AREA).map((habit, i) => {
                const col = i % COLS;
                const row = (i * 2) % ROWS;
                const slotIndex =
                  weekBoxIndex * SLOTS_PER_AREA + row * COLS + col;
                const pos = getGardenSlotPosition(slotIndex);
                const plantIndex = getPlantIndexForHabitSlot(i, weekKey);
                const source = getPlantSprite(plantIndex, dayFrame);
                return (
                  <Image
                    key={habit.id}
                    source={source}
                    style={[
                      styles.plant,
                      {
                        left: pos.x - activeArea.left - PLANT_SIZE / 2,
                        top: pos.y - activeArea.top - PLANT_SIZE / 2,
                        width: PLANT_SIZE,
                        height: PLANT_SIZE,
                      },
                    ]}
                    resizeMode="contain"
                  />
                );
              })}
            </View>
          );
        })()}

        {/* Character (sprite sheet: one Image, crop by position so animation has no extra loads) */}
        <Animated.View
          style={[
            styles.character,
            { transform: charAnim.getTranslateTransform() },
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

        {/* House roof (drawn after character, higher zIndex so it layers on top when character is "behind") */}
        <View
          style={[
            styles.asset,
            styles.houseClip,
            styles.houseRoofLayer,
            {
              left: A.house.left,
              top: A.house.top,
              width: A.house.width,
              height: HOUSE_ROOF_PASS_HEIGHT,
            },
          ]}
          pointerEvents="none"
        >
          <Image
            source={HOUSE}
            style={[
              styles.houseClipImage,
              {
                width: A.house.width,
                height: A.house.height,
                top: 0,
              },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Trigger circles in front of each garden */}
        {GARDEN_TRIGGERS.map((t, i) => (
          <View
            key={`trigger-${i}`}
            style={[
              styles.triggerCircle,
              {
                left: t.x - TRIGGER_RADIUS,
                top: t.y - TRIGGER_RADIUS,
                width: TRIGGER_RADIUS * 2,
                height: TRIGGER_RADIUS * 2,
                borderRadius: TRIGGER_RADIUS,
                opacity: 0,
              },
            ]}
            pointerEvents="none"
          />
        ))}

        {/* Collision debug overlay — 60% opacity (only house.png and other collision shapes) */}
        {SHOW_COLLISION_DEBUG &&
          COLLISION_DATA.layers.map((layer, i) => (
            <Image
              key={i}
              source={COLLISION_DEBUG_IMAGES[i]}
              style={[
                styles.asset,
                {
                  left: layer.x,
                  top: layer.y,
                  width: layer.w,
                  height: layer.h,
                  opacity: 0,
                },
              ]}
              resizeMode="contain"
            />
          ))}
      </Animated.View>

      {/* ── UI overlays (always on top, not affected by camera) ── */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/(tabs)/garden")}
        activeOpacity={0.7}
      >
        <IconSymbol name="chevron.left" size={18} color="#5A7A3A" />
        <AppText style={styles.backLabel}>Garden</AppText>
      </TouchableOpacity>

      {/* "View Garden" button — appears when standing on a trigger circle */}
      {activeGarden >= 0 && gardenOverlayIdx < 0 && (
        <TouchableOpacity
          style={styles.viewGardenBtn}
          activeOpacity={0.8}
          onPress={() => openGardenOverlay(activeGarden)}
        >
          <AppText style={styles.viewGardenLabel}>View Garden</AppText>
        </TouchableOpacity>
      )}

      {/* White garden overlay — slides up from bottom */}
      {gardenOverlayIdx >= 0 && (
        <Animated.View
          style={[
            styles.gardenOverlay,
            {
              transform: [
                {
                  translateY: overlayAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [H, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.overlayCloseBtn}
            activeOpacity={0.7}
            onPress={closeGardenOverlay}
          >
            <IconSymbol name="xmark" size={20} color="#333" />
          </TouchableOpacity>
          <AppText style={styles.overlayTitle}>
            Garden — Week {gardenOverlayIdx + 1}
          </AppText>
        </Animated.View>
      )}

      <Joystick onMove={handleMove} onEnd={handleEnd} />

      {/* Loading overlay until assets are preloaded (reduces delay in Expo Go) */}
      {!gameAssetsReady && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <AppText style={styles.loadingText}>Loading…</AppText>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C5E8A0",
    overflow: "hidden",
  },
  world: {
    position: "absolute",
    width: WORLD_W,
    height: WORLD_H,
  },
  asset: {
    position: "absolute",
  },
  plant: {
    position: "absolute",
    pointerEvents: "none",
  },
  gardenGridWrap: {
    position: "absolute",
  },
  gardenClip: {
    position: "absolute",
    overflow: "hidden",
  },
  houseClip: {
    overflow: "hidden",
  },
  houseRoofLayer: {
    zIndex: 15,
    elevation: 15,
  },
  houseClipImage: {
    position: "absolute",
    left: 0,
  },
  character: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CHAR_SIZE,
    height: CHAR_SIZE,
    zIndex: 10,
    elevation: 10,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(197,232,160,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#5A7A3A",
  },
  backBtn: {
    position: "absolute",
    top: 60,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    zIndex: 10,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#5A7A3A",
  },
  triggerCircle: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  viewGardenBtn: {
    position: "absolute",
    top: H * 0.32,
    alignSelf: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 20,
  },
  viewGardenLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5A7A3A",
  },
  gardenOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: H * 0.85,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    zIndex: 30,
    elevation: 30,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  overlayCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 31,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginTop: 8,
  },
});
