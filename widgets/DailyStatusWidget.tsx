import { Gauge, HStack, Spacer, Text, VStack, ZStack } from "@expo/ui/swift-ui";
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

export type DailyStatusWidgetProps = {
  completedCount: number;
  totalCount: number;
  title: string;
  subtitle: string;
};

const BG_START = "#45A427";

function pct(completedCount: number, totalCount: number) {
  if (totalCount <= 0) return 0;
  return Math.max(0, Math.min(1, completedCount / totalCount));
}

const DailyStatusWidget = (props: DailyStatusWidgetProps, _environment: WidgetEnvironment) => {
  "widget";

  const progress = pct(props.completedCount, props.totalCount);

  return (
    <ZStack
      modifiers={[
        background(BG_START, shapes.roundedRectangle({ cornerRadius: 21.67 })),
        clipShape("roundedRectangle", 21.67),
        padding({ all: 16 }),
      ]}
    >
      <HStack spacing={14}>
        <VStack spacing={2} alignment="leading">
          <Text
            modifiers={[
              font({ size: 15, weight: "semibold" }),
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
            {props.subtitle.toUpperCase()}
          </Text>
        </VStack>

        <Spacer />

        <Gauge
          value={progress}
          min={0}
          max={1}
          modifiers={[
            frame({ width: 66, height: 66 }),
            foregroundStyle({ type: "color", color: "#FFFFFF" }),
          ]}
        />
      </HStack>
    </ZStack>
  );
};

export default createWidget("DailyStatusWidget", DailyStatusWidget);

