import { Joystick, type JoystickDelta } from "@/components/garden/Joystick";
import { GardenDetailsModal } from "@/components/game/GardenDetailsModal";
import { WorldScene } from "@/components/game/world/WorldScene";
import {
  CHAR_SCALE,
  CHAR_SCALE_INDOOR,
  CHAR_SIZE,
  CharacterSprite,
  type AnimKey,
} from "@/components/game/world/sprites";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getCurrentMonthWeekIndex } from "@/lib/game/gardenBackupGrid";
import { getIslandWorldLayout } from "@/lib/game/islandWorldLayout";
import {
  DEADZONE,
  FEET_OFFSET_Y,
  MOVE_INTERVAL,
  createIslandNavigation,
  type DepthPropId,
} from "@/lib/game/world/navigation";
import {
  playCowPettingSound,
  playDoorCloseSound,
  playDoorOpenSound,
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
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

// ─── World setup ──────────────────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get("window");
const layout = getIslandWorldLayout(H);
const nav = createIslandNavigation(layout, W, H);

/**
 * World + UI hit zones for tuning (walk mask, circles, button outlines).
 * Keep false for players; set true when adjusting layout.
 */
const GAME_INTERACTION_DEBUG = false;

const ACTIVITY_ACTION_LABELS = ["Breathing", "Puzzles", "Gratitude"] as const;
const ACTIVITY_ROUTES = ["/breathe", "/puzzles", "/gratitude"] as const;

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

/** Proximity flags updated by the game loop; one state object, changed only on flips. */
type Proximity = {
  door: boolean;
  desk: boolean;
  bed: boolean;
  garden: number;
  activity: number;
  tree: boolean;
  shakeTree: boolean;
  cow: boolean;
};

const PROXIMITY_NONE: Proximity = {
  door: false,
  desk: false,
  bed: false,
  garden: -1,
  activity: -1,
  tree: false,
  shakeTree: false,
  cow: false,
};

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
  const isFocused = useIsFocused();

  // ── World state ────────────────────────────────────────────────────────────
  const joystickRef = useRef<JoystickDelta>({ x: 0, y: 0 });
  const worldPosRef = useRef({ x: layout.START_X, y: layout.START_Y });

  const cameraAnim = useRef(
    new Animated.ValueXY(nav.getCameraOffset(layout.START_X, layout.START_Y)),
  ).current;
  const charAnim = useRef(
    new Animated.ValueXY({
      x: layout.START_X - CHAR_SIZE / 2,
      y: layout.START_Y - CHAR_SIZE / 2,
    }),
  ).current;

  const [animKey, setAnimKey] = useState<AnimKey>("idle");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [insideHouse, setInsideHouse] = useState(false);
  const [prox, setProx] = useState<Proximity>(PROXIMITY_NONE);
  const [behindSet, setBehindSet] = useState<ReadonlySet<DepthPropId>>(
    () => new Set(),
  );
  const [gardenPopupIndex, setGardenPopupIndex] = useState(-1);

  const [treeFalling, setTreeFalling] = useState(false);
  const [treeFallen, setTreeFallen] = useState(false);
  const [cowPetting, setCowPetting] = useState(false);
  const [shakeTreeShaking, setShakeTreeShaking] = useState(false);
  const [shakeTreeResetKey, setShakeTreeResetKey] = useState(0);

  // Refs mirroring state the 16ms loop and stable callbacks need to read.
  const dirRef = useRef<AnimKey>("idle");
  const insideHouseRef = useRef(false);
  const proxRef = useRef<Proximity>(PROXIMITY_NONE);
  const behindKeyRef = useRef("");
  const treeFallingRef = useRef(false);
  const treeFallenRef = useRef(false);
  const shakeTreeShakingRef = useRef(false);
  const treeWasOnScreenRef = useRef(false);
  const shakeTreeWasOnScreenRef = useRef(false);
  const soundEnabledRef = useRef(false);
  const isFocusedRef = useRef(isFocused);
  const lastFootstepFrameRef = useRef<number | null>(null);

  soundEnabledRef.current = soundEnabled;
  isFocusedRef.current = isFocused;
  treeFallingRef.current = treeFalling;
  treeFallenRef.current = treeFallen;
  shakeTreeShakingRef.current = shakeTreeShaking;

  // ── Audio lifecycle ────────────────────────────────────────────────────────
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
    if (Platform.OS === "web") return;
    if (animKey === "idle" || !soundEnabled || !isFocused) {
      stopGameFootsteps();
    }
  }, [animKey, soundEnabled, isFocused]);

  /** Footsteps on walk-cycle contact frames (0 and 3). */
  const handleCharFrame = useCallback((frame: number, anim: AnimKey) => {
    if (Platform.OS === "web") return;
    if (!soundEnabledRef.current || !isFocusedRef.current || anim === "idle") {
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
  }, []);

  // ── Spawn / reset handling ─────────────────────────────────────────────────
  const placeCharacter = useCallback(
    (x: number, y: number, indoor: boolean) => {
      joystickRef.current = { x: 0, y: 0 };
      insideHouseRef.current = indoor;
      setInsideHouse(indoor);
      worldPosRef.current = { x, y };
      charAnim.setValue({ x: x - CHAR_SIZE / 2, y: y - CHAR_SIZE / 2 });
      cameraAnim.setValue(nav.getCameraOffset(x, y));
    },
    [cameraAnim, charAnim],
  );

  const resetToStartRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isFocused || !resetFromHome) return;
    if (resetToStartRef.current === resetFromHome) return;
    resetToStartRef.current = resetFromHome;
    placeCharacter(layout.START_X, layout.START_Y, false);
    router.setParams({ resetFromHome: undefined });
  }, [isFocused, placeCharacter, resetFromHome, router]);

  const resetHouseEntryRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isFocused || !resetHouseInterior) return;
    if (resetHouseEntryRef.current === resetHouseInterior) return;
    resetHouseEntryRef.current = resetHouseInterior;
    placeCharacter(layout.HOUSE_ENTER_POS.x, layout.HOUSE_ENTER_POS.y, true);
    router.setParams({ resetHouseInterior: undefined });
  }, [isFocused, placeCharacter, resetHouseInterior, router]);

  useFocusEffect(
    useCallback(() => {
      ensureDayReset();
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

  // ── Interactions ───────────────────────────────────────────────────────────
  const handleChopTree = useCallback(() => {
    if (treeFallenRef.current || treeFallingRef.current) return;
    gameImpactMedium();
    if (soundEnabledRef.current) {
      void playTreeChopSound();
    }
    setTreeFalling(true);
  }, []);

  const handleTreeFallEnd = useCallback(() => {
    setTreeFalling(false);
    setTreeFallen(true);
    gameImpactMedium();
  }, []);

  const handlePetCow = useCallback(() => {
    if (cowPetting) return;
    gameImpactLight();
    if (soundEnabledRef.current) {
      void playCowPettingSound();
    }
    setCowPetting(true);
  }, [cowPetting]);

  const handleCowPetEnd = useCallback(() => {
    setCowPetting(false);
    gameSuccess();
  }, []);

  const handleShakeTree = useCallback(() => {
    if (shakeTreeShakingRef.current) return;
    gameImpactRigid();
    if (soundEnabledRef.current) {
      void playTreeShakeSound();
    }
    setShakeTreeShaking(true);
  }, []);

  const handleShakeTreeEnd = useCallback(() => {
    setShakeTreeShaking(false);
  }, []);

  const handleMove = useCallback((delta: JoystickDelta) => {
    joystickRef.current = delta;
  }, []);

  const handleEnd = useCallback(() => {
    joystickRef.current = { x: 0, y: 0 };
  }, []);

  const handleEnterHouse = useCallback(() => {
    if (soundEnabledRef.current) {
      void playDoorOpenSound();
    }
    placeCharacter(layout.HOUSE_ENTER_POS.x, layout.HOUSE_ENTER_POS.y, true);
  }, [placeCharacter]);

  const handleExitHouse = useCallback(() => {
    if (soundEnabledRef.current) {
      void playDoorCloseSound();
    }
    const spawn = nav.getHouseExitSpawn();
    placeCharacter(spawn.x, spawn.y, false);
  }, [placeCharacter]);

  // ── Game loop: movement, camera, depth, proximity ──────────────────────────
  useEffect(() => {
    if (!isFocused) return;
    const id = setInterval(() => {
      const { x: jx, y: jy } = joystickRef.current;
      const isMoving = Math.abs(jx) > DEADZONE || Math.abs(jy) > DEADZONE;
      const indoor = insideHouseRef.current;

      if (isMoving) {
        const { x: curX, y: curY } = worldPosRef.current;
        const next = nav.stepMovement(curX, curY, jx, jy, indoor);
        worldPosRef.current = next;
        charAnim.setValue({
          x: next.x - CHAR_SIZE / 2,
          y: next.y - CHAR_SIZE / 2,
        });
        cameraAnim.setValue(nav.getCameraOffset(next.x, next.y));
      }

      const { x: px, y: py } = worldPosRef.current;

      // Depth: which props the character draws behind.
      const nextBehind = nav.computeBehindSet(px, py, indoor);
      const behindKey = Array.from(nextBehind).join(",");
      if (behindKey !== behindKeyRef.current) {
        behindKeyRef.current = behindKey;
        setBehindSet(nextBehind);
      }

      // Reset one-shot tree animations when they scroll off-screen.
      const treeOnScreen = nav.isTreeVisibleOnScreen(px, py);
      if (treeWasOnScreenRef.current && !treeOnScreen) {
        setTreeFalling(false);
        setTreeFallen(false);
        treeFallingRef.current = false;
        treeFallenRef.current = false;
      }
      treeWasOnScreenRef.current = treeOnScreen;

      const shakeTreeOnScreen = nav.isShakeTreeVisibleOnScreen(px, py);
      if (shakeTreeWasOnScreenRef.current && !shakeTreeOnScreen) {
        setShakeTreeShaking(false);
        shakeTreeShakingRef.current = false;
        setShakeTreeResetKey((k) => k + 1);
      }
      shakeTreeWasOnScreenRef.current = shakeTreeOnScreen;

      // Proximity triggers.
      const outdoorFeetY = py + FEET_OFFSET_Y;
      const next: Proximity = indoor
        ? {
            ...PROXIMITY_NONE,
            door: nav.isNearDoor(px, py, true),
            desk: nav.isNearHouseDesk(px, py),
            bed: nav.isNearHouseBed(px, py),
          }
        : {
            door: nav.isNearDoor(px, py, false),
            desk: false,
            bed: false,
            garden: nav.nearGardenIndex(px, outdoorFeetY),
            activity: nav.nearActivityIndex(px, outdoorFeetY),
            tree:
              nav.isNearTree(px, py) &&
              !treeFallenRef.current &&
              !treeFallingRef.current,
            shakeTree: nav.isNearShakeTree(px, py),
            cow: nav.isNearCow(px, py),
          };

      const prev = proxRef.current;
      if (
        next.door !== prev.door ||
        next.desk !== prev.desk ||
        next.bed !== prev.bed ||
        next.garden !== prev.garden ||
        next.activity !== prev.activity ||
        next.tree !== prev.tree ||
        next.shakeTree !== prev.shakeTree ||
        next.cow !== prev.cow
      ) {
        // Light haptic when entering any zone.
        if (
          (next.door && !prev.door) ||
          (next.desk && !prev.desk) ||
          (next.bed && !prev.bed) ||
          (next.garden >= 0 && prev.garden < 0) ||
          (next.activity >= 0 && prev.activity < 0) ||
          (next.tree && !prev.tree) ||
          (next.shakeTree && !prev.shakeTree) ||
          (next.cow && !prev.cow)
        ) {
          gameImpactLight();
        }
        proxRef.current = next;
        setProx(next);
      }

      // Facing / walk animation.
      const newDir = getAnimKey(jx, jy);
      if (newDir !== dirRef.current) {
        dirRef.current = newDir;
        setAnimKey(newDir);
      }
    }, MOVE_INTERVAL);

    return () => clearInterval(id);
  }, [cameraAnim, charAnim, isFocused]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const activitiesLabel =
    !insideHouse && prox.activity >= 0
      ? ACTIVITY_ACTION_LABELS[prox.activity]
      : "Activities";

  const charBehindIndoorFurniture = behindSet.has("indoorFurniture");
  const characterZ = insideHouse ? (charBehindIndoorFurniture ? 14 : 17) : 25;

  // Soft white veil behind the status bar so time/battery stay readable.
  const statusBarFadeHeight = insets.top + 20;

  return (
    <View style={styles.container}>
      <View
        pointerEvents="none"
        style={[styles.statusBarFade, { height: statusBarFadeHeight }]}
      >
        <Svg width={W} height={statusBarFadeHeight}>
          <Defs>
            <LinearGradient id="statusBarFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect
            width={W}
            height={statusBarFadeHeight}
            fill="url(#statusBarFade)"
          />
        </Svg>
      </View>

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
        style={[styles.world, { transform: cameraAnim.getTranslateTransform() }]}
      >
        <WorldScene
          layout={layout}
          mode="game"
          habits={habits}
          completionDates={completionDates}
          currentWeekPlot={currentWeekPlot}
          behindSet={behindSet}
          insideHouse={insideHouse}
          active={isFocused}
          activitiesLabel={activitiesLabel}
          treeFalling={treeFalling}
          treeFallen={treeFallen}
          onTreeFallEnd={handleTreeFallEnd}
          cowPetting={cowPetting}
          onCowPetEnd={handleCowPetEnd}
          shakeTreeShaking={shakeTreeShaking}
          shakeTreeResetKey={shakeTreeResetKey}
          onShakeTreeEnd={handleShakeTreeEnd}
          showActivityZones
          showWalkAreaDebug={GAME_INTERACTION_DEBUG}
        >
          {/* Character — inside: z14 behind furniture / z17 in front; outside: z25 */}
          <Animated.View
            style={[
              styles.character,
              {
                zIndex: characterZ,
                elevation: Platform.OS === "android" ? characterZ : 0,
                transform: [
                  ...charAnim.getTranslateTransform(),
                  { scale: insideHouse ? CHAR_SCALE_INDOOR : CHAR_SCALE },
                ],
              },
            ]}
          >
            <CharacterSprite
              animKey={animKey}
              active={isFocused}
              onFrame={handleCharFrame}
            />
          </Animated.View>

          {GAME_INTERACTION_DEBUG && <DebugZones insideHouse={insideHouse} />}
        </WorldScene>
      </Animated.View>

      {prox.door && (
        <TouchableOpacity
          onPress={() => {
            (insideHouse ? handleExitHouse : handleEnterHouse)();
          }}
          style={[
            styles.actionButton,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.actionButtonText}>
            {insideHouse ? "Exit" : "Enter"}
          </Text>
        </TouchableOpacity>
      )}

      {prox.desk && insideHouse && (
        <TouchableOpacity
          onPress={() => {
            gameSelection();
            router.push("/house-desk" as Href);
          }}
          style={[
            styles.actionButton,
            prox.door && styles.actionButtonOffset,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.actionButtonText}>Pomodoro</Text>
        </TouchableOpacity>
      )}

      {prox.bed && insideHouse && (
        <TouchableOpacity
          onPress={() => {
            gameSelection();
            router.push("/house-bed" as Href);
          }}
          style={[
            styles.actionButton,
            (prox.door || prox.desk) && styles.actionButtonOffset,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.actionButtonText}>Rest</Text>
        </TouchableOpacity>
      )}

      {prox.garden >= 0 && !insideHouse && (
        <TouchableOpacity
          onPress={() => {
            setGardenPopupIndex(prox.garden);
          }}
          style={[
            styles.actionButton,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.actionButtonText}>View Garden</Text>
        </TouchableOpacity>
      )}

      {prox.activity >= 0 && !insideHouse && (
        <TouchableOpacity
          onPress={() => {
            gameSelection();
            router.push(ACTIVITY_ROUTES[prox.activity]);
          }}
          style={[
            styles.actionButton,
            prox.garden >= 0 && styles.actionButtonOffset,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={styles.actionButtonText}>
            {ACTIVITY_ACTION_LABELS[prox.activity]}
          </Text>
        </TouchableOpacity>
      )}

      {prox.tree && !insideHouse && (
        <TouchableOpacity
          onPress={handleChopTree}
          style={[
            styles.actionButton,
            styles.chopTreeButton,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={[styles.actionButtonText, styles.chopTreeButtonText]}>
            Chop tree
          </Text>
        </TouchableOpacity>
      )}

      {prox.shakeTree && !insideHouse && (
        <TouchableOpacity
          onPress={handleShakeTree}
          style={[
            styles.actionButton,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
        >
          <Text style={[styles.actionButtonText, styles.shakeTreeButtonText]}>
            Shake tree
          </Text>
        </TouchableOpacity>
      )}

      {prox.cow && !insideHouse && (
        <TouchableOpacity
          onPress={handlePetCow}
          style={[
            styles.actionButton,
            cowPetting && styles.petCowButtonDisabled,
            GAME_INTERACTION_DEBUG && styles.interactionDebugUiOutline,
          ]}
          activeOpacity={1}
          disabled={cowPetting}
        >
          <Text style={[styles.actionButtonText, styles.petCowButtonText]}>
            Pet cow
          </Text>
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

// ─── Debug overlays (GAME_INTERACTION_DEBUG only) ─────────────────────────────

function DebugZones({ insideHouse }: { insideHouse: boolean }) {
  const z = nav.zones;
  const L = layout;
  if (insideHouse) {
    return (
      <>
        <View
          pointerEvents="none"
          style={[
            debugStyles.zone,
            {
              left: L.HOUSE_EXIT_X - L.HOUSE_EXIT_RX,
              top: L.HOUSE_EXIT_Y - L.HOUSE_EXIT_RY,
              width: L.HOUSE_EXIT_RX * 2,
              height: L.HOUSE_EXIT_RY * 2,
              borderRadius: L.HOUSE_EXIT_RY,
              borderColor: "#6A1B9A",
              backgroundColor: "rgba(106, 27, 154, 0.22)",
            },
          ]}
        />
        {([z.deskInteract, z.bedInteract] as const).map((e, i) => (
          <View
            key={`furniture-zone-${i}`}
            pointerEvents="none"
            style={[
              debugStyles.zone,
              {
                left: e.cx - e.rx,
                top: e.cy - e.ry,
                width: e.rx * 2,
                height: e.ry * 2,
                borderRadius: e.ry,
                borderColor: i === 0 ? "#00695C" : "#C62828",
                backgroundColor:
                  i === 0 ? "rgba(0, 105, 92, 0.2)" : "rgba(198, 40, 40, 0.18)",
              },
            ]}
          />
        ))}
      </>
    );
  }
  return (
    <>
      <View
        pointerEvents="none"
        style={[
          debugStyles.zone,
          {
            left: L.WALKWAY_LEFT - z.walkwayPadX,
            top: L.WALKWAY_TOP,
            width: L.WALKWAY_DISPLAY_W + 2 * z.walkwayPadX,
            height: L.WALKWAY_DISPLAY_H,
            borderColor: "#1565C0",
            backgroundColor: "rgba(21, 101, 192, 0.22)",
          },
        ]}
      />
      {z.gardenTriggers.map((g, i) => (
        <View
          key={`dbg-garden-${i}`}
          pointerEvents="none"
          style={[
            debugStyles.zone,
            {
              left: g.x - z.gardenTriggerRx,
              top: g.y - z.gardenTriggerRy,
              width: z.gardenTriggerRx * 2,
              height: z.gardenTriggerRy * 2,
              borderRadius: z.gardenTriggerRy,
              borderColor: "#2E7D32",
              backgroundColor: "rgba(46, 125, 50, 0.2)",
            },
          ]}
        />
      ))}
      {(
        [
          [L.TREE_INTERACT_CENTER_X, L.TREE_INTERACT_CENTER_Y, L.TREE_INTERACT_RADIUS, "#E65100", "rgba(230, 81, 0, 0.2)"],
          [L.SHAKE_TREE_INTERACT_CENTER_X, L.SHAKE_TREE_INTERACT_CENTER_Y, L.SHAKE_TREE_INTERACT_RADIUS, "#5D4037", "rgba(93, 64, 55, 0.2)"],
          [L.COW_INTERACT_CENTER_X, L.COW_INTERACT_CENTER_Y, L.COW_INTERACT_RADIUS, "#C2185B", "rgba(194, 24, 91, 0.2)"],
        ] as const
      ).map(([cx, cy, r, stroke, fill], i) => (
        <View
          key={`dbg-circle-${i}`}
          pointerEvents="none"
          style={[
            debugStyles.zone,
            {
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              borderColor: stroke,
              backgroundColor: fill,
            },
          ]}
        />
      ))}
    </>
  );
}

const debugStyles = StyleSheet.create({
  zone: {
    position: "absolute",
    borderWidth: 2,
    zIndex: 26,
    elevation: 26,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C5E8A0",
    overflow: "hidden",
  },
  statusBarFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 25,
    elevation: 25,
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
    width: layout.WORLD_W,
    height: layout.WORLD_H,
  },
  character: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CHAR_SIZE,
    height: CHAR_SIZE,
  },
  actionButton: {
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
  actionButtonOffset: {
    bottom: 308,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3a5a20",
  },
  chopTreeButton: {
    bottom: 293,
    zIndex: 21,
    elevation: 21,
  },
  chopTreeButtonText: {
    color: "#5a3d20",
  },
  shakeTreeButtonText: {
    color: "#3d4a20",
  },
  petCowButtonDisabled: {
    backgroundColor: "#E8E8E8",
  },
  petCowButtonText: {
    color: "#4a3d2a",
  },
});

