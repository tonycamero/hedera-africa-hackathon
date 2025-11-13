/**
 * Web storage adapter using IndexedDB + Web Crypto
 * 
 * Implements encrypted, owner-scoped, TTL-enforced local storage for PWAs.
 * 
 * Storage structure:
 * - Database: trustmesh_v1
 * - Object store: state
 * - Key: StateKey (from schema)
 * - Value: { owner, encryptedData, metadata }
 */

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import type {
  LocalStateKey,
  LocalStateSchema,
  LocalStateEntryMeta,
} from '../localStateSchema';
import {
  deriveEncryptionKey,
  encryptJSON,
  decryptJSON,
  EncryptedPayload,
  EncryptionKey,
} from '../encryption';

// ========== TYPES ==========

interface StoredEntry<K extends LocalStateKey> {
  key: K;
  owner: string;                    // Hedera account ID
  encryptedData: EncryptedPayload;  // Encrypted value
  metadata: {
    createdAt: number;
    expiresAt: number | null;       // null = no expiry
    version: number;
  };
}

interface TrustMeshDB extends DBSchema {
  state: {
    key: LocalStateKey;
    value: StoredEntry<LocalStateKey>;
  };
  metadata: {
    key: string;
    value: any;
  };
}

// ========== ADAPTER ==========

export class IndexedDBStorageAdapter {
  private db: IDBPDatabase<TrustMeshDB> | null = null;
  private encryptionKey: EncryptionKey | null = null;
  private currentOwner: string | null = null;

  private readonly DB_NAME = 'trustmesh_v1';
  private readonly DB_VERSION = 1;

  // ========== INITIALIZATION ==========

