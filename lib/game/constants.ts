/**
 * Garden world and game constants.
 */

export const WORLD = {
  /** World size in logical units (can be scaled to screen) */
  WIDTH: 800,
  HEIGHT: 600,
  /** Tile size for grid alignment */
  TILE_SIZE: 40,
} as const;

export const PLAYER = {
  WIDTH: 32,
  HEIGHT: 32,
  MOVE_SPEED: 4,
} as const;

export const JOYSTICK = {
  SIZE: 120,
  KNOB_SIZE: 48,
  DEADZONE: 0.15,
} as const;
