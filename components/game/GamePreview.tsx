/**
 * Live-view snippet of the island game for the Garden tab.
 * Uses the same world layout and assets as app/(tabs)/game.tsx (getIslandWorldLayout).
 */

import { AppText } from "@/components/ui/AppText";
import { gardenActiveWeekOvalBox } from "@/lib/game/gardenTriggerOval";
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
import { gameSelection } from "@/lib/gameHaptics";
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
  Text,
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
const CHARACTER_ATLAS = require("@/assets/Game/character-atlas.png");

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

export function GamePreview({
  showOverlay = true,
}: {
  /** When false, hides the CTA overlay (useful for onboarding). */
  showOverlay?: boolean;
}) {
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
    COW_EATING_FRAMES,
    COW_FRAME_COUNT,
    COW_ANIM_INTERVAL_MS,
    COW_DISPLAY_W,
    COW_DISPLAY_H,
    COW_WORLD_X,
    COW_WORLD_Y,
    COW_DEPTH_Y,
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
    ACTIVITIES_HEADING,
    ACTIVITIES_BREATHING,
    ACTIVITIES_PUZZLES,
    ACTIVITIES_GRATITUDE,
    ACTIVITIES_HEADING_LEFT,
    ACTIVITIES_HEADING_TOP,
    ACTIVITIES_HEADING_W,
    ACTIVITIES_HEADING_H,
    ACTIVITIES_ICONS_TOP,
    ACTIVITIES_BREATHING_LEFT,
    ACTIVITIES_PUZZLES_LEFT,
    ACTIVITIES_GRATITUDE_LEFT,
    ACTIVITIES_ICON_W,
    ACTIVITIES_ICON_H,
    ACTIVITIES_DEPTH_Y,
    BIG_TREE,
    BIG_TREE_DISPLAY_W,
    BIG_TREE_DISPLAY_H,
    BIG_TREE_WORLD_X,
    BIG_TREE_WORLD_Y,
    BIG_TREE_DEPTH_Y,
    WELL,
    WELL_DISPLAY_W,
    WELL_DISPLAY_H,
    WELL_LEFT,
    WELL_TOP,
    WELL_DEPTH_Y,
    PLANT,
    PLANT_DISPLAY_W,
    PLANT_DISPLAY_H,
    PLANT_LEFT,
    PLANT_TOP,
    PLANT_DEPTH_Y,
    TREE_SHAKE_FRAMES,
    SHAKE_TREE_DISPLAY_W,
    SHAKE_TREE_DISPLAY_H,
    SHAKE_TREE_WORLD_X,
    SHAKE_TREE_WORLD_Y,
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
    WALKWAY,
    WALKWAY_DISPLAY_W,
    WALKWAY_DISPLAY_H,
    WALKWAY_LEFT,
    WALKWAY_TOP,
  } = island;

  const activitiesHeadingFloatPx = Math.max(
    3,
    Math.round(ACTIVITIES_HEADING_H * 0.12),
  );

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
  const charBehindCow = feetY < COW_DEPTH_Y;
  const charBehindActivities = feetY < ACTIVITIES_DEPTH_Y;
  const charBehindChicken = feetY < CHICKEN_DEPTH_Y;
  const charBehindBigTree = feetY < BIG_TREE_DEPTH_Y;
  const charBehindWell = feetY < WELL_DEPTH_Y;
  const charBehindPlant = feetY < PLANT_DEPTH_Y;
  const charBehindTallBush = feetY < TALL_BUSH_DEPTH_Y;

  const [layout, setLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [idleFrame, setIdleFrame] = useState(0);
  const [cowFrameIndex, setCowFrameIndex] = useState(0);
  const [chickenIdleFrameIndex, setChickenIdleFrameIndex] = useState(0);
  const [chickenPeckFrameIndex, setChickenPeckFrameIndex] = useState(0);
  const [chickenPeckPlaying, setChickenPeckPlaying] = useState(false);
  const arrowNudge = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const activitiesHeadingFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => {
      setIdleFrame((f) => (f + 1) % IDLE_FRAME_COUNT);
    }, IDLE_ANIM_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCowFrameIndex((i) => (i + 1) % COW_FRAME_COUNT);
    }, COW_ANIM_INTERVAL_MS);
    return () => clearInterval(id);
  }, [COW_FRAME_COUNT, COW_ANIM_INTERVAL_MS]);

  useEffect(() => {
    if (chickenPeckPlaying) return;
    const id = setInterval(() => {
      setChickenIdleFrameIndex((i) => (i + 1) % CHICKEN_IDLE_FRAME_COUNT);
    }, CHICKEN_ANIM_INTERVAL_MS);
    return () => clearInterval(id);
  }, [
    chickenPeckPlaying,
    CHICKEN_IDLE_FRAME_COUNT,
    CHICKEN_ANIM_INTERVAL_MS,
  ]);

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
  }, [
    chickenPeckPlaying,
    CHICKEN_PECK_FRAME_COUNT,
    CHICKEN_ANIM_INTERVAL_MS,
  ]);

  useEffect(() => {
    if (chickenPeckPlaying) return;
    const t = setTimeout(() => {
      setChickenPeckPlaying(true);
    }, CHICKEN_IDLE_BEFORE_PECK_MS);
    return () => clearTimeout(t);
  }, [chickenPeckPlaying, CHICKEN_IDLE_BEFORE_PECK_MS]);

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

  useEffect(() => {
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
  }, [activitiesHeadingFloat]);

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
                left: BIG_TREE_WORLD_X - BIG_TREE_DISPLAY_W / 2,
                top: BIG_TREE_WORLD_Y - BIG_TREE_DISPLAY_H,
                width: BIG_TREE_DISPLAY_W,
                height: BIG_TREE_DISPLAY_H,
                zIndex: charBehindBigTree ? 26 : 0,
                elevation: Platform.OS === "android" && charBehindBigTree ? 26 : 0,
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
                zIndex: charBehindWell ? 26 : 1,
                elevation: Platform.OS === "android" && charBehindWell ? 26 : 0,
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
                zIndex: charBehindPlant ? 26 : 2,
                elevation:
                  Platform.OS === "android" && charBehindPlant ? 26 : 0,
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

            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: ACTIVITIES_HEADING_LEFT,
                top: ACTIVITIES_HEADING_TOP,
                width: ACTIVITIES_HEADING_W,
                height: ACTIVITIES_HEADING_H,
                overflow: "visible",
                zIndex: charBehindActivities ? 26 : 10,
                elevation:
                  Platform.OS === "android" && charBehindActivities ? 26 : 0,
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
                        outputRange: [0, -activitiesHeadingFloatPx],
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
                <View
                  style={styles.activitiesHeadingTextWrap}
                  pointerEvents="none"
                >
                  <Text
                    accessibilityRole="header"
                    accessibilityLabel="Activities"
                    style={[
                      styles.activitiesHeadingText,
                      {
                        fontSize: Math.min(
                          18,
                          Math.max(
                            11,
                            Math.round(ACTIVITIES_HEADING_H * 0.42),
                          ),
                        ),
                      },
                    ]}
                  >
                    Activities
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
                zIndex: charBehindActivities ? 26 : 10,
                elevation:
                  Platform.OS === "android" && charBehindActivities ? 26 : 0,
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
                zIndex: charBehindActivities ? 26 : 10,
                elevation:
                  Platform.OS === "android" && charBehindActivities ? 26 : 0,
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
                zIndex: charBehindActivities ? 26 : 10,
                elevation:
                  Platform.OS === "android" && charBehindActivities ? 26 : 0,
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

            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: SHAKE_TREE_WORLD_X - SHAKE_TREE_DISPLAY_W / 2,
                top: SHAKE_TREE_WORLD_Y - SHAKE_TREE_DISPLAY_H,
                width: SHAKE_TREE_DISPLAY_W,
                height: SHAKE_TREE_DISPLAY_H,
                overflow: "hidden",
                zIndex: 11,
              }}
            >
              <Image
                source={TREE_SHAKE_FRAMES[0]}
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
                zIndex: charBehindCow ? 26 : 12,
                elevation: Platform.OS === "android" && charBehindCow ? 26 : 0,
              }}
            >
              <Image
                source={COW_EATING_FRAMES[cowFrameIndex]}
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
                zIndex: charBehindChicken ? 26 : 13,
                elevation: Platform.OS === "android" && charBehindChicken ? 26 : 0,
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
                  {i === currentWeekPlot ? (
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        ...gardenActiveWeekOvalBox(GW, GH),
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        zIndex: 12,
                      }}
                    />
                  ) : null}
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
              source={WALKWAY}
              style={{
                position: "absolute",
                left: WALKWAY_LEFT,
                top: WALKWAY_TOP,
                width: WALKWAY_DISPLAY_W,
                height: WALKWAY_DISPLAY_H,
                zIndex: 0,
              }}
              resizeMode="stretch"
            />

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
            </View>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: HOUSE_LEFT + HIMG_X,
                top: HOUSE_TOP + HIMG_Y,
                width: HIMG_W,
                height: HIMG_H,
                zIndex: 2,
                elevation: Platform.OS === "android" ? 2 : 0,
              }}
            >
              <Image
                source={HOUSE_IMAGE}
                style={{ width: "100%", height: "100%" }}
                resizeMode="stretch"
              />
            </View>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: HOUSE_LEFT + HDRAWER_X,
                top: HOUSE_TOP + HDRAWER_Y,
                width: HDRAWER_W,
                height: HDRAWER_H,
                zIndex: 2,
                elevation: Platform.OS === "android" ? 2 : 0,
              }}
            >
              <Image
                source={HOUSE_DRAWER}
                style={{ width: "100%", height: "100%" }}
                resizeMode="stretch"
              />
            </View>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: HOUSE_LEFT + HBED_X,
                top: HOUSE_TOP + HBED_Y,
                width: HBED_W,
                height: HBED_H,
                zIndex: 2,
                elevation: Platform.OS === "android" ? 2 : 0,
              }}
            >
              <Image
                source={HOUSE_BED}
                style={{ width: "100%", height: "100%" }}
                resizeMode="stretch"
              />
            </View>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: HOUSE_LEFT + HDESK_X,
                top: HOUSE_TOP + HDESK_Y,
                width: HDESK_W,
                height: HDESK_H,
                zIndex: 2,
                elevation: Platform.OS === "android" ? 2 : 0,
              }}
            >
              <Image
                source={HOUSE_DESK}
                style={{ width: "100%", height: "100%" }}
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
                zIndex: charBehindTallBush ? 26 : 2,
                elevation:
                  Platform.OS === "android" && charBehindTallBush ? 26 : 0,
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

            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: HOUSE_FRONT_LEFT,
                top: HOUSE_FRONT_TOP,
                width: HOUSE_FRONT_W,
                height: HOUSE_FRONT_H,
                zIndex: 26,
                elevation: Platform.OS === "android" ? 26 : 0,
              }}
            >
              <Image
                source={HOUSE_FRONT}
                style={{ width: "100%", height: "100%" }}
                resizeMode="stretch"
              />
            </View>
          </View>
        )}

        {showOverlay ? (
          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.overlayFill} />
            <View style={styles.overlayContent}>
              <AppText variant="h1" style={styles.overlayText}>
                See Your Garden Grow
              </AppText>
              <TouchableOpacity
                style={styles.overlayButton}
                activeOpacity={0.8}
                onPress={() => {
                  gameSelection();
                  router.replace({
                    pathname: "/(tabs)/game",
                    params: { resetFromHome: String(Date.now()) },
                  });
                }}
              >
                <Animated.View
                  style={{ transform: [{ translateX: arrowNudge }] }}
                >
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color="#5D6D00"
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
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
