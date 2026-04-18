import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import { Platform } from "react-native";

const AMBIENCE_SOURCE = require("@/assets/Game/Game sounds/Ambience.wav");
const FOOTSTEP_SOURCES = [
  require("@/assets/Game/Game sounds/walking-sounds/walking-1.wav"),
  require("@/assets/Game/Game sounds/walking-sounds/walking-2.wav"),
  require("@/assets/Game/Game sounds/walking-sounds/walking-3.wav"),
  require("@/assets/Game/Game sounds/walking-sounds/walking-4.wav"),
];
const COW_PETTING_SOURCE = require("@/assets/Game/Game sounds/cow-petting.wav");
const TREE_SHAKE_SOURCE = require("@/assets/Game/Game sounds/tree-shake.wav");
const TREE_CHOP_SOURCE = require("@/assets/Game/Game sounds/chopping-tree.wav");
const DOOR_OPEN_SOURCE = require("@/assets/Game/Game sounds/open-door.wav");
const DOOR_CLOSE_SOURCE = require("@/assets/Game/Game sounds/close-door.wav");
const INDOOR_FOOTSTEP_SOURCE = require("@/assets/Game/Game sounds/Footsteps-inHouse.wav");
const AMBIENCE_VOLUME = 0.18;
const FOOTSTEP_VOLUME = 0.06;
const INDOOR_FOOTSTEP_VOLUME = 0.06;
/** Outdoor + indoor clips are full-length WAVs; cap playback so tails don't bleed after each step or when idle. */
const FOOTSTEP_MAX_DURATION_MS = 130;
const COW_PETTING_VOLUME = 0.2;
const TREE_SHAKE_VOLUME = 0.02;
const TREE_CHOP_VOLUME = 0.02;
const DOOR_OPEN_VOLUME = 0.08;
const DOOR_CLOSE_VOLUME = 0.08;

let modeConfigured = false;
let loadPromise: Promise<void> | null = null;
let ambience: AudioPlayer | null = null;
let footstepPlayers: AudioPlayer[] = [];
let footstepRotate = 0;
let indoorFootstepPlayer: AudioPlayer | null = null;
let cowPettingPlayer: AudioPlayer | null = null;
let treeShakePlayer: AudioPlayer | null = null;
let treeChopPlayer: AudioPlayer | null = null;
let doorOpenPlayer: AudioPlayer | null = null;
let doorClosePlayer: AudioPlayer | null = null;

const footstepCutoffTimers = new Map<
  AudioPlayer,
  ReturnType<typeof setTimeout>
>();

function clearFootstepCutoffForPlayer(p: AudioPlayer): void {
  const t = footstepCutoffTimers.get(p);
  if (t) {
    clearTimeout(t);
    footstepCutoffTimers.delete(p);
  }
}

function clearAllFootstepCutoffTimers(): void {
  for (const t of footstepCutoffTimers.values()) {
    clearTimeout(t);
  }
  footstepCutoffTimers.clear();
}

function scheduleFootstepCutoff(p: AudioPlayer): void {
  clearFootstepCutoffForPlayer(p);
  const t = setTimeout(() => {
    footstepCutoffTimers.delete(p);
    try {
      p.pause();
      void p.seekTo(0);
    } catch {
      /* ignore */
    }
  }, FOOTSTEP_MAX_DURATION_MS);
  footstepCutoffTimers.set(p, t);
}

async function configureAudioMode(): Promise<void> {
  if (Platform.OS === "web") return;
  if (modeConfigured) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: "duckOthers",
    allowsRecording: false,
    shouldPlayInBackground: false,
  });
  modeConfigured = true;
}

async function doLoad(): Promise<void> {
  await configureAudioMode();
  const amb = createAudioPlayer(AMBIENCE_SOURCE, { downloadFirst: true });
  amb.loop = true;
  amb.volume = AMBIENCE_VOLUME;
  ambience = amb;
  footstepPlayers = FOOTSTEP_SOURCES.map((src) =>
    createAudioPlayer(src, { keepAudioSessionActive: true }),
  );
  for (const p of footstepPlayers) {
    p.volume = FOOTSTEP_VOLUME;
  }
  indoorFootstepPlayer = createAudioPlayer(INDOOR_FOOTSTEP_SOURCE, {
    keepAudioSessionActive: true,
  });
  indoorFootstepPlayer.volume = INDOOR_FOOTSTEP_VOLUME;
  cowPettingPlayer = createAudioPlayer(COW_PETTING_SOURCE, {
    keepAudioSessionActive: true,
  });
  cowPettingPlayer.volume = COW_PETTING_VOLUME;
  treeShakePlayer = createAudioPlayer(TREE_SHAKE_SOURCE, {
    keepAudioSessionActive: true,
  });
  treeShakePlayer.volume = TREE_SHAKE_VOLUME;
  treeChopPlayer = createAudioPlayer(TREE_CHOP_SOURCE, {
    keepAudioSessionActive: true,
  });
  treeChopPlayer.volume = TREE_CHOP_VOLUME;
  doorOpenPlayer = createAudioPlayer(DOOR_OPEN_SOURCE, {
    keepAudioSessionActive: true,
  });
  doorOpenPlayer.volume = DOOR_OPEN_VOLUME;
  doorClosePlayer = createAudioPlayer(DOOR_CLOSE_SOURCE, {
    keepAudioSessionActive: true,
  });
  doorClosePlayer.volume = DOOR_CLOSE_VOLUME;
}

