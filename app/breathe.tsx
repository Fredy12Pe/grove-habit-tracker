import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GroveBorderRadius, GroveColors, GroveSpacing } from "@/styles/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Phase = "inhale" | "hold" | "exhale";

const PRESETS_MIN = [1, 2, 3, 5] as const;
const PATTERN = { inhale: 4, hold: 4, exhale: 4 } as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim();
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
  const to2 = (x: number) => clamp(x).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function buildGradientStops(
  fromHex: string,
  toHex: string,
  steps: number,
): string[] {
  const a = hexToRgb(fromHex);
  const b = hexToRgb(toHex);
  const n = Math.max(2, Math.floor(steps));
  return Array.from({ length: n }).map((_, i) => {
    const t = i / (n - 1);
    return rgbToHex(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t));
  });
}

function GradientBackground() {
  // Approximate a vertical gradient without external libraries.
  const stops = useMemo(() => buildGradientStops("#A7DE33", "#BFE64A", 14), []);
  return (
    <View style={styles.gradientWrap} pointerEvents="none">
      {stops.map((c, i) => (
        <View
          key={`${c}_${i}`}
          style={[styles.gradientStop, { backgroundColor: c }]}
        />
      ))}
    </View>
  );
}

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function phaseLabel(phase: Phase): string {
  switch (phase) {
    case "inhale":
      return "Inhale";
    case "hold":
      return "Hold";
    case "exhale":
      return "Exhale";
  }
}

