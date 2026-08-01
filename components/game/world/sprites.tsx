/**
 * Shared animated sprites for the island world (game screen + Garden tab preview).
 *
 * Each sprite owns its frame state internally, so per-frame animation ticks
 * re-render only that sprite — not the whole world tree.
 */

import React, { memo, useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from "react-native";

// ─── Character atlas ─────────────────────────────────────────────────────────

export const CHAR_SIZE = 96;
export const CHAR_SCALE = 0.67;
export const CHAR_SCALE_INDOOR = 0.5;
export const ANIM_FPS = 8;

export type AnimKey =
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

export const FRAME_COUNTS: Record<AnimKey, number> = {
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

/** Simple looping frame index; resets to 0 whenever `count` or `running` changes. */
function useFrameLoop(count: number, intervalMs: number, running: boolean) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    setFrame(0);
    if (!running) return;
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % count);
    }, intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs, running]);
  return frame;
}

/**
 * Character sprite: atlas crop + ground shadow with walk bounce.
 * Position/scale/z-order are the caller's responsibility (wrap in a positioned view).
 */
export const CharacterSprite = memo(function CharacterSprite({
  animKey = "idle",
  active = true,
  onFrame,
}: {
  animKey?: AnimKey;
  active?: boolean;
  /** Called on every frame change (e.g. footstep sounds). Keep the reference stable. */
  onFrame?: (frame: number, animKey: AnimKey) => void;
}) {
  const [spriteError, setSpriteError] = useState(false);
  const frameCount = FRAME_COUNTS[animKey];
  const frame = useFrameLoop(frameCount, 1000 / ANIM_FPS, active);

  useEffect(() => {
    onFrame?.(frame, animKey);
  }, [frame, animKey, onFrame]);

  const isWalking = animKey !== "idle";
  const shadowScale = isWalking
    ? 1 + 0.12 * Math.sin((frame / Math.max(1, frameCount)) * Math.PI * 2)
    : 1;

  return (
    <>
      <View
        style={[
          styles.shadow,
          { transform: [{ scaleY: 0.28 }, { scale: shadowScale }] },
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
                left: -frame * ATLAS_CELL,
                top: -ANIM_KEY_TO_ROW[animKey] * ATLAS_CELL,
              },
            ]}
            resizeMode="stretch"
            onError={() => setSpriteError(true)}
          />
        </View>
      )}
    </>
  );
});

// ─── World creatures / interactive props ─────────────────────────────────────

type FrameSource = readonly ImageSourcePropType[];

/** Bottom-anchored frame image inside an overflow-hidden box (world sprite pattern). */
function SpriteFrame({
  source,
  width,
  height,
  resizeMode,
}: {
  source: ImageSourcePropType;
  width: number;
  height: number;
  resizeMode: "contain" | "cover";
}) {
  return (
    <Image
      source={source}
      style={{ position: "absolute", bottom: 0, left: 0, width, height }}
      resizeMode={resizeMode}
    />
  );
}

