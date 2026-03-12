import React from 'react';
import { Image, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { GroveColors } from '@/styles/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface SproutSupportCardProps {
  onPress?: () => void;
}

const cardText = {
  heading: 13,
  body: 10,
};

export function SproutSupportCard({ onPress }: SproutSupportCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.mascotWrap}>
          <Image
            source={require('@/assets/garden/Sprout.png')}
            style={styles.mascotImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textBlock}>
          <AppText variant="h2" style={styles.heading} numberOfLines={1} adjustsFontSizeToFit>
            Feeling Overwhelmed?
          </AppText>
          <AppText variant="paragraphRegular" style={styles.bodyLine1}>
            Let's take a few calm breaths
          </AppText>
          <View style={styles.bodyLine2Wrap}>
            <AppText variant="paragraphRegular" style={styles.bodyLine2} boldSprout>
              with Sprout.
            </AppText>
          </View>
        </View>
        <TouchableOpacity style={styles.arrowButton} onPress={onPress} activeOpacity={0.7}>
          <IconSymbol
            name="chevron.right"
            size={22}
            color={GroveColors.primaryGreen}
          />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const MASCOT_SIZE = 100;
const V_PAD = 24;

const styles = StyleSheet.create({
  card: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
  },
  mascotWrap: {
    width: MASCOT_SIZE,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  mascotImage: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    paddingTop: V_PAD,
    paddingBottom: V_PAD,
    justifyContent: 'center',
  },
  heading: {
    fontSize: cardText.heading,
    fontWeight: '700',
    color: GroveColors.primaryText,
    marginBottom: 6,
  },
  bodyLine1: {
    fontSize: cardText.body,
    color: GroveColors.secondaryText,
    lineHeight: 14,
    marginBottom: 2,
  },
  bodyLine2Wrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  bodyLine2: {
    fontSize: cardText.body,
    color: GroveColors.secondaryText,
    lineHeight: 14,
    textAlign: 'center',
  },
  arrowButton: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
});
