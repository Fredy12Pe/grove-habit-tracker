import { GroveColors } from "@/styles/theme";
import React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

/**
 * Decorative blob cluster for the Progress card, composed exactly as in the
 * Figma Progress_Container:
 *
 * - Bright blob (#C5EA47): 225×247 at (270, 137) in the card frame.
 * - Soft blob (#BADF3D): 182×188 at (261, 291.5), rotated -48° about its
 *   top-left corner, drawn ON TOP of the bright blob (Figma layer order).
 *
 * Local coordinate space starts at card position (261, 137), so the union of
 * both shapes fits in a 262×281 viewBox. Rendering both paths in one SVG keeps
 * their relative alignment fixed — the card only positions this one element.
 */
export const PROGRESS_BLOBS_WIDTH = 262;
export const PROGRESS_BLOBS_HEIGHT = 281;

export function ProgressBlobs(props: SvgProps) {
  return (
    <Svg
      width={PROGRESS_BLOBS_WIDTH}
      height={PROGRESS_BLOBS_HEIGHT}
      viewBox={`0 0 ${PROGRESS_BLOBS_WIDTH} ${PROGRESS_BLOBS_HEIGHT}`}
      fill="none"
      {...props}
    >
      {/* Bright front-facing blob (progress-blob-1.svg) */}
      <Path
        transform="translate(9 0)"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M95.8365 14.1099C127.736 8.6519 162.252 -10.5552 189.003 7.7081C217.445 27.1261 229.766 67.2532 223.33 101.153C217.486 131.933 179.817 141.164 159.197 164.702C135.541 191.705 131.428 242.481 95.8365 246.689C60.3261 250.888 35.0928 211.714 15.5413 181.688C0.0821242 157.946 -1.67419 129.375 1.07288 101.153C3.49716 76.2465 11.4247 51.8449 29.8248 34.944C47.5097 18.7 72.1977 18.1546 95.8365 14.1099Z"
        fill={GroveColors.accentLime}
      />
      {/* Soft blob layered on top (progress-blob-2.svg, -48° like Figma) */}
      <Path
        transform="translate(0 154.5) rotate(-48)"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M83.8893 0.236028C109.188 -3.12099 121.861 30.138 139.379 48.719C156.02 66.3691 182.83 80.0209 181.98 104.278C181.137 128.364 155.916 143.116 135.619 156.072C120.177 165.928 101.858 163.352 83.8893 166.887C57.2377 172.13 26.0327 200.666 6.85955 181.404C-12.3233 162.131 14.0292 130.418 21.5704 104.278C26.0799 88.6464 33.0285 75.6755 41.3864 61.722C54.6968 39.5002 58.2341 3.64029 83.8893 0.236028Z"
        fill={GroveColors.accentLimeSoft}
      />
    </Svg>
  );
}
