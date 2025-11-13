/**
 * Lifecycle hooks for EncryptedLocalStore
 * 
 * Manages storage lifecycle across app events:
 * - onLogin: Initialize storage with user's encryption key
 * - onLogout: Clear all state and shutdown
 * - onAppVisible: Resume auto-save, cleanup expired
 * - onAppHidden: Flush pending saves
 * - Auto-save: Periodic persistence (60s default)
 */

import { getEncryptedLocalStore } from './EncryptedLocalStore';

// ========== LIFECYCLE STATE ==========

interface LifecycleState {
  isInitialized: boolean;
  currentOwner: string | null;
  autoSaveCallbacks: Array<() => Promise<void>>;
  autoSaveInterval: NodeJS.Timeout | null;
}

const state: LifecycleState = {
  isInitialized: false,
  currentOwner: null,
  autoSaveCallbacks: [],
  autoSaveInterval: null,
};

// ========== LOGIN/LOGOUT ==========

/**
 * Initialize encrypted storage on user login
 * 
 * Call this after Magic.link authentication succeeds.
 * 
 * @param ownerAddress - User's wallet address (Magic.link public address)
 * @param hederaAccountId - Optional Hedera account ID (if already provisioned)
 * 
 * @example
 * ```ts
 * const magic = useMagic();
 * const user = await magic.user.getMetadata();
 * await onLogin(user.publicAddress);
 * ```
 */
export async function onLogin(
  ownerAddress: string,
  hederaAccountId?: string
): Promise<void> {
  console.log('[Lifecycle] Login:', ownerAddress);

  const store = getEncryptedLocalStore();

  // Initialize store
  await store.initialize(ownerAddress);

  // Start auto-save (60s interval by default)
  startAutoSave();

  // Cleanup expired entries from previous sessions
  await store.cleanupExpired();

  state.isInitialized = true;
  state.currentOwner = ownerAddress;

  console.log('[Lifecycle] Initialized storage for:', ownerAddress);
}

/**
 * Clear encrypted storage on user logout
 * 
 * Call this when user logs out or switches accounts.
 * Clears all cached state and shuts down auto-save.
 * 
 * @example
 * ```ts
 * const magic = useMagic();
 * await magic.user.logout();
 * await onLogout();
 * ```
 */
export async function onLogout(): Promise<void> {
  console.log('[Lifecycle] Logout:', state.currentOwner);

  const store = getEncryptedLocalStore();

  // Stop auto-save
  stopAutoSave();

  // Clear all state for current owner
  if (store.isReady()) {
    await store.clear();
  }

  // Shutdown store
  await store.shutdown();

  state.isInitialized = false;
  state.currentOwner = null;

  console.log('[Lifecycle] Storage cleared and shutdown complete');
}

// ========== APP VISIBILITY ==========

/**
 * Resume storage operations when app becomes visible
 * 
 * - Restarts auto-save
 * - Runs cleanup of expired entries
 * - Triggers immediate save of pending changes
 * 
 * Hook this to `visibilitychange` or React Native AppState.
 */
export async function onAppVisible(): Promise<void> {
  if (!state.isInitialized) return;

  console.log('[Lifecycle] App visible');

  const store = getEncryptedLocalStore();

  // Restart auto-save if it was stopped
  if (!state.autoSaveInterval) {
    startAutoSave();
  }

  // Cleanup expired entries
  await store.cleanupExpired();

  // Trigger immediate save
  await executeAutoSave();
}

/**
 * Pause storage operations when app becomes hidden
 * 
 * - Flushes pending saves
 * - Stops auto-save timer (will restart on visible)
 * 
 * Hook this to `visibilitychange` or React Native AppState.
 */
export async function onAppHidden(): Promise<void> {
  if (!state.isInitialized) return;

  console.log('[Lifecycle] App hidden');

  // Flush pending saves
  await executeAutoSave();

  // Stop auto-save to conserve battery
  stopAutoSave();
}

// ========== AUTO-SAVE ==========

/**
 * Register a callback to be executed on auto-save
 * 
 * Use this to persist in-memory state periodically.
 * Callbacks are executed every 60s (or custom interval).
 * 
 * @param callback - Async function to persist state
 * 
 * @example
 * ```ts
 * registerAutoSave(async () => {
 *   const store = getEncryptedLocalStore();
 *   await store.set('contactsSnapshot', contacts);
 * });
 * ```
 */
