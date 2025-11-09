// HCS-22 Event Reducer - In-memory state management with ordering and idempotency
import type { Hcs22Envelope } from './types';
// Crypto not needed here - removed unused import

type Binding = { 
  accountId: string; 
  active: boolean; 
  lastType: string; 
  lastIat: string;
  evmAddress?: string;
};

// In-memory binding registry: issuer -> binding
const bindings = new Map<string, Binding>();

// Track warmup state
let warmupComplete = false;
let warmupPromise: Promise<void> | null = null;

/**
 * Process an HCS-22 event and update binding state
 * Implements ordering (by timestamp) and idempotency (skip duplicates)
 */
export function reduceHcs22(event: Hcs22Envelope) {
  const sub = event.sub.toLowerCase();
  const current = bindings.get(sub);

  // Idempotency: Skip if event is older than or equal to last processed event
  if (current && new Date(event.iat) <= new Date(current.lastIat)) {
    console.log(`[HCS22] Skip old/duplicate ${event.t} for ${sub} (${event.iat} <= ${current.lastIat})`);
    return;
  }

  // ROTATE/UNBIND require signature (signature verification delegated to verify.ts)
  if ((event.t === 'IDENTITY_ROTATE' || event.t === 'IDENTITY_UNBIND') && !event.sig) {
    console.warn(`[HCS22] Reject ${event.t} without sig for ${sub}`);
    return;
  }

  // Process event based on type
  switch (event.t) {
    case 'IDENTITY_BIND':
    case 'IDENTITY_ASSERT':
      bindings.set(sub, {
        accountId: event.payload.hedera_account_id,
        active: true,
        lastType: event.t,
        lastIat: event.iat,
        evmAddress: event.payload.evm_address,
      });
      // Silent - only log in debug mode
      break;

    case 'IDENTITY_ROTATE':
      bindings.set(sub, {
        accountId: event.payload.to_hedera_id,
        active: true,
        lastType: event.t,
        lastIat: event.iat,
        evmAddress: current?.evmAddress, // preserve EVM address
      });
      // Silent - only log in debug mode
      break;

    case 'IDENTITY_UNBIND':
      if (current) {
        bindings.set(sub, { 
          ...current, 
          active: false, 
          lastType: event.t, 
          lastIat: event.iat 
        });
      }
      // Silent - only log in debug mode
      break;
  }
}

/**
 * Ensure warmup has completed (lazy init if not done yet)
 */
async function ensureWarmup() {
  if (warmupComplete) return;
  
  if (!warmupPromise) {
    warmupPromise = (async () => {
      try {
        const { initHcs22 } = await import('./init');
        await initHcs22();
        warmupComplete = true;
      } catch (error) {
        console.error('[HCS Reducer] Warmup failed:', error);
        warmupPromise = null; // Allow retry
      }
    })();
  }
  
  await warmupPromise;
}

/**
 * Get the active Hedera Account ID for an issuer
 * Returns null if no active binding exists
 */
export async function getBinding(issuer: string): Promise<string | null> {
  await ensureWarmup();
  
  const normalized = issuer.toLowerCase();
  const b = bindings.get(normalized);
  
  // Silent lookup - only log misses in debug mode
  if (!b && process.env.HCS22_LOG_LEVEL === 'debug') {
    console.log(`[HCS Reducer] No binding found for ${normalized}`);
  }
  
  return b?.active ? b.accountId : null;
}

/**
 * Get all binding details for an issuer (for debugging/admin)
 */
export function getBindingDetails(issuer: string): Binding | null {
  return bindings.get(issuer.toLowerCase()) || null;
}

/**
 * Get binding registry stats (for health/telemetry)
 */
export function getBindingStats() {
  const active = Array.from(bindings.values()).filter(b => b.active).length;
  return {
    total: bindings.size,
    active,
    inactive: bindings.size - active,
  };
}

/**
 * Clear all bindings (for testing only)
 */
export function clearBindings() {
  bindings.clear();
  console.log('[HCS22] Cleared all bindings');
}
