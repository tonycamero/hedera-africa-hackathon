// lib/cache/registryCache.ts
import { write, read } from './sessionCache';

export type RegistrySnapshot = {
  registryId: string;
  topics: { 
    feed: string; 
    contacts: string; 
    trust: string; 
    recognition: string; 
    profile: string; 
    system: string;
  };
  updatedAt: number;
};

// Cache namespace scoping by registry
let REGISTRY_NS = "unknown";

export function setRegistryNamespace(registryId: string) {
  REGISTRY_NS = registryId || "unknown";
  console.log('[RegistryCache] Set namespace:', REGISTRY_NS);
}

export function getRegistryNamespace(): string {
  return REGISTRY_NS;
}

// Registry-scoped cache operations
export function saveRegistrySnapshot(s: RegistrySnapshot) { 
  write("registrySnapshot", s);
  console.log('[RegistryCache] Saved snapshot:', s.registryId, 'topics:', Object.keys(s.topics).length);
}

export function loadRegistrySnapshot(): RegistrySnapshot | null { 
  const snapshot = read<RegistrySnapshot>("registrySnapshot")?.payload ?? null;
  if (snapshot) {
    console.log('[RegistryCache] Loaded snapshot:', snapshot.registryId, 'age:', Date.now() - snapshot.updatedAt + 'ms');
  }
  return snapshot;
}

// Enhanced signals cache with registry awareness
export function saveSignalsWithRegistry(signals: any[]) {
  const snapshot = loadRegistrySnapshot();
  const meta = {
    registryId: snapshot?.registryId || 'unknown',
    topicsHash: snapshot ? JSON.stringify(snapshot.topics) : 'none',
    savedAt: Date.now(),
    count: signals.length
  };
  
  write("signals", signals);
  write("signalsMeta", meta);
  console.log('[RegistryCache] Saved', signals.length, 'signals with registry context:', meta.registryId);
}

export function loadSignalsWithRegistry(): { signals: any[], meta: any } | null {
  const signals = read<any[]>("signals")?.payload ?? [];
  const meta = read<any>("signalsMeta")?.payload ?? null;
  
  if (signals.length > 0 && meta) {
    console.log('[RegistryCache] Loaded', signals.length, 'signals from registry:', meta.registryId);
    return { signals, meta };
  }
  
  return null;
}