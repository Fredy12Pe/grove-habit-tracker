import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/auth-context";
import { PUZZLE_IMAGES } from "@/lib/game/puzzleImages";
import { gameImpactLight, gameImpactMedium } from "@/lib/gameHaptics";
import { GroveColors, GroveSpacing } from "@/styles/theme";
import { Redirect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  PicturePuzzle,
  type PuzzlePieces,
} from "react-native-picture-puzzle";

const SCREEN_BG = "#F3FBDE";

const PUZZLE_SIDE = 3;
const PIECE_COUNT = PUZZLE_SIDE * PUZZLE_SIDE;
/** Invisible / empty tile (bottom-right when solved). */
const HIDDEN_PIECE = PIECE_COUNT - 1;

const SOLVED: PuzzlePieces = Object.freeze(
  Array.from({ length: PIECE_COUNT }, (_, i) => i),
) as PuzzlePieces;

/** Fewer random slides → starts closer to solved (library is fixed 3×3). */
const SHUFFLE_MOVES_INITIAL = 42;
const SHUFFLE_MOVES_NEW = 48;

function randomImageIndex(exclude?: number): number {
  const n = PUZZLE_IMAGES.length;
  if (n <= 1) return 0;
  let idx = Math.floor(Math.random() * n);
  while (idx === exclude) {
    idx = Math.floor(Math.random() * n);
  }
  return idx;
}

function shufflePieces(moves: number): PuzzlePieces {
  const pieces = [...SOLVED];
  for (let m = 0; m < moves; m++) {
    const blankIdx = pieces.indexOf(HIDDEN_PIECE);
    const neighbors: number[] = [];
    if (blankIdx % PUZZLE_SIDE > 0) neighbors.push(blankIdx - 1);
    if (blankIdx % PUZZLE_SIDE < PUZZLE_SIDE - 1) neighbors.push(blankIdx + 1);
    if (blankIdx >= PUZZLE_SIDE) neighbors.push(blankIdx - PUZZLE_SIDE);
    if (blankIdx < PIECE_COUNT - PUZZLE_SIDE) neighbors.push(blankIdx + PUZZLE_SIDE);
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)]!;
    [pieces[blankIdx], pieces[pick]] = [pieces[pick]!, pieces[blankIdx]!];
  }
  return pieces as PuzzlePieces;
}

function isSolved(pieces: PuzzlePieces): boolean {
  return pieces.every((p, i) => p === i);
}

function PuzzlesScreenContent() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const puzzleSize = useMemo(() => {
    const max = Math.min(width, height) - GroveSpacing.screenPaddingHorizontal * 2 - 48;
    return Math.max(220, Math.min(340, Math.floor(max)));
  }, [width, height]);

  const [hidden, setHidden] = useState<number | null>(HIDDEN_PIECE);
  const [imageIndex, setImageIndex] = useState(() => randomImageIndex());
  const [pieces, setPieces] = useState<PuzzlePieces>(() =>
    shufflePieces(SHUFFLE_MOVES_INITIAL),
  );
  const [won, setWon] = useState(false);

  const source = PUZZLE_IMAGES[imageIndex];

  const newPuzzle = useCallback(() => {
    gameImpactMedium();
    setImageIndex((prev) => randomImageIndex(prev));
    setHidden(HIDDEN_PIECE);
    setPieces(shufflePieces(SHUFFLE_MOVES_NEW));
    setWon(false);
  }, []);

  const onChange = useCallback((nextPieces: PuzzlePieces, nextHidden: number | null) => {
    setPieces(nextPieces);
    setHidden(nextHidden);
    gameImpactLight();
    if (isSolved(nextPieces)) {
      setWon(true);
      gameImpactMedium();
    } else {
      setWon(false);
    }
  }, []);

  const renderLoading = useCallback(
    () => (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={GroveColors.primaryGreen} />
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            name="chevron.left"
            size={20}
            color={GroveColors.primaryText}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText variant="h1" style={styles.title}>
            Picture puzzle
          </AppText>
          <AppText variant="paragraphRegular" style={styles.subtitle}>
            Tap a tile next to the gap to slide it. Rebuild the image.
          </AppText>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <View style={styles.puzzleCard}>
          <PicturePuzzle
            key={imageIndex}
            size={puzzleSize}
            pieces={pieces}
            hidden={hidden}
            source={source}
            renderLoading={renderLoading}
            onChange={onChange}
          />
        </View>

        {won ? (
          <View style={styles.winBanner}>
            <AppText style={styles.winText}>Nice — you solved it!</AppText>
          </View>
        ) : null}

        <Pressable
          onPress={newPuzzle}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
        >
          <AppText style={styles.primaryBtnText}>New puzzle</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function PuzzlesScreen() {
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
  return <PuzzlesScreenContent />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 36 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: GroveColors.primaryText,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 6,
    alignSelf: "stretch",
  },
  subtitle: {
    textAlign: "center",
    color: GroveColors.secondaryText,
    fontSize: 13,
    lineHeight: 18,
  },
  body: {
    flex: 1,
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    alignItems: "center",
    paddingTop: 8,
  },
  puzzleCard: {
    backgroundColor: GroveColors.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 20,
  },
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(243, 251, 222, 0.85)",
  },
  winBanner: {
    backgroundColor: "rgba(107, 158, 26, 0.15)",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginBottom: 16,
  },
  winText: {
    fontSize: 15,
    fontWeight: "600",
    color: GroveColors.primaryText,
  },
  primaryBtn: {
    alignSelf: "stretch",
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#6B9E1A",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnPressed: {
    opacity: 0.9,
  },
  primaryBtnText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: GroveColors.white,
  },
});
