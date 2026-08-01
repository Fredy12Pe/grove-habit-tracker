/**
 * Live-view snippet of the island game for the Garden tab and onboarding.
 * Renders the same shared WorldScene as app/(tabs)/game.tsx in read-only mode.
 */

import { AppText } from "@/components/ui/AppText";
import { WorldScene } from "@/components/game/world/WorldScene";
import {
  CHAR_SCALE,
  CHAR_SIZE,
  CharacterSprite,
} from "@/components/game/world/sprites";
import { getCurrentMonthWeekIndex } from "@/lib/game/gardenBackupGrid";
import { getIslandWorldLayout } from "@/lib/game/islandWorldLayout";
import { createIslandNavigation } from "@/lib/game/world/navigation";
import { gameSelection } from "@/lib/gameHaptics";
import { useHabitStore } from "@/lib/store";
import { GroveColors, GroveSpacing } from "@/styles/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const ARROW_NUDGE_PX = 5;
const ARROW_NUDGE_MS = 700;

/** >1 zooms past "fill" so the preview crops tighter on the character at START. */
const PREVIEW_ZOOM = 1.4;

/** Positive = pan view right (world shifts left; more of the scene to the right of the character). */
const PREVIEW_PAN_X = 300;

/** Positive = pan view down (world shifts up; more of the scene below the character). */
const PREVIEW_PAN_Y = 100;

export function GamePreview({
  showOverlay = true,
}: {
  /** When false, hides the CTA overlay (useful for onboarding). */
  showOverlay?: boolean;
}) {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const habits = useHabitStore((s) => s.habits);
  const completionDates = useHabitStore((s) => s.completionDates);
  const currentWeekPlot = getCurrentMonthWeekIndex();

  const layout = useMemo(
    () => getIslandWorldLayout(windowHeight),
    [windowHeight],
  );
  const behindSet = useMemo(() => {
    const nav = createIslandNavigation(layout, windowWidth, windowHeight);
    return nav.computeStaticBehindSet(layout.START_Y);
  }, [layout, windowWidth, windowHeight]);

  const [box, setBox] = useState<{ width: number; height: number } | null>(
    null,
  );
  const arrowNudge = useRef(new Animated.Value(0)).current;

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
    if (width > 0 && height > 0) setBox({ width, height });
  };

  const scale = box
    ? Math.max(box.width / layout.WORLD_W, box.height / layout.WORLD_H) *
      PREVIEW_ZOOM
    : 1;
  const cameraX = box ? box.width / 2 - layout.START_X * scale - PREVIEW_PAN_X : 0;
  const cameraY = box
    ? box.height / 2 - layout.START_Y * scale - PREVIEW_PAN_Y
    : 0;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.touchable}>
        {box && (
          <View
            style={[
              styles.worldWrap,
              {
                width: layout.WORLD_W,
                height: layout.WORLD_H,
                transformOrigin: "left top",
                transform: [
                  { scale },
                  { translateX: cameraX },
                  { translateY: cameraY },
                ],
              },
            ]}
          >
            <WorldScene
              layout={layout}
              mode="preview"
              habits={habits}
              completionDates={completionDates}
              currentWeekPlot={currentWeekPlot}
              behindSet={behindSet}
            >
              <View
                style={[
                  styles.character,
                  {
                    left: layout.START_X - CHAR_SIZE / 2,
                    top: layout.START_Y - CHAR_SIZE / 2,
                    transform: [{ scale: CHAR_SCALE }],
                    zIndex: 25,
                    elevation: 25,
                  },
                ]}
              >
                <CharacterSprite animKey="idle" />
              </View>
            </WorldScene>
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
});
