/**
 * Shared island world renderer.
 *
 * Renders the full world (background, props, gardens, house, creatures) for both
 * the interactive game screen (mode="game") and the Garden tab preview
 * (mode="preview"). The character (and any screen-specific overlays) are passed
 * as `children`, positioned in world coordinates.
 *
 * Depth sorting: props the character can stand behind take zIndex 26 when their
 * id is in `behindSet` (see lib/game/world/navigation.ts), else their base z.
 */

import type { IslandWorldLayout } from "@/lib/game/islandWorldLayout";
import type { DepthPropId } from "@/lib/game/world/navigation";
import { gardenActiveWeekOvalBox } from "@/lib/game/gardenTriggerOval";
import {
  GARDEN_MAX_PLANTS,
  getGardenGridDimensionsForPlantCount,
  getGardenPlantSize,
  getPlantSlotCenters,
  getWeekCompletionCount,
  getWeekOfMonthDateRange,
  makeWeekKeyForPlot,
} from "@/lib/game/gardenBackupGrid";
import {
  FRAMES_PER_PLANT,
  getPlantIndexForHabitSlot,
  getPlantSprite,
} from "@/lib/game/plantSprites";
import type { CompletionDatesByHabit } from "@/lib/store/useHabitStore";
import type { Habit } from "@/lib/types";
import { Image as ExpoImage } from "expo-image";
import React, { memo, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ChickenSprite,
  CowSprite,
  FallingTreeSprite,
  ShakeTreeSprite,
} from "./sprites";

/** How much of each grid cell the plant sprite fills (see getGardenPlantSize). */
const GARDEN_PLANT_FILL = 1.8;

const ACTIVITY_TRIGGER_ZONE_FILL = "rgba(255, 255, 255, 0.1)";
const ACTIVITY_TRIGGER_ZONE_STROKE = "rgba(255, 255, 255, 0.32)";

export type WorldSceneMode = "game" | "preview";

export type WorldSceneProps = {
  layout: IslandWorldLayout;
  mode: WorldSceneMode;
  habits: Habit[];
  completionDates: CompletionDatesByHabit;
  currentWeekPlot: number;
  /** Prop ids the character currently draws behind (zIndex 26). */
  behindSet?: ReadonlySet<DepthPropId>;
  insideHouse?: boolean;
  /** Gates animation loops (game passes screen focus; preview stays true). */
  active?: boolean;
  /** Text inside the activities banner ("Activities" or the nearby activity name). */
  activitiesLabel?: string;
  treeFalling?: boolean;
  treeFallen?: boolean;
  onTreeFallEnd?: () => void;
  cowPetting?: boolean;
  onCowPetEnd?: () => void;
  shakeTreeShaking?: boolean;
  /** Bump to rewind the shake tree to its rest frame (e.g. scrolled off-screen). */
  shakeTreeResetKey?: number;
  onShakeTreeEnd?: () => void;
  /** Interaction zone squares in front of the activities kiosk (game only). */
  showActivityZones?: boolean;
  /** Renders the walk-area mask over the island (layout debugging). */
  showWalkAreaDebug?: boolean;
  /** Character and screen-specific overlays, in world coordinates. */
  children?: React.ReactNode;
};

const EMPTY_BEHIND: ReadonlySet<DepthPropId> = new Set();

/** Absolute wrapper whose z flips to 26 while the character is behind the prop. */
function DepthProp({
  behind,
  baseZ,
  left,
  top,
  width,
  height,
  overflow,
  centerBottom,
  children,
}: {
  behind: boolean;
  baseZ: number;
  left: number;
  top: number;
  width: number;
  height: number;
  overflow?: "hidden" | "visible";
  /** Aligns content to the bottom center (falling tree pattern). */
  centerBottom?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        overflow,
        ...(centerBottom
          ? { alignItems: "center" as const, justifyContent: "flex-end" as const }
          : null),
        zIndex: behind ? 26 : baseZ,
        elevation: Platform.OS === "android" && behind ? 26 : 0,
      }}
    >
      {children}
    </View>
  );
}

