import Constants, { ExecutionEnvironment } from "expo-constants";
import { useAssets } from "expo-asset";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { RiveRef } from "rive-react-native";
import {
  ActivityIndicator,
  Image,
  InteractionManager,
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Must match `assets/garden/Breath_therapy/sprout_breathing.riv` (state machine + trigger input names). */
const STATE_MACHINE_NAME = "State Machine 1";

const PHASE_TRIGGER: Record<
  "inhale" | "holdAfterInhale" | "exhale" | "holdAfterExhale",
  string
> = {
  inhale: "breathe in",
  holdAfterInhale: "hold",
  exhale: "breathe out",
  holdAfterExhale: "hold",
};

const sproutBreathingRive = require("@/assets/garden/Breath_therapy/sprout_breathing.riv");
const sproutFallback = require("@/assets/garden/Sprout.png");

export type BreathingPhase =
  | "inhale"
  | "holdAfterInhale"
  | "exhale"
  | "holdAfterExhale";

type Props = {
  style?: StyleProp<ViewStyle>;
  isActive: boolean;
  paused: boolean;
  /** Drives Rive state machine triggers in sync with the on-screen breath phase. */
  phase: BreathingPhase;
  /**
   * Fires once per active session when the native state machine has actually started
   * (after file + view are ready). Parent should start the breath wall-clock here so
   * the counter stays aligned with motion from the first frame.
   */
  onPlaybackReady?: () => void;
};

/**
 * Rive only runs in a development build. Expo Go has no Rive native module — we
 * show a static sprout image so the breathing screen still works.
 */
export function BreathingRivePlayer({
  style,
  isActive,
  paused,
  phase,
  onPlaybackReady,
}: Props) {
  const riveRef = useRef<RiveRef | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  /** Prior phase — used to detect a new box cycle (inhale after bottom hold). Cleared when session ends. */
  const prevPhaseRef = useRef<BreathingPhase | null>(null);
  /** SM already playing — avoid play() on every phase (that restarts timeline vs the wall-clock counter). */
  const playbackStartedRef = useRef(false);
  const wasPausedRef = useRef(false);
  /** One signal per active session — `onPlay` can repeat on loop/restart. */
  const playbackReadyNotifiedRef = useRef(false);

  const [riveAssets, riveAssetError] = useAssets([sproutBreathingRive]);

  const riveNative = useMemo(() => {
    if (isExpoGo) return null;
    return require("rive-react-native") as typeof import("rive-react-native");
  }, []);

  const riveUrl = riveAssets?.[0]?.localUri ?? null;

  const applyPhaseTrigger = useCallback((p: BreathingPhase) => {
    const name = PHASE_TRIGGER[p];
    try {
      riveRef.current?.fireState(STATE_MACHINE_NAME, name);
    } catch {
      // fireState can throw if inputs are missing; avoid crashing the screen
    }
  }, []);

  const startStateMachine = useCallback(() => {
    if (!riveNative) return;
    const { LoopMode, Direction } = riveNative;
    // Pass the state machine name; "" is unreliable and the SM may settle after one cycle.
    riveRef.current?.play(
      STATE_MACHINE_NAME,
      LoopMode.Loop,
      Direction.Auto,
      true,
    );
  }, [riveNative]);

  useEffect(() => {
    if (!isActive) {
      prevPhaseRef.current = null;
      playbackStartedRef.current = false;
      wasPausedRef.current = false;
      playbackReadyNotifiedRef.current = false;
      try {
        riveRef.current?.stop();
      } catch {
        /* native not ready */
      }
    }
  }, [isActive]);

  const notifyPlaybackReady = useCallback(() => {
    if (playbackReadyNotifiedRef.current) return;
    playbackReadyNotifiedRef.current = true;
    onPlaybackReady?.();
  }, [onPlaybackReady]);

  // Expo Go has no native Rive — treat as ready as soon as the session is active.
  useEffect(() => {
    if (!isExpoGo || !isActive) return;
    notifyPlaybackReady();
  }, [isExpoGo, isActive, notifyPlaybackReady]);

  const onRivePlay = useCallback(
    (_animationName: string, isStateMachine: boolean) => {
      if (!isActive || !isStateMachine) return;
      notifyPlaybackReady();
    },
    [isActive, notifyPlaybackReady],
  );

  /**
   * `onPlay` sometimes fires only after another layout or user interaction; the breath
   * timer waits on `onPlaybackReady`. Re-issue play + trigger after paint / idle, and
   * fall back to unblocking the timer so the session never stalls.
   */
  useEffect(() => {
    if (!isActive || isExpoGo || !riveUrl || paused) return;

    let cancelled = false;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled || playbackReadyNotifiedRef.current) return;
        try {
          startStateMachine();
          playbackStartedRef.current = true;
          applyPhaseTrigger(phaseRef.current);
        } catch {
          /* native not ready */
        }
      });
    });

    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      if (cancelled || playbackReadyNotifiedRef.current) return;
      try {
        startStateMachine();
        playbackStartedRef.current = true;
        applyPhaseTrigger(phaseRef.current);
      } catch {
        /* native not ready */
      }
    });

    const fallbackMs = 450;
    const timeoutId = setTimeout(() => {
      if (!cancelled) notifyPlaybackReady();
    }, fallbackMs);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      interactionHandle.cancel();
      clearTimeout(timeoutId);
    };
  }, [
    isActive,
    isExpoGo,
    paused,
    riveUrl,
    applyPhaseTrigger,
    startStateMachine,
    notifyPlaybackReady,
  ]);

  // One layout pass: pause, resume, and phase triggers. play() only when starting, resuming, or after stop() on a new box — not every phase.
  useLayoutEffect(() => {
    if (!isActive || isExpoGo || !riveNative || !riveUrl) return;

    if (paused) {
      try {
        riveRef.current?.pause();
      } catch {
        /* ignore */
      }
      wasPausedRef.current = true;
      return;
    }

    const resumed = wasPausedRef.current;
    wasPausedRef.current = false;

    const prev = prevPhaseRef.current;
    const newBoxCycle =
      phase === "inhale" && prev === "holdAfterExhale";
    prevPhaseRef.current = phase;

    try {
      if (newBoxCycle) {
        riveRef.current?.stop();
        startStateMachine();
        playbackStartedRef.current = true;
        applyPhaseTrigger(phase);
        return;
      }

      if (resumed || !playbackStartedRef.current) {
        startStateMachine();
        playbackStartedRef.current = true;
      }
      applyPhaseTrigger(phase);
    } catch {
      /* native not ready */
    }
  }, [phase, isActive, paused, riveUrl, applyPhaseTrigger, startStateMachine, riveNative]);

  useEffect(() => {
    if (riveAssetError) {
      console.warn("[BreathingRivePlayer] asset load error:", riveAssetError);
    }
  }, [riveAssetError]);

  if (isExpoGo) {
    return (
      <View style={style}>
        <Image
          source={sproutFallback}
          style={styles.fillContain}
          resizeMode="cover"
        />
      </View>
    );
  }

  const { default: Rive, Fit, Alignment } = riveNative!;

  if (!riveUrl) {
    return (
      <View style={[style, styles.loadingWrap]}>
        <ActivityIndicator color="#7C7B67" />
      </View>
    );
  }

  const restartAfterStop = () => {
    if (!isActive || paused) return;
    try {
      startStateMachine();
      applyPhaseTrigger(phaseRef.current);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={style}>
      <Rive
        ref={riveRef}
        url={riveUrl}
        style={styles.fill}
        fit={Fit.Cover}
        alignment={Alignment.Center}
        stateMachineName={STATE_MACHINE_NAME}
        autoplay={false}
        onPlay={onRivePlay}
        onStop={restartAfterStop}
        onError={(e) => {
          console.warn("[BreathingRivePlayer] Rive error:", e);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  fillContain: {
    width: "100%",
    height: "100%",
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
