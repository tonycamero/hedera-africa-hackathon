import type { ScendIdentity } from '@/lib/identity/ScendIdentity';
import type { Client as XmtpClient } from '@xmtp/browser-sdk';
import { Client, type Identifier } from '@xmtp/browser-sdk';
import { XMTP_ENV } from '@/lib/config/xmtp';
import type { BondedContact } from '@/lib/stores/signalsStore';

export interface MessagingContact {
  hederaAccountId: string;
  evmAddress: string;
  displayName: string;
  bonded: boolean;
  hasXMTP: boolean;
  lastBondedAt?: number;
}

interface BondedContactInternal {
  hederaAccountId: string;
  displayName: string;
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
 * Load bonded contacts from existing Circle API
 * Reuses the same backend endpoint that powers the Circle page
 */
async function loadBondedContacts(hederaAccountId: string): Promise<BondedContactInternal[]> {
  try {
    const res = await fetch(`/api/circle?sessionId=${encodeURIComponent(hederaAccountId)}`);
    
    if (!res.ok) {
      console.warn('[contactsForMessaging] Failed to load circle data', res.status);
      return [];
    }
    
    const data = await res.json();
    
    if (!data.success) {
      console.warn('[contactsForMessaging] Circle API returned error:', data.error);
      return [];
    }
    
    // Map BondedContact[] from API to internal format
    return (data.bondedContacts as BondedContact[]).map((c: BondedContact) => ({
      hederaAccountId: c.peerId || '',
      displayName: c.handle || c.peerId || 'Unknown',
      lastBondedAt: c.bondedAt ? Date.parse(c.bondedAt) : undefined,
    })).filter(c => c.hederaAccountId); // Filter out invalid entries
  } catch (error) {
    console.error('[contactsForMessaging] Failed to load bonded contacts:', error);
    return [];
  }
}

/**
 * Resolve EVM address from Hedera account ID
 * Uses Mirror Node API via existing /api/hcs22/resolve endpoint
 * 
 * NOTE: Current HCS-22 resolver is issuer->accountId (EVM->Hedera).
 * We need reverse lookup (Hedera->EVM). For Phase 1, we'll use Mirror Node
 * account query which includes the EVM address alias if set.
 */
async function resolveEvmForHedera(hederaAccountId: string): Promise<string> {
  const cached = evmCache.get(hederaAccountId);
  if (cached && Date.now() - cached.ts < EVM_CACHE_TTL_MS) {
    return cached.evmAddress;
  }

  try {
    // Query Mirror Node for account details
    // Format: https://testnet.mirrornode.hedera.com/api/v1/accounts/{accountId}
    const mirrorUrl = process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet'
      ? 'https://mainnet-public.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com';
    
    const res = await fetch(`${mirrorUrl}/api/v1/accounts/${hederaAccountId}`);
    
    if (!res.ok) {
      throw new Error(`Mirror Node returned ${res.status} for ${hederaAccountId}`);
    }
    
    const data = await res.json();
    
    // Mirror Node returns account.evm_address field
    if (!data.evm_address) {
      throw new Error(`No EVM address for Hedera ${hederaAccountId}`);
    }
    
    // Mirror Node returns evm_address with 0x prefix already, ensure no double prefix
    let evmAddress = data.evm_address.toLowerCase();
    if (!evmAddress.startsWith('0x')) {
      evmAddress = `0x${evmAddress}`;
    }
    
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

  // 1. Load HCS-bonded contacts
  const bondedContacts = await loadBondedContacts(identity.hederaAccountId);

  // 2. If no XMTP client (flag off or init failed), return basic list
  if (!xmtpClient) {
    return bondedContacts.map((c) => ({
      hederaAccountId: c.hederaAccountId,
      evmAddress: '',
      displayName: c.displayName || c.hederaAccountId,
      bonded: true,
      hasXMTP: false,
      lastBondedAt: c.lastBondedAt,
    }));
  }

  // 3. Resolve EVM + reachability in parallel
  const results = await Promise.all(
    bondedContacts.map(async (c) => {
      try {
        const evmAddress = await resolveEvmForHedera(c.hederaAccountId);
        const hasXMTP = await checkXmtpReachability(xmtpClient, evmAddress);

        return {
          hederaAccountId: c.hederaAccountId,
          evmAddress,
          displayName: c.displayName || evmAddress || c.hederaAccountId,
          bonded: true,
          hasXMTP,
          lastBondedAt: c.lastBondedAt,
        } as MessagingContact;
      } catch {
        return {
          hederaAccountId: c.hederaAccountId,
          evmAddress: '',
          displayName: c.displayName || c.hederaAccountId,
          bonded: true,
          hasXMTP: false,
          lastBondedAt: c.lastBondedAt,
        } as MessagingContact;
      }
    })
  );

  // 4. Sort contacts by lastBondedAt desc (fallback: displayName asc)
  return results.sort((a, b) => {
    if (a.lastBondedAt && b.lastBondedAt) return b.lastBondedAt - a.lastBondedAt;
    if (a.lastBondedAt) return -1;
    if (b.lastBondedAt) return 1;
    return a.displayName.localeCompare(b.displayName);
  });
}
