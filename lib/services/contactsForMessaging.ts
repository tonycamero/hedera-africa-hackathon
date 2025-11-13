import type { ScendIdentity } from '@/lib/identity/ScendIdentity';
import type { Client as XmtpClient } from '@xmtp/browser-sdk';
import { Client, type Identifier } from '@xmtp/browser-sdk';
import { XMTP_ENV } from '@/lib/config/xmtp';
import { signalsStore } from '@/lib/stores/signalsStore';

export interface MessagingContact {
  hederaAccountId: string;
  evmAddress: string;
  displayName: string;
  bonded: boolean;
  hasXMTP: boolean;
  lastBondedAt?: number;
}

// Hedera -> EVM resolution cache
const evmCache = new Map<string, { evmAddress: string; ts: number }>();
const EVM_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// XMTP reachability cache (LRU-ish with capacity limit)
const reachabilityCache = new Map<string, { hasXMTP: boolean; ts: number }>();
const REACHABILITY_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REACHABILITY_MAX = 100; // LRU cap

/**
 * Resolve EVM address from Hedera account ID using XMTP's inbox lookup
 * XMTP can find users by their Hedera account if they've initialized with Magic
 * 
 * For Magic users: XMTP stores the mapping between their EVM address (from Magic)
 * and any identifiers they used (including Hedera account format)
 */
async function resolveEvmForHedera(hederaAccountId: string): Promise<string> {
  const cached = evmCache.get(hederaAccountId);
  if (cached && Date.now() - cached.ts < EVM_CACHE_TTL_MS) {
    console.log(`[contactsForMessaging] Using cached EVM for ${hederaAccountId}: ${cached.evmAddress}`);
    return cached.evmAddress;
  }

  console.log(`[contactsForMessaging] Resolving EVM address for Hedera account: ${hederaAccountId}`);

  try {
    // Try XMTP's identifier lookup first - this works for users who initialized XMTP
    const { Utils } = await import('@xmtp/browser-sdk');
    const utils = new Utils();
    const env = XMTP_ENV as 'dev' | 'production' | 'local';
    
    console.log(`[contactsForMessaging] Looking up inbox ID for ${hederaAccountId} in XMTP ${env}`);
    
    // Try to get inbox ID for this Hedera account
    // XMTP can resolve users who signed up with any identifier format
    const inboxId = await utils.getInboxIdForIdentifier(
      {
        identifier: hederaAccountId,
        identifierKind: 'Ethereum' // XMTP treats all as Ethereum-style
      },
      env
    );
    
    if (!inboxId) {
      console.warn(`[contactsForMessaging] No XMTP inbox found for ${hederaAccountId}`);
      throw new Error(`No XMTP inbox found for ${hederaAccountId}`);
    }
    
    console.log(`[contactsForMessaging] Found inbox ID for ${hederaAccountId}: ${inboxId}`);
    
    // Get the inbox state to find their actual EVM addresses
    const states = await utils.inboxStateFromInboxIds([inboxId], env);
    
    if (!states || states.length === 0 || !states[0].accountAddresses || states[0].accountAddresses.length === 0) {
      console.warn(`[contactsForMessaging] No account addresses found for inbox ${inboxId}`);
      throw new Error(`No account addresses for inbox ${inboxId}`);
    }
    
    // Use their first EVM address (this is the Magic address they signed up with)
    const evmAddress = states[0].accountAddresses[0].toLowerCase();
    
    console.log(`[contactsForMessaging] Resolved EVM address for ${hederaAccountId}: ${evmAddress}`);
    
    evmCache.set(hederaAccountId, { evmAddress, ts: Date.now() });
    return evmAddress;
  } catch (error) {
    console.error(`[contactsForMessaging] Failed to resolve EVM for ${hederaAccountId}:`, error);
    throw error;
  }
}

/**
 * Check XMTP reachability for an EVM address (V3/V5 API)
 * Uses Client.canMessage(Identifier[]) with caching
 */
async function checkXmtpReachability(
  _xmtpClient: XmtpClient, // kept for signature compatibility, not used here
  evmAddress: string
): Promise<boolean> {
  const key = evmAddress.toLowerCase();
  const cached = reachabilityCache.get(key);
  if (cached && Date.now() - cached.ts < REACHABILITY_TTL_MS) {
    return cached.hasXMTP;
  }

  try {
    const identifiers: Identifier[] = [
      {
        identifier: key,
        identifierKind: 'Ethereum',
      },
    ];

    // Use static canMessage with the same env as the client
    const result = await Client.canMessage(identifiers, XMTP_ENV);
    const hasXMTP = result.get(key) === true;

    reachabilityCache.set(key, { hasXMTP, ts: Date.now() });

    // Trim cache if over limit (simple FIFO)
    if (reachabilityCache.size > REACHABILITY_MAX) {
      const firstKey = reachabilityCache.keys().next().value;
      if (firstKey) {
        reachabilityCache.delete(firstKey);
      }
    }

    return hasXMTP;
  } catch (error) {
    console.warn(`[contactsForMessaging] Failed to check XMTP for ${key}:`, error);
    // Fail soft: assume not reachable on error
    return false;
  }
}

/**
 * Get contacts for messaging
 * Returns HCS-bonded contacts enriched with EVM address and XMTP reachability
 * 
 * @param identity - ScendIdentity with Hedera account ID
 * @param xmtpClient - XMTP client instance (can be null if flag disabled)
 * @returns Array of MessagingContact with XMTP reachability info
 */
export async function getContactsForMessaging(
  identity: ScendIdentity,
  xmtpClient: XmtpClient | null
): Promise<MessagingContact[]> {
  if (!identity?.hederaAccountId) {
    return [];
  }

  // 1. Load HCS-bonded contacts directly from signalsStore
  const bondedContacts = signalsStore.getBondedContacts(identity.hederaAccountId);

  // 2. If no XMTP client (flag off or init failed), return basic list
  if (!xmtpClient) {
    return bondedContacts.map((c) => ({
      hederaAccountId: c.peerId,
      evmAddress: '',
      displayName: c.handle || c.peerId,
      bonded: true,
      hasXMTP: false,
      lastBondedAt: c.bondedAt ? new Date(c.bondedAt).getTime() : undefined,
    }));
  }

  // 3. Return contacts with their EVM addresses (exchanged during bonding)
  const results = bondedContacts.map((c) => {
    const lastBondedAt = c.bondedAt ? new Date(c.bondedAt).getTime() : undefined;
    
    return {
      hederaAccountId: c.peerId,
      evmAddress: c.evmAddress || '', // Use EVM address from bonding exchange
      displayName: c.handle || c.peerId,
      bonded: true,
      hasXMTP: !!c.evmAddress, // Has XMTP if they shared their EVM address
      lastBondedAt,
    } as MessagingContact;
  });

  // 4. Sort contacts by lastBondedAt desc (fallback: displayName asc)
  return results.sort((a, b) => {
    if (a.lastBondedAt && b.lastBondedAt) return b.lastBondedAt - a.lastBondedAt;
    if (a.lastBondedAt) return -1;
    if (b.lastBondedAt) return 1;
    return a.displayName.localeCompare(b.displayName);
  });
}
