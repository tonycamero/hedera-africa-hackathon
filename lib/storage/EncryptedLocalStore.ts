import { LocalStateKey, LocalStateSchema, LOCAL_STATE_MANIFEST } from './localStateSchema';
import { getStorageAdapter, StorageAdapter } from './adapters';

/**
 * EncryptedLocalStore
 * 
 * Unified interface for all local state persistence in TrustMesh.
 * Thin wrapper around platform-specific adapters (IndexedDB, React Native, etc.)
 * 
 * The adapters handle:
 * - Owner-scoping (all data tied to wallet address)
 * - TTL expiration (automatic cleanup)
 * - Encryption (AES-GCM-256 via device key)
 * - Manifest compliance (only allowed keys can be stored)
 * 
 * This class provides:
 * - Simplified API for application code
 * - Lifecycle management (init/shutdown)
 * - Auto-save coordination
 * - Statistics and debugging
 * 
 * Truth: HCS topics (immutable ledger)
 * Cache: This store (encrypted ephemeral checkpoints)
 * UX: Instant load + background sync
 */
export class EncryptedLocalStore {
  private adapter: StorageAdapter;
  private ownerAddress: string | null = null;
  private hederaAccountId: string | null = null;
  private isInitialized = false;

  constructor() {
    this.adapter = getStorageAdapter();
  }

  /**
   * Initialize store with user's wallet address.
   * 
   * Call this on login/app launch after Magic.link authentication.
   * 
   * @param ownerAddress - Magic.link public address (used for encryption key derivation)
   * @param hederaAccountId - Optional Hedera account ID (used for scoping)
   */
  async initialize(ownerAddress: string, hederaAccountId?: string): Promise<void> {
    if (this.isInitialized && this.ownerAddress === ownerAddress) {
      return; // Already initialized for this owner
    }

    this.ownerAddress = ownerAddress.toLowerCase();
    this.hederaAccountId = hederaAccountId || ownerAddress;
    
    // Initialize adapter (handles encryption key derivation)
    await this.adapter.initialize(this.hederaAccountId, this.ownerAddress);
    
    this.isInitialized = true;

    // Request persistent storage for PWA (prevents browser eviction)
    if (typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage.persist) {
      await navigator.storage.persist();
    }

    // Clean up expired entries on init
    await this.cleanupExpired();
  }

  /**
   * Check if store is ready to use.
   */
  isReady(): boolean {
    return this.isInitialized && this.ownerAddress !== null;
  }

  /**
   * Get current owner address.
   */
  getOwner(): string | null {
    return this.ownerAddress;
  }

  /**
   * Set a value in encrypted storage.
   * Automatically enforces manifest rules (TTL, encryption, scoping).
   * 
   * @param key - Must be a valid LocalStateKey from manifest
   * @param value - Data to store (will be encrypted by adapter)
   */
  async set<K extends LocalStateKey>(
    key: K,
    value: LocalStateSchema[K]['data']
  ): Promise<void> {
    this.assertReady();

    const manifest = LOCAL_STATE_MANIFEST[key];
    if (!manifest) {
      throw new Error(`Invalid state key: ${key}. Not in LOCAL_STATE_MANIFEST.`);
    }

    // Delegate to adapter (handles encryption, TTL, scoping)
    await this.adapter.set(key, value, manifest);
  }

  /**
   * Get a value from encrypted storage.
   * Returns null if key doesn't exist, is expired, or owner mismatch.
   * 
   * @param key - Must be a valid LocalStateKey from manifest
   */
  async get<K extends LocalStateKey>(
    key: K
  ): Promise<LocalStateSchema[K]['data'] | null> {
    this.assertReady();

    const manifest = LOCAL_STATE_MANIFEST[key];
    if (!manifest) {
      throw new Error(`Invalid state key: ${key}. Not in LOCAL_STATE_MANIFEST.`);
    }

    // Delegate to adapter (handles decryption, TTL, scoping)
    return await this.adapter.get(key, manifest);
  }

  /**
   * Delete a key from storage.
   */
  async delete(key: LocalStateKey): Promise<void> {
    this.assertReady();
    await this.adapter.delete(key);
  }

  /**
   * Check if a key exists and is valid (not expired, owner match).
   */
  async has(key: LocalStateKey): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Clear ALL storage for current owner.
   * Use on logout or account switch.
   */
  async clear(): Promise<void> {
    this.assertReady();
    await this.adapter.clearAll();
  }

  /**
   * Clean up expired entries for current owner.
   * Call periodically or on app launch.
   */
  async cleanupExpired(): Promise<void> {
    this.assertReady();
    await this.adapter.cleanupExpired();
  }

  /**
   * Shutdown store (close adapter, clear sensitive data).
   * Call on logout.
   */
  async shutdown(): Promise<void> {
    if (this.isInitialized) {
      await this.adapter.close();
    }
    this.ownerAddress = null;
    this.hederaAccountId = null;
    this.isInitialized = false;
  }

  /**
   * Assert store is initialized and ready.
   */
  private assertReady(): void {
    if (!this.isReady()) {
      throw new Error('EncryptedLocalStore not initialized. Call initialize(ownerAddress) first.');
    }
  }
}

// Singleton instance
let _store: EncryptedLocalStore | null = null;

/**
 * Get singleton instance of EncryptedLocalStore.
 * Use this throughout the app to ensure single source of truth.
 */
export function getEncryptedLocalStore(): EncryptedLocalStore {
  if (!_store) {
    _store = new EncryptedLocalStore();
  }
  return _store;
}
