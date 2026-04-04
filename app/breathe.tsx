import { BreathingRivePlayer } from "@/components/breathe/BreathingRivePlayer";
import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/auth-context";
import {
  gameImpactLight,
  gameImpactMedium,
  gameImpactRigid,
} from "@/lib/gameHaptics";
import { GroveColors, GroveSpacing } from "@/styles/theme";
import { Redirect, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BreathingPerimeterCard from "../components/breathe/BreathingPerimeterCard";

type Phase = "inhale" | "holdAfterInhale" | "exhale" | "holdAfterExhale";

/** Breathe route chrome (setup safe area + active session). */
const BREATHE_SCREEN_BG = "#F3FBDE";

const PRESETS_MIN = [1, 2, 3, 5] as const;
const PATTERN = {
  inhale: 4,
  holdAfterInhale: 4,
  exhale: 4,
  holdAfterExhale: 4,
} as const;

const BOX_CYCLE_SECONDS =
  PATTERN.inhale +
  PATTERN.holdAfterInhale +
  PATTERN.exhale +
  PATTERN.holdAfterExhale;

const PHASE_SEGMENTS: { phase: Phase; duration: number }[] = [
  { phase: "inhale", duration: PATTERN.inhale },
  { phase: "holdAfterInhale", duration: PATTERN.holdAfterInhale },
  { phase: "exhale", duration: PATTERN.exhale },
  { phase: "holdAfterExhale", duration: PATTERN.holdAfterExhale },
];

/** Position within one 4+4+4+4 box from session elapsed time (seconds). */
function phaseFromElapsedInCycle(elapsedSec: number): {
  phase: Phase;
  phaseSecondsRemaining: number;
} {
  const p =
    ((elapsedSec % BOX_CYCLE_SECONDS) + BOX_CYCLE_SECONDS) % BOX_CYCLE_SECONDS;
  let acc = 0;
  for (const { phase, duration } of PHASE_SEGMENTS) {
    const end = acc + duration;
    if (p < end) {
      return {
        phase,
        phaseSecondsRemaining: Math.max(1, Math.ceil(end - p)),
      };
    }
    acc = end;
  }
  return { phase: "inhale", phaseSecondsRemaining: PATTERN.inhale };
}

/** One full lap of the perimeter stroke = one 16s box-breathing cycle (repeats). */
function cycleProgressFromElapsed(elapsedSec: number): number {
  const p =
    ((elapsedSec % BOX_CYCLE_SECONDS) + BOX_CYCLE_SECONDS) % BOX_CYCLE_SECONDS;
  return p / BOX_CYCLE_SECONDS;
}

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function phaseInstruction(phase: Phase): string {
  switch (phase) {
    case "inhale":
      return "breathe in";
    case "holdAfterInhale":
    case "holdAfterExhale":
      return "hold";
    case "exhale":
      return "breathe out";
  }
}

function BreatheScreenContent() {
  const router = useRouter();

  const [selectedMinutes, setSelectedMinutes] = useState<number>(1);

  const [mode, setMode] = useState<"setup" | "active">("setup");
  const [paused, setPaused] = useState(false);
  /** False until native Rive state machine has started — keeps the counter aligned with motion. */
  const [breathTimelineLive, setBreathTimelineLive] = useState(false);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [cycleProgress, setCycleProgress] = useState(0);

  const totalSeconds = useMemo(() => selectedMinutes * 60, [selectedMinutes]);

  /** Wall-clock session timing (avoids setInterval drift vs Rive). */
  const wallSessionStartRef = useRef(0);
  const frozenElapsedMsRef = useRef(0);
  const prevPausedRef = useRef(false);
  const breathTimelinePrimedRef = useRef(false);
  const lastCycleProgressRef = useRef(-1);
  const lastPublishedRef = useRef<{
    sec: number;
    phase: Phase | null;
  }>({ sec: -1, phase: null });

  const resetSession = () => {
    setSecondsRemaining(totalSeconds);
    setPhase("inhale");
    setPaused(false);
  };

  const startSession = () => {
    gameImpactMedium();
    frozenElapsedMsRef.current = 0;
    prevPausedRef.current = false;
    breathTimelinePrimedRef.current = false;
    setBreathTimelineLive(false);
    lastPublishedRef.current = { sec: -1, phase: null };
    setSecondsRemaining(totalSeconds);
    setPhase("inhale");
    lastCycleProgressRef.current = -1;
    setCycleProgress(0);
    setPaused(false);
    setMode("active");
  };

  const onBreathingRivePlaybackReady = useCallback(() => {
    if (breathTimelinePrimedRef.current) return;
    breathTimelinePrimedRef.current = true;
    wallSessionStartRef.current = Date.now();
    frozenElapsedMsRef.current = 0;
    lastPublishedRef.current = { sec: -1, phase: null };
    setBreathTimelineLive(true);
  }, []);

  const endSessionToSetup = useCallback(() => {
    setMode("setup");
    setPaused(false);
  }, []);

  const onEndSessionPress = useCallback(() => {
    gameImpactRigid();
    endSessionToSetup();
  }, [endSessionToSetup]);

  // Leaving active mode: reset Rive sync + 16s perimeter progress (cycleProgress state only).
  useEffect(() => {
    if (mode !== "active") {
      setBreathTimelineLive(false);
      breathTimelinePrimedRef.current = false;
      lastCycleProgressRef.current = -1;
      setCycleProgress(0);
    }
  }, [mode]);

  // Freeze / unfreeze wall-clock offset on pause transitions.
  useEffect(() => {
    if (mode !== "active") {
      prevPausedRef.current = paused;
      return;
    }
    const wasPaused = prevPausedRef.current;
    prevPausedRef.current = paused;

    if (!breathTimelineLive) return;

    if (!wasPaused && paused) {
      frozenElapsedMsRef.current += Date.now() - wallSessionStartRef.current;
    } else if (wasPaused && !paused) {
      wallSessionStartRef.current = Date.now();
    }
  }, [paused, mode, breathTimelineLive]);

  // Drive countdown + phases from elapsed ms (rAF), not 1 Hz interval.
  useEffect(() => {
    if (mode !== "active" || paused || !breathTimelineLive) return;

    let rafId: number;

    const tick = () => {
      const elapsedMs =
        frozenElapsedMsRef.current + (Date.now() - wallSessionStartRef.current);
      const elapsedSec = elapsedMs / 1000;

      if (elapsedSec >= totalSeconds) {
        endSessionToSetup();
        return;
      }

      const sessionRem = Math.max(0, Math.ceil(totalSeconds - elapsedSec));
      const { phase: ph } = phaseFromElapsedInCycle(elapsedSec);

      const last = lastPublishedRef.current;
      if (sessionRem !== last.sec) {
        last.sec = sessionRem;
        setSecondsRemaining(sessionRem);
      }
      if (ph !== last.phase) {
        last.phase = ph;
        setPhase(ph);
      }

      const cp = cycleProgressFromElapsed(elapsedSec);
      if (Math.abs(cp - lastCycleProgressRef.current) > 0.002) {
        lastCycleProgressRef.current = cp;
        setCycleProgress(cp);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode, paused, breathTimelineLive, totalSeconds, endSessionToSetup]);

  useEffect(() => {
    // keep remaining consistent when changing preset in setup mode
    if (mode !== "setup") return;
    setSecondsRemaining(totalSeconds);
  }, [mode, totalSeconds]);

  return (
    <SafeAreaView
      style={[styles.safe, mode === "active" && styles.safeActiveSession]}
    >
      <View style={styles.screenRoot}>
        <BreathingRivePlayer
          style={styles.activeRiveBackground}
          isActive={mode === "active"}
          paused={paused}
          phase={phase}
          onPlaybackReady={onBreathingRivePlaybackReady}
        />
        {mode === "setup" ? (
          <View style={styles.setupLayout}>
            <View style={styles.setupHeaderWrap}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol
                    name="chevron.left"
                    size={20}
                    color={GroveColors.primaryText}
                  />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <AppText variant="h1" style={styles.title}>
                    Breathe with Sprout
                  </AppText>
                  <AppText variant="paragraphRegular" style={styles.subtitle}>
                    Take a quiet moment to slow down and reset.
                  </AppText>
                </View>
                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.setupPatternSection}>
                <View style={styles.patternCard}>
                  <Text style={styles.patternNumbers}>4 · 4 · 4 · 4</Text>
                  <Text style={styles.patternLabels}>
                    Inhale · Hold · Exhale · Hold
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              style={styles.scrollSetupFlex}
              contentContainerStyle={styles.contentSetupBottom}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.setupBottomGroup}>
                <View style={styles.pillRow}>
                  {PRESETS_MIN.map((m) => {
                    const selected = selectedMinutes === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setSelectedMinutes(m)}
                        style={({ pressed }) => [
                          styles.pill,
                          selected && styles.pillSelected,
                          pressed && !selected && styles.pillPressed,
                        ]}
                      >
                        <AppText
                          variant="paragraph"
                          style={[
                            styles.pillText,
                            selected && styles.pillTextSelected,
                          ]}
                        >
                          {m} min
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  onPress={startSession}
                  style={({ pressed }) => [
                    styles.primaryBtnFull,
                    pressed && styles.primaryBtnPressed,
                  ]}
                >
                  <AppText variant="paragraph" style={styles.primaryBtnText}>
                    Start
                  </AppText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.activeOverlay} pointerEvents="box-none">
            <AppText variant="h1" style={styles.activeInstruction}>
              {phaseInstruction(phase)}
            </AppText>

            <View style={styles.activeCardSection}>
              <BreathingPerimeterCard
                progress={cycleProgress}
                timeLabel={formatMmSs(secondsRemaining)}
              />
            </View>

            <View style={styles.activeFooter}>
              {!paused ? (
                <Pressable
                  onPress={() => {
                    gameImpactLight();
                    setPaused(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Pause"
                  style={({ pressed }) => [
                    styles.pauseCircleBtn,
                    pressed && styles.pauseCircleBtnPressed,
                  ]}
                >
                  <IconSymbol
                    name="pause.fill"
                    size={30}
                    color={GroveColors.primaryGreen}
                  />
                </Pressable>
              ) : (
                <View style={styles.pausedRow}>
                  <Pressable
                    onPress={() => {
                      gameImpactMedium();
                      setPaused(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Continue"
                    style={({ pressed }) => [
                      styles.secondaryCircleBtn,
                      pressed && styles.secondaryCircleBtnPressed,
                    ]}
                  >
                    <IconSymbol
                      name="play.fill"
                      size={30}
                      color={GroveColors.primaryGreen}
                    />
                  </Pressable>
                  <Pressable
                    onPress={onEndSessionPress}
                    style={({ pressed }) => [
                      styles.primaryCircleBtn,
                      pressed && styles.primaryCircleBtnPressed,
                    ]}
                  >
                    <AppText style={styles.primaryCircleBtnText}>End</AppText>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function BreatheScreen() {
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
  return <BreatheScreenContent />;
}

/** Phase label only; card margin cancels this so the square stays put. */
const ACTIVE_PHASE_TEXT_TOP_OFFSET = 24;
const ACTIVE_CARD_SECTION_MARGIN_TOP = -28 - ACTIVE_PHASE_TEXT_TOP_OFFSET;

/** Duration pills — shared size with Start label styling where applicable. */
const setupSessionControlText = {
  fontSize: 13,
  lineHeight: 18,
  fontWeight: "600" as const,
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BREATHE_SCREEN_BG,
  },
  safeActiveSession: {
    backgroundColor: BREATHE_SCREEN_BG,
  },
  screenRoot: {
    flex: 1,
  },
  setupLayout: {
    flex: 1,
  },
  setupHeaderWrap: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 24,
  },
  setupPatternSection: {
    marginTop: 18,
    alignSelf: "stretch",
  },
  scrollSetupFlex: {
    flex: 1,
    backgroundColor: "transparent",
  },
  contentSetupBottom: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal + 12,
    paddingBottom: 80,
  },
  setupBottomGroup: {
    width: "100%",
    gap: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 36 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: GroveColors.primaryText,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 6,
    alignSelf: "stretch",
  },
  subtitle: {
    textAlign: "center",
    color: GroveColors.secondaryText,
    fontSize: 13,
    lineHeight: 18,
  },
  pillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  pill: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: GroveColors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
  },
  pillPressed: { opacity: 0.92 },
  pillSelected: {
    backgroundColor: GroveColors.white,
    borderColor: "rgba(167, 222, 51, 0.45)",
  },
  pillText: {
    ...setupSessionControlText,
    color: GroveColors.secondaryText,
    fontWeight: "500",
  },
  pillTextSelected: {
    color: GroveColors.primaryGreen,
    fontWeight: "700",
  },
  patternCard: {
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  patternNumbers: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: GroveColors.primaryGreen,
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  patternLabels: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: GroveColors.primaryText,
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: "#A3C434",
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryBtnFull: {
    width: "100%",
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#6B9E1A",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnFlex: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryBtnSmall: {
    width: 180,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryBtnPressed: { opacity: 0.9 },
  primaryBtnText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: GroveColors.white,
  },

  // Active session
  activeRiveBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  activeOverlay: {
    flex: 1,
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 44,
    paddingBottom: 28,
  },
  activeInstruction: {
    textAlign: "center",
    alignSelf: "stretch",
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "800",
    color: GroveColors.primaryGreen,
    marginTop: ACTIVE_PHASE_TEXT_TOP_OFFSET,
    marginBottom: 8,
  },
  activeCardSection: {
    flex: 1,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: ACTIVE_CARD_SECTION_MARGIN_TOP,
    marginBottom: 8,
  },
  activeFooter: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 8,
  },
  pauseCircleBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: GroveColors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pauseCircleBtnPressed: { opacity: 0.92 },
  pausedRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryCircleBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  secondaryCircleBtnPressed: { opacity: 0.92 },
  primaryCircleBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: GroveColors.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryCircleBtnPressed: { opacity: 0.92 },
  primaryCircleBtnText: {
    color: GroveColors.white,
    fontWeight: "800",
    fontSize: 15,
  },
});
