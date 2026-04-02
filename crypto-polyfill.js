import "react-native-get-random-values";

// The library sets `global.crypto`; Hermes often leaves `globalThis.crypto` unset.
const g = global;
if (
  g.crypto &&
  typeof g.crypto.getRandomValues === "function" &&
  (typeof globalThis.crypto === "undefined" ||
    typeof globalThis.crypto.getRandomValues !== "function")
) {
  globalThis.crypto = g.crypto;
}