export function registerAutoSave(callback: () => Promise<void>): void {
  state.autoSaveCallbacks.push(callback);
  console.log('[Lifecycle] Registered auto-save callback:', callback.name || 'anonymous');
}

/**
 * Unregister an auto-save callback
 */
export function unregisterAutoSave(callback: () => Promise<void>): void {
  const index = state.autoSaveCallbacks.indexOf(callback);
  if (index !== -1) {
    state.autoSaveCallbacks.splice(index, 1);
    console.log('[Lifecycle] Unregistered auto-save callback');
  }
}

/**
 * Start auto-save timer (internal use)
 */
function startAutoSave(intervalMs = 60000): void {
  if (state.autoSaveInterval) {
    return; // Already running
  }

  state.autoSaveInterval = setInterval(async () => {
    await executeAutoSave();
  }, intervalMs);

  console.log('[Lifecycle] Auto-save started:', intervalMs, 'ms');
}

/**
 * Stop auto-save timer (internal use)
 */
function stopAutoSave(): void {
  if (state.autoSaveInterval) {
    clearInterval(state.autoSaveInterval);
    state.autoSaveInterval = null;
    console.log('[Lifecycle] Auto-save stopped');
  }
}

/**
 * Execute all registered auto-save callbacks
 */
async function executeAutoSave(): Promise<void> {
  if (!state.isInitialized || state.autoSaveCallbacks.length === 0) {
    return;
  }

  console.log('[Lifecycle] Executing auto-save:', state.autoSaveCallbacks.length, 'callbacks');

  const results = await Promise.allSettled(
    state.autoSaveCallbacks.map(cb => cb())
  );

  // Log failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error('[Lifecycle] Auto-save callback failed:', index, result.reason);
    }
  });
}

/**
 * Manually trigger auto-save (useful for critical saves)
 */
export async function triggerAutoSave(): Promise<void> {
  await executeAutoSave();
}

// ========== BROWSER INTEGRATION ==========

/**
 * Setup browser lifecycle hooks automatically
 * 
 * Call this once in your app root (_app.tsx or layout.tsx).
 * Handles visibility changes and page unload.
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   setupBrowserLifecycle();
 * }, []);
 * ```
 */
export function setupBrowserLifecycle(): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // SSR
  }

  // Visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      onAppHidden().catch(console.error);
    } else {
      onAppVisible().catch(console.error);
    }
  };

  // Page unload (flush saves)
  const handleBeforeUnload = () => {
    // Synchronous fallback - try to flush
    executeAutoSave().catch(console.error);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);

  console.log('[Lifecycle] Browser hooks registered');

  // Cleanup
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    console.log('[Lifecycle] Browser hooks unregistered');
  };
}

// ========== REACT HOOK ==========

/**
 * React hook for storage lifecycle
 * 
 * Automatically sets up lifecycle hooks and provides state.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { isReady, owner } = useStorageLifecycle();
 *   
 *   if (!isReady) return <div>Loading...</div>;
 *   
 *   return <div>Welcome {owner}</div>;
 * }
 * ```
 */
export function useStorageLifecycle() {
  if (typeof window === 'undefined') {
    return { isReady: false, owner: null };
  }

  // Could be converted to actual React hook if needed
  return {
    isReady: state.isInitialized,
    owner: state.currentOwner,
  };
}

// ========== DEBUG UTILITIES ==========

/**
 * Get current lifecycle state (for debugging)
 */
export function getLifecycleState(): Readonly<LifecycleState> {
  return {
    ...state,
    autoSaveCallbacks: [...state.autoSaveCallbacks], // Copy array
  };
}

/**
 * Force cleanup of expired entries (manual trigger)
 */
export async function forceCleanup(): Promise<void> {
  if (!state.isInitialized) {
    console.warn('[Lifecycle] Cannot cleanup - not initialized');
    return;
  }

  const store = getEncryptedLocalStore();
  await store.cleanupExpired();
  console.log('[Lifecycle] Manual cleanup complete');
}

