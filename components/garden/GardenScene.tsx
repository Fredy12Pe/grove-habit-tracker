import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { GroveColors } from '@/styles/theme';
import { GardenTileGrid } from './GardenTileGrid';
import { PlantPlaceholder } from './PlantPlaceholder';
import { CharacterPlaceholder } from './CharacterPlaceholder';
import { IconSymbol } from '@/components/ui/icon-symbol';

/**
 * Static garden scene for the Garden tab — layout only, no game mechanics.
 * Renders a square garden with placeholder plants, characters, and tiles.
 */
export function GardenScene() {
  const { width } = useWindowDimensions();
  const padding = 20;
  const cardPadding = 20;
  const maxGardenSize = 260;
  const gardenSize = Math.min(width - padding * 2 - cardPadding * 2, maxGardenSize);
  const edgeWidth = 12;

  return (
    <View style={[styles.container, { width: gardenSize + edgeWidth * 2, height: gardenSize + edgeWidth * 2 }]}>
      {/* Green boundary / hedges */}
      <View style={[styles.edge, styles.edgeTop, { width: gardenSize + edgeWidth * 2, height: edgeWidth }]} />
      <View style={[styles.edge, styles.edgeBottom, { width: gardenSize + edgeWidth * 2, height: edgeWidth }]} />
      <View style={[styles.edge, styles.edgeLeft, { left: 0, top: edgeWidth, width: edgeWidth, height: gardenSize }]} />
      <View style={[styles.edge, styles.edgeRight, { right: 0, top: edgeWidth, width: edgeWidth, height: gardenSize }]} />

      {/* Tiled play area */}
      <View style={[styles.tileArea, { width: gardenSize, height: gardenSize, left: edgeWidth, top: edgeWidth }]}>
        <GardenTileGrid size={gardenSize} />

        {/* Placeholder elements positioned over the grid */}
        <View style={[styles.plantTopLeft, { left: gardenSize * 0.08, top: gardenSize * 0.08 }]}>
          <PlantPlaceholder size={36} />
        </View>
        <View style={[styles.plantTopRight, { right: gardenSize * 0.15, top: gardenSize * 0.1 }]}>
          <PlantPlaceholder size={36} />
        </View>

        <View style={[styles.characterBlue, { left: gardenSize * 0.4, top: gardenSize * 0.12 }]}>
          <CharacterPlaceholder size={28} color="#4A90D9" />
        </View>
        <View style={[styles.characterPink, { right: gardenSize * 0.2, top: gardenSize * 0.35 }]}>
          <CharacterPlaceholder size={24} color="#E91E63" />
        </View>

        <View style={[styles.interactiveX, { left: gardenSize * 0.15, top: gardenSize * 0.45 }]}>
          <View style={[styles.xMark, styles.xMarkLine1]} />
          <View style={[styles.xMark, styles.xMarkLine2]} />
        </View>
        <View style={[styles.interactivePump, { left: gardenSize * 0.08, top: gardenSize * 0.72 }]}>
          <View style={styles.pump} />
        </View>
        <View style={[styles.fountain, { left: gardenSize * 0.42, top: gardenSize * 0.78 }]}>
          <View style={styles.fountainShape} />
        </View>
      </View>

      {/* Nav arrow (carousel) */}
      <View style={styles.navArrow}>
        <IconSymbol name="chevron.right" size={20} color={GroveColors.white} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
  },
  edge: {
    position: 'absolute',
    backgroundColor: '#558B2F',
  },
  edgeTop: { left: 0, top: 0 },
  edgeBottom: { left: 0, bottom: 0 },
  edgeLeft: {},
  edgeRight: { left: undefined },
  tileArea: {
    position: 'absolute',
    overflow: 'hidden',
  },
  plantTopLeft: {
    position: 'absolute',
  },
  plantTopRight: {
    position: 'absolute',
  },
  characterBlue: {
    position: 'absolute',
  },
  characterPink: {
    position: 'absolute',
  },
  interactiveX: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xMark: {
    width: 20,
    height: 2,
    backgroundColor: GroveColors.white,
    position: 'absolute',
  },
  xMarkLine1: { transform: [{ rotate: '45deg' }] },
  xMarkLine2: { transform: [{ rotate: '-45deg' }] },
  interactivePump: {
    position: 'absolute',
    width: 24,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#00897B',
  },
  fountain: {
    position: 'absolute',
    width: 40,
    height: 36,
    borderRadius: 20,
    backgroundColor: '#4FC3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fountainShape: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  navArrow: {
    position: 'absolute',
    right: -8,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#607D8B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
