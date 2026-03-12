import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GroveColors } from '@/styles/theme';

const TILE_COUNT = 5;
const TILE_GAP = 2;

interface GardenTileGridProps {
  size: number;
}

export function GardenTileGrid({ size }: GardenTileGridProps) {
  const tileSize = (size - (TILE_COUNT - 1) * TILE_GAP) / TILE_COUNT;

  return (
    <View style={[styles.grid, { width: size, height: size }]}>
      {Array.from({ length: TILE_COUNT * TILE_COUNT }).map((_, i) => {
        const row = Math.floor(i / TILE_COUNT);
        const col = i % TILE_COUNT;
        const isLight = (row + col) % 2 === 0;
        return (
          <View
            key={i}
            style={[
              styles.tile,
              {
                width: tileSize,
                height: tileSize,
                left: col * (tileSize + TILE_GAP),
                top: row * (tileSize + TILE_GAP),
                backgroundColor: isLight ? GroveColors.white : GroveColors.inactive,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    position: 'relative',
  },
  tile: {
    position: 'absolute',
    borderRadius: 4,
  },
});
