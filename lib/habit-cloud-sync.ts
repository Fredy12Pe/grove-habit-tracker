/**
 * Local-first cloud sync for signed-in users.
 *
 * - Guests / missing Supabase config: no-ops.
 * - One JSON snapshot row per user (`public.habit_snapshots`).
 * - Completions & entries merge additively; habit list merges by `updatedAt`
 *   with order taken from the newer snapshot.
 * - Mutations mark dirty and debounce a push; sign-in / foreground pull+merge.
 */
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { calendarDateKey } from '@/lib/calendarDate';
import { computeGrowthState } from '@/lib/game/plantGrowth';
import { trackEvent } from '@/lib/analytics';
import { isTransientNetworkError } from '@/lib/auth-invalid-session';
import { captureException } from '@/lib/sentry';
import { isSupabaseConfigured } from '@/lib/supabase-env';
import { getSupabase } from '@/lib/supabase';
import type {
  CompletionDatesByHabit,
  HabitEntriesByHabit,
  HabitEntry,
} from '@/lib/store/useHabitStore';
import { useHabitStore } from '@/lib/store/useHabitStore';
import type { Habit } from '@/lib/types';

export type HabitCloudSlice = {
  habits: Habit[];
  completionDates: CompletionDatesByHabit;
  habitEntries: HabitEntriesByHabit;
  lastResetDate: string | null;
};

type CloudMeta = {
  userId: string | null;
  /** ISO time of last successful push or pull that we applied. */
  lastSyncedAt: string | null;
  dirty: boolean;
  /** ISO time of the latest local mutation while dirty. */
  dirtyAt: string | null;
};

type RemoteRow = {
  user_id: string;
  habits: unknown;
  completion_dates: unknown;
  habit_entries: unknown;
  last_reset_date: string | null;
  updated_at: string;
};

const META_KEY = 'grove.habits.cloud.meta';
const PUSH_DEBOUNCE_MS = 1600;

let activeUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
/** Resolves to whether the in-flight attempt succeeded, so waiters know if it's safe to chase a retry. */
let syncInFlight: Promise<boolean> | null = null;
let applyingRemote = false;
let storeUnsub: (() => void) | null = null;
let appStateSub: { remove: () => void } | null = null;
let started = false;

function getAsyncStorage(): {
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
  removeItem: (k: string) => Promise<void>;
} | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return {
      getItem: async (k) => window.localStorage.getItem(k),
      setItem: async (k, v) => {
        window.localStorage.setItem(k, v);
      },
      removeItem: async (k) => {
        window.localStorage.removeItem(k);
      },
    };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage') as {
      default?: {
        getItem: (key: string) => Promise<string | null>;
        setItem: (key: string, value: string) => Promise<void>;
        removeItem: (key: string) => Promise<void>;
      };
    };
    if (mod?.default) return mod.default;
  } catch {
    /* ignore */
  }
  return null;
}

async function readCloudMeta(): Promise<CloudMeta> {
  const storage = getAsyncStorage();
  if (!storage) {
    return { userId: null, lastSyncedAt: null, dirty: false, dirtyAt: null };
  }
  try {
    const raw = await storage.getItem(META_KEY);
    if (!raw) {
      return { userId: null, lastSyncedAt: null, dirty: false, dirtyAt: null };
    }
    const o = JSON.parse(raw) as Partial<CloudMeta>;
    return {
      userId: typeof o.userId === 'string' ? o.userId : null,
      lastSyncedAt: typeof o.lastSyncedAt === 'string' ? o.lastSyncedAt : null,
      dirty: o.dirty === true,
      dirtyAt: typeof o.dirtyAt === 'string' ? o.dirtyAt : null,
    };
  } catch {
    return { userId: null, lastSyncedAt: null, dirty: false, dirtyAt: null };
  }
}

