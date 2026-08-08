import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

const mascotImage = require('@/assets/garden/redesign/sprout-waving.png');

type Props = {
  style?: StyleProp<ImageStyle>;
};

/**
 * Static Sprout mascot artwork. Intentionally an image, not a Rive animation —
 * the existing .riv files (`sprout_welcome.riv`, `sprout_breathing.riv`) are
 * full-scene compositions built for their own dedicated screens (auth background,
 * breathing session) and don't crop cleanly into a small card-sized mascot cutout.
 */
export function MascotRive({ style }: Props) {
  return (
    <Image
      source={mascotImage}
      style={style}
      resizeMode="contain"
    />
  );
}
