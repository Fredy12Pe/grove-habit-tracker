import { useAuth } from "@/contexts/auth-context";
import { useIsFocused } from "@react-navigation/native";
import { Redirect, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

const SLEEP_VIDEO = require("@/assets/Game/house/bed-sleeping/character-sleeping.mp4");

function HouseBedContent() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const finishedRef = useRef(false);

  const player = useVideoPlayer(SLEEP_VIDEO, (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  const exitToGameWithReset = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    player.pause();
    router.replace({
      pathname: "/(tabs)/game",
      params: { resetHouseInterior: String(Date.now()) },
    });
  }, [player, router]);

  useEffect(() => {
    const sub = player.addListener("playToEnd", () => {
      exitToGameWithReset();
    });
    return () => sub.remove();
  }, [player, exitToGameWithReset]);

  useEffect(() => {
    if (!isFocused) {
      player.pause();
      return;
    }
    if (!finishedRef.current) {
      player.play();
    }
  }, [isFocused, player]);

  return (
    <View style={styles.root}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

export default function HouseBedScreen() {
  const { initialized, session, needsOnboarding } = useAuth();
  if (!initialized) {
    return null;
  }
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }
  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  return <HouseBedContent />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
});
