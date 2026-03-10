import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { JOYSTICK } from '@/lib/game/constants';

export interface JoystickDelta {
  x: number;
  y: number;
}

interface JoystickProps {
  onMove: (delta: JoystickDelta) => void;
  onEnd: () => void;
  size?: number;
}

const springConfig = { damping: 20, stiffness: 200 };

export function Joystick({ onMove, onEnd, size = JOYSTICK.SIZE }: JoystickProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const knobRadius = JOYSTICK.KNOB_SIZE / 2;
  const baseRadius = size / 2;
  const maxDistance = baseRadius - knobRadius;

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      let dx = e.translationX;
      let dy = e.translationY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDistance) {
        const scale = maxDistance / dist;
        dx *= scale;
        dy *= scale;
      }
      translateX.value = dx;
      translateY.value = dy;
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      if (magnitude > JOYSTICK.DEADZONE * maxDistance) {
        onMove({ x: dx / maxDistance, y: dy / maxDistance });
      }
    })
    .onEnd(() => {
      translateX.value = withSpring(0, springConfig);
      translateY.value = withSpring(0, springConfig);
      onEnd();
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={[styles.canvas, { width: size, height: size }]}>
        <Circle cx={baseRadius} cy={baseRadius} r={baseRadius - 2} color="rgba(255,255,255,0.3)" />
        <Circle cx={baseRadius} cy={baseRadius} r={baseRadius - 4} color="rgba(255,255,255,0.2)" />
      </Canvas>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.knob,
            {
              width: JOYSTICK.KNOB_SIZE,
              height: JOYSTICK.KNOB_SIZE,
              borderRadius: knobRadius,
              left: baseRadius - knobRadius,
              top: baseRadius - knobRadius,
              backgroundColor: 'rgba(255,255,255,0.9)',
            },
            knobStyle,
          ]}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    position: 'absolute',
  },
  knob: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
