import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Canvas, Circle, Group, Rect } from '@shopify/react-native-skia';
import { useGardenStore } from '@/lib/store';
import { WORLD, PLAYER } from '@/lib/game/constants';
import type { PlantGrowthState } from '@/lib/types';

function getPlantColor(state: PlantGrowthState): string {
  switch (state) {
    case 'seed':
      return '#8B4513';
    case 'sprout':
      return '#228B22';
    case 'bloom':
      return '#FF69B4';
    case 'wilt':
      return '#808080';
    default:
      return '#8B4513';
  }
}

export function GardenWorld() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { player, plants } = useGardenStore();

  const scaleX = screenWidth / WORLD.WIDTH;
  const scaleY = screenHeight / WORLD.HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (screenWidth - WORLD.WIDTH * scale) / 2;
  const offsetY = (screenHeight - WORLD.HEIGHT * scale) / 2;

  const toScreen = (wx: number, wy: number) => ({
    x: wx * scale + offsetX,
    y: wy * scale + offsetY,
  });

  const playerScreen = toScreen(player.position.x, player.position.y);
  const playerRadius = (Math.max(PLAYER.WIDTH, PLAYER.HEIGHT) / 2) * scale;

  return (
    <Canvas style={{ flex: 1, width: screenWidth, height: screenHeight }}>
      <Group transform={[{ translateX: offsetX }, { translateY: offsetY }, { scale }]}>
        {/* Ground */}
        <Rect x={0} y={0} width={WORLD.WIDTH} height={WORLD.HEIGHT} color="#87CEEB" />
        <Rect x={0} y={WORLD.HEIGHT * 0.6} width={WORLD.WIDTH} height={WORLD.HEIGHT * 0.4} color="#90EE90" />

        {/* Plants */}
        {plants.map((plant) => {
          const color = getPlantColor(plant.growthState);
          const r = plant.growthState === 'bloom' ? 14 : plant.growthState === 'sprout' ? 10 : 6;
          return (
            <Circle
              key={plant.id}
              cx={plant.position.x}
              cy={plant.position.y}
              r={r}
              color={color}
            />
          );
        })}
      </Group>

      {/* Player (drawn in screen space so always visible) */}
      <Circle
        cx={playerScreen.x}
        cy={playerScreen.y}
        r={playerRadius}
        color="#4A90D9"
      />
      <Circle
        cx={playerScreen.x}
        cy={playerScreen.y}
        r={playerRadius - 2}
        color="#6BB3F2"
      />
    </Canvas>
  );
}
