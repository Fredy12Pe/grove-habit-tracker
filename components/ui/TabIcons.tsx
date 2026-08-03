import React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

type TabIconProps = {
  /** When true, renders the Figma active (filled) SVG; otherwise the base (outline) SVG. */
  focused: boolean;
  color: string;
  size?: number;
} & Omit<SvgProps, "width" | "height" | "color">;

/* ─── Home (ri:plant) ─────────────────────────────────────────────── */

function HomeBase({ color, size = 24, ...props }: Omit<TabIconProps, "focused">) {
  // assets/garden/redesign/tab/home-base.svg
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color}
        d="M5.998 2a7 7 0 0 1 6.197 3.741A6.49 6.49 0 0 1 17.498 3h3.5v2.5a6.5 6.5 0 0 1-6.5 6.5h-1.5v1h5v7a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-7h5v-2h-2a7 7 0 0 1-7-7V2zm10 13h-8v5h8zm3-10h-1.5a4.5 4.5 0 0 0-4.5 4.5v.5h1.5a4.5 4.5 0 0 0 4.5-4.5zm-13-1h-2a5 5 0 0 0 5 5h2a5 5 0 0 0-5-5"
      />
    </Svg>
  );
}

function HomeActive({ color, size = 24, ...props }: Omit<TabIconProps, "focused">) {
  // assets/garden/redesign/tab/home-active.svg
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color}
        d="M20.998 3V5C20.998 6.85652 20.2605 8.63699 18.9477 9.94975C17.635 11.2625 15.8545 12 13.998 12H12.998V13H17.998V20C17.998 20.5304 17.7873 21.0391 17.4122 21.4142C17.0371 21.7893 16.5284 22 15.998 22H7.998C7.46757 22 6.95886 21.7893 6.58379 21.4142C6.20871 21.0391 5.998 20.5304 5.998 20V13H10.998V10C10.998 8.14348 11.7355 6.36301 13.0483 5.05025C14.361 3.7375 16.1415 3 17.998 3H20.998ZM5.498 2C6.69798 1.99903 7.88062 2.28638 8.94636 2.83787C10.0121 3.38936 10.9297 4.18884 11.622 5.169C10.5658 6.55782 9.99523 8.2552 9.998 10V11H9.498C7.50888 11 5.60122 10.2098 4.1947 8.8033C2.78818 7.39678 1.998 5.48912 1.998 3.5V2H5.498Z"
      />
    </Svg>
  );
}

export function TabHomeIcon({ focused, color, size = 24, ...props }: TabIconProps) {
  return focused ? (
    <HomeActive color={color} size={size} {...props} />
  ) : (
    <HomeBase color={color} size={size} {...props} />
  );
}

/* ─── Habits (check-one) ──────────────────────────────────────────── */

function HabitsBase({ color, size = 24, ...props }: Omit<TabIconProps, "focused">) {
  // assets/garden/redesign/tab/habits-base.svg — 22×22 art centered in 24×24
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 22C13.3135 22.0016 14.6143 21.7437 15.8278 21.2411C17.0412 20.7384 18.1434 20.0009 19.071 19.071C20.0009 18.1434 20.7384 17.0412 21.2411 15.8278C21.7437 14.6143 22.0016 13.3135 22 12C22.0016 10.68655 21.7437 9.38572 21.2411 8.17225C20.7384 6.95878 20.0009 5.85659 19.071 4.92901C18.1434 3.99909 17.0412 3.26162 15.8278 2.75897C14.6143 2.25631 13.3135 1.998388 12 2.00001C10.68655 1.998388 9.38572 2.25631 8.17225 2.75897C6.95878 3.26162 5.85659 3.99909 4.92901 4.92901C3.99909 5.85659 3.26162 6.95878 2.75897 8.17225C2.25631 9.38572 1.998388 10.68655 2.00001 12C1.998388 13.3135 2.25631 14.6143 2.75897 15.8278C3.26162 17.0412 3.99909 18.1434 4.92901 19.071C5.85659 20.0009 6.95878 20.7384 8.17225 21.2411C9.38572 21.7437 10.68655 22.0016 12 22Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M8 12L11 15L17 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HabitsActive({ color, size = 24, ...props }: Omit<TabIconProps, "focused">) {
  // Filled check-circle — same optical bounds as HabitsBase (inset to match stroke ring)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color}
        d="M12 21C7.029 21 3 16.971 3 12S7.029 3 12 3s9 4.029 9 9-4.029 9-9 9Zm-1.12-5.67 5.727-5.728-1.272-1.273-4.455 4.455-1.91-1.909-1.272 1.273 3.182 3.182Z"
      />
    </Svg>
  );
}

