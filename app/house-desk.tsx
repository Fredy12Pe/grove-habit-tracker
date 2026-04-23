import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/auth-context";
import {
  gameImpactLight,
  gameImpactMedium,
  gameSelection,
} from "@/lib/gameHaptics";
import { GroveSpacing } from "@/styles/theme";
import { useIsFocused } from "@react-navigation/native";
import { Redirect, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  type AppStateStatus,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const STUDY_VIDEO = require("@/assets/Game/house/Pomodoro/Character_studying_202604171508.mp4");

const SCREEN_BG = "#9D754D";
const CARD_BG = "#8D6E63";
const CONTROL_SURFACE = "#A1887F";
const POMO_PANEL_BG = "#B88A5D";
const TEXT_WHITE = "#FFFFFF";
const BAR_COMPLETE = "#CDDC39";
const BAR_TODO = "#D7CCC8";

/**
 * 1:1 viewport (e.g. 1080×1080 framing).
 * Taller player + *negative* top offset shifts framing up (less floor / bottom of scene).
 */
const VIDEO_SQUARE_VERTICAL_SCALE = 2.0;
const VIDEO_SQUARE_TOP_BIAS_RATIO = -0.9;
const VIDEO_SQUARE_SCREEN_Y_SHIFT_RATIO = 0.14;

type Phase = "focus" | "shortBreak" | "longBreak";

type PomodoroSettings = {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  sessionsUntilLong: number;
};

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  sessionsUntilLong: 4,
};

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function phaseLabel(phase: Phase): string {
  switch (phase) {
    case "focus":
      return "FOCUS";
    case "shortBreak":
      return "SHORT BREAK";
    case "longBreak":
      return "LONG BREAK";
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function HouseDeskContent() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const squareSide = Math.min(screenW, screenH);
  const videoTop = squareSide * VIDEO_SQUARE_TOP_BIAS_RATIO;
  const videoHeight = squareSide * VIDEO_SQUARE_VERTICAL_SCALE;

  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [phase, setPhase] = useState<Phase>("focus");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const [secondsRemaining, setSecondsRemaining] = useState(
    DEFAULT_SETTINGS.focusMin * 60,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [timerEverStarted, setTimerEverStarted] = useState(false);
  const [pomodorosCompletedInCycle, setPomodorosCompletedInCycle] = useState(0);
  const completedRef = useRef(0);
  completedRef.current = pomodorosCompletedInCycle;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<PomodoroSettings>(DEFAULT_SETTINGS);

  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;

  const player = useVideoPlayer(STUDY_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    /**
     * The video is muted, so don't contend for the iOS audio session with the
     * game's ambience (expo-audio). `doNotMix` (the iOS default) would cause
     * the native video manager to tear down/rebuild the audio session, which
     * has been observed to race with `play()` and leave the player stuck.
     */
    p.audioMixingMode = "mixWithOthers";
    p.play();
  });

  const tryPlayVideo = useCallback(() => {
    if (!isFocusedRef.current) return;
    try {
      player.play();
    } catch {
      /* native layer not ready */
    }
  }, [player]);

  useEffect(() => {
    const statusSub = player.addListener("statusChange", ({ status: s }) => {
      if (s === "readyToPlay") {
        tryPlayVideo();
      } else if (s === "error") {
        // Transient load error — retry shortly in case the native side recovers.
        setTimeout(tryPlayVideo, 400);
      }
    });

    // Some iOS scenarios never re-fire `statusChange` after the VideoView mounts
    // (e.g. the player reached `readyToPlay` before listeners were attached).
    // A few staggered retries cover those races without spamming native calls.
    const retryTimers = [80, 300, 900, 2000].map((ms) =>
      setTimeout(tryPlayVideo, ms),
    );

    return () => {
      statusSub.remove();
      for (const t of retryTimers) clearTimeout(t);
    };
  }, [player, tryPlayVideo]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next === "active") {
        tryPlayVideo();
      }
    };
    const sub = AppState.addEventListener("change", onAppState);
    return () => {
      sub.remove();
    };
  }, [tryPlayVideo]);

  useEffect(() => {
    if (!isFocused) {
      try {
        player.pause();
      } catch {
        /* ignore */
      }
      setIsRunning(false);
      return;
    }
    tryPlayVideo();
  }, [isFocused, player, tryPlayVideo]);

  const secondsForPhase = useCallback((p: Phase, cfg: PomodoroSettings) => {
    switch (p) {
      case "focus":
        return cfg.focusMin * 60;
      case "shortBreak":
        return cfg.shortBreakMin * 60;
      case "longBreak":
        return cfg.longBreakMin * 60;
    }
  }, []);

  const onTimerElapsed = useCallback(() => {
    gameImpactMedium();
    const cfg = settingsRef.current;
    const p = phaseRef.current;

    if (p === "focus") {
      const nextDone = completedRef.current + 1;
      if (nextDone >= cfg.sessionsUntilLong) {
        completedRef.current = 0;
        setPomodorosCompletedInCycle(cfg.sessionsUntilLong);
        setPhase("longBreak");
        phaseRef.current = "longBreak";
        setSecondsRemaining(cfg.longBreakMin * 60);
      } else {
        completedRef.current = nextDone;
        setPomodorosCompletedInCycle(nextDone);
        setPhase("shortBreak");
        phaseRef.current = "shortBreak";
        setSecondsRemaining(cfg.shortBreakMin * 60);
      }
      return;
    }

    if (p === "shortBreak") {
      setPhase("focus");
      phaseRef.current = "focus";
      setSecondsRemaining(cfg.focusMin * 60);
      return;
    }

    completedRef.current = 0;
    setPomodorosCompletedInCycle(0);
    setPhase("focus");
    phaseRef.current = "focus";
    setSecondsRemaining(cfg.focusMin * 60);
  }, []);

  useEffect(() => {
    if (!isRunning || !isFocused) return;
    const id = setInterval(() => {
      setSecondsRemaining((s) => {
        if (s <= 0) return s;
        if (s === 1) {
          setTimeout(onTimerElapsed, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, isFocused, onTimerElapsed]);

  const handleResetSession = useCallback(() => {
    gameImpactLight();
    const cfg = settingsRef.current;
    setIsRunning(false);
    setTimerEverStarted(false);
    completedRef.current = 0;
    setPomodorosCompletedInCycle(0);
    setPhase("focus");
    phaseRef.current = "focus";
    setSecondsRemaining(secondsForPhase("focus", cfg));
  }, [secondsForPhase]);

  const handleStartPause = useCallback(() => {
    gameSelection();
    gameImpactLight();
    setIsRunning((r) => {
      if (!r) setTimerEverStarted(true);
      return !r;
    });
  }, []);

  const openSettings = useCallback(() => {
    gameImpactLight();
    setDraft(settingsRef.current);
    setSettingsOpen(true);
    setIsRunning(false);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const saveSettings = useCallback(() => {
    const prevCfg = settingsRef.current;
    const next = {
      focusMin: clamp(draft.focusMin, 1, 60),
      shortBreakMin: clamp(draft.shortBreakMin, 1, 30),
      longBreakMin: clamp(draft.longBreakMin, 1, 45),
      sessionsUntilLong: clamp(draft.sessionsUntilLong, 2, 8),
    };
    const p = phaseRef.current;
    const oldFull = secondsForPhase(p, prevCfg);
    setSettings(next);
    settingsRef.current = next;
    setSecondsRemaining((prev) =>
      prev === oldFull ? secondsForPhase(p, next) : prev,
    );
    const capped = Math.min(completedRef.current, next.sessionsUntilLong);
    completedRef.current = capped;
    setPomodorosCompletedInCycle(capped);
    setSettingsOpen(false);
    gameImpactLight();
  }, [draft, secondsForPhase]);

  const barCount = settings.sessionsUntilLong;
  const barsGreen =
    phase === "longBreak"
      ? barCount
      : Math.min(pomodorosCompletedInCycle, barCount);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.videoSquareClip,
          {
            width: squareSide,
            height: squareSide,
            left: (screenW - squareSide) / 2,
            top:
              (screenH - squareSide) / 2 +
              screenH * VIDEO_SQUARE_SCREEN_Y_SHIFT_RATIO,
          },
        ]}
      >
        <VideoView
          style={{
            position: "absolute",
            left: 0,
            top: videoTop,
            width: squareSide,
            height: videoHeight,
          }}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
      </View>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              gameSelection();
              router.back();
            }}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <IconSymbol name="chevron.left" size={22} color={TEXT_WHITE} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Pomodoro</Text>

        <View style={styles.timerCard}>
          <Text style={styles.timerDigits}>{formatMmSs(secondsRemaining)}</Text>
          <View style={styles.barsRow}>
            {Array.from({ length: barCount }, (_, i) => (
              <View
                key={`pom-bar-${i}`}
                style={[
                  styles.sessionBar,
                  i < barsGreen ? styles.sessionBarDone : styles.sessionBarTodo,
                ]}
              />
            ))}
          </View>
          <Text style={styles.phaseTag}>{phaseLabel(phase)}</Text>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.roundControl}
            onPress={handleResetSession}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reset timer"
          >
            <IconSymbol
              name="arrow.counterclockwise"
              size={22}
              color={TEXT_WHITE}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startPill}
            onPress={handleStartPause}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={
              isRunning ? "Pause" : timerEverStarted ? "Resume" : "Start"
            }
          >
            <Text style={styles.startPillText}>
              {isRunning ? "PAUSE" : timerEverStarted ? "RESUME" : "START"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roundControl}
            onPress={openSettings}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <IconSymbol name="gearshape" size={22} color={TEXT_WHITE} />
          </TouchableOpacity>
        </View>

        <Modal
          visible={settingsOpen}
          animationType="fade"
          transparent
          onRequestClose={closeSettings}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeSettings}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity
                  onPress={closeSettings}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close settings"
                >
                  <IconSymbol name="xmark" size={22} color={TEXT_WHITE} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSection}>Durations</Text>

              <DurationRow
                label="Focus session"
                valueMin={draft.focusMin}
                onChange={(v) => setDraft((d) => ({ ...d, focusMin: v }))}
                min={1}
                max={60}
                editableValue
              />
              <DurationRow
                label="Short break"
                valueMin={draft.shortBreakMin}
                onChange={(v) => setDraft((d) => ({ ...d, shortBreakMin: v }))}
                min={1}
                max={30}
              />
              <DurationRow
                label="Long break"
                valueMin={draft.longBreakMin}
                onChange={(v) => setDraft((d) => ({ ...d, longBreakMin: v }))}
                min={1}
                max={45}
              />
              <DurationRow
                label="Long break after"
                valueMin={draft.sessionsUntilLong}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, sessionsUntilLong: v }))
                }
                min={2}
                max={8}
                suffix="sessions"
              />

              <TouchableOpacity
                style={styles.saveSettingsBtn}
                onPress={saveSettings}
                activeOpacity={0.9}
              >
                <Text style={styles.saveSettingsText}>Save</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function DurationRow({
  label,
  valueMin,
  onChange,
  min,
  max,
  suffix = "min",
  editableValue = false,
}: {
  label: string;
  valueMin: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
  editableValue?: boolean;
}) {
  const [valueFocused, setValueFocused] = useState(false);
  const [valueText, setValueText] = useState(String(valueMin));

  useEffect(() => {
    if (!valueFocused) setValueText(String(valueMin));
  }, [valueMin, valueFocused]);

  const applyValue = (v: number) => {
    const n = clamp(v, min, max);
    onChange(n);
    if (editableValue && valueFocused) setValueText(String(n));
  };

  const commitTypedValue = () => {
    const digits = valueText.replace(/\D/g, "");
    if (digits === "") {
      setValueText(String(valueMin));
      setValueFocused(false);
      return;
    }
    applyValue(parseInt(digits, 10));
    setValueFocused(false);
  };

  const unitLabel = suffix === "min" ? " min" : ` ${suffix}`;

  return (
    <View style={styles.durationRow}>
      <Text style={styles.durationLabel}>{label}</Text>
      <View style={styles.durationControls}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => applyValue(valueMin - 1)}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </TouchableOpacity>
        {editableValue ? (
          <View style={styles.durationValueEditableWrap}>
            <TextInput
              style={styles.durationValueInput}
              value={valueFocused ? valueText : String(valueMin)}
              onChangeText={(t) =>
                setValueText(t.replace(/\D/g, "").slice(0, 2))
              }
              onFocus={() => {
                setValueFocused(true);
                setValueText(String(valueMin));
              }}
              onBlur={commitTypedValue}
              onSubmitEditing={commitTypedValue}
              keyboardType="number-pad"
              returnKeyType="done"
              selectTextOnFocus
              underlineColorAndroid="transparent"
              cursorColor={TEXT_WHITE}
              placeholderTextColor="rgba(255,255,255,0.45)"
            />
            <Text style={styles.durationUnit}>{unitLabel}</Text>
          </View>
        ) : (
          <Text style={styles.durationValue}>
            {valueMin}
            <Text style={styles.durationUnit}>{unitLabel}</Text>
          </Text>
        )}
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => applyValue(valueMin + 1)}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HouseDeskScreen() {
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
  return <HouseDeskContent />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  videoSquareClip: {
    position: "absolute",
    overflow: "hidden",
    zIndex: 0,
  },
  safe: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: POMO_PANEL_BG,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  title: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 34,
    fontWeight: "700",
    color: TEXT_WHITE,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  timerCard: {
    backgroundColor: POMO_PANEL_BG,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 28,
    marginHorizontal: 14,
    alignItems: "center",
  },
  timerDigits: {
    fontSize: 56,
    fontWeight: "700",
    color: TEXT_WHITE,
    fontVariant: ["tabular-nums"],
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 18,
    height: 28,
  },
  sessionBar: {
    width: 8,
    borderRadius: 3,
    alignSelf: "flex-end",
  },
  sessionBarDone: {
    height: 26,
    backgroundColor: BAR_COMPLETE,
  },
  sessionBarTodo: {
    height: 18,
    backgroundColor: BAR_TODO,
    opacity: 0.85,
  },
  phaseTag: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1.2,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 22,
    marginBottom: 24,
    marginHorizontal: 14,
  },
  roundControl: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: POMO_PANEL_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  startPill: {
    flex: 1,
    maxWidth: 220,
    backgroundColor: POMO_PANEL_BG,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  startPillText: {
    color: TEXT_WHITE,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT_WHITE,
  },
  modalSection: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 12,
    letterSpacing: 0.6,
  },
  durationRow: {
    marginBottom: 16,
  },
  durationLabel: {
    color: TEXT_WHITE,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  durationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: CONTROL_SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    color: TEXT_WHITE,
    fontSize: 22,
    fontWeight: "600",
  },
  durationValue: {
    flex: 1,
    color: TEXT_WHITE,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  durationValueEditableWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  durationValueInput: {
    minWidth: 40,
    paddingVertical: 4,
    paddingHorizontal: 4,
    color: TEXT_WHITE,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "right",
  },
  durationUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
  },
  saveSettingsBtn: {
    marginTop: 8,
    backgroundColor: BAR_COMPLETE,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  saveSettingsText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#33691E",
  },
});
