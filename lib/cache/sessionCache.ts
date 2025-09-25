// lib/cache/sessionCache.ts
type CacheBackend = Storage; // localStorage (default) or sessionStorage
const NS = "flex.sessionCache";
const VERSION = 1;

export type CacheEnvelope<T> = {
  v: number;
  sid: string;         // cache session id
  startedAt: number;   // epoch ms when session began
  updatedAt: number;   // epoch ms
  payload: T;
};

type CacheState = {
  sid: string | null;
  startedAt: number | null;
  enabled: boolean;
  backend: CacheBackend;
};

const state: CacheState = {
  sid: null,
  startedAt: null,
  enabled: false,
  backend: typeof window !== "undefined" ? window.localStorage : ({} as any),
};

function key(k: string) {
  return `${NS}:${k}`;
}

export function configureCacheBackend(useSessionStorage = false) {
  if (typeof window === "undefined") return;
  state.backend = useSessionStorage ? window.sessionStorage : window.localStorage;
}

export function beginCacheSession(sid?: string) {
  const now = Date.now();
  state.sid = sid ?? `sid_${now}_${Math.random().toString(36).slice(2, 8)}`;
  state.startedAt = now;
  state.enabled = true;
  write("__meta", { v: VERSION, sid: state.sid, startedAt: now, updatedAt: now });
}

export function endCacheSession() {
  state.enabled = false;
}

export function clearCache() {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < state.backend.length; i++) {
    const k = state.backend.key(i);
    if (k && k.startsWith(NS)) toRemove.push(k);
  }
  toRemove.forEach(k => state.backend.removeItem(k));
  state.sid = null;
  state.startedAt = null;
  state.enabled = false;
}

function write<T>(suffix: string, payload: T) {
  if (!state.enabled || !state.sid) return;
  const env: CacheEnvelope<T> = {
    v: VERSION,
    sid: state.sid,
    startedAt: state.startedAt!,
    updatedAt: Date.now(),
    payload,
  };
  try {
    state.backend.setItem(key(`${state.sid}:${suffix}`), JSON.stringify(env));
  } catch { /* storage full / private mode */ }
}

function read<T>(suffix: string): CacheEnvelope<T> | null {
  if (!state.sid) return null;
  try {
    const raw = state.backend.getItem(key(`${state.sid}:${suffix}`));
    return raw ? JSON.parse(raw) as CacheEnvelope<T> : null;
  } catch { return null; }
}

/** Public helpers for common objects **/

// raw Mirror messages merged across topics
export function saveMirrorRaw(messages: any[]) {
  write("mirrorRaw", messages);
}
export function loadMirrorRaw(): any[] | null {
  return read<any[]>("mirrorRaw")?.payload ?? null;
}

// normalized signal events (what your UI consumes)
import type { SignalEvent } from "@/lib/stores/signalsStore";
export function saveSignals(signals: SignalEvent[]) {
  write("signals", signals);
}
export function loadSignals(): SignalEvent[] | null {
  return read<SignalEvent[]>("signals")?.payload ?? null;
}

// lightweight derived state (counters, top9, etc.)
export type DerivedState = {
  outboundUsed: number;
  outboundAvail: number;
  inboundTop9Ids: string[];
  lastConsensusISO?: string;
};
export function saveDerivedState(s: DerivedState) {
  write("derived", s);
}
export function loadDerivedState(): DerivedState | null {
  return read<DerivedState>("derived")?.payload ?? null;
}

// Additional functions needed by bootstrap system
const REGISTRY_NS_KEY = `${NS}:registry:ns`;
const REGISTRY_SNAPSHOT_KEY = `${NS}:registry:snapshot`;
const VERSION_KEY = `${NS}:version`;

/** Clear all cached entries safely when version changes or other invalidation rules hit */
export function maybeInvalidate(currentVersion = VERSION.toString()) {
  if (typeof window === "undefined") return;
  try {
    const existing = state.backend.getItem(VERSION_KEY);
    if (existing === currentVersion) return;
    // nuke only our namespace
    const toRemove: string[] = [];
    for (let i = 0; i < state.backend.length; i++) {
      const k = state.backend.key(i);
      if (k && k.startsWith(`${NS}:`)) toRemove.push(k);
    }
    toRemove.forEach((key) => state.backend.removeItem(key));
    state.backend.setItem(VERSION_KEY, currentVersion);
  } catch {}
}

/** Registry namespace lets you segment snapshots by registry id/network */
export function setRegistryNamespace(ns: string) {
  if (typeof window === "undefined") return;
  try { state.backend.setItem(REGISTRY_NS_KEY, ns); } catch {}
}

export function getRegistryNamespace(): string | null {
  if (typeof window === "undefined") return null;
  try { return state.backend.getItem(REGISTRY_NS_KEY); } catch { return null; }
}

/** Persist a compact snapshot of resolved topics from HCS-2 (or fallback) */
export function saveRegistrySnapshot(snapshot: unknown) {
  if (typeof window === "undefined") return;
  try {
    state.backend.setItem(REGISTRY_SNAPSHOT_KEY, JSON.stringify({ v: VERSION, ts: Date.now(), snapshot }));
  } catch {}
}

export function loadRegistrySnapshot<T = any>(): { snapshot: T; ts: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = state.backend.getItem(REGISTRY_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) ?? {};
    const { snapshot, ts } = parsed;
    if (!snapshot) return null;
    return { snapshot, ts };
  } catch {
    return null;
  }
}

// Export generic read/write for registryCache.ts
export { write, read };