/** One garden plot: floor, fences, and habit-driven plants for its week-of-month. */
const GardenPlot = memo(function GardenPlot({
  layout,
  plotIndex,
  habits,
  completionDates,
  currentWeekPlot,
  slotCenters,
  plantSize,
  highlightOpacity,
  showHighlight,
}: {
  layout: IslandWorldLayout;
  plotIndex: number;
  habits: Habit[];
  completionDates: CompletionDatesByHabit;
  currentWeekPlot: number;
  slotCenters: { x: number; y: number }[];
  plantSize: number;
  highlightOpacity: number;
  showHighlight: boolean;
}) {
  const L = layout;
  const pos = L.GARDEN_POSITIONS[plotIndex];
  const gLeft = L.ISLAND_LEFT + pos.x * L.ISLAND_W - L.GW / 2;
  const gTop = L.ISLAND_TOP + pos.y * L.ISLAND_H - L.GH / 2;

  return (
    <View
      style={{
        position: "absolute",
        left: gLeft,
        top: gTop,
        width: L.GW,
        height: L.GH,
      }}
    >
      <Image
        source={L.GARDEN_FLOOR}
        style={{
          position: "absolute",
          left: ((L.G_CONTAINER_W - L.G_FLOOR.w) / 2 / L.G_CONTAINER_W) * L.GW,
          top: ((L.G_CONTAINER_H - L.G_FLOOR.h) / 2 / L.G_CONTAINER_H) * L.GH,
          width: (L.G_FLOOR.w / L.G_CONTAINER_W) * L.GW,
          height: (L.G_FLOOR.h / L.G_CONTAINER_H) * L.GH,
        }}
        resizeMode="stretch"
      />
      <Image
        source={L.GARDEN_BACK}
        style={{
          position: "absolute",
          left: ((L.G_CONTAINER_W - L.G_BACK.w) / 2 / L.G_CONTAINER_W) * L.GW,
          top: 0,
          width: (L.G_BACK.w / L.G_CONTAINER_W) * L.GW,
          height: (L.G_BACK.h / L.G_CONTAINER_H) * L.GH,
        }}
        resizeMode="stretch"
      />
      <Image
        source={L.GARDEN_SIDES}
        style={{
          position: "absolute",
          left: ((L.G_CONTAINER_W - L.G_SIDES.w) / 2 / L.G_CONTAINER_W) * L.GW,
          top: 0,
          width: (L.G_SIDES.w / L.G_CONTAINER_W) * L.GW,
          height: (L.G_SIDES.h / L.G_CONTAINER_H) * L.GH,
        }}
        resizeMode="stretch"
      />
      {/* Plants: this plot shows its week-of-month's completions; future weeks stay empty. */}
      {plotIndex <= currentWeekPlot &&
        habits.slice(0, GARDEN_MAX_PLANTS).map((habit, habitIndex) => {
          const slot = slotCenters[habitIndex];
          if (!slot) return null;
          const weekKey = makeWeekKeyForPlot(new Date(), plotIndex);
          const plantIndex = getPlantIndexForHabitSlot(habitIndex, weekKey);
          const weekRange = getWeekOfMonthDateRange(plotIndex);
          const count = getWeekCompletionCount(
            habit.id,
            completionDates,
            weekRange.start,
            weekRange.end,
          );
          const frame = Math.min(count, FRAMES_PER_PLANT - 1);
          return (
            <Image
              key={`${plotIndex}-${habit.id}`}
              source={getPlantSprite(plantIndex, frame)}
              style={{
                position: "absolute",
                left: slot.x - plantSize / 2,
                top: slot.y - plantSize / 2,
                width: plantSize,
                height: plantSize,
                zIndex: 2,
              }}
              resizeMode="contain"
            />
          );
        })}
      {showHighlight && plotIndex === currentWeekPlot ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            ...gardenActiveWeekOvalBox(L.GW, L.GH),
            backgroundColor: `rgba(255, 255, 255, ${highlightOpacity})`,
            zIndex: 12,
          }}
        />
      ) : null}
      {/* Front fence must draw above plants (Android needs elevation + wrapper for z-order). */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: ((L.G_CONTAINER_W - L.G_FRONT.w) / 2 / L.G_CONTAINER_W) * L.GW,
          top: L.GH - (L.G_FRONT.h / L.G_CONTAINER_H) * L.GH,
          width: (L.G_FRONT.w / L.G_CONTAINER_W) * L.GW,
          height: (L.G_FRONT.h / L.G_CONTAINER_H) * L.GH,
          zIndex: 20,
          elevation: Platform.OS === "android" ? 16 : 0,
        }}
      >
        <Image
          source={L.GARDEN_FRONTS[plotIndex]}
          style={{ width: "100%", height: "100%" }}
          resizeMode="stretch"
        />
      </View>
    </View>
  );
});

