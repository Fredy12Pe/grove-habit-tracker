import { useAuth } from "@/contexts/auth-context";
import { gameSelection } from "@/lib/gameHaptics";
import { useIsFocused } from "@react-navigation/native";
import { Redirect, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import type { VideoPlayerStatus } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SLEEP_VIDEO = require("@/assets/Game/house/bed-sleeping/character-sleeping.mp4");

/**
 * Known duration of the sleep animation in seconds. Used as a fallback
 * finish timer so we never get stuck on this screen, even if the native
 * `playToEnd` event fails to fire.
 */
const SLEEP_VIDEO_DURATION_SECONDS = 6.6;

/**
 * Extra grace time added on top of the known duration before we force-exit.
 */
const SLEEP_VIDEO_EXIT_GRACE_MS = 1200;

/**
 * Max wait for the asset to become `readyToPlay` before we assume something
 * went wrong and bail back to the game.
 */
const SLEEP_VIDEO_READY_TIMEOUT_MS = 6000;

function HouseBedContent() {
  const router = useRouter();
  const isFocused = useIsFocused();

  const finishedRef = useRef(false);
  const playStartedAtRef = useRef<number | null>(null);
  const hardExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<VideoPlayerStatus>("loading");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(SLEEP_VIDEO, (p) => {
    p.loop = false;
    p.muted = true;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  const clearHardExitTimer = useCallback(() => {
    if (hardExitTimerRef.current) {
      clearTimeout(hardExitTimerRef.current);
      hardExitTimerRef.current = null;
    }
  }, []);

  const clearReadyTimer = useCallback(() => {
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }
  }, []);

  const exitToGameWithReset = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearHardExitTimer();
    clearReadyTimer();
    try {
      player.pause();
    } catch {
      // Player may already be torn down.
    }
    router.replace({
      pathname: "/(tabs)/game",
      params: { resetHouseInterior: String(Date.now()) },
    });
  }, [player, router, clearHardExitTimer, clearReadyTimer]);

  const scheduleHardExit = useCallback(
    (msFromNow: number) => {
      clearHardExitTimer();
      hardExitTimerRef.current = setTimeout(() => {
        exitToGameWithReset();
      }, msFromNow);
    },
    [clearHardExitTimer, exitToGameWithReset],
  );

  useEffect(() => {
    const statusSub = player.addListener(
      "statusChange",
      ({ status: next }) => {
        setStatus(next);
        if (next === "readyToPlay") {
          clearReadyTimer();
          if (playStartedAtRef.current == null) {
            playStartedAtRef.current = Date.now();
          }
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }).start();
          try {
            player.play();
          } catch {
            // Ignore — we'll retry via the focus effect.
          }
          const fromDuration =
            typeof player.duration === "number" && player.duration > 0
              ? player.duration * 1000
              : SLEEP_VIDEO_DURATION_SECONDS * 1000;
          scheduleHardExit(fromDuration + SLEEP_VIDEO_EXIT_GRACE_MS);
        } else if (next === "error") {
          exitToGameWithReset();
        }
      },
    );

    const endSub = player.addListener("playToEnd", () => {
      exitToGameWithReset();
    });

    const timeSub = player.addListener("timeUpdate", ({ currentTime }) => {
      const d = player.duration;
      if (typeof d === "number" && d > 0 && currentTime >= d - 0.15) {
        exitToGameWithReset();
      }
    });

    return () => {
      statusSub.remove();
      endSub.remove();
      timeSub.remove();
    };
  }, [player, exitToGameWithReset, scheduleHardExit, clearReadyTimer, fadeAnim]);

  // Safety net: if the video never reaches `readyToPlay`, bail after a timeout.
  useEffect(() => {
    clearReadyTimer();
    readyTimerRef.current = setTimeout(() => {
      if (!finishedRef.current && status !== "readyToPlay") {
        exitToGameWithReset();
      }
    }, SLEEP_VIDEO_READY_TIMEOUT_MS);
    return clearReadyTimer;
  }, [status, exitToGameWithReset, clearReadyTimer]);

  useEffect(() => {
    if (!isFocused) {
      try {
        player.pause();
      } catch {
        // no-op
      }
      return;
    }
    if (!finishedRef.current) {
      try {
        player.play();
      } catch {
        // no-op
      }
    }
  }, [isFocused, player]);

  useEffect(() => {
    return () => {
      clearHardExitTimer();
      clearReadyTimer();
    };
  }, [clearHardExitTimer, clearReadyTimer]);

  const handleSkip = useCallback(() => {
    gameSelection();
    exitToGameWithReset();
  }, [exitToGameWithReset]);

  const showLoading = status !== "readyToPlay" && !finishedRef.current;

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
      </Animated.View>

      {showLoading ? (
        <View style={styles.loadingLayer} pointerEvents="none">
          <ActivityIndicator color="#FFFFFF" size="small" />
        </View>
      ) : null}

      <Pressable
        style={styles.skipOverlay}
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Wake up"
        hitSlop={12}
      >
        <Text style={styles.skipHint}>Tap to wake up</Text>
      </Pressable>
    </View>
  );
}

export default function HouseBedScreen() {
  const { initialized, session, needsOnboarding } = useAuth();
  if (!initialized) {
    return null;
  }
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }
  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  return <HouseBedContent />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  skipOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 24,
    paddingBottom: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  skipHint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