/**
 * Load ambience + footstep players once. Safe to call repeatedly.
 */
export async function ensureGameSoundsLoaded(): Promise<void> {
  if (Platform.OS === "web") return;
  if (ambience && footstepPlayers.length === FOOTSTEP_SOURCES.length) return;
  if (!loadPromise) {
    loadPromise = doLoad().catch((e) => {
      loadPromise = null;
      throw e;
    });
  }
  await loadPromise;
}

export function unloadGameSounds(): void {
  if (Platform.OS === "web") return;
  clearAllFootstepCutoffTimers();
  loadPromise = null;
  footstepRotate = 0;
  modeConfigured = false;
  if (ambience) {
    try {
      ambience.remove();
    } catch {
      /* ignore */
    }
    ambience = null;
  }
  for (const p of footstepPlayers) {
    try {
      p.remove();
    } catch {
      /* ignore */
    }
  }
  footstepPlayers = [];
  if (indoorFootstepPlayer) {
    try {
      indoorFootstepPlayer.remove();
    } catch {
      /* ignore */
    }
    indoorFootstepPlayer = null;
  }
  if (cowPettingPlayer) {
    try {
      cowPettingPlayer.remove();
    } catch {
      /* ignore */
    }
    cowPettingPlayer = null;
  }
  if (treeShakePlayer) {
    try {
      treeShakePlayer.remove();
    } catch {
      /* ignore */
    }
    treeShakePlayer = null;
  }
  if (treeChopPlayer) {
    try {
      treeChopPlayer.remove();
    } catch {
      /* ignore */
    }
    treeChopPlayer = null;
  }
  if (doorOpenPlayer) {
    try {
      doorOpenPlayer.remove();
    } catch {
      /* ignore */
    }
    doorOpenPlayer = null;
  }
  if (doorClosePlayer) {
    try {
      doorClosePlayer.remove();
    } catch {
      /* ignore */
    }
    doorClosePlayer = null;
  }
}

/** Stop footstep playback immediately (e.g. when the walk animation ends). */
export function stopGameFootsteps(): void {
  if (Platform.OS === "web") return;
  clearAllFootstepCutoffTimers();
  for (const p of footstepPlayers) {
    try {
      p.pause();
      void p.seekTo(0);
    } catch {
      /* ignore */
    }
  }
  if (indoorFootstepPlayer) {
    try {
      indoorFootstepPlayer.pause();
      void indoorFootstepPlayer.seekTo(0);
    } catch {
      /* ignore */
    }
  }
}

export async function syncGameAmbience(
  shouldPlay: boolean,
  isFocused: boolean,
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ensureGameSoundsLoaded();
  } catch {
    return;
  }
  if (!ambience) return;
  const want = shouldPlay && isFocused;
  try {
    if (want) {
      ambience.play();
    } else {
      ambience.pause();
      await ambience.seekTo(0);
    }
  } catch {
    /* ignore */
  }
}

export async function playGameFootstep(indoor = false): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ensureGameSoundsLoaded();
  } catch {
    return;
  }
  const p = indoor
    ? indoorFootstepPlayer
    : footstepPlayers.length > 0
      ? footstepPlayers[footstepRotate % footstepPlayers.length]!
      : null;
  if (!p) return;
  if (!indoor) {
    footstepRotate += 1;
  }
  if (!p.isLoaded) return;
  try {
    await p.seekTo(0);
    p.play();
    scheduleFootstepCutoff(p);
  } catch {
    /* ignore */
  }
}

export async function playCowPettingSound(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ensureGameSoundsLoaded();
  } catch {
    return;
  }
  if (!cowPettingPlayer?.isLoaded) return;
  try {
    await cowPettingPlayer.seekTo(0);
    cowPettingPlayer.play();
  } catch {
    /* ignore */
  }
}

export async function playTreeShakeSound(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ensureGameSoundsLoaded();
  } catch {
    return;
  }
  if (!treeShakePlayer?.isLoaded) return;
  try {
    await treeShakePlayer.seekTo(0);
    treeShakePlayer.play();
  } catch {
    /* ignore */
  }
}

export async function playTreeChopSound(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ensureGameSoundsLoaded();
  } catch {
    return;
  }
  if (!treeChopPlayer?.isLoaded) return;
  try {
    await treeChopPlayer.seekTo(0);
    treeChopPlayer.play();
  } catch {
    /* ignore */
  }
}

export async function playDoorOpenSound(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ensureGameSoundsLoaded();
  } catch {
    return;
  }
  if (!doorOpenPlayer?.isLoaded) return;
  try {
    await doorOpenPlayer.seekTo(0);
    doorOpenPlayer.play();
  } catch {
    /* ignore */
  }
}

export async function playDoorCloseSound(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ensureGameSoundsLoaded();
  } catch {
    return;
  }
  if (!doorClosePlayer?.isLoaded) return;
  try {
    await doorClosePlayer.seekTo(0);
    doorClosePlayer.play();
  } catch {
    /* ignore */
  }
}