export default function BreatheScreen() {
  const router = useRouter();

  const [selectedMinutes, setSelectedMinutes] = useState<number>(1);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customText, setCustomText] = useState("");

  const [mode, setMode] = useState<"setup" | "active">("setup");
  const [paused, setPaused] = useState(false);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState<number>(
    PATTERN.inhale,
  );

  const totalSeconds = useMemo(() => selectedMinutes * 60, [selectedMinutes]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetSession = () => {
    setSecondsRemaining(totalSeconds);
    setPhase("inhale");
    setPhaseSecondsRemaining(PATTERN.inhale);
    setPaused(false);
  };

  const startSession = () => {
    resetSession();
    setMode("active");
  };

  const endSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setMode("setup");
    setPaused(false);
  };

  const exitSessionToPrevious = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPaused(false);
    router.back();
  };

  const endSessionToSetup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setMode("setup");
    setPaused(false);
  };

  useEffect(() => {
    if (mode !== "active" || paused) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((s) => s - 1);
      setPhaseSecondsRemaining((s) => s - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [mode, paused]);

  useEffect(() => {
    if (mode !== "active") return;

    if (secondsRemaining <= 0) {
      endSessionToSetup();
      return;
    }

    if (phaseSecondsRemaining > 0) return;

    // advance phase
    if (phase === "inhale") {
      setPhase("hold");
      setPhaseSecondsRemaining(PATTERN.hold);
    } else if (phase === "hold") {
      setPhase("exhale");
      setPhaseSecondsRemaining(PATTERN.exhale);
    } else {
      setPhase("inhale");
      setPhaseSecondsRemaining(PATTERN.inhale);
    }
  }, [endSession, mode, phase, phaseSecondsRemaining, secondsRemaining]);

  useEffect(() => {
    // keep remaining consistent when changing preset in setup mode
    if (mode !== "setup") return;
    setSecondsRemaining(totalSeconds);
  }, [mode, totalSeconds]);

  const sproutImage = useMemo(() => require("@/assets/garden/Sprout.png"), []);

  return (
    <SafeAreaView style={styles.safe}>
      <GradientBackground />
      <View style={styles.gradientWash} pointerEvents="none" />
      {mode === "setup" ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.titleRow}>
                <IconSymbol
                  name="leaf.fill"
                  size={18}
                  color={GroveColors.primaryGreen}
                />
                <AppText variant="h1" style={styles.title}>
                  Breathe with Sprout
                </AppText>
              </View>
              <AppText variant="paragraphRegular" style={styles.subtitle}>
                Take a quiet moment to slow down and reset.
              </AppText>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.characterSection}>
            <View style={styles.glow} />
            <Image
              source={sproutImage}
              style={styles.sprout}
              resizeMode="contain"
            />
          </View>

          <View style={styles.section}>
            <AppText variant="paragraph" style={styles.sectionLabel}>
              Choose your session
            </AppText>
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
              onPress={() => setCustomModalVisible(true)}
              style={({ pressed }) => [
                styles.customBtn,
                pressed && styles.customBtnPressed,
              ]}
            >
              <AppText variant="paragraph" style={styles.customBtnText}>
                Custom
              </AppText>
            </Pressable>
          </View>

          <View style={styles.patternCard}>
            <AppText variant="paragraph" style={styles.patternTitle}>
              Breathing pattern
            </AppText>
            <AppText variant="h1" style={styles.patternMain}>
              4 • 4 • 4
            </AppText>
            <AppText variant="paragraphRegular" style={styles.patternSub}>
              Inhale • Hold • Exhale
            </AppText>
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={startSession}
              style={({ pressed }) => [
                styles.primaryBtnFull,
                pressed && styles.primaryBtnPressed,
              ]}
            >
              <AppText variant="paragraph" style={styles.primaryBtnText}>
                Start Breathing
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.activeWrap}>
          <View style={styles.headerActive}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={exitSessionToPrevious}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <AppText variant="h2" style={styles.activeTitle}>
              Breathe with Sprout
            </AppText>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.activeCenter}>
            <View style={styles.activeGlow} />
            <Image
              source={sproutImage}
              style={styles.sproutActive}
              resizeMode="contain"
            />

            <View style={styles.phaseCard}>
              <AppText variant="paragraph" style={styles.phaseLabel}>
                {phaseLabel(phase)}
              </AppText>
              <AppText variant="h1" style={styles.phaseCount}>
                {Math.max(0, phaseSecondsRemaining)}
              </AppText>
              <AppText variant="paragraphRegular" style={styles.remaining}>
                {formatMmSs(secondsRemaining)} remaining
              </AppText>
            </View>
          </View>

          <View style={styles.activeFooter}>
            {!paused ? (
              <Pressable
                onPress={() => setPaused(true)}
                style={({ pressed }) => [
                  styles.primaryBtnSmall,
                  pressed && styles.primaryBtnPressed,
                ]}
              >
                <AppText variant="paragraph" style={styles.primaryBtnText}>
                  Pause
                </AppText>
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={() => setPaused(false)}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && styles.secondaryBtnPressed,
                  ]}
                >
                  <AppText variant="paragraph" style={styles.secondaryBtnText}>
                    Continue
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={endSessionToSetup}
                  style={({ pressed }) => [
                    styles.primaryBtnFlex,
                    pressed && styles.primaryBtnPressed,
                  ]}
                >
                  <AppText variant="paragraph" style={styles.primaryBtnText}>
                    End
                  </AppText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}

      {customModalVisible ? (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalWrap}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setCustomModalVisible(false)}
            />
            <View style={styles.modalCard}>
              <AppText variant="h2" style={styles.modalTitle}>
                Custom duration
              </AppText>
              <AppText variant="paragraphRegular" style={styles.modalHint}>
                Enter minutes (1–60)
              </AppText>
              <TextInput
                style={styles.modalInput}
                value={customText}
                onChangeText={setCustomText}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={GroveColors.secondaryText}
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setCustomModalVisible(false)}
                  style={({ pressed }) => [
                    styles.modalBtn,
                    pressed && styles.modalBtnPressed,
                  ]}
                >
                  <AppText variant="paragraph" style={styles.modalBtnText}>
                    Cancel
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const n = parseInt(customText, 10);
                    if (!isNaN(n)) {
                      const clamped = Math.max(1, Math.min(60, n));
                      setSelectedMinutes(clamped);
                      setCustomText("");
                    }
                    setCustomModalVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.modalBtnPrimary,
                    pressed && styles.modalBtnPrimaryPressed,
                  ]}
                >
                  <AppText
                    variant="paragraph"
                    style={styles.modalBtnPrimaryText}
                  >
                    Set
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#BFE64A",
  },
  gradientWrap: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
  },
  gradientStop: {
    flex: 1,
  },
  gradientWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(246,245,242,0.42)",
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 12,
    paddingBottom: 28,
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
    backgroundColor: "rgba(255, 255, 255, 0.28)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 36 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
  },
  characterSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    marginBottom: 8,
  },
  glow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FFFFFF",
    opacity: 0.10,
  },
  sprout: {
    width: 210,
    height: 210,
  },
  section: { marginTop: 8, marginBottom: 16 },
  sectionLabel: {
    textAlign: "center",
    marginBottom: 12,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  pillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
  },
  pillPressed: { opacity: 0.9 },
  pillSelected: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderColor: "rgba(255,255,255,0.9)",
  },
  pillText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  pillTextSelected: { color: "#5B2B86" },
  customBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
  },
  customBtnPressed: { opacity: 0.85 },
  customBtnText: { color: "#FFFFFF", fontWeight: "600" },
  patternCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 6,
  },
  patternTitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  patternMain: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 38,
    marginBottom: 6,
  },
  patternSub: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  footer: { marginTop: 22 },
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
  primaryBtnText: { color: "#5B2B86", fontWeight: "800", fontSize: 16 },

  // Active session
  activeWrap: {
    flex: 1,
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  activeCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  activeGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#FFFFFF",
    opacity: 0.09,
  },
  sproutActive: { width: 180, height: 180 },
  phaseCard: {
    width: "100%",
    borderRadius: GroveBorderRadius.card,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.28)",
    paddingVertical: 18,
    alignItems: "center",
  },
  phaseLabel: { color: "rgba(255,255,255,0.9)", fontWeight: "700" },
  phaseCount: {
    fontSize: 44,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 52,
    marginTop: 4,
  },
  remaining: { marginTop: 6, color: "rgba(255,255,255,0.85)", fontSize: 13 },
  activeFooter: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  secondaryBtnPressed: { opacity: 0.9 },
  secondaryBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },

  // Custom modal
  modalWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,0,40,0.35)",
  },
  modalCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 22,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(91,43,134,0.18)",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#5B2B86" },
  modalHint: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 13,
    color: "rgba(91,43,134,0.85)",
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(91,43,134,0.18)",
    fontSize: 16,
    color: "#5B2B86",
    marginBottom: 14,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "rgba(91,43,134,0.10)",
    borderWidth: 1,
    borderColor: "rgba(91,43,134,0.18)",
    alignItems: "center",
  },
  modalBtnPressed: { opacity: 0.9 },
  modalBtnText: { color: "#5B2B86", fontWeight: "800" },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#5B2B86",
    alignItems: "center",
  },
  modalBtnPrimaryPressed: { opacity: 0.9 },
  modalBtnPrimaryText: { color: "#FFFFFF", fontWeight: "700" },
});
