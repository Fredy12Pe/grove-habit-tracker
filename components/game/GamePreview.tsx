/**
 * Live-view snippet of the garden game for the Garden tab.
 * Renders a scaled, static snapshot of the game world (no joystick).
 * On press, opens the full game tab.
 */

import { AppText } from "@/components/ui/AppText";
import { GroveColors, GroveSpacing } from "@/styles/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const SCALE = 1 / 3;
const WORLD_W = Math.round(2181 * SCALE);
const WORLD_H = Math.round(3072 * SCALE);
const CHAR_SIZE = 96;
const ATLAS_CELL = 96;
const ATLAS_COLS = 6;
const ATLAS_ROWS = 9;
const ATLAS_W = ATLAS_COLS * ATLAS_CELL;
const ATLAS_H = ATLAS_ROWS * ATLAS_CELL;
const HOUSE_ROOF_PASS_HEIGHT = 200;
const START_X = WORLD_W / 2;
const START_Y = WORLD_H / 2 - 50;

const BG = require("@/assets/game/optimized/Background.png");
const BUSH_TOP_LEFT = require("@/assets/game/optimized/Bushes-top-left.png");
const GARDEN_TOP_LEFT = require("@/assets/game/optimized/Garden-top-left.png");
const GARDEN_TOP_RIGHT = require("@/assets/game/optimized/Garden-top-right.png");
const GARDEN_BOTTOM_LEFT = require("@/assets/game/optimized/Garden-Bottom-left.png");
const GARDEN_BOTTOM_RIGHT = require("@/assets/game/optimized/Garden-Bottom-right.png");
const HOUSE = require("@/assets/game/optimized/house.png");
const POND = require("@/assets/game/optimized/pond.png");
const CHARACTER_ATLAS = require("@/assets/game/character-atlas.png");

const A = {
  bg: { left: 0, top: 0, width: WORLD_W, height: WORLD_H },
  bushTopLeft: {
    left: 0,
    top: 0,
    width: Math.round(825 * SCALE),
    height: Math.round(381 * SCALE),
  },
  house: {
    left: 365,
    top: 15,
    width: Math.round(1047 * SCALE),
    height: Math.round(929 * SCALE),
  },
  pond: {
    left: 135,
    top: 200,
    width: Math.round(360 * SCALE),
    height: Math.round(231 * SCALE),
  },
  gardenTopLeft: {
    left: 5,
    top: 340,
    width: Math.round(870 * SCALE),
    height: Math.round(495 * SCALE),
  },
  gardenTopRight: {
    left: 380,
    top: 340,
    width: Math.round(870 * SCALE),
    height: Math.round(495 * SCALE),
  },
  gardenBotLeft: {
    left: 5,
    top: 510,
    width: Math.round(870 * SCALE),
    height: Math.round(495 * SCALE),
  },
  gardenBotRight: {
    left: 380,
    top: 510,
    width: Math.round(870 * SCALE),
    height: Math.round(495 * SCALE),
  },
};

const HOUSE_BASE_TOP = 15 + HOUSE_ROOF_PASS_HEIGHT;
const HOUSE_BASE_HEIGHT = 310 - HOUSE_ROOF_PASS_HEIGHT;

const IDLE_FRAME_COUNT = 4;
const IDLE_ANIM_INTERVAL_MS = 125;

const ARROW_NUDGE_PX = 5;
const ARROW_NUDGE_MS = 700;

export function GamePreview() {
  const router = useRouter();
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [idleFrame, setIdleFrame] = useState(0);
  const arrowNudge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => {
      setIdleFrame((f) => (f + 1) % IDLE_FRAME_COUNT);
    }, IDLE_ANIM_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowNudge, {
          toValue: ARROW_NUDGE_PX,
          duration: ARROW_NUDGE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(arrowNudge, {
          toValue: 0,
          duration: ARROW_NUDGE_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [arrowNudge]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setLayout({ width, height });
  };

  const scale = layout
    ? Math.max(layout.width / WORLD_W, layout.height / WORLD_H)
    : 1;

  // Pan so the character is centered in the preview (same idea as full game camera)
  const cameraX = layout ? layout.width / 2 - START_X * scale : 0;
  const cameraY = layout ? layout.height / 2 - START_Y * scale : 0;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.touchable}>
        {layout && (
          <View
            style={[
              styles.worldWrap,
              {
                width: WORLD_W,
                height: WORLD_H,
                transformOrigin: "left top",
                transform: [
                  { scale },
                  { translateX: cameraX },
                  { translateY: cameraY },
                ],
              },
            ]}
          >
            {/* Background */}
            <Image
              source={BG}
              style={[styles.asset, A.bg]}
              resizeMode="cover"
            />

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

            {/* House base (behind character) */}
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

            {/* Character (idle animation) */}
            <View
              style={[
                styles.character,
                {
                  left: START_X - CHAR_SIZE / 2,
                  top: START_Y - CHAR_SIZE / 2,
                },
              ]}
            >
              <View style={styles.shadow} />
              <View style={styles.atlasCrop}>
                <Image
                  source={CHARACTER_ATLAS}
                  style={[
                    styles.atlasImage,
                    {
                      width: ATLAS_W,
                      height: ATLAS_H,
                      left: -idleFrame * ATLAS_CELL,
                      top: 0,
                    },
                  ]}
                  resizeMode="stretch"
                />
              </View>
            </View>

            {/* House roof (in front of character) */}
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
            >
              <Image
                source={HOUSE}
                style={[
                  styles.houseClipImage,
                  { width: A.house.width, height: A.house.height, top: 0 },
                ]}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* Bottom overlay: black 50% fill, corner radius 22; only arrow button is pressable (no BlurView — not supported in Expo Go) */}
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.overlayFill} />
          <View style={styles.overlayContent}>
            <AppText variant="h1" style={styles.overlayText}>
              See Your Garden Grow
            </AppText>
            <TouchableOpacity
              style={styles.overlayButton}
              activeOpacity={0.8}
              onPress={() => router.push("/game")}
            >
              <Animated.View
                style={{ transform: [{ translateX: arrowNudge }] }}
              >
                <MaterialIcons name="arrow-forward" size={18} color="#5D6D00" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    flex: 1,
  },
  touchable: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#C5E8A0",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    overflow: "hidden",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  overlayFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GroveColors.primaryGreen,
  },
  overlayContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GroveSpacing.cardPaddingHorizontal,
    paddingVertical: 12,
  },
  overlayText: {
    color: "#5D6D00",
    fontSize: 18,
  },
  overlayButton: {
    height: 38,
    minWidth: 60,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  worldWrap: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  asset: {
    position: "absolute",
  },
  houseClip: {
    overflow: "hidden",
  },
  houseClipImage: {
    position: "absolute",
    left: 0,
  },
  houseRoofLayer: {
    zIndex: 15,
    elevation: 15,
  },
  character: {
    position: "absolute",
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
});
