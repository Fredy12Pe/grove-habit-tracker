import { JOYSTICK } from "@/lib/game/constants";
import React, { useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface JoystickDelta {
  x: number;
  y: number;
}

interface JoystickProps {
  onMove: (delta: JoystickDelta) => void;
  onEnd: () => void;
  size?: number;
}

const SPRING = { damping: 20, stiffness: 200, useNativeDriver: true };

export function Joystick({
  onMove,
  onEnd,
  size = JOYSTICK.SIZE,
}: JoystickProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const knobRadius = JOYSTICK.KNOB_SIZE / 2;
  const baseRadius = size / 2;
  const maxDistance = baseRadius - knobRadius;
  const leftCenter = (SCREEN_WIDTH - size) / 2;

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      let dx = e.translationX;
      let dy = e.translationY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDistance) {
        const scale = maxDistance / dist;
        dx *= scale;
        dy *= scale;
      }
      translateX.setValue(dx);
      translateY.setValue(dy);
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      if (magnitude > JOYSTICK.DEADZONE * maxDistance) {
        onMove({ x: dx / maxDistance, y: dy / maxDistance });
      }
    })
    .onEnd(() => {
      Animated.spring(translateX, { toValue: 0, ...SPRING }).start();
      Animated.spring(translateY, { toValue: 0, ...SPRING }).start();
      onEnd();
    });

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, left: leftCenter },
      ]}
    >
      {/* Joystick base rings */}
      <View
        style={[
          styles.baseOuter,
          { width: size, height: size, borderRadius: baseRadius },
        ]}
      />
      <View
        style={[
          styles.baseInner,
          {
            width: size - 8,
            height: size - 8,
            borderRadius: baseRadius - 4,
            top: 4,
            left: 4,
          },
        ]}
      />

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
            },
            { transform: [{ translateX }, { translateY }] },
          ]}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 76,
    justifyContent: "center",
    alignItems: "center",
  },
  baseOuter: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  baseInner: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  knob: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
