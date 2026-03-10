/**
 * Garden world and game object types.
 */

import type { PlantGrowthState } from './habit';

export interface WorldPosition {
  x: number;
  y: number;
}

export interface GardenPlant {
  id: string;
  habitId: string;
  position: WorldPosition;
  growthState: PlantGrowthState;
}

export interface GardenDecoration {
  id: string;
  type: string;
  position: WorldPosition;
}

export interface PlayerState {
  position: WorldPosition;
  direction: 'up' | 'down' | 'left' | 'right';
}