async function writeCloudMeta(meta: CloudMeta): Promise<void> {
  const storage = getAsyncStorage();
  if (!storage) return;
  try {
    await storage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.warn('[habit-cloud] write meta:', e);
  }
}

export async function clearHabitCloudMeta(): Promise<void> {
  const storage = getAsyncStorage();
  if (!storage) return;
  try {
    await storage.removeItem(META_KEY);
  } catch (e) {
    console.warn('[habit-cloud] clear meta:', e);
  }
}

function readLocalSlice(): HabitCloudSlice {
  const s = useHabitStore.getState();
  return {
    habits: s.habits,
    completionDates: s.completionDates,
    habitEntries: s.habitEntries,
    lastResetDate: s.lastResetDate,
  };
}

function isHabitArray(value: unknown): value is Habit[] {
  return Array.isArray(value);
}

function asCompletionDates(value: unknown): CompletionDatesByHabit {
  if (!value || typeof value !== 'object') return {};
  const out: CompletionDatesByHabit = {};
  for (const [id, dates] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(dates)) continue;
    out[id] = dates.filter((d): d is string => typeof d === 'string');
  }
  return out;
}

function asHabitEntries(value: unknown): HabitEntriesByHabit {
  if (!value || typeof value !== 'object') return {};
  const out: HabitEntriesByHabit = {};
  for (const [habitId, byDate] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!byDate || typeof byDate !== 'object') continue;
    const dates: Record<string, HabitEntry> = {};
    for (const [date, entry] of Object.entries(
      byDate as Record<string, unknown>,
    )) {
      if (!entry || typeof entry !== 'object') continue;
      dates[date] = entry as HabitEntry;
    }
    out[habitId] = dates;
  }
  return out;
}

function remoteToSlice(row: RemoteRow): HabitCloudSlice & { updatedAt: string } {
  return {
    habits: isHabitArray(row.habits) ? (row.habits as Habit[]) : [],
    completionDates: asCompletionDates(row.completion_dates),
    habitEntries: asHabitEntries(row.habit_entries),
    lastResetDate:
      typeof row.last_reset_date === 'string' ? row.last_reset_date : null,
    updatedAt: row.updated_at,
  };
}

function habitTimestamp(h: Habit): string {
  return h.updatedAt || h.createdAt || '';
}

/**
 * Merge habit rows by id (newer `updatedAt` wins).
 * - `membership: 'local'` — keep local ids (deletes win); optionally admit remote-only
 *   habits created after `includeRemoteOnlyIfCreatedAfter`.
 * - `membership: 'remote'` — keep remote ids.
 * - `membership: 'union'` — keep ids from both (first cloud sync / no baseline yet).
 */
function mergeHabits(
  local: Habit[],
  remote: Habit[],
  membership: 'local' | 'remote' | 'union',
  includeRemoteOnlyIfCreatedAfter: string | null,
): Habit[] {
  const byId = new Map<string, Habit>();
  for (const h of remote) byId.set(h.id, h);
  for (const h of local) {
    const other = byId.get(h.id);
    if (!other || habitTimestamp(h) >= habitTimestamp(other)) {
      byId.set(h.id, h);
    }
  }

  const preferOrder =
    membership === 'remote'
      ? remote
      : membership === 'union'
        ? [...local, ...remote]
        : local;

  const ordered: Habit[] = [];
  const seen = new Set<string>();
  for (const h of preferOrder) {
    const merged = byId.get(h.id);
    if (!merged || seen.has(h.id)) continue;
    ordered.push(merged);
    seen.add(h.id);
  }

  if (membership === 'local' && includeRemoteOnlyIfCreatedAfter) {
    for (const h of remote) {
      if (seen.has(h.id)) continue;
      const created = habitTimestamp(h);
      if (
        created &&
        remoteUpdatedAtCompare(created, includeRemoteOnlyIfCreatedAfter) > 0
      ) {
        ordered.push(byId.get(h.id) ?? h);
        seen.add(h.id);
      }
    }
  }

  if (membership === 'union') {
    for (const h of byId.values()) {
      if (seen.has(h.id)) continue;
      ordered.push(h);
      seen.add(h.id);
    }
  }

  return ordered;
}

