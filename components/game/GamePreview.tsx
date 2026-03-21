/**
 * Live-view snippet of the island game for the Garden tab.
 * Uses the same world layout and assets as app/(tabs)/game.tsx (getIslandWorldLayout).
 */

import { AppText } from "@/components/ui/AppText";
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
import { useHabitStore } from "@/lib/store";
import type { CompletionDatesByHabit } from "@/lib/store/useHabitStore";
import type { Habit } from "@/lib/types";
import { GroveColors, GroveSpacing } from "@/styles/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const CHAR_SIZE = 96;
const CHAR_SCALE = 0.67;
const ATLAS_CELL = 96;
const ATLAS_COLS = 6;
const ATLAS_ROWS = 9;
const ATLAS_W = ATLAS_COLS * ATLAS_CELL;
const ATLAS_H = ATLAS_ROWS * ATLAS_CELL;
const CHARACTER_ATLAS = require("@/assets/game/character-atlas.png");

const FEET_OFFSET_Y = CHAR_SIZE * 0.32;
const BACKUP_GARDEN_PLANT_FILL = 1.8;
const BACKUP_GARDEN_GRID_DEBUG = false;

const IDLE_FRAME_COUNT = 4;
const IDLE_ANIM_INTERVAL_MS = 125;

const ARROW_NUDGE_PX = 5;
const ARROW_NUDGE_MS = 700;

/** >1 zooms past “fill” so the preview crops tighter on the character at START. */
const PREVIEW_ZOOM = 1.4;

/** Positive = pan view right (world shifts left; more of the scene to the right of the character). */
const PREVIEW_PAN_X = 300;

/** Positive = pan view down (world shifts up; more of the scene below the character). */
const PREVIEW_PAN_Y = 100;

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

export function GamePreview() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const habits = useHabitStore((s) => s.habits);
  const completionDates = useHabitStore((s) => s.completionDates);
  const currentWeekPlot = getCurrentMonthWeekIndex();

  const island = useMemo(
    () => getIslandWorldLayout(windowHeight),
    [windowHeight],
  );

  const {
    WORLD_W,
    WORLD_H,
    BG,
    ISLAND,
    ISLAND_W,
    ISLAND_H,
    ISLAND_LEFT,
    ISLAND_TOP,
    TREE_FALL_FRAMES,
    TREE_DISPLAY_H,
    TREE_DISPLAY_W,
    TREE_WORLD_X,
    TREE_WORLD_Y,
    TREE_DEPTH_Y,
    HILLS,
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
  } = island;

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

  const feetY = START_Y + FEET_OFFSET_Y;
  const charBehindTree = feetY < TREE_DEPTH_Y;

  const [layout, setLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [idleFrame, setIdleFrame] = useState(0);
  const arrowNudge = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

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

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setLayout({ width, height });
  };

  const scale = layout
    ? Math.max(layout.width / WORLD_W, layout.height / WORLD_H) * PREVIEW_ZOOM
    : 1;

  const cameraX = layout
    ? layout.width / 2 - START_X * scale - PREVIEW_PAN_X
    : 0;
  const cameraY = layout
    ? layout.height / 2 - START_Y * scale - PREVIEW_PAN_Y
    : 0;

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
                zIndex: charBehindTree ? 26 : 12,
                elevation: Platform.OS === "android" && charBehindTree ? 26 : 0,
              }}
            >
              <Image
                source={TREE_FALL_FRAMES[0]}
                style={{
                  width: TREE_DISPLAY_W,
                  height: TREE_DISPLAY_H,
                }}
                resizeMode="contain"
              />
            </View>

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
                  <Image
                    source={GARDEN_FLOOR}
                    style={{
                      position: "absolute",
                      left:
                        ((G_CONTAINER_W - G_FLOOR.w) / 2 / G_CONTAINER_W) * GW,
                      top:
                        ((G_CONTAINER_H - G_FLOOR.h) / 2 / G_CONTAINER_H) * GH,
                      width: (G_FLOOR.w / G_CONTAINER_W) * GW,
                      height: (G_FLOOR.h / G_CONTAINER_H) * GH,
                    }}
                    resizeMode="stretch"
                  />
                  <Image
                    source={GARDEN_BACK}
                    style={{
                      position: "absolute",
                      left:
                        ((G_CONTAINER_W - G_BACK.w) / 2 / G_CONTAINER_W) * GW,
                      top: 0,
                      width: (G_BACK.w / G_CONTAINER_W) * GW,
                      height: (G_BACK.h / G_CONTAINER_H) * GH,
                    }}
                    resizeMode="stretch"
                  />
                  <Image
                    source={GARDEN_SIDES}
                    style={{
                      position: "absolute",
                      left:
                        ((G_CONTAINER_W - G_SIDES.w) / 2 / G_CONTAINER_W) * GW,
                      top: 0,
                      width: (G_SIDES.w / G_CONTAINER_W) * GW,
                      height: (G_SIDES.h / G_CONTAINER_H) * GH,
                    }}
                    resizeMode="stretch"
                  />
                  {i <= currentWeekPlot &&
                    habits
                      .slice(0, GARDEN_MAX_PLANTS)
                      .map((habit: Habit, habitIndex: number) => {
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
                        length:
                          backupGardenLayout.cols * backupGardenLayout.rows,
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
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left:
                        ((G_CONTAINER_W - G_FRONT.w) / 2 / G_CONTAINER_W) * GW,
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

            <View
              style={{
                position: "absolute",
                left: HOUSE_LEFT,
                top: HOUSE_TOP,
                width: HOUSE_W,
                height: HOUSE_H,
                zIndex: 1,
                elevation: 1,
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

            <View
              style={[
                styles.character,
                {
                  left: START_X - CHAR_SIZE / 2,
                  top: START_Y - CHAR_SIZE / 2,
                  transform: [{ scale: CHAR_SCALE }],
                  zIndex: 25,
                  elevation: 25,
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
          </View>
        )}

        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.overlayFill} />
          <View style={styles.overlayContent}>
            <AppText variant="h1" style={styles.overlayText}>
              See Your Garden Grow
            </AppText>
            <TouchableOpacity
              style={styles.overlayButton}
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/game")}
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
  character: {
    position: "absolute",
    width: CHAR_SIZE,
    height: CHAR_SIZE,
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
