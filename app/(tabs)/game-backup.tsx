import { Joystick, type JoystickDelta } from "@/components/garden/Joystick";
import unifiedCollision from "@/lib/game/unifiedCollision.json";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Screen & world dimensions ────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get("window");

// Background scaled to fill screen height; width extends beyond screen
const BG_ASPECT = 2213 / 1000;
const WORLD_H = H;
const WORLD_W = Math.round(H * BG_ASPECT);

const BG = require("@/assets/game-backup/background/Background.png");
const ISLAND = require("@/assets/game-backup/island/island-main.png");
const WALK_AREA = require("@/assets/game-backup/island/unified-walkArea.png");

const ISLAND_W = Math.round(1751 * (WORLD_H / 1000));
const ISLAND_H = Math.round(705 * (WORLD_H / 1000));
const ISLAND_LEFT = (WORLD_W - ISLAND_W) / 2;
const ISLAND_TOP = (WORLD_H - ISLAND_H) / 2 - WORLD_H * 0.102;

// ─── Hills ───────────────────────────────────────────────────────────────────

const HILLS = require("@/assets/game-backup/hills/hills.png");
const HILLS_SCALE = ISLAND_W / 1751;
const HILLS_W = Math.round(417 * HILLS_SCALE);
const HILLS_H = Math.round(219 * HILLS_SCALE);
const HILLS_LEFT = ISLAND_LEFT + ISLAND_W * 0.34 - HILLS_W / 2;
const HILLS_TOP = ISLAND_TOP + ISLAND_H * 0.14 - HILLS_H / 2;

// Hill bottom pieces (cliff faces)
const HILLS_BTM1 = require("@/assets/game-backup/hills/Hills-bottom-1.png");
const HILLS_BTM2 = require("@/assets/game-backup/hills/Hills-bottom-2.png");
const HBTM1_W = Math.round(172 * HILLS_SCALE);
const HBTM1_H = Math.round(30 * HILLS_SCALE);
const HBTM2_W = Math.round(128 * HILLS_SCALE);
const HBTM2_H = Math.round(29 * HILLS_SCALE);

// Position: directly under each hill section
// Left hill spans roughly 0–42% of hills width
const HBTM1_LEFT = HILLS_LEFT + HILLS_W * -0.0;
const HBTM1_TOP = HILLS_TOP + HILLS_H - HBTM1_H * 2.5;
// Right hill spans roughly 60–95% of hills width
const HBTM2_LEFT = HILLS_LEFT + HILLS_W * 0.694;
const HBTM2_TOP = HILLS_TOP + HILLS_H - HBTM2_H * 2.2;

// Entrance arrow position (above the stairs)
const ARROW_X = HILLS_LEFT + HILLS_W * 0.84;
const ARROW_Y = HILLS_TOP + HILLS_H * 0.75;
const ARROW_SIZE = Math.round(HILLS_W * 0.08);

// ─── House assets & layout ──────────────────────────────────────────────────

const HOUSE_FRAME = require("@/assets/game-backup/house/house-frame.png");
const HOUSE_FLOOR = require("@/assets/game-backup/house/house-floor.png");
const HOUSE_BED = require("@/assets/game-backup/house/house-bed.png");
const HOUSE_DRAWER = require("@/assets/game-backup/house/house-drawer.png");
const HOUSE_IMAGE = require("@/assets/game-backup/house/house-image.png");
const HOUSE_DESK = require("@/assets/game-backup/house/desk-and-table.png");

// Native sizes
const FRAME_NW = 233;
const FRAME_NH = 194;
const FLOOR_NW = 207;
const FLOOR_NH = 140;

const HOUSE_SCALE = HILLS_SCALE * 1.2;
const HOUSE_W = Math.round(FRAME_NW * HOUSE_SCALE);
const HOUSE_H = Math.round(FRAME_NH * HOUSE_SCALE);

// Position house on the island (left side of hills area)
const HOUSE_LEFT = HILLS_LEFT - HILLS_W * 0.48;
const HOUSE_TOP = HILLS_TOP + HOUSE_H * 1;

// Interior offset (where the floor sits inside the frame)
const INTERIOR_X = Math.round(13 * HOUSE_SCALE);
const INTERIOR_Y = Math.round(18 * HOUSE_SCALE);
const INTERIOR_W = Math.round(FLOOR_NW * HOUSE_SCALE);
const INTERIOR_H = Math.round(155 * HOUSE_SCALE);

// Furniture positions (native px offsets from frame top-left, then scaled)
const HIMG_X = Math.round(35 * HOUSE_SCALE);
const HIMG_Y = Math.round(28 * HOUSE_SCALE);
const HIMG_W = Math.round(29 * HOUSE_SCALE);
const HIMG_H = Math.round(19 * HOUSE_SCALE);

const HDRAWER_X = Math.round(160 * HOUSE_SCALE);
const HDRAWER_Y = Math.round(12 * HOUSE_SCALE);
const HDRAWER_W = Math.round(37 * HOUSE_SCALE);
const HDRAWER_H = Math.round(42 * HOUSE_SCALE);

const HBED_X = Math.round(172 * HOUSE_SCALE);
const HBED_Y = Math.round(50 * HOUSE_SCALE);
const HBED_W = Math.round(37 * HOUSE_SCALE);
const HBED_H = Math.round(53 * HOUSE_SCALE);

