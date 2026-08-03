import { Redirect, Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import {
  TabHabitsIcon,
  TabHomeIcon,
  TabProfileIcon,
  TabProgressIcon,
} from "@/components/ui/TabIcons";
import { useAuth } from "@/contexts/auth-context";
import { GroveBorderRadius, GroveColors, GroveFontFamily } from "@/styles/theme";

/** Soft rounded top surface so corner cutouts aren't black chrome. */
function TabBarBackground() {
  return <View style={styles.tabBarBackground} pointerEvents="none" />;
}

export default function TabLayout() {
  const { initialized, session, isGuest, needsOnboarding } = useAuth();

  if (!initialized) {
    return null;
  }
  if (!session && !isGuest) {
    return <Redirect href="/(auth)/login" />;
  }
  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: GroveColors.accentLimeSoft,
          tabBarInactiveTintColor: GroveColors.mutedGray,
          sceneStyle: { backgroundColor: "transparent" },
          tabBarStyle: {
            backgroundColor: "transparent",
            borderTopWidth: 0,
            height: 96,
            paddingTop: 12,
            paddingBottom: 24,
            // Pull items slightly inward so icons sit a bit closer
            paddingHorizontal: 28,
            elevation: 0,
            shadowOpacity: 0,
            // Float over the scene so rounded corner cutouts show page content
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
          },
          tabBarItemStyle: {
            paddingHorizontal: 0,
          },
          tabBarBackground: TabBarBackground,
          tabBarLabelStyle: {
            fontFamily: GroveFontFamily,
            fontSize: 14,
            fontWeight: "600",
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="garden"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabHomeIcon focused={focused} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            title: "Habits",
            tabBarIcon: ({ color, focused }) => (
              <TabHabitsIcon focused={focused} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color, focused }) => (
              <TabProgressIcon focused={focused} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <TabProfileIcon focused={focused} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="game"
          options={{
            // Keep the route accessible (e.g. from Garden preview) but hide it from the tab bar.
            href: null,
            title: "Game",
            tabBarStyle: { display: "none" },
          }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GroveColors.softSurface,
    borderTopLeftRadius: GroveBorderRadius.homeCard,
    borderTopRightRadius: GroveBorderRadius.homeCard,
    // Figma: iOS continuous corner smoothing ~60%
    borderCurve: "continuous",
    overflow: "hidden",
  },
});
