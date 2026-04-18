import { Platform } from "react-native";

type GameScreenAudioImpl = typeof import("./gameScreenAudio.expo");

let implModule: Promise<GameScreenAudioImpl | null> | null = null;

function loadImpl(): Promise<GameScreenAudioImpl | null> {
  if (Platform.OS === "web") return Promise.resolve(null);
  if (!implModule) {
    implModule = import("./gameScreenAudio.expo")
      .then((m) => m)
      .catch((err) => {
        console.warn(
          "[gameScreenAudio] expo-audio is not available in this build (e.g. Expo Go or an outdated dev client). Reinstall a dev build with: npx expo run:ios",
          err,
        );
        return null;
      });
  }
  return implModule;
}

/**
 * Resets the lazy loader after native unload so a future focus can retry loading.
 */
function resetImplLoader(): void {
  implModule = null;
}

export async function ensureGameSoundsLoaded(): Promise<void> {
  const m = await loadImpl();
  if (!m) return;
  return m.ensureGameSoundsLoaded();
}

export function unloadGameSounds(): void {
  if (Platform.OS === "web") return;
  const pending = implModule;
  resetImplLoader();
  void (pending ?? Promise.resolve(null)).then((m) => {
    if (m) m.unloadGameSounds();
  });
}

export async function syncGameAmbience(
  shouldPlay: boolean,
  isFocused: boolean,
): Promise<void> {
  const m = await loadImpl();
  if (!m) return;
  return m.syncGameAmbience(shouldPlay, isFocused);
}

export async function playGameFootstep(indoor = false): Promise<void> {
  const m = await loadImpl();
  if (!m) return;
  return m.playGameFootstep(indoor);
}

export function stopGameFootsteps(): void {
  if (Platform.OS === "web") return;
  void loadImpl().then((m) => {
    if (m) m.stopGameFootsteps();
  });
}

export async function playCowPettingSound(): Promise<void> {
  const m = await loadImpl();
  if (!m) return;
  return m.playCowPettingSound();
}

export async function playTreeShakeSound(): Promise<void> {
  const m = await loadImpl();
  if (!m) return;
  return m.playTreeShakeSound();
}

export async function playTreeChopSound(): Promise<void> {
  const m = await loadImpl();
  if (!m) return;
  return m.playTreeChopSound();
}

export async function playDoorOpenSound(): Promise<void> {
  const m = await loadImpl();
  if (!m) return;
  return m.playDoorOpenSound();
}

export async function playDoorCloseSound(): Promise<void> {
  const m = await loadImpl();
  if (!m) return;
  return m.playDoorCloseSound();
}
