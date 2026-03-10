import { create } from 'zustand';
import type { WorldPosition, GardenPlant, PlayerState } from '@/lib/types';

interface GardenStore {
  player: PlayerState;
  plants: GardenPlant[];
  setPlayerPosition: (position: WorldPosition) => void;
  setPlayerDirection: (direction: PlayerState['direction']) => void;
  addPlant: (plant: GardenPlant) => void;
  updatePlantPosition: (plantId: string, position: WorldPosition) => void;
  syncPlantsFromHabits: (habitIdsWithPositions: { habitId: string; position: WorldPosition }[]) => void;
}

const initialPlayer: PlayerState = {
  position: { x: 400, y: 300 },
  direction: 'down',
};

export const useGardenStore = create<GardenStore>((set) => ({
  player: initialPlayer,
  plants: [],

  setPlayerPosition: (position) =>
    set((state) => ({
      player: { ...state.player, position },
    })),

  setPlayerDirection: (direction) =>
    set((state) => ({
      player: { ...state.player, direction },
    })),

  addPlant: (plant) =>
    set((state) => ({
      plants: state.plants.some((p) => p.id === plant.id) ? state.plants : [...state.plants, plant],
    })),

  updatePlantPosition: (plantId, position) =>
    set((state) => ({
      plants: state.plants.map((p) => (p.id === plantId ? { ...p, position } : p)),
    })),

  syncPlantsFromHabits: (habitIdsWithPositions) =>
    set((state) => {
      const existingIds = new Set(state.plants.map((p) => p.habitId));
      const newPlants: GardenPlant[] = habitIdsWithPositions
        .filter(({ habitId }) => !existingIds.has(habitId))
        .map(({ habitId, position }, i) => ({
          id: `plant_${habitId}`,
          habitId,
          position,
          growthState: 'seed' as const,
        }));
      return {
        plants: [
          ...state.plants.map((p) => {
            const match = habitIdsWithPositions.find((h) => h.habitId === p.habitId);
            return match ? { ...p, position: match.position } : p;
          }),
          ...newPlants,
        ],
      };
    }),
}));
