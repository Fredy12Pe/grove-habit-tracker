import type { Session, SupabaseClient } from "@supabase/supabase-js";

function isVerifierErrorMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("code verifier") || m.includes("verifier");
}

function isTransientNetworkMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("network request failed") ||
    m.includes("failed to fetch") ||
    m.includes("load failed") ||
    m.includes("the internet connection appears to be offline") ||
    m.includes("network connection was lost") ||
    m.includes("could not connect")
  );
}

async function sleep(ms: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type ExchangeResult =
  | { ok: true; session: Session }
  | { ok: false; errorMessage: string; verifierMismatch: boolean };

/**
 * Email confirmation often cold-starts the app from Safari; the first token
 * request can fail with RN's generic "Network request failed" before the stack is ready.
 */
export async function exchangeCodeForSessionWithRetry(
  supabase: SupabaseClient,
  code: string,
): Promise<ExchangeResult> {
  let lastMsg = "Could not complete sign-in.";
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      await sleep(350 * attempt);
    }
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (data.session && !error) {
        return { ok: true, session: data.session };
      }
      if (!error && !data.session) {
        return {
          ok: false,
          errorMessage: "No session returned. Try opening the link again or sign in with email.",
          verifierMismatch: false,
        };
      }
      const msg = error?.message ?? lastMsg;
      lastMsg = msg;
      if (isVerifierErrorMessage(msg)) {
        return {
          ok: false,
          errorMessage: msg,
          verifierMismatch: true,
        };
      }
      if (!error || !isTransientNetworkMessage(msg)) {
        return {
          ok: false,
          errorMessage: msg,
          verifierMismatch: false,
        };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastMsg = msg;
      if (isVerifierErrorMessage(msg)) {
        return {
          ok: false,
          errorMessage: msg,
          verifierMismatch: true,
        };
      }
      if (!isTransientNetworkMessage(msg)) {
        return {
          ok: false,
          errorMessage: msg,
          verifierMismatch: false,
        };
      }
    }
  }
  return { ok: false, errorMessage: lastMsg, verifierMismatch: false };
}

export async function setSessionFromTokensWithRetry(
  supabase: SupabaseClient,
  access_token: string,
  refresh_token: string,
): Promise<ExchangeResult> {
  let lastMsg = "Could not complete sign-in.";
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      await sleep(350 * attempt);
    }
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (data.session && !error) {
        return { ok: true, session: data.session };
      }
      if (!error && !data.session) {
        return {
          ok: false,
          errorMessage: "No session returned. Try opening the link again or sign in with email.",
          verifierMismatch: false,
        };
      }
      const msg = error?.message ?? lastMsg;
      lastMsg = msg;
      if (!error || !isTransientNetworkMessage(msg)) {
        return {
          ok: false,
          errorMessage: msg,
          verifierMismatch: false,
        };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastMsg = msg;
      if (!isTransientNetworkMessage(msg)) {
        return {
          ok: false,
          errorMessage: msg,
          verifierMismatch: false,
        };
      }
    }
  }
  return { ok: false, errorMessage: lastMsg, verifierMismatch: false };
}

/** Where to send the user once we have a valid session from the deep link. */
export function getPostAuthCallbackHref(session: Session): "/(tabs)/garden" | "/onboarding/choose-habits" {
  const done = session.user?.user_metadata?.onboarding_completed === true;
  return done ? "/(tabs)/garden" : "/onboarding/choose-habits";
}
