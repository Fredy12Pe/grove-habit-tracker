/** Matches elliptical garden interaction zones in `app/(tabs)/game.tsx`. */

const RX_FACTOR = 0.52;
const RY_FACTOR = 0.2;
const Y_SHIFT_FACTOR = 0.65;

export function gardenTriggerRadii(gh: number): { rx: number; ry: number } {
  return { rx: gh * RX_FACTOR, ry: gh * RY_FACTOR };
}

/**
 * Position/size of the trigger oval inside each garden plot view (origin top-left,
 * width GW × height GH), aligned with world `GARDEN_TRIGGERS`.
 */
export function gardenActiveWeekOvalBox(
  gw: number,
  gh: number,
): {
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius: number;
} {
  const { rx, ry } = gardenTriggerRadii(gh);
  return {
    left: gw / 2 - rx,
    top: gh + ry * Y_SHIFT_FACTOR - ry,
    width: rx * 2,
    height: ry * 2,
    borderRadius: ry,
  };
}
