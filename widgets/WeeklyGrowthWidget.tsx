import { Circle, Grid, HStack, Spacer, Text, VStack, ZStack } from "@expo/ui/swift-ui";
import {
  background,
  clipShape,
  font,
  foregroundStyle,
  frame,
  opacity,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { shapes } from "@expo/ui/swift-ui/modifiers/shapes";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import React from "react";
import { Image as RNImage, View } from "react-native";
import { RNHostView } from "@expo/ui/swift-ui";
import { getPlantSprite } from "@/lib/game/plantSprites";

export type WeeklyGrowthWidgetProps = {
  completedCountToday: number;
  totalCountToday: number;
  title: string;
  subtitle: string;
  days: Array<{ iso: string; completed: boolean }>; // Mon..Sun
  plants: Array<{ habitId: string; plantIndex: number; frameIndex: number }>; // up to 8
};

const BG_START = "#45A427";
const PANEL_BG = "#F4F3E7";
const DOT_ON = "#88BF25";
const DOT_OFF = "#AEBA9B";

function DotsRow({ days }: { days: WeeklyGrowthWidgetProps["days"] }) {
  return (
    <HStack spacing={6}>
      {days.map((d) => (
        <Circle
          key={d.iso}
          modifiers={[
            background(d.completed ? DOT_ON : DOT_OFF),
            frame({ width: 6, height: 6 }),
          ]}
        />
      ))}
    </HStack>
  );
}

function PlantTile({
  plantIndex,
  frameIndex,
}: {
  plantIndex: number;
  frameIndex: number;
}) {
  const source = getPlantSprite(plantIndex, frameIndex);
  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <RNImage source={source} style={{ width: 54, height: 54 }} resizeMode="contain" />
    </View>
  );
}

const WeeklyGrowthWidget = (props: WeeklyGrowthWidgetProps, _environment: WidgetEnvironment) => {
  "widget";

  return (
    <ZStack
      modifiers={[
        background(BG_START, shapes.roundedRectangle({ cornerRadius: 21.67 })),
        clipShape("roundedRectangle", 21.67),
        padding({ all: 16 }),
      ]}
    >
      <VStack spacing={12} alignment="leading">
        <VStack spacing={4} alignment="leading">
          <Text
            modifiers={[
              font({ size: 20, weight: "semibold" }),
              foregroundStyle({ type: "color", color: "#FFFFFF" }),
            ]}
          >
            {props.title}
          </Text>
          <Text
            modifiers={[
              font({ size: 12, weight: "medium" }),
              foregroundStyle({ type: "color", color: "#FFFFFF" }),
              opacity(0.7),
            ]}
          >
            {props.subtitle}
          </Text>
        </VStack>

        <DotsRow days={props.days} />

        <ZStack
          modifiers={[
            background(PANEL_BG, shapes.roundedRectangle({ cornerRadius: 16 })),
            clipShape("roundedRectangle", 16),
            padding({ all: 12 }),
          ]}
        >
          <Grid columns={4} spacing={10}>
            {props.plants.slice(0, 8).map((p) => (
              <RNHostView key={p.habitId} matchContents={false}>
                <View style={{ width: 64, height: 64 }}>
                  <PlantTile plantIndex={p.plantIndex} frameIndex={p.frameIndex} />
                </View>
              </RNHostView>
            ))}
          </Grid>
        </ZStack>

        <HStack>
          <Spacer />
        </HStack>
      </VStack>
    </ZStack>
  );
};

export default createWidget("WeeklyGrowthWidget", WeeklyGrowthWidget);