export function WorldScene({
  layout,
  mode,
  habits,
  completionDates,
  currentWeekPlot,
  behindSet = EMPTY_BEHIND,
  insideHouse = false,
  active = true,
  activitiesLabel = "Activities",
  treeFalling = false,
  treeFallen = false,
  onTreeFallEnd,
  cowPetting = false,
  onCowPetEnd,
  shakeTreeShaking = false,
  shakeTreeResetKey = 0,
  onShakeTreeEnd,
  showActivityZones = false,
  showWalkAreaDebug = false,
  children,
}: WorldSceneProps) {
  const L = layout;
  const isGame = mode === "game";

  const behind = (id: DepthPropId) => behindSet.has(id) && !insideHouse;

  // ── Garden grid (shared math for all four plots) ──────────────────────────
  const habitCountForGarden = Math.min(habits.length, GARDEN_MAX_PLANTS);
  const gardenGrid = useMemo(() => {
    const { cols, rows } = getGardenGridDimensionsForPlantCount(
      habitCountForGarden,
      L.BACKUP_GARDEN_FLOOR_RECT,
    );
    return {
      slotCenters: getPlantSlotCenters(L.BACKUP_GARDEN_FLOOR_RECT, cols, rows),
      plantSize: getGardenPlantSize(
        L.BACKUP_GARDEN_FLOOR_RECT,
        cols,
        rows,
        GARDEN_PLANT_FILL,
      ),
    };
  }, [habitCountForGarden, L]);

  // ── Ambient animations (arrow bob, activities banner float) ───────────────
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const headingFloat = useRef(new Animated.Value(0)).current;
  const headingFloatPx = Math.max(3, Math.round(L.ACTIVITIES_HEADING_H * 0.12));

  useEffect(() => {
    if (!active) return;
    const mkLoop = (value: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    const arrowLoop = mkLoop(arrowAnim, 900);
    const headingLoop = mkLoop(headingFloat, 1250);
    arrowLoop.start();
    headingLoop.start();
    return () => {
      arrowLoop.stop();
      headingLoop.stop();
    };
  }, [active, arrowAnim, headingFloat]);

  const activitiesZ = behind("activities") ? 26 : 10;
  const activitiesElevation =
    Platform.OS === "android" && behind("activities") ? 26 : 0;

  return (
    <>
      {/* Background + island */}
      <ExpoImage
        source={L.BG}
        style={{ position: "absolute", left: 0, top: 0, width: L.WORLD_W, height: L.WORLD_H }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <ExpoImage
        source={L.ISLAND}
        style={{
          position: "absolute",
          left: L.ISLAND_LEFT,
          top: L.ISLAND_TOP,
          width: L.ISLAND_W,
          height: L.ISLAND_H,
        }}
        contentFit="contain"
        cachePolicy="memory-disk"
      />

      {/* Big tree — left of the house */}
      <DepthProp
        behind={behind("bigTree")}
        baseZ={0}
        left={L.BIG_TREE_WORLD_X - L.BIG_TREE_DISPLAY_W / 2}
        top={L.BIG_TREE_WORLD_Y - L.BIG_TREE_DISPLAY_H}
        width={L.BIG_TREE_DISPLAY_W}
        height={L.BIG_TREE_DISPLAY_H}
      >
        <Image
          source={L.BIG_TREE}
          style={{ width: L.BIG_TREE_DISPLAY_W, height: L.BIG_TREE_DISPLAY_H }}
          resizeMode="contain"
        />
      </DepthProp>

      <DepthProp
        behind={behind("well")}
        baseZ={1}
        left={L.WELL_LEFT}
        top={L.WELL_TOP}
        width={L.WELL_DISPLAY_W}
        height={L.WELL_DISPLAY_H}
      >
        <Image
          source={L.WELL}
          style={{ width: L.WELL_DISPLAY_W, height: L.WELL_DISPLAY_H }}
          resizeMode="contain"
        />
      </DepthProp>

      <DepthProp
        behind={behind("plant")}
        baseZ={2}
        left={L.PLANT_LEFT}
        top={L.PLANT_TOP}
        width={L.PLANT_DISPLAY_W}
        height={L.PLANT_DISPLAY_H}
      >
        <Image
          source={L.PLANT}
          style={{ width: L.PLANT_DISPLAY_W, height: L.PLANT_DISPLAY_H }}
          resizeMode="contain"
        />
      </DepthProp>

      {/* Activities kiosk: floating banner + three icons */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: L.ACTIVITIES_HEADING_LEFT,
          top: L.ACTIVITIES_HEADING_TOP,
          width: L.ACTIVITIES_HEADING_W,
          height: L.ACTIVITIES_HEADING_H,
          overflow: "visible",
          zIndex: activitiesZ,
          elevation: activitiesElevation,
        }}
      >
        <Animated.View
          style={{
            width: L.ACTIVITIES_HEADING_W,
            height: L.ACTIVITIES_HEADING_H,
            transform: [
              {
                translateY: headingFloat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -headingFloatPx],
                }),
              },
            ],
          }}
        >
          <Image
            source={L.ACTIVITIES_HEADING}
            style={{ width: L.ACTIVITIES_HEADING_W, height: L.ACTIVITIES_HEADING_H }}
            resizeMode="contain"
          />
          <View style={styles.activitiesHeadingTextWrap} pointerEvents="none">
            <Text
              accessibilityRole="header"
              accessibilityLabel={activitiesLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={[
                styles.activitiesHeadingText,
                {
                  fontSize: Math.min(
                    18,
                    Math.max(11, Math.round(L.ACTIVITIES_HEADING_H * 0.42)),
                  ),
                },
              ]}
            >
              {activitiesLabel}
            </Text>
          </View>
        </Animated.View>
      </View>
      {(
        [
          [L.ACTIVITIES_BREATHING, L.ACTIVITIES_BREATHING_LEFT],
          [L.ACTIVITIES_PUZZLES, L.ACTIVITIES_PUZZLES_LEFT],
          [L.ACTIVITIES_GRATITUDE, L.ACTIVITIES_GRATITUDE_LEFT],
        ] as const
      ).map(([source, left], i) => (
        <View
          key={`activity-icon-${i}`}
          pointerEvents="none"
          style={{
            position: "absolute",
            left,
            top: L.ACTIVITIES_ICONS_TOP,
            width: L.ACTIVITIES_ICON_W,
            height: L.ACTIVITIES_ICON_H,
            zIndex: activitiesZ,
            elevation: activitiesElevation,
          }}
        >
          <Image
            source={source}
            style={{ width: L.ACTIVITIES_ICON_W, height: L.ACTIVITIES_ICON_H }}
            resizeMode="contain"
          />
        </View>
      ))}

      {/* Shake tree */}
      <DepthProp
        behind={behind("shakeTree")}
        baseZ={11}
        left={L.SHAKE_TREE_WORLD_X - L.SHAKE_TREE_DISPLAY_W / 2}
        top={L.SHAKE_TREE_WORLD_Y - L.SHAKE_TREE_DISPLAY_H}
        width={L.SHAKE_TREE_DISPLAY_W}
        height={L.SHAKE_TREE_DISPLAY_H}
        overflow="hidden"
      >
        <ShakeTreeSprite
          frames={L.TREE_SHAKE_FRAMES}
          width={L.SHAKE_TREE_DISPLAY_W}
          height={L.SHAKE_TREE_DISPLAY_H}
          shaking={shakeTreeShaking}
          resetKey={shakeTreeResetKey}
          onShakeEnd={onShakeTreeEnd}
        />
      </DepthProp>

      {/* Cow */}
      <DepthProp
        behind={behind("cow")}
        baseZ={12}
        left={L.COW_WORLD_X - L.COW_DISPLAY_W / 2}
        top={L.COW_WORLD_Y - L.COW_DISPLAY_H}
        width={L.COW_DISPLAY_W}
        height={L.COW_DISPLAY_H}
        overflow="hidden"
      >
        <CowSprite
          eatingFrames={L.COW_EATING_FRAMES}
          heartFrames={L.COW_HEART_FRAMES}
          intervalMs={L.COW_ANIM_INTERVAL_MS}
          heartIntervalMs={L.COW_HEART_ANIM_INTERVAL_MS}
          width={L.COW_DISPLAY_W}
          height={L.COW_DISPLAY_H}
          petting={cowPetting}
          onPetEnd={onCowPetEnd}
          active={active}
        />
      </DepthProp>

      {/* Chicken */}
      <DepthProp
        behind={behind("chicken")}
        baseZ={13}
        left={L.CHICKEN_WORLD_X - L.CHICKEN_DISPLAY_W / 2}
        top={L.CHICKEN_WORLD_Y - L.CHICKEN_DISPLAY_H}
        width={L.CHICKEN_DISPLAY_W}
        height={L.CHICKEN_DISPLAY_H}
        overflow="hidden"
      >
        <ChickenSprite
          idleFrames={L.CHICKEN_IDLE_FRAMES}
          peckFrames={L.CHICKEN_PECK_FRAMES}
          intervalMs={L.CHICKEN_ANIM_INTERVAL_MS}
          idleBeforePeckMs={L.CHICKEN_IDLE_BEFORE_PECK_MS}
          width={L.CHICKEN_DISPLAY_W}
          height={L.CHICKEN_DISPLAY_H}
          active={active}
        />
      </DepthProp>

      {/* Choppable tree */}
      <DepthProp
        behind={behind("tree")}
        baseZ={12}
        left={L.TREE_WORLD_X - L.TREE_DISPLAY_W / 2}
        top={L.TREE_WORLD_Y - L.TREE_DISPLAY_H}
        width={L.TREE_DISPLAY_W}
        height={L.TREE_DISPLAY_H}
        centerBottom
      >
        <FallingTreeSprite
          frames={L.TREE_FALL_FRAMES}
          width={L.TREE_DISPLAY_W}
          height={L.TREE_DISPLAY_H}
          falling={treeFalling}
          fallen={treeFallen}
          onFallEnd={onTreeFallEnd}
        />
      </DepthProp>

      {/* Gardens */}
      {L.GARDEN_POSITIONS.map((_, i) => (
        <GardenPlot
          key={i}
          layout={L}
          plotIndex={i}
          habits={habits}
          completionDates={completionDates}
          currentWeekPlot={currentWeekPlot}
          slotCenters={gardenGrid.slotCenters}
          plantSize={gardenGrid.plantSize}
          highlightOpacity={isGame ? 0.2 : 0.1}
          showHighlight={!insideHouse}
        />
      ))}

      {/* Walkway from door (under house frame; hidden while inside) */}
      {!insideHouse && (
        <ExpoImage
          source={L.WALKWAY}
          style={{
            position: "absolute",
            left: L.WALKWAY_LEFT,
            top: L.WALKWAY_TOP,
            width: L.WALKWAY_DISPLAY_W,
            height: L.WALKWAY_DISPLAY_H,
            zIndex: 0,
          }}
          contentFit="fill"
          cachePolicy="memory-disk"
        />
      )}

      {/* House floor (behind character when inside) */}
      <ExpoImage
        source={L.HOUSE_FLOOR}
        style={{
          position: "absolute",
          left: L.HOUSE_LEFT + L.INTERIOR_X,
          top: L.HOUSE_TOP + L.INTERIOR_Y,
          width: L.INTERIOR_W,
          height: L.INTERIOR_H,
          zIndex: 1,
        }}
        contentFit="fill"
        cachePolicy="memory-disk"
      />

      {/* House frame; furniture drawn above frame (z16) when inside */}
      <View
        style={{
          position: "absolute",
          left: L.HOUSE_LEFT,
          top: L.HOUSE_TOP,
          width: L.HOUSE_W,
          height: L.HOUSE_H,
          zIndex: insideHouse ? 15 : 1,
          elevation: insideHouse ? 15 : 1,
        }}
      >
        <Image
          source={L.HOUSE_FRAME}
          style={{ position: "absolute", left: 0, top: 0, width: L.HOUSE_W, height: L.HOUSE_H }}
          resizeMode="stretch"
        />
      </View>

      {/* Rooftop overlay (game only; preview keeps the dollhouse look) */}
      {isGame && !insideHouse && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: L.HOUSE_ROOFTOP_LEFT,
            top: L.HOUSE_ROOFTOP_TOP,
            width: L.HOUSE_ROOFTOP_W,
            height: L.HOUSE_ROOFTOP_H,
            zIndex: 2,
            elevation: Platform.OS === "android" ? 2 : 0,
          }}
        >
          <Image
            source={L.HOUSE_ROOFTOP}
            style={{ width: "100%", height: "100%" }}
            resizeMode="stretch"
          />
        </View>
      )}

      {/* Interior furniture — z16 when inside (above frame 15, above char 14) */}
      {(
        [
          [L.HOUSE_IMAGE, L.HIMG_X, L.HIMG_Y, L.HIMG_W, L.HIMG_H],
          [L.HOUSE_DRAWER, L.HDRAWER_X, L.HDRAWER_Y, L.HDRAWER_W, L.HDRAWER_H],
          [L.HOUSE_BED, L.HBED_X, L.HBED_Y, L.HBED_W, L.HBED_H],
          [L.HOUSE_DESK, L.HDESK_X, L.HDESK_Y, L.HDESK_W, L.HDESK_H],
        ] as const
      ).map(([source, x, y, w, h], i) => (
        <View
          key={`furniture-${i}`}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: L.HOUSE_LEFT + x,
            top: L.HOUSE_TOP + y,
            width: w,
            height: h,
            zIndex: insideHouse ? 16 : isGame ? 0 : 2,
            elevation: Platform.OS === "android" && insideHouse ? 16 : 0,
          }}
        >
          <Image
            source={source}
            style={{ width: "100%", height: "100%" }}
            resizeMode="stretch"
          />
        </View>
      ))}

      {/* Hill cliff bottoms (behind hills) + hills */}
      <ExpoImage
        source={L.HILLS_BTM1}
        style={{ position: "absolute", left: L.HBTM1_LEFT, top: L.HBTM1_TOP, width: L.HBTM1_W, height: L.HBTM1_H }}
        contentFit="fill"
        cachePolicy="memory-disk"
      />
      <ExpoImage
        source={L.HILLS_BTM2}
        style={{ position: "absolute", left: L.HBTM2_LEFT, top: L.HBTM2_TOP, width: L.HBTM2_W, height: L.HBTM2_H }}
        contentFit="fill"
        cachePolicy="memory-disk"
      />
      <ExpoImage
        source={L.HILLS}
        style={{ position: "absolute", left: L.HILLS_LEFT, top: L.HILLS_TOP, width: L.HILLS_W, height: L.HILLS_H }}
        contentFit="fill"
        cachePolicy="memory-disk"
      />

      <Image
        source={L.BUSH_2}
        style={{
          position: "absolute",
          left: L.BUSH_2_LEFT,
          top: L.BUSH_2_TOP,
          width: L.BUSH_2_W,
          height: L.BUSH_2_H,
          zIndex: 2,
        }}
        resizeMode="contain"
      />
      <Image
        source={L.ROCK}
        style={{
          position: "absolute",
          left: L.ROCK_LEFT,
          top: L.ROCK_TOP,
          width: L.ROCK_W,
          height: L.ROCK_H,
          zIndex: 2,
        }}
        resizeMode="contain"
      />

      <DepthProp
        behind={behind("tallBush")}
        baseZ={2}
        left={L.TALL_BUSH_LEFT}
        top={L.TALL_BUSH_TOP}
        width={L.TALL_BUSH_DISPLAY_W}
        height={L.TALL_BUSH_DISPLAY_H}
      >
        <Image
          source={L.TALL_BUSH}
          style={{ width: L.TALL_BUSH_DISPLAY_W, height: L.TALL_BUSH_DISPLAY_H }}
          resizeMode="contain"
        />
      </DepthProp>

      {/* House entrance arrow */}
      <Animated.View
        style={{
          position: "absolute",
          left: L.ARROW_X - L.ARROW_SIZE / 2,
          top: L.ARROW_Y,
          width: L.ARROW_SIZE,
          height: L.ARROW_SIZE,
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.8,
          transform: [
            {
              translateY: arrowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -L.ARROW_SIZE * 0.4],
              }),
            },
          ],
        }}
      >
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: L.ARROW_SIZE * 0.4,
            borderRightWidth: L.ARROW_SIZE * 0.4,
            borderBottomWidth: L.ARROW_SIZE * 0.6,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: "rgba(255,255,255,0.8)",
          }}
        />
      </Animated.View>

      {/* Walk-area mask (invisible unless debugging layout) */}
      {isGame && (
        <ExpoImage
          source={L.WALK_AREA}
          style={{
            position: "absolute",
            left: L.ISLAND_LEFT,
            top: L.ISLAND_TOP,
            width: L.ISLAND_W,
            height: L.ISLAND_H,
            opacity: showWalkAreaDebug ? 1 : 0,
          }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      )}

      {/* Character + screen-specific world overlays */}
      {children}

      {/* Activity interaction squares (always-on zone hints in the game) */}
      {showActivityZones &&
        !insideHouse &&
        (
          [
            L.ACTIVITIES_BREATHING_LEFT,
            L.ACTIVITIES_PUZZLES_LEFT,
            L.ACTIVITIES_GRATITUDE_LEFT,
          ] as const
        ).map((left, i) => {
          const half = Math.max(12, Math.round(L.ACTIVITIES_ICON_W * 0.34));
          const cx = left + L.ACTIVITIES_ICON_W / 2;
          const cy = Math.round(L.ACTIVITIES_GROUND_Y + Math.round(half * 0.45));
          return (
            <View
              key={`activity-trigger-zone-${i}`}
              pointerEvents="none"
              style={{
                position: "absolute",
                left: cx - half,
                top: cy - half,
                width: half * 2,
                height: half * 2,
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

      {/* House facade strip: covers the doorway from the camera side */}
      {(isGame ? insideHouse : true) && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: L.HOUSE_FRONT_LEFT,
            top: L.HOUSE_FRONT_TOP,
            width: L.HOUSE_FRONT_W,
            height: L.HOUSE_FRONT_H,
            zIndex: isGame ? 18 : 26,
            elevation: Platform.OS === "android" ? (isGame ? 18 : 26) : 0,
          }}
        >
          <Image
            source={L.HOUSE_FRONT}
            style={{ width: "100%", height: "100%" }}
            resizeMode="stretch"
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
});