function unionCompletionDates(
  a: CompletionDatesByHabit,
  b: CompletionDatesByHabit,
): CompletionDatesByHabit {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: CompletionDatesByHabit = {};
  for (const id of ids) {
    const set = new Set([...(a[id] ?? []), ...(b[id] ?? [])]);
    out[id] = [...set].sort();
  }
  return out;
}

/**
 * Completions are toggles (add OR remove a day). A plain union resurrects
 * un-completions from a stale remote snapshot — so membership follows the same
 * authority rules as the habit list, not "ever completed anywhere".
 */
function mergeCompletionDates(
  local: CompletionDatesByHabit,
  remote: CompletionDatesByHabit,
  mode: 'local' | 'remote' | 'union',
  localHabitIds: Set<string>,
): CompletionDatesByHabit {
  if (mode === 'union') {
    return unionCompletionDates(local, remote);
  }

  if (mode === 'local') {
    const out: CompletionDatesByHabit = {};
    for (const [id, dates] of Object.entries(local)) {
      out[id] = [...dates].sort();
    }
    // Remote-only habits (not on this device yet) keep their history.
    for (const [id, dates] of Object.entries(remote)) {
      if (localHabitIds.has(id) || id in local) continue;
      out[id] = [...dates].sort();
    }
    return out;
  }

  // mode === 'remote'
  const out: CompletionDatesByHabit = {};
  for (const [id, dates] of Object.entries(remote)) {
    out[id] = [...dates].sort();
  }
  for (const [id, dates] of Object.entries(local)) {
    if (id in remote) continue;
    out[id] = [...dates].sort();
  }
  return out;
}

function mergeEntry(a: HabitEntry = {}, b: HabitEntry = {}): HabitEntry {
  const next: HabitEntry = { ...a };
  for (const key of Object.keys(b) as (keyof HabitEntry)[]) {
    const bv = b[key];
    const av = a[key];
    if (bv === undefined) continue;
    if (av === undefined) {
      next[key] = bv as never;
      continue;
    }
    // Prefer the longer string / larger number when both exist.
    if (typeof bv === 'string' && typeof av === 'string') {
      next[key] = (bv.length >= av.length ? bv : av) as never;
    } else if (typeof bv === 'number' && typeof av === 'number') {
      next[key] = (bv >= av ? bv : av) as never;
    } else if (Array.isArray(bv) && Array.isArray(av)) {
      const bLen = (bv as string[]).join('').length;
      const aLen = (av as string[]).join('').length;
      next[key] = (bLen >= aLen ? bv : av) as never;
    } else {
      next[key] = bv as never;
    }
  }
  return next;
}

function mergeHabitEntries(
  a: HabitEntriesByHabit,
  b: HabitEntriesByHabit,
): HabitEntriesByHabit {
  const habitIds = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: HabitEntriesByHabit = {};
  for (const habitId of habitIds) {
    const aDates = a[habitId] ?? {};
    const bDates = b[habitId] ?? {};
    const dates = new Set([...Object.keys(aDates), ...Object.keys(bDates)]);
    const byDate: Record<string, HabitEntry> = {};
    for (const date of dates) {
      byDate[date] = mergeEntry(aDates[date], bDates[date]);
    }
    out[habitId] = byDate;
  }
  return out;
}

