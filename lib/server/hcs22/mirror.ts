// HCS-22 Mirror Node Integration - Stateless EVM address lookups
import fetch from 'node-fetch';

const BASE = (() => {
  const rawUrl = process.env.NEXT_PUBLIC_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';
  const cleanUrl = rawUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  return `${cleanUrl}/api/v1`;
})();

/**
 * Look up Hedera Account ID by EVM address using Mirror Node
 * This is the fastest, stateless way to resolve existing accounts
 * Returns null if no account found (account hasn't been created yet)
 */
export async function lookupAccountByEvm(evmAddress: string): Promise<string | null> {
  const evm = evmAddress.toLowerCase().replace(/^0x/, '');
  const url = `${BASE}/accounts?evm_address=0x${evm}`;
  
  try {
    console.log(`[HCS22 Mirror] Looking up EVM address: 0x${evm}`);
    const res = await fetch(url);
    
    if (!res.ok) {
      if (res.status === 404) {
        console.log(`[HCS22 Mirror] No account found for EVM address 0x${evm}`);
        return null;
      }
      console.error(`[HCS22 Mirror] Error ${res.status} for ${url}`);
      return null;
    }
    
    const data: any = await res.json();
    const accountId = data?.accounts?.[0]?.account || null;
    
    if (accountId) {
      console.log(`[HCS22 Mirror] Found account ${accountId} for EVM 0x${evm}`);
    } else {
      console.log(`[HCS22 Mirror] No account in response for EVM 0x${evm}`);
    }
    
    return accountId;
  } catch (error: any) {
    console.error(`[HCS22 Mirror] Lookup failed for EVM 0x${evm}:`, error.message);
    return null;
  }
}

/**
 * Look up account details including balance and tokens
 * Useful for richer account information
 */
export async function getAccountDetails(accountId: string): Promise<any | null> {
  const url = `${BASE}/accounts/${accountId}`;
  
  try {
    console.log(`[HCS22 Mirror] Fetching details for account ${accountId}`);
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error(`[HCS22 Mirror] Error ${res.status} fetching account ${accountId}`);
      return null;
    }
    
    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error(`[HCS22 Mirror] Failed to fetch account ${accountId}:`, error.message);
    return null;
  }
}
