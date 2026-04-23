import Constants, { ExecutionEnvironment } from "expo-constants";
import { useAssets } from "expo-asset";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  View,
} from "react-native";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const completionPopupRive = require("@/assets/habits/Popup/completion_popup.riv");

/**
 * Fallback used if Rive's `onStop` never fires (e.g. Expo Go without the native
 * module, or a Rive error path). Keeps the overlay from becoming stuck.
 */
const SAFETY_DISMISS_MS = 4000;

/**
 * Cadence for the continuous celebration buzz while the overlay is visible.
 * iOS / Android don't expose a true sustained vibration through Taptic, so we
 * approximate one by firing rapid medium impacts until dismissal.
 */
const BUZZ_INTERVAL_MS = 80;

type Props = {
  visible: boolean;
  onFinish: () => void;
};

export function HabitsCompletionOverlay({ visible, onFinish }: Props) {
  const [riveAssets, riveAssetError] = useAssets([completionPopupRive]);

  const riveNative = useMemo(() => {
    if (isExpoGo) return null;
    return require("rive-react-native") as typeof import("rive-react-native");
  }, []);

  const riveUrl = riveAssets?.[0]?.localUri ?? null;

  const finishedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      finishedRef.current = false;
      return;
    }

    let buzzId: ReturnType<typeof setInterval> | null = null;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      buzzId = setInterval(() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, BUZZ_INTERVAL_MS);
    }

    const safetyId = setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish();
    }, SAFETY_DISMISS_MS);

    return () => {
      if (buzzId != null) clearInterval(buzzId);
      clearTimeout(safetyId);
    };
  }, [visible, onFinish]);

  useEffect(() => {
    if (riveAssetError) {
      console.warn("[HabitsCompletionOverlay] asset load error:", riveAssetError);
    }
  }, [riveAssetError]);

  const fireFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  const renderRive = () => {
    if (isExpoGo || !riveNative || !riveUrl) {
      return <ActivityIndicator color="#FFFFFF" />;
    }
    const { default: Rive, Fit, Alignment } = riveNative;
    return (
      <Rive
        url={riveUrl}
        style={styles.rive}
        fit={Fit.Contain}
        alignment={Alignment.Center}
        autoplay
        onStop={() => fireFinish()}
        onError={(e) => {
          console.warn("[HabitsCompletionOverlay] Rive error:", e);
          fireFinish();
        }}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={() => {
        // No-op: overlay should only dismiss when the animation finishes.
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.riveWrap}>{renderRive()}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  riveWrap: {
    width: "130%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rive: {
    width: "100%",
    height: "100%",
  },
});
