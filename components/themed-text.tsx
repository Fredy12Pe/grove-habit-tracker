import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { GroveFontFamily } from "@/styles/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        styles.base,
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: GroveFontFamily,
  },
  default: {
    fontFamily: GroveFontFamily,
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontFamily: GroveFontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontFamily: GroveFontFamily,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: GroveFontFamily,
    fontSize: 20,
    fontWeight: "600",
  },
  link: {
    fontFamily: GroveFontFamily,
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});
