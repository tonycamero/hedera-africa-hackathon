/**
 * Idempotency Lock Helper
 * 
 * Prevents duplicate Hedera account creation during concurrent provision requests.
 * Uses in-memory locks with TTL (production should use Redis/KV store).
 * 
 * HARD GUARD: Always acquire lock before provisioning new accounts.
 */

interface LockEntry {
  did: string;
  acquiredAt: number;
  ttlMs: number;
}

// In-memory lock store (use Redis in production)
const locks = new Map<string, LockEntry>();

// Cleanup interval to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of locks.entries()) {
    if (now - lock.acquiredAt > lock.ttlMs) {
      locks.delete(key);
      console.log(`[IdentityLock] Released expired lock for ${lock.did}`);
    }
  }
}, 5000); // Cleanup every 5 seconds

/**
 * Execute function with identity lock to prevent duplicate account creation
 * 
 * @param did - Canonical DID to lock on
 * @param fn - Async function to execute while holding lock
 * @param ttlMs - Lock TTL in milliseconds (default 15s)
 * @returns Result of fn()
 * @throws Error if lock already held
 */
export async function withIdentityLock<T>(
  did: string,
  fn: () => Promise<T>,
  ttlMs: number = 15000
): Promise<T> {
  const lockKey = `identity:${did}`;
  
  // Check if lock already exists
  const existing = locks.get(lockKey);
  const now = Date.now();
  
  if (existing && (now - existing.acquiredAt < existing.ttlMs)) {
    const elapsed = now - existing.acquiredAt;
    const remaining = existing.ttlMs - elapsed;
    throw new Error(
      `[IdentityLock] Provision already in progress for ${did} (${Math.round(remaining / 1000)}s remaining)`
    );
  }
  
  // Acquire lock
  console.log(`[IdentityLock] Acquired lock for ${did} (TTL: ${ttlMs}ms)`);
  locks.set(lockKey, {
    did,
    acquiredAt: now,
    ttlMs
  });
  
  try {
    // Execute function with lock held
    const result = await fn();
    return result;
  } finally {
    // Always release lock
    locks.delete(lockKey);
    console.log(`[IdentityLock] Released lock for ${did}`);
  }
}

/**
 * Check if lock is currently held for a DID
 */
export function isLocked(did: string): boolean {
  const lockKey = `identity:${did}`;
  const existing = locks.get(lockKey);
  
  if (!existing) return false;
  
  const now = Date.now();
  const isActive = (now - existing.acquiredAt < existing.ttlMs);
  
  if (!isActive) {
    // Expired lock, clean it up
    locks.delete(lockKey);
    return false;
  }
  
  return true;
}

/**
 * Force release a lock (use with caution - for testing/admin only)
 */
export function forceReleaseLock(did: string): void {
  const lockKey = `identity:${did}`;
  locks.delete(lockKey);
  console.warn(`[IdentityLock] FORCE RELEASED lock for ${did}`);
}

/**
 * Get lock stats for monitoring
 */
export function getLockStats(): { total: number; locks: { did: string; ageMs: number }[] } {
  const now = Date.now();
  const activeLocks = Array.from(locks.values())
    .filter(lock => now - lock.acquiredAt < lock.ttlMs)
    .map(lock => ({
      did: lock.did,
      ageMs: now - lock.acquiredAt
    }));
  
  return {
    total: activeLocks.length,
    locks: activeLocks
  };
}
