import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useGardenStore } from '@/lib/store';
import { GardenWorld, Joystick, type JoystickDelta } from '@/components/garden';
import { WORLD, PLAYER } from '@/lib/game/constants';

export default function GardenScreen() {
  const { setPlayerPosition, setPlayerDirection, player } = useGardenStore();

  const handleJoystickMove = useCallback(
    (delta: JoystickDelta) => {
      const speed = PLAYER.MOVE_SPEED;
      setPlayerPosition({
        x: Math.max(PLAYER.WIDTH / 2, Math.min(WORLD.WIDTH - PLAYER.WIDTH / 2, player.position.x + delta.x * speed)),
        y: Math.max(PLAYER.HEIGHT / 2, Math.min(WORLD.HEIGHT - PLAYER.HEIGHT / 2, player.position.y + delta.y * speed)),
      });
      if (Math.abs(delta.x) > 0.3) setPlayerDirection(delta.x > 0 ? 'right' : 'left');
      if (Math.abs(delta.y) > 0.3) setPlayerDirection(delta.y > 0 ? 'down' : 'up');
    },
    [player.position, setPlayerPosition, setPlayerDirection]
  );

  const handleJoystickEnd = useCallback(() => {
    // Optional: idle animation
  }, []);

  return (
    <View style={styles.container}>
      <GardenWorld />
      <Joystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
});