const HDESK_X = Math.round(18 * HOUSE_SCALE);
const HDESK_Y = Math.round(85 * HOUSE_SCALE);
const HDESK_W = Math.round(74 * HOUSE_SCALE);
const HDESK_H = Math.round(37 * HOUSE_SCALE);

// House entrance & interior navigation
const CHAR_SCALE_INDOOR = 0.5;
const HOUSE_DOOR_X = HOUSE_LEFT + HOUSE_W * 0.2;
const HOUSE_DOOR_Y = HOUSE_TOP + HOUSE_H - 2;
const HOUSE_DOOR_RADIUS = 18;
// Exit trigger inside the house (bottom-center of the floor)
const HOUSE_EXIT_X = HOUSE_LEFT + INTERIOR_X + INTERIOR_W * 0.1;
const HOUSE_EXIT_Y = HOUSE_TOP + INTERIOR_Y + INTERIOR_H - 40;
const HOUSE_EXIT_RADIUS = 22;
const HOUSE_ENTER_POS = {
  x: HOUSE_LEFT + INTERIOR_X + INTERIOR_W / 2,
  y: HOUSE_TOP + INTERIOR_Y + INTERIOR_H / 2,
};
const HOUSE_INTERIOR_RECT = {
  left: HOUSE_LEFT + INTERIOR_X + 4,
  top: HOUSE_TOP + INTERIOR_Y + 4,
  right: HOUSE_LEFT + INTERIOR_X + INTERIOR_W - 4,
  bottom: HOUSE_TOP + INTERIOR_Y + INTERIOR_H - 4,
};

// ─── Garden assets & layout ──────────────────────────────────────────────────

const GARDEN_FLOOR = require("@/assets/game-backup/garden/garden-floor.png");
const GARDEN_BACK = require("@/assets/game-backup/garden/Back.png");
const GARDEN_SIDES = require("@/assets/game-backup/garden/garden-sides.png");
const GARDEN_FRONTS = [
  require("@/assets/game-backup/garden/Front-1.png"),
  require("@/assets/game-backup/garden/Front-2.png"),
  require("@/assets/game-backup/garden/Front-3.png"),
  require("@/assets/game-backup/garden/Front-4.png"),
];

// Native asset sizes
const G_CONTAINER_W = 144;
const G_CONTAINER_H = 111;
const G_FLOOR = { w: 125, h: 83 };
const G_BACK = { w: 143, h: 30 };
const G_SIDES = { w: 142, h: 111 };
const G_FRONT = { w: 144, h: 30 };

const GARDEN_SCALE = (ISLAND_W * 0.086) / G_CONTAINER_W;
const GW = Math.round(G_CONTAINER_W * GARDEN_SCALE);
const GH = Math.round(G_CONTAINER_H * GARDEN_SCALE);

// 2x2 garden positions (center of each garden, relative to island)
const G_CENTER_X = 0.51;
const G_CENTER_Y = 0.58;
const G_GAP_X = 0.06;
const G_GAP_Y = 0.12;
const GARDEN_POSITIONS = [
  { x: G_CENTER_X - G_GAP_X, y: G_CENTER_Y - G_GAP_Y }, // top-left
  { x: G_CENTER_X + G_GAP_X, y: G_CENTER_Y - G_GAP_Y }, // top-right
  { x: G_CENTER_X - G_GAP_X, y: G_CENTER_Y + G_GAP_Y }, // bottom-left
  { x: G_CENTER_X + G_GAP_X, y: G_CENTER_Y + G_GAP_Y }, // bottom-right
];

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

const GARDEN_RECTS = GARDEN_POSITIONS.map((pos) => {
  const left = ISLAND_LEFT + pos.x * ISLAND_W - GW / 2 - GARDEN_PADDING;
  const top = ISLAND_TOP + pos.y * ISLAND_H - GH / 2 - GARDEN_PADDING;
  return {
    left,
    top,
    right: left + GW + GARDEN_PADDING * 2,
    bottom: top + GH + GARDEN_PADDING * 2,
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

function isWalkable(worldX: number, worldY: number): boolean {
  const feetY = worldY + FEET_OFFSET_Y;
  if (isInsideGarden(worldX, feetY)) return false;
  if (isInsideHouse(worldX, feetY)) return false;
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

const START_X = WORLD_W / 2;
const START_Y = WORLD_H / 2 - 50;

export default function GameBackupScreen() {
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
    }, [charAnim, cameraAnim]),
  );

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
      const near = isNearDoor(px, py, indoor);
      setNearDoor(near);

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
              {/* 4. Front fence */}
              <Image
                source={GARDEN_FRONTS[i]}
                style={{
                  position: "absolute",
                  left: ((G_CONTAINER_W - G_FRONT.w) / 2 / G_CONTAINER_W) * GW,
                  top: GH - (G_FRONT.h / G_CONTAINER_H) * GH,
                  width: (G_FRONT.w / G_CONTAINER_W) * GW,
                  height: (G_FRONT.h / G_CONTAINER_H) * GH,
                }}
                resizeMode="stretch"
              />
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

      <Joystick onMove={handleMove} onEnd={handleEnd} />
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
});
