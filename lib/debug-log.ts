/** Debug-only logger that routes to the agent's HTTP ingest server on the Mac's LAN IP.
 *  Derives host from Metro's source URL so it works on a physical device. */
import { NativeModules } from 'react-native';

const SESSION_ID = '5377c6';
const PORT = 7908;
const PATH = '/ingest/a1a35e63-5050-4bd1-9df6-656795a4f245';

function getEndpoint(): string | null {
  try {
    const raw = (NativeModules as { SourceCode?: { scriptURL?: string } }).SourceCode?.scriptURL;
    if (!raw) return null;
    const match = raw.match(/^https?:\/\/([^/:]+)(?::\d+)?/);
    if (!match) return null;
    return `http://${match[1]}:${PORT}${PATH}`;
  } catch {
    return null;
  }
}

export function agentLog(payload: {
  hypothesisId?: string;
  location: string;
  message: string;
  data?: unknown;
}): void {
  try {
    const endpoint = getEndpoint();
    if (!endpoint) return;
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': SESSION_ID,
      },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        hypothesisId: payload.hypothesisId,
        location: payload.location,
        message: payload.message,
        data: payload.data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}