  /**
   * Initialize the adapter with user's encryption key
   * 
   * @param ownerAccountId - User's Hedera account ID
   * @param userIdentifier - Magic.link public address (for key derivation)
   */
  async initialize(ownerAccountId: string, userIdentifier: string): Promise<void> {
    // Derive encryption key
    this.encryptionKey = await deriveEncryptionKey(userIdentifier);
    this.currentOwner = ownerAccountId;

    // Open IndexedDB
    this.db = await openDB<TrustMeshDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create object stores on first run
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      },
    });

    console.log('[IndexedDB] Initialized for owner:', ownerAccountId);
  }

  // ========== CORE OPERATIONS ==========

  /**
   * Save a value to encrypted storage
   */
  async set<K extends LocalStateKey>(
    key: K,
    value: LocalStateSchema[K]['data'],
    meta: LocalStateEntryMeta<any>
  ): Promise<void> {
    this.ensureInitialized();

    // Calculate expiry
    const expiresAt = this.calculateExpiry(meta.ttl);

    // Encrypt value
    const encryptedData = await encryptJSON(value, this.encryptionKey!);

    // Store
    const entry: StoredEntry<K> = {
      key,
      owner: this.currentOwner!,
      encryptedData,
      metadata: {
        createdAt: Date.now(),
        expiresAt,
        version: 1,
      },
    };

    await this.db!.put('state', entry as any);

    console.log('[IndexedDB] Saved:', key, {
      encrypted: true,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : 'never',
    });
  }

  /**
   * Get a value from encrypted storage
   * 
   * Returns null if:
   * - Key doesn't exist
   * - Value expired
   * - Owner mismatch
   * - Decryption failed
   */
  async get<K extends LocalStateKey>(
    key: K,
    meta: LocalStateEntryMeta<any>
  ): Promise<LocalStateSchema[K]['data'] | null> {
    this.ensureInitialized();

    try {
      const entry = await this.db!.get('state', key);

      if (!entry) {
        console.log('[IndexedDB] Miss:', key);
        return null;
      }

      // Check owner
      if (entry.owner !== this.currentOwner) {
        console.warn('[IndexedDB] Owner mismatch:', key, {
          stored: entry.owner,
          current: this.currentOwner,
        });
        await this.db!.delete('state', key); // Clean up
        return null;
      }

      // Check expiry
      if (entry.metadata.expiresAt && Date.now() > entry.metadata.expiresAt) {
        console.log('[IndexedDB] Expired:', key);
        await this.db!.delete('state', key); // Clean up
        return null;
      }

      // Decrypt
      const value = await decryptJSON(entry.encryptedData, this.encryptionKey!);

      console.log('[IndexedDB] Hit:', key);
      return value as LocalStateSchema[K]['data'];
    } catch (error) {
      console.error('[IndexedDB] Get failed:', key, error);
      return null;
    }
  }

  /**
   * Delete a specific key
   */
  async delete<K extends LocalStateKey>(key: K): Promise<void> {
    this.ensureInitialized();
    await this.db!.delete('state', key);
    console.log('[IndexedDB] Deleted:', key);
  }

  /**
   * Clear all data for current owner
   */
  async clearAll(): Promise<void> {
    this.ensureInitialized();

    const tx = this.db!.transaction('state', 'readwrite');
    const store = tx.objectStore('state');
    const allKeys = await store.getAllKeys();

    let deletedCount = 0;
    for (const key of allKeys) {
      const entry = await store.get(key);
      if (entry && entry.owner === this.currentOwner) {
        await store.delete(key);
        deletedCount++;
      }
    }

    await tx.done;

    console.log('[IndexedDB] Cleared all state for owner:', this.currentOwner, {
      deletedCount,
    });
  }

  /**
   * Cleanup expired entries (garbage collection)
   */
  async cleanupExpired(): Promise<void> {
    this.ensureInitialized();

    const tx = this.db!.transaction('state', 'readwrite');
    const store = tx.objectStore('state');
    const allEntries = await store.getAll();

    let deletedCount = 0;
    const now = Date.now();

    for (const entry of allEntries) {
      if (entry.metadata.expiresAt && now > entry.metadata.expiresAt) {
        await store.delete(entry.key);
        deletedCount++;
      }
    }

    await tx.done;

    if (deletedCount > 0) {
      console.log('[IndexedDB] Cleanup:', { deletedCount, total: allEntries.length });
    }
  }

  // ========== UTILITIES ==========

  /**
   * Request persistent storage (prevents browser eviction)
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (!navigator.storage || !navigator.storage.persist) {
      console.warn('[IndexedDB] Persistent storage API not available');
      return false;
    }

    const isPersisted = await navigator.storage.persist();
    console.log('[IndexedDB] Persistent storage:', isPersisted ? 'granted' : 'denied');
    return isPersisted;
  }

  /**
   * Get storage quota info
   */
  async getStorageInfo(): Promise<{ usage: number; quota: number; percent: number }> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { usage: 0, quota: 0, percent: 0 };
    }

    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percent = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percent };
  }

  // ========== HELPERS ==========

  private ensureInitialized(): void {
    if (!this.db || !this.encryptionKey || !this.currentOwner) {
      throw new Error('IndexedDBStorageAdapter not initialized. Call initialize() first.');
    }
  }

  private calculateExpiry(ttl: LocalStateSchema[LocalStateKey]['ttl']): number | null {
    switch (ttl) {
      case 'until_logout':
        return null; // Cleared explicitly
      case '24h':
        return Date.now() + 24 * 60 * 60 * 1000;
      case '30d':
        return Date.now() + 30 * 24 * 60 * 60 * 1000;
      case '14d':
        return Date.now() + 14 * 24 * 60 * 60 * 1000;
      case '90d':
        return Date.now() + 90 * 24 * 60 * 60 * 1000;
      case 'indefinite':
        return null;
      default:
        return null;
    }
  }

  /**
   * Close database connection (cleanup on logout)
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.encryptionKey = null;
    this.currentOwner = null;
    console.log('[IndexedDB] Connection closed');
  }
}