function maxDateKey(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

/** Recompute derived fields so UI stays consistent after a remote apply. */
export function normalizeHabitCloudSlice(slice: HabitCloudSlice): HabitCloudSlice {
  const today = calendarDateKey();
  const completionDates = { ...slice.completionDates };
  const habits = slice.habits.map((h) => {
    const dates = completionDates[h.id] ?? [];
    const completedToday = dates.includes(today);
    return {
      ...h,
      completedToday,
      growthState: computeGrowthState(
        { id: h.id, completedToday },
        completionDates,
        today,
      ),
    };
  });
  return {
    habits,
    completionDates,
    habitEntries: slice.habitEntries,
    lastResetDate: slice.lastResetDate,
  };
}

export function mergeHabitCloudSlices(
  local: HabitCloudSlice,
  remote: HabitCloudSlice,
  options: {
    localDirty: boolean;
    remoteUpdatedAt: string;
    lastSyncedAt: string | null;
    dirtyAt: string | null;
  },
): HabitCloudSlice {
  const hasSyncBaseline = Boolean(options.lastSyncedAt);
  const remoteIsNewer =
    hasSyncBaseline &&
    remoteUpdatedAtCompare(options.remoteUpdatedAt, options.lastSyncedAt!) > 0;

  let habits: Habit[];
  let completionMode: 'local' | 'remote' | 'union';
  if (!hasSyncBaseline) {
    // First cloud contact for this install: never drop either side's habits.
    habits = mergeHabits(local.habits, remote.habits, 'union', null);
    completionMode = 'union';
  } else if (!options.localDirty && remoteIsNewer) {
    habits = mergeHabits(local.habits, remote.habits, 'remote', null);
    completionMode = 'remote';
  } else {
    // Local membership wins (covers deletes + un-completions). Admit remote-only
    // habits created after we last synced / dirtied so offline creates survive.
    const createdAfter =
      options.dirtyAt ?? options.lastSyncedAt ?? options.remoteUpdatedAt;
    habits = mergeHabits(local.habits, remote.habits, 'local', createdAfter);
    completionMode = 'local';
  }

  const localHabitIds = new Set(local.habits.map((h) => h.id));

  return normalizeHabitCloudSlice({
    habits,
    completionDates: mergeCompletionDates(
      local.completionDates,
      remote.completionDates,
      completionMode,
      localHabitIds,
    ),
    habitEntries: mergeHabitEntries(local.habitEntries, remote.habitEntries),
    lastResetDate: maxDateKey(local.lastResetDate, remote.lastResetDate),
  });
}

function remoteUpdatedAtCompare(a: string, b: string): number {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (!Number.isNaN(ta) && !Number.isNaN(tb)) return ta - tb;
  return a < b ? -1 : a > b ? 1 : 0;
}

function applySliceToStore(slice: HabitCloudSlice): void {
  applyingRemote = true;
  try {
    const normalized = normalizeHabitCloudSlice(slice);
    useHabitStore.setState({
      habits: normalized.habits,
      completionDates: normalized.completionDates,
      habitEntries: normalized.habitEntries,
      lastResetDate: normalized.lastResetDate,
    });
  } finally {
    // Allow zustand subscribers to settle before accepting dirty marks again.
    queueMicrotask(() => {
      applyingRemote = false;
    });
  }
}

async function fetchRemoteSnapshot(
  userId: string,
): Promise<(HabitCloudSlice & { updatedAt: string }) | null> {
  const { data, error } = await getSupabase()
    .from('habit_snapshots')
    .select(
      'user_id, habits, completion_dates, habit_entries, last_reset_date, updated_at',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return remoteToSlice(data as RemoteRow);
}

async function pushSlice(userId: string, slice: HabitCloudSlice): Promise<string> {
  const updatedAt = new Date().toISOString();
  const { error } = await getSupabase().from('habit_snapshots').upsert(
    {
      user_id: userId,
      habits: slice.habits,
      completion_dates: slice.completionDates,
      habit_entries: slice.habitEntries,
      last_reset_date: slice.lastResetDate,
      updated_at: updatedAt,
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    throw new Error(error.message);
  }
  return updatedAt;
}

function slicesEqual(a: HabitCloudSlice, b: HabitCloudSlice): boolean {
  return (
    JSON.stringify(a.habits) === JSON.stringify(b.habits) &&
    JSON.stringify(a.completionDates) === JSON.stringify(b.completionDates) &&
    JSON.stringify(a.habitEntries) === JSON.stringify(b.habitEntries) &&
    a.lastResetDate === b.lastResetDate
  );
}

/**
 * Pull remote (if any), merge with local, apply, and push the result.
 * Safe to call often; concurrent calls share one in-flight promise.
 */
export async function syncHabitCloudNow(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  if (syncInFlight) {
    const priorSucceeded = await syncInFlight;
    // Edits during a *successful* in-flight sync leave `dirty`; push them now. Don't
    // chase a retry after a failed attempt — that would spin in a tight loop offline.
    if (!priorSucceeded) return;
    const meta = await readCloudMeta();
    if (meta.dirty && meta.userId === userId && activeUserId === userId) {
      await syncHabitCloudNow(userId);
    }
    return;
  }

  syncInFlight = (async () => {
    let succeeded = false;
    try {
      const remote = await fetchRemoteSnapshot(userId);
      // Re-read after the network round-trip so a toggle during fetch isn't lost.
      const meta = await readCloudMeta();
      const local = readLocalSlice();

      if (!remote) {
        const pushedAt = await pushSlice(userId, local);
        // If the user toggled again while we pushed, keep dirty for a follow-up.
        const afterPush = readLocalSlice();
        const stillDirty = !slicesEqual(afterPush, local);
        await writeCloudMeta({
          userId,
          lastSyncedAt: pushedAt,
          dirty: stillDirty,
          dirtyAt: stillDirty ? new Date().toISOString() : null,
        });
        trackEvent('habit_cloud_uploaded', { reason: 'empty_remote' });
        succeeded = true;
        return succeeded;
      }

      const merged = mergeHabitCloudSlices(local, remote, {
        localDirty: meta.dirty === true && meta.userId === userId,
        remoteUpdatedAt: remote.updatedAt,
        lastSyncedAt: meta.userId === userId ? meta.lastSyncedAt : null,
        dirtyAt: meta.userId === userId ? meta.dirtyAt : null,
      });

      // If local changed while we were merging, prefer the newer local slice
      // (still fold remote under local-dirty rules) instead of clobbering the tap.
      const localNow = readLocalSlice();
      const finalSlice = !slicesEqual(localNow, local)
        ? mergeHabitCloudSlices(localNow, remote, {
            localDirty: true,
            remoteUpdatedAt: remote.updatedAt,
            lastSyncedAt: meta.userId === userId ? meta.lastSyncedAt : null,
            dirtyAt: new Date().toISOString(),
          })
        : merged;

      if (!slicesEqual(finalSlice, localNow)) {
        applySliceToStore(finalSlice);
      }

      const toPush = readLocalSlice();
      const pushedAt = await pushSlice(userId, toPush);
      const afterPush = readLocalSlice();
      const stillDirty = !slicesEqual(afterPush, toPush);
      await writeCloudMeta({
        userId,
        lastSyncedAt: pushedAt,
        dirty: stillDirty,
        dirtyAt: stillDirty ? new Date().toISOString() : null,
      });
      trackEvent('habit_cloud_synced');
      succeeded = true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isTransientNetworkError(msg)) {
        console.warn('[habit-cloud] sync skipped (network):', msg);
      } else {
        captureException(e, { where: 'syncHabitCloudNow', userId });
        console.warn('[habit-cloud] sync failed:', e);
      }
    }
    return succeeded;
  })();

  let succeededThisCall = false;
  try {
    succeededThisCall = await syncInFlight;
  } finally {
    syncInFlight = null;
  }

  /**
   * Only chase a fresh edit that raced in *during a successful* sync. Retrying
   * immediately after a failure (offline, dropped connection) would recurse with
   * zero backoff and spin in a tight loop hammering the network — the debounced
   * push timer / AppState listener / next explicit call already cover retrying later.
   */
  if (!succeededThisCall) return;

  const metaAfter = await readCloudMeta();
  if (
    metaAfter.dirty &&
    metaAfter.userId === userId &&
    activeUserId === userId
  ) {
    await syncHabitCloudNow(userId);
  }
}

/** Best-effort upload of the current local slice (e.g. before sign-out). */
export async function flushHabitCloudPush(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    const meta = await readCloudMeta();
    if (meta.userId === userId && !meta.dirty) return;
    const pushedAt = await pushSlice(userId, readLocalSlice());
    await writeCloudMeta({
      userId,
      lastSyncedAt: pushedAt,
      dirty: false,
      dirtyAt: null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Simulator / brief offline blips are expected; don't page Sentry or red-box.
    if (isTransientNetworkError(msg)) {
      console.warn('[habit-cloud] flush push skipped (network):', msg);
      return;
    }
    captureException(e, { where: 'flushHabitCloudPush', userId });
    console.warn('[habit-cloud] flush push failed:', e);
  }
}

async function markDirtyAndSchedulePush(userId: string): Promise<void> {
  if (!userId || applyingRemote) return;
  const now = new Date().toISOString();
  const meta = await readCloudMeta();
  await writeCloudMeta({
    userId,
    lastSyncedAt: meta.userId === userId ? meta.lastSyncedAt : null,
    dirty: true,
    dirtyAt: now,
  });

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void syncHabitCloudNow(userId);
  }, PUSH_DEBOUNCE_MS);
}

function onStoreChange(): void {
  if (!activeUserId || applyingRemote) return;
  void markDirtyAndSchedulePush(activeUserId);
}

/** Only mark dirty when persisted habit fields actually change. */
function subscribeToHabitStore(): () => void {
  let prev = readLocalSlice();
  return useHabitStore.subscribe(() => {
    const next = readLocalSlice();
    if (slicesEqual(prev, next)) return;
    prev = next;
    if (!activeUserId || applyingRemote) return;
    onStoreChange();
  });
}

function onAppState(next: AppStateStatus): void {
  if (next !== 'active' || !activeUserId) return;
  void syncHabitCloudNow(activeUserId);
}

/**
 * Stop marking dirty / pushing without a network flush.
 * Use before account deletion so a hung upsert cannot block the UI spinner.
 */
export function pauseHabitCloudSync(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  activeUserId = null;
}

/**
 * Start / switch cloud sync for the signed-in user. Pass `null` on sign-out.
 * Call after local per-user snapshot restore so we merge the right device state.
 */
export async function setHabitCloudSyncUser(
  userId: string | null,
): Promise<void> {
  if (!isSupabaseConfigured) {
    activeUserId = null;
    return;
  }

  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }

  const previous = activeUserId;
  if (previous && previous !== userId) {
    try {
      await Promise.race([
        flushHabitCloudPush(previous),
        new Promise<void>((_, reject) =>
          setTimeout(
            () => reject(new Error('flushHabitCloudPush timed out')),
            4000,
          ),
        ),
      ]);
    } catch (e) {
      console.warn('[habit-cloud] flush before user switch skipped:', e);
    }
  }

  activeUserId = userId;

  if (!started) {
    started = true;
    storeUnsub = subscribeToHabitStore();
    appStateSub = AppState.addEventListener('change', onAppState);
  }

  if (!userId) {
    return;
  }

  try {
    await Promise.race([
      syncHabitCloudNow(userId),
      new Promise<void>((_, reject) =>
        setTimeout(
          () => reject(new Error('syncHabitCloudNow timed out')),
          6000,
        ),
      ),
    ]);
  } catch (e) {
    console.warn('[habit-cloud] sync after user switch skipped:', e);
  }
}

/** Tear down listeners (tests / rare full reset). */
export function stopHabitCloudSync(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  storeUnsub?.();
  storeUnsub = null;
  appStateSub?.remove();
  appStateSub = null;
  activeUserId = null;
  started = false;
}
