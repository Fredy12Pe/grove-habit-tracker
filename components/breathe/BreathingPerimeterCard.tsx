/**
 * Calm breathing / progress card: rounded-square border drawn with react-native-svg,
 * progress revealed with strokeDasharray / strokeDashoffset.
 *
 * Rive / Lottie are intentionally not used here.
 */
import { GroveColors } from "@/styles/theme";
import React, { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Design: 359×359 artboard; stroke is centered on the path inset by half stroke width from the outer box. */
export const BREATHING_CARD_SIZE = 359;
const STROKE_WIDTH = 20;
const CORNER_RADIUS = 60;

/** Inset so the 20px stroke fits inside the 359×359 view (stroke half-width = 10). */
const INSET = STROKE_WIDTH / 2;
const INNER_W = BREATHING_CARD_SIZE - STROKE_WIDTH;
const INNER_H = BREATHING_CARD_SIZE - STROKE_WIDTH;
const RX = CORNER_RADIUS;
const RY = CORNER_RADIUS;

/**
 * Clockwise offset along the top-left quarter-circle from the leftmost point (x, y+ry).
 * A small positive value nudges the stroke start slightly to the right on that arc.
 */
const TOP_LEFT_ARC_START_RAD = 0.6;

/**
 * Builds one continuous clockwise path along the centerline of a rounded rectangle.
 *
 * Starts on the **top-left rounded corner** arc, a little past the leftmost point so the
 * stroke does not begin flush with the left edge.
 *
 * Arc commands use elliptical arcs (A rx ry … sweep x y) for each 90° corner.
 */
function buildRoundedRectPathD(
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  ry: number,
): string {
  const right = x + w;
  const bottom = y + h;
  const cx = x + rx;
  const cy = y + ry;
  const t0 = TOP_LEFT_ARC_START_RAD;
  const sx = cx - rx * Math.cos(t0);
  const sy = cy - ry * Math.sin(t0);
  const f = (n: number) => n.toFixed(4);

  return [
    `M ${f(sx)} ${f(sy)}`,
    `A ${rx} ${ry} 0 0 1 ${x + rx} ${y}`,
    `L ${right - rx} ${y}`,
    `A ${rx} ${ry} 0 0 1 ${right} ${y + ry}`,
    `L ${right} ${bottom - ry}`,
    `A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}`,
    `L ${x + rx} ${bottom}`,
    `A ${rx} ${ry} 0 0 1 ${x} ${bottom - ry}`,
    `L ${x} ${y + ry}`,
    `A ${rx} ${ry} 0 0 1 ${f(sx)} ${f(sy)}`,
    "Z",
  ].join(" ");
}

/**
 * Exact geometric length of the rounded-rect perimeter (centerline), for dash math.
 * Straights: 2×(w − 2r) + 2×(h − 2r); corners: one full circle of radius r → 2πr.
 */
function roundedRectPerimeter(w: number, h: number, r: number): number {
  return 2 * (w + h - 4 * r) + 2 * Math.PI * r;
}

const PATH_D = buildRoundedRectPathD(INSET, INSET, INNER_W, INNER_H, RX, RY);

const PATH_LENGTH = roundedRectPerimeter(INNER_W, INNER_H, RX);

export type BreathingPerimeterCardProps = {
  /** 0 = no white stroke visible, 1 = full lap drawn (one box-breathing cycle in the parent). */
  progress: number;
  /** Session or total time label below the card. */
  timeLabel: string;
  /** When false (Grove default), only the card + label + optional inner placeholder are shown. */
  showControls?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  /** Whether the session is paused (only affects optional control labels / disabled state). */
  isPaused?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * strokeDasharray is set to [pathLength, pathLength] so one “dash” covers the whole path.
 * strokeDashoffset shifts where that dash begins along the path:
 *   offset = (1 - progress) * pathLength
 * hides the tail, so increasing progress reveals more of the white stroke from the path start
 * (top-left corner, clockwise). At progress = 0, offset = pathLength → nothing visible; at 1, offset = 0 → full loop.
 *
 * Pause / resume: parent stops updating `progress` while paused; offset stays fixed — no extra logic here.
 * Reset (parent): parent sets progress back to 0; offset returns to pathLength.
 */
export default function BreathingPerimeterCard({
  progress,
  timeLabel,
  showControls = false,
  onPause,
  onResume,
  onReset,
  isPaused = false,
  style,
}: BreathingPerimeterCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const horizontalPadding = 40;
  const cardPixelSize = Math.min(
    BREATHING_CARD_SIZE,
    Math.max(200, windowWidth - horizontalPadding),
  );

  const progressSV = useSharedValue(Math.min(1, Math.max(0, progress)));

  useEffect(() => {
    progressSV.value = Math.min(1, Math.max(0, progress));
  }, [progress, progressSV]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - progressSV.value) * PATH_LENGTH,
  }));

  return (
    <View style={[styles.root, style]}>
      <View
        style={[
          styles.cardWrap,
          {
            width: cardPixelSize,
            height: cardPixelSize,
            borderRadius: CORNER_RADIUS,
          },
        ]}
      >
        <Svg
          width={cardPixelSize}
          height={cardPixelSize}
          viewBox={`0 0 ${BREATHING_CARD_SIZE} ${BREATHING_CARD_SIZE}`}
        >
          {/* Track: full perimeter always visible */}
          <Path
            d={PATH_D}
            fill="none"
            stroke="#E2F1BA"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Progress: same geometry; reveal via dash */}
          <AnimatedPath
            d={PATH_D}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`}
            animatedProps={animatedProps}
          />
        </Svg>

        {/* Placeholder region for future mascot asset; Rive shows through from layers below. */}
        <View pointerEvents="none" style={styles.innerPlaceholder} />
      </View>

      <Text style={styles.timeLabel}>{timeLabel}</Text>

      {showControls ? (
        <View style={styles.controls}>
          {!isPaused ? (
            <Pressable
              onPress={onPause}
              style={({ pressed }) => [
                styles.ctrlBtn,
                pressed && styles.ctrlBtnPressed,
              ]}
            >
              <Text style={styles.ctrlBtnText}>Pause</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onResume}
              style={({ pressed }) => [
                styles.ctrlBtn,
                pressed && styles.ctrlBtnPressed,
              ]}
            >
              <Text style={styles.ctrlBtnText}>Resume</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onReset}
            style={({ pressed }) => [
              styles.ctrlBtn,
              styles.ctrlBtnSecondary,
              pressed && styles.ctrlBtnPressed,
            ]}
          >
            <Text style={styles.ctrlBtnTextSecondary}>Reset</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  cardWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  /** Invisible region reserved for visual alignment with the mascot. */
  innerPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    margin: 48,
    borderRadius: 40,
  },
  timeLabel: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: "600",
    color: GroveColors.primaryGreen,
    letterSpacing: 0.3,
  },
  controls: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  ctrlBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: "rgba(124, 123, 103, 0.12)",
  },
  ctrlBtnSecondary: {
    backgroundColor: "rgba(167, 222, 51, 0.25)",
  },
  ctrlBtnPressed: {
    opacity: 0.88,
  },
  ctrlBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5B2B86",
  },
  ctrlBtnTextSecondary: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5B2B86",
  },
});