export function TabHabitsIcon({ focused, color, size = 24, ...props }: TabIconProps) {
  return focused ? (
    <HabitsActive color={color} size={size} {...props} />
  ) : (
    <HabitsBase color={color} size={size} {...props} />
  );
}

/* ─── Progress (ri:progress-1) ────────────────────────────────────── */

function ProgressBase({ color, size = 24, ...props }: Omit<TabIconProps, "focused">) {
  // assets/garden/redesign/tab/progress-base.svg
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color}
        d="M2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12ZM20 12C20 14.1217 19.1571 16.1566 17.6569 17.6569C16.1566 19.1571 14.1217 20 12 20C9.87827 20 7.84344 19.1571 6.34315 17.6569C4.84285 16.1566 4 14.1217 4 12C4 9.87827 4.84285 7.84344 6.34315 6.34315C7.84344 4.84285 9.87827 4 12 4C14.1217 4 16.1566 4.84285 17.6569 6.34315C19.1571 7.84344 20 9.87827 20 12ZM12 12V6C12.7881 5.99881 13.5687 6.15343 14.2969 6.45496C15.0251 6.75649 15.6864 7.19898 16.243 7.757L12 12Z"
      />
    </Svg>
  );
}

function ProgressActive({ color, size = 24, ...props }: Omit<TabIconProps, "focused">) {
  // Filled progress — inset to match ProgressBase ring optical size
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color}
        d="M12 21c4.971 0 9-4.029 9-9s-4.029-9-9-9-9 4.029-9 9 4.029 9 9 9m0-9V6.75A5.23 5.23 0 0 1 15.713 8.287z"
      />
    </Svg>
  );
}

export function TabProgressIcon({
  focused,
  color,
  size = 24,
  ...props
}: TabIconProps) {
  return focused ? (
    <ProgressActive color={color} size={size} {...props} />
  ) : (
    <ProgressBase color={color} size={size} {...props} />
  );
}

/* ─── Profile (iconamoon:profile) ─────────────────────────────────── */

function ProfileBase({ color, size = 24, ...props }: Omit<TabIconProps, "focused">) {
  // assets/garden/redesign/tab/profile-base.svg — 18×18 art centered in 24×24
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 18C4 16.9391 4.42143 15.9217 5.17157 15.1716C5.92172 14.4214 6.93913 14 8 14H16C17.0609 14 18.0783 14.4214 18.8284 15.1716C19.5786 15.9217 20 16.9391 20 18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4C10.34315 4 9 5.34315 9 7C9 8.65685 10.34315 10 12 10Z"
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}

function ProfileActive({ color, size = 24, ...props }: Omit<TabIconProps, "focused">) {
  // Filled profile — matched to ProfileBase optical bounds (18×18 glyph in 24×24)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color}
        d="M19 20H5v-1.5a3.5 3.5 0 0 1 3.5-3.5h7a3.5 3.5 0 0 1 3.5 3.5zM12 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8"
      />
    </Svg>
  );
}

export function TabProfileIcon({
  focused,
  color,
  size = 24,
  ...props
}: TabIconProps) {
  return focused ? (
    <ProfileActive color={color} size={size} {...props} />
  ) : (
    <ProfileBase color={color} size={size} {...props} />
  );
}
