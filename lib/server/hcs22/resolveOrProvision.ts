import { withIdentityLock } from '@/lib/util/withIdentityLock';
import { getCanonicalDid, assertSafeForHCS } from '@/lib/util/getCanonicalDid';
import { publishHcs22 } from './publish';
import { bindEvent } from './types';

/**
 * Resolve or Provision Service
 * 
 * HARD GUARD: Server-side only. Never trust client-supplied Hedera account IDs.
 * 
 * Flow: cache → reducer → mirror → provision (with lock)
 * 
 * This ensures:
 * - Same DID always maps to same Hedera account (idempotent)
 * - No duplicate accounts from concurrent requests (lock guard)
 * - Cross-browser re-logins work correctly (stable DID)
 */

interface ResolutionResult {
  did: string;
  hederaAccountId: string;
  source: 'cache' | 'reducer' | 'mirror' | 'provisioned';
  timestamp: string;
}

// In-memory cache (use Redis in production)
const didCache = new Map<string, { accountId: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve DID to Hedera account ID, or provision if needed
 * 
 * @param issuer - Magic issuer DID (stable across sessions)
 * @returns Resolution result with Hedera account ID
 */
export async function resolveOrProvision(issuer: string): Promise<ResolutionResult> {
  // Step 1: Use issuer as stable DID
  // Magic's issuer is in format did:ethr:0xADDRESS and is stable across sessions
  console.log(`[ResolveOrProvision] Resolving for issuer: ${issuer}`);
  
  const did = issuer.toLowerCase(); // Normalize to lowercase for consistency
  assertSafeForHCS(did);
  
  console.log(`[ResolveOrProvision] Starting resolution for ${did}`);
  
  // Step 2: Check cache
  const cached = didCache.get(did);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[ResolveOrProvision] Cache hit for ${did} → ${cached.accountId}`);
    return {
      did,
      hederaAccountId: cached.accountId,
      source: 'cache',
      timestamp: new Date().toISOString()
    };
  }
  
  // Step 3: Check HCS reducer (query topic messages for latest binding)
  const reducerResult = await queryHCSReducer(did);
  if (reducerResult) {
    console.log(`[ResolveOrProvision] HCS reducer found ${did} → ${reducerResult}`);
    updateCache(did, reducerResult);
    return {
      did,
      hederaAccountId: reducerResult,
      source: 'reducer',
      timestamp: new Date().toISOString()
    };
  }
  
  // Step 4: Check Mirror Node (EVM alias lookup)
  const mirrorResult = await queryMirrorNode(did);
  if (mirrorResult) {
    console.log(`[ResolveOrProvision] Mirror Node found ${did} → ${mirrorResult}`);
    updateCache(did, mirrorResult);
    return {
      did,
      hederaAccountId: mirrorResult,
      source: 'mirror',
      timestamp: new Date().toISOString()
    };
  }
  
  // Step 5: No existing binding - provision new account (with lock)
  console.log(`[ResolveOrProvision] No existing account for ${did}, provisioning...`);
  
  const accountId = await withIdentityLock(did, async () => {
    // Double-check after acquiring lock (another request may have completed)
    const recheck = await queryMirrorNode(did);
    if (recheck) {
      console.log(`[ResolveOrProvision] Account created by concurrent request: ${recheck}`);
      return recheck;
    }
    
    // Provision new Hedera account
    const newAccountId = await provisionHederaAccount(did);
    console.log(`[ResolveOrProvision] Provisioned new account: ${did} → ${newAccountId}`);
    
    // Verify via Mirror Node
    await verifyAccountCreation(newAccountId);
    
    // Publish IDENTITY_BIND to HCS-22 topic for durable persistence
    const evmAddress = did.replace('did:ethr:', '');
    try {
      const bindingEvent = bindEvent({
        issuer: did,
        hederaId: newAccountId,
        evmAddress,
      });
      
      await publishHcs22(bindingEvent);
      console.log(`[ResolveOrProvision] Published IDENTITY_BIND to HCS-22`);
      
      // Immediately reduce the event to update in-memory cache
      // This ensures the binding is available for subsequent requests without waiting for topic polling
      const { reduceHcs22 } = await import('./reducer');
      reduceHcs22(bindingEvent);
      console.log(`[ResolveOrProvision] Reduced IDENTITY_BIND locally`);
    } catch (error) {
      console.error(`[ResolveOrProvision] Failed to publish IDENTITY_BIND:`, error);
      // Non-blocking - account is already created and verified
    }
    
    return newAccountId;
  });
  
  updateCache(did, accountId);
  
  return {
    did,
    hederaAccountId: accountId,
    source: 'provisioned',
    timestamp: new Date().toISOString()
  };
}

/**
 * Query HCS reducer for latest DID binding
 * Uses the in-memory reducer state that was hydrated on startup
 */
async function queryHCSReducer(did: string): Promise<string | null> {
  try {
    // Import getBinding from the reducer (now async)
    const { getBinding } = await import('./reducer');
    
    // Query the in-memory binding registry (await since it's now async)
    const accountId = await getBinding(did);
    
    return accountId;
  } catch (error) {
    console.error('[HCS Reducer] Query failed:', error);
    return null;
  }
}

/**
 * Query Mirror Node for EVM alias → Hedera account mapping
 */
async function queryMirrorNode(did: string): Promise<string | null> {
  // Extract EVM address from DID
  const evmAddress = did.replace('did:ethr:', '');
  
  if (!evmAddress.startsWith('0x')) {
    console.warn('[Mirror Query] Invalid EVM address format');
    return null;
  }
  
  try {
    // Query Mirror Node accounts endpoint with EVM alias
    const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts?account.id=${evmAddress}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.accounts && data.accounts.length > 0) {
      const account = data.accounts[0];
      return account.account;
    }
    
    return null;
  } catch (error) {
    console.error('[Mirror Query] Failed:', error);
    return null;
  }
}

/**
 * Provision new Hedera account for DID
 * Creates account directly using Hedera SDK with EVM alias auto-create
 */
async function provisionHederaAccount(did: string): Promise<string> {
  // Extract EVM address from DID
  const evmAddress = did.replace('did:ethr:', '');
  
  console.log(`[Provision] Creating Hedera account for EVM alias ${evmAddress}`);
  
  // Use Hedera SDK directly instead of internal fetch
  const { getHederaClient } = await import('@/lib/hedera/serverClient');
  const { TransferTransaction, Hbar, AccountId } = await import('@hashgraph/sdk');
  
  const client = await getHederaClient();
  
  // Create account by sending 1 HBAR to EVM alias (auto-create)
  // The EVM alias format triggers Hedera's auto-account-creation
  const tx = await new TransferTransaction()
    .addHbarTransfer(client.operatorAccountId!, new Hbar(-1))
    .addHbarTransfer(AccountId.fromEvmAddress(0, 0, evmAddress), new Hbar(1))
    .execute(client);
  
  const receipt = await tx.getReceipt(client);
  
  // Query the account that was just created via the EVM alias
  // The Mirror Node will now have the mapping
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for mirror propagation
  
  const mirrorAccountId = await queryMirrorNode(did);
  if (!mirrorAccountId) {
    throw new Error(`Failed to verify account creation for ${evmAddress}`);
  }
  
  console.log(`[Provision] Account created: ${mirrorAccountId}`);
  return mirrorAccountId;
}

/**
 * Verify account creation via Mirror Node
 * Polls Mirror until account appears (eventual consistency)
 */
async function verifyAccountCreation(accountId: string, maxAttempts = 5): Promise<void> {
  console.log(`[Verify] Checking Mirror Node for ${accountId}...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`;
      const response = await fetch(url);
      
      if (response.ok) {
        console.log(`[Verify] Account ${accountId} confirmed on Mirror Node`);
        return;
      }
    } catch (err) {
      // Retry
    }
    
    // Wait before retry (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
  }
  
  console.warn(`[Verify] Could not verify ${accountId} on Mirror Node after ${maxAttempts} attempts`);
}

/**
 * Update cache with DID → account mapping
 */
function updateCache(did: string, accountId: string): void {
  didCache.set(did, {
    accountId,
    timestamp: Date.now()
  });
}

/**
 * Clear cache entry (for testing/admin)
 */
export function clearCacheEntry(did: string): void {
  didCache.delete(did);
  console.log(`[Cache] Cleared entry for ${did}`);
}

/**
 * Get cache stats for monitoring
 */
export function getCacheStats() {
  const now = Date.now();
  const entries = Array.from(didCache.entries()).map(([did, entry]) => ({
    did,
    accountId: entry.accountId,
    ageMs: now - entry.timestamp,
    expired: (now - entry.timestamp) > CACHE_TTL_MS
  }));
  
  return {
    total: entries.length,
    active: entries.filter(e => !e.expired).length,
    expired: entries.filter(e => e.expired).length,
    entries
  };
}