/** Cow: loops eating; while `petting`, plays the heart sequence once then calls `onPetEnd`. */
export const CowSprite = memo(function CowSprite({
  eatingFrames,
  heartFrames,
  intervalMs,
  heartIntervalMs,
  width,
  height,
  petting = false,
  onPetEnd,
  active = true,
}: {
  eatingFrames: FrameSource;
  heartFrames: FrameSource;
  intervalMs: number;
  heartIntervalMs: number;
  width: number;
  height: number;
  petting?: boolean;
  onPetEnd?: () => void;
  active?: boolean;
}) {
  const eatFrame = useFrameLoop(eatingFrames.length, intervalMs, active && !petting);
  const [heartFrame, setHeartFrame] = useState(0);

  useEffect(() => {
    if (!petting) {
      setHeartFrame(0);
      return;
    }
    const id = setInterval(() => {
      setHeartFrame((prev) => {
        if (prev >= heartFrames.length - 1) {
          clearInterval(id);
          onPetEnd?.();
          return 0;
        }
        return prev + 1;
      });
    }, heartIntervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petting, heartFrames.length, heartIntervalMs]);

  return (
    <SpriteFrame
      source={petting ? heartFrames[heartFrame] : eatingFrames[eatFrame]}
      width={width}
      height={height}
      resizeMode="contain"
    />
  );
});

/** Chicken: autonomous idle loop with a peck sequence every `idleBeforePeckMs`. */
export const ChickenSprite = memo(function ChickenSprite({
  idleFrames,
  peckFrames,
  intervalMs,
  idleBeforePeckMs,
  width,
  height,
  active = true,
}: {
  idleFrames: FrameSource;
  peckFrames: FrameSource;
  intervalMs: number;
  idleBeforePeckMs: number;
  width: number;
  height: number;
  active?: boolean;
}) {
  const [pecking, setPecking] = useState(false);
  const [peckFrame, setPeckFrame] = useState(0);
  const idleFrame = useFrameLoop(idleFrames.length, intervalMs, active && !pecking);

  useEffect(() => {
    if (!active || pecking) return;
    const t = setTimeout(() => setPecking(true), idleBeforePeckMs);
    return () => clearTimeout(t);
  }, [active, pecking, idleBeforePeckMs]);

  useEffect(() => {
    if (!pecking) return;
    setPeckFrame(0);
    const id = setInterval(() => {
      setPeckFrame((prev) => {
        if (prev >= peckFrames.length - 1) {
          clearInterval(id);
          setPecking(false);
          return 0;
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [pecking, peckFrames.length, intervalMs]);

  return (
    <SpriteFrame
      source={pecking ? peckFrames[peckFrame] : idleFrames[idleFrame]}
      width={width}
      height={height}
      resizeMode="contain"
    />
  );
});

/**
 * Choppable tree: static until `falling`; plays the fall sequence once, then `onFallEnd`.
 * When neither falling nor fallen, shows frame 0 (used to reset once off-screen).
 */
export const FallingTreeSprite = memo(function FallingTreeSprite({
  frames,
  width,
  height,
  falling = false,
  fallen = false,
  frameMs = 55,
  onFallEnd,
}: {
  frames: FrameSource;
  width: number;
  height: number;
  falling?: boolean;
  fallen?: boolean;
  frameMs?: number;
  onFallEnd?: () => void;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!falling) {
      setFrame(fallen ? frames.length - 1 : 0);
      return;
    }
    const id = setInterval(() => {
      setFrame((prev) => {
        if (prev >= frames.length - 1) {
          clearInterval(id);
          onFallEnd?.();
          return frames.length - 1;
        }
        return prev + 1;
      });
    }, frameMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [falling, fallen, frames.length, frameMs]);

  return (
    <Image
      source={frames[frame]}
      style={{ width, height }}
      resizeMode="contain"
    />
  );
});

/**
 * Shake tree: plays the shake sequence once while `shaking`, holds the last frame,
 * and rewinds to frame 0 whenever `resetKey` changes (tree scrolled off-screen).
 */
export const ShakeTreeSprite = memo(function ShakeTreeSprite({
  frames,
  width,
  height,
  shaking = false,
  frameMs = 72,
  resetKey = 0,
  onShakeEnd,
}: {
  frames: FrameSource;
  width: number;
  height: number;
  shaking?: boolean;
  frameMs?: number;
  resetKey?: number;
  onShakeEnd?: () => void;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
  }, [resetKey]);

  useEffect(() => {
    if (!shaking) return;
    setFrame(0);
    const id = setInterval(() => {
      setFrame((prev) => {
        if (prev >= frames.length - 1) {
          clearInterval(id);
          onShakeEnd?.();
          return frames.length - 1;
        }
        return prev + 1;
      });
    }, frameMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shaking, frames.length, frameMs]);

  return (
    <SpriteFrame
      source={frames[frame]}
      width={width}
      height={height}
      resizeMode="cover"
    />
  );
});

const styles = StyleSheet.create({
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
});
