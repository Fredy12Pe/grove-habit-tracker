import "react-native-get-random-values";
import { sha256 } from "js-sha256";

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

/**
 * Hermes has getRandomValues (via react-native-get-random-values) but not
 * crypto.subtle. Supabase PKCE needs subtle.digest('SHA-256') for S256;
 * without it auth-js falls back to "plain" and Google OAuth often fails.
 */
function algorithmName(algorithm) {
  if (typeof algorithm === "string") return algorithm;
  if (algorithm && typeof algorithm.name === "string") return algorithm.name;
  return "";
}

function toByteArray(data) {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  throw new TypeError("crypto.subtle.digest: data must be a BufferSource");
}

function ensureSubtleDigest() {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    return;
  }
  if (
    cryptoObj.subtle &&
    typeof cryptoObj.subtle.digest === "function"
  ) {
    return;
  }

  const digest = async (algorithm, data) => {
    const name = algorithmName(algorithm).toUpperCase();
    if (name !== "SHA-256") {
      throw new Error(
        `crypto.subtle.digest polyfill only supports SHA-256 (got ${name || "unknown"})`,
      );
    }
    const bytes = toByteArray(data);
    return sha256.arrayBuffer(bytes);
  };

  try {
    Object.defineProperty(cryptoObj, "subtle", {
      value: { digest },
      configurable: true,
      enumerable: true,
      writable: true,
    });
  } catch {
    cryptoObj.subtle = { digest };
  }
}

ensureSubtleDigest();
