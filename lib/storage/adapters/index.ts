/**
 * Storage adapter factory
 * 
 * Auto-detects platform and returns appropriate storage adapter:
 * - Web (PWA): IndexedDB + Web Crypto
 * - React Native: react-native-encrypted-storage (future)
 * - Fallback: In-memory only (for SSR/testing)
 */

import { IndexedDBStorageAdapter } from './web';
import type {
  LocalStateKey,
  LocalStateSchema,
  LocalStateEntryMeta,
} from '../localStateSchema';

// ========== ADAPTER INTERFACE ==========

export interface StorageAdapter {
  initialize(ownerAccountId: string, userIdentifier: string): Promise<void>;
  set<K extends LocalStateKey>(
    key: K,
    value: LocalStateSchema[K]['data'],
    meta: LocalStateEntryMeta<any>
  ): Promise<void>;
  get<K extends LocalStateKey>(
    key: K,
    meta: LocalStateEntryMeta<any>
  ): Promise<LocalStateSchema[K]['data'] | null>;
  delete<K extends LocalStateKey>(key: K): Promise<void>;
  clearAll(): Promise<void>;
  cleanupExpired(): Promise<void>;
  close(): Promise<void>;
}

// ========== PLATFORM DETECTION ==========

function detectPlatform(): 'web' | 'native' | 'unknown' {
  // React Native detection
  if (
    typeof navigator !== 'undefined' &&
    navigator.product === 'ReactNative'
  ) {
    return 'native';
  }

  // Web browser detection
  if (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof indexedDB !== 'undefined'
  ) {
    return 'web';
  }

  return 'unknown';
}

// ========== IN-MEMORY FALLBACK ==========

/**
 * In-memory storage (for SSR or when no persistent storage available)
 * 
 * WARNING: This adapter loses all data on page refresh.
 * Only use for testing or as fallback.
 */
class InMemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<LocalStateKey, any>();
  private currentOwner: string | null = null;

  async initialize(ownerAccountId: string, _userIdentifier: string): Promise<void> {
    this.currentOwner = ownerAccountId;
    console.warn('[InMemory] Using in-memory storage (data will be lost on refresh)');
  }

  async set<K extends LocalStateKey>(
    key: K,
    value: LocalStateSchema[K]['data'],
    _meta: LocalStateEntryMeta<any>
  ): Promise<void> {
    this.storage.set(key, value);
  }

  async get<K extends LocalStateKey>(
    key: K,
    _meta: LocalStateEntryMeta<any>
  ): Promise<LocalStateSchema[K]['data'] | null> {
    return this.storage.get(key) ?? null;
  }

  async delete<K extends LocalStateKey>(key: K): Promise<void> {
    this.storage.delete(key);
  }

  async clearAll(): Promise<void> {
    this.storage.clear();
  }

  async cleanupExpired(): Promise<void> {
    // No-op for in-memory
  }

  async close(): Promise<void> {
    this.storage.clear();
    this.currentOwner = null;
  }
}

// ========== FACTORY ==========

/**
 * Get the appropriate storage adapter for current platform
 * 
 * Usage:
 * ```ts
 * const adapter = getStorageAdapter();
 * await adapter.initialize(hederaAccountId, magicPublicAddress);
 * await adapter.set('contactsSnapshot', contacts, meta);
 * const contacts = await adapter.get('contactsSnapshot', meta);
 * ```
 */
export function getStorageAdapter(): StorageAdapter {
  const platform = detectPlatform();

  switch (platform) {
    case 'web':
      return new IndexedDBStorageAdapter();

    case 'native':
      // TODO: Implement react-native-encrypted-storage adapter
      console.warn('[Storage] React Native adapter not implemented yet, using in-memory');
      return new InMemoryStorageAdapter();

    case 'unknown':
    default:
      console.warn('[Storage] Unknown platform, using in-memory storage');
      return new InMemoryStorageAdapter();
  }
}

// ========== EXPORTS ==========

export { IndexedDBStorageAdapter } from './web';
export { InMemoryStorageAdapter };
