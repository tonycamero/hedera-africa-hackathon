// HCS-22 Resolver - Cache → HCS reducer → Mirror fallback with non-blocking ASSERT
import { getBinding } from './reducer';
import { lookupAccountByEvm } from './mirror';
import { publishHcs22Async } from './publish';
import { assertEvent } from './types';

// Simple TTL cache: issuer -> { accountId, expiry }
const cache = new Map<string, { accountId: string; expiry: number }>();
const TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Resolve Hedera Account ID from Magic issuer (DID)
 * 
 * Resolution strategy:
 * 1. Check cache (fast, in-memory)
 * 2. Check HCS reducer (warm state from ingested events)
 * 3. Check Mirror Node (stateless lookup by EVM address)
 * 4. Return null if not found (account needs to be provisioned)
 * 
 * When resolved via Mirror, publishes non-blocking ASSERT event for audit trail
 */
export async function resolveHederaAccountId(issuer: string): Promise<string | null> {
  const sub = issuer.toLowerCase();
  const now = Date.now();

  // 1. Check cache
  const cached = cache.get(sub);
  if (cached && now < cached.expiry) {
    console.log(`[HCS22 Resolver] Cache hit for ${sub}: ${cached.accountId}`);
    return cached.accountId;
  }

  // 2. Check HCS reducer (in-memory state from ingested events)
  const fromHcs = getBinding(sub);
  if (fromHcs) {
    console.log(`[HCS22 Resolver] HCS reducer hit for ${sub}: ${fromHcs}`);
    cache.set(sub, { accountId: fromHcs, expiry: now + TTL_MS });
    return fromHcs;
  }

  // 3. Check Mirror Node (fast-path for existing accounts)
  // Extract EVM address from issuer (did:ethr:0x...)
  const evm = extractEvmFromIssuer(sub);
  if (!evm) {
    console.warn(`[HCS22 Resolver] Invalid issuer format: ${sub}`);
    return null;
  }

  const fromMirror = await lookupAccountByEvm(evm);
  if (fromMirror) {
    console.log(`[HCS22 Resolver] Mirror hit for ${sub}: ${fromMirror}`);
    
    // Publish non-blocking ASSERT event for audit trail (with sampling)
    const samplingRate = parseFloat(process.env.HCS22_ASSERT_SAMPLING || '1.0');
    if (Math.random() < samplingRate) {
      publishHcs22Async(assertEvent(issuer, fromMirror, 'mirror-resolution'));
    } else {
      console.log(`[HCS22 Resolver] Skipped ASSERT (sampling: ${samplingRate})`);
    }
    
    // Cache the result
    cache.set(sub, { accountId: fromMirror, expiry: now + TTL_MS });
    return fromMirror;
  }

  // 4. Not found anywhere
  console.log(`[HCS22 Resolver] No account found for ${sub}`);
  return null;
}

/**
 * Extract EVM address from Magic issuer DID
 * Expected format: did:ethr:0x... or did:ethr:...
 */
function extractEvmFromIssuer(issuer: string): string | null {
  const normalized = issuer.toLowerCase();
  
  // Match did:ethr:0x... or did:ethr:...
  const match = normalized.match(/^did:ethr:(0x)?([0-9a-f]{40})$/);
  if (!match) {
    return null;
  }
  
  return `0x${match[2]}`;
}

/**
 * Clear resolver cache (for testing or manual invalidation)
 */
export function clearResolverCache() {
  cache.clear();
  console.log('[HCS22 Resolver] Cleared cache');
}

/**
 * Get resolver cache stats (for health/telemetry)
 */
export function getResolverStats() {
  const now = Date.now();
  const valid = Array.from(cache.values()).filter(entry => now < entry.expiry).length;
  
  return {
    total: cache.size,
    valid,
    expired: cache.size - valid,
  };
}
