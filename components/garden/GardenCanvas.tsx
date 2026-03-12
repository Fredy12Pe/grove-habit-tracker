import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Canvas, Circle, Group, Rect, RoundedRect } from '@shopify/react-native-skia';
import { useGardenStore } from '@/lib/store';
import { WORLD, PLAYER } from '@/lib/game/constants';

/**
 * Clamp camera so the viewport stays within world bounds.
 * Returns camera position in world coordinates (center of viewport).
 */
function clampCamera(
  playerX: number,
  playerY: number,
  viewportWorldWidth: number,
  viewportWorldHeight: number
) {
  const halfW = viewportWorldWidth / 2;
  const halfH = viewportWorldHeight / 2;
  const cameraX =
    WORLD.WIDTH > viewportWorldWidth
      ? Math.max(halfW, Math.min(WORLD.WIDTH - halfW, playerX))
      : WORLD.WIDTH / 2;
  const cameraY =
    WORLD.HEIGHT > viewportWorldHeight
      ? Math.max(halfH, Math.min(WORLD.HEIGHT - halfH, playerY))
      : WORLD.HEIGHT / 2;
  return { x: cameraX, y: cameraY };
}

const MIN_DIM = 1;

export function GardenCanvas() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { player, plants } = useGardenStore();

  // Avoid invalid dimensions (0 or negative) that can crash Skia
  const w = Math.max(MIN_DIM, screenWidth ?? WORLD.WIDTH);
  const h = Math.max(MIN_DIM, screenHeight ?? WORLD.HEIGHT);
  const scale = Math.min(w / WORLD.WIDTH, h / WORLD.HEIGHT) || 1;
  const viewportWorldWidth = w / scale;
  const viewportWorldHeight = h / scale;

  const camera = clampCamera(
    player.position.x,
    player.position.y,
    viewportWorldWidth,
    viewportWorldHeight
  );

  const offsetX = w / 2 - camera.x * scale;
  const offsetY = h / 2 - camera.y * scale;

  const playerRadius = Math.max(PLAYER.WIDTH, PLAYER.HEIGHT) / 2;

  return (
    <Canvas style={{ flex: 1, width: w, height: h }}>
      <Group
        transform={[
          { translateX: offsetX },
          { translateY: offsetY },
          { scale },
        ]}
      >
        {/* Sky */}
        <Rect x={0} y={0} width={WORLD.WIDTH} height={WORLD.HEIGHT} color="#87CEEB" />

        {/* Ground (grass) */}
        <Rect
          x={0}
          y={WORLD.HEIGHT * 0.55}
          width={WORLD.WIDTH}
          height={WORLD.HEIGHT * 0.45}
          color="#7CB342"
        />

        {/* Ground line / horizon */}
        <Rect
          x={0}
          y={WORLD.HEIGHT * 0.55}
          width={WORLD.WIDTH}
          height={4}
          color="#558B2F"
        />

        {/* Simple decorative patches */}
        <Rect x={100} y={WORLD.HEIGHT * 0.6} width={60} height={40} color="#8BC34A" />
        <Rect x={600} y={WORLD.HEIGHT * 0.65} width={80} height={35} color="#9CCC65" />
        <Rect x={350} y={WORLD.HEIGHT * 0.7} width={100} height={30} color="#8BC34A" />

        {/* Plants (from store) */}
        {plants.map((plant) => {
          const colors: Record<string, string> = {
            seed: '#5D4037',
            sprout: '#43A047',
            bloom: '#E91E63',
            wilt: '#757575',
          };
          const r = plant.growthState === 'bloom' ? 12 : plant.growthState === 'sprout' ? 8 : 5;
          return (
            <Circle
              key={plant.id}
              cx={plant.position.x}
              cy={plant.position.y}
              r={r}
              color={colors[plant.growthState] ?? colors.seed}
            />
          );
        })}

        {/* Player sprite: body + head */}
        <RoundedRect
          x={player.position.x - PLAYER.WIDTH / 2}
          y={player.position.y - PLAYER.HEIGHT}
          width={PLAYER.WIDTH}
          height={PLAYER.HEIGHT}
          r={6}
          color="#5C6BC0"
        />
        <Circle
          cx={player.position.x}
          cy={player.position.y - PLAYER.HEIGHT / 2 - 4}
          r={playerRadius * 0.6}
          color="#7986CB"
        />
        <Circle
          cx={player.position.x}
          cy={player.position.y - PLAYER.HEIGHT / 2 - 4}
          r={playerRadius * 0.45}
          color="#9FA8DA"
        />
      </Group>
    </Canvas>
  );
}
