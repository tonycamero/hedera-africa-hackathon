/**
 * HashScan link utilities for Hedera transactions
 */

export type HederaNetwork = 'testnet' | 'mainnet'

/**
 * Generate HashScan transaction URL
 */
export function hashScanTxUrl(txId: string, network: HederaNetwork = 'testnet'): string {
  return `https://hashscan.io/${network}/transaction/${encodeURIComponent(txId)}`
}

/**
 * Generate HashScan account URL
 */
export function hashScanAccountUrl(accountId: string, network: HederaNetwork = 'testnet'): string {
  return `https://hashscan.io/${network}/account/${encodeURIComponent(accountId)}`
}

/**
 * Generate HashScan topic URL
 */
export function hashScanTopicUrl(topicId: string, network: HederaNetwork = 'testnet'): string {
  return `https://hashscan.io/${network}/topic/${encodeURIComponent(topicId)}`
}

/**
 * Generate HashScan token URL
 */
export function hashScanTokenUrl(tokenId: string, network: HederaNetwork = 'testnet'): string {
  return `https://hashscan.io/${network}/token/${encodeURIComponent(tokenId)}`
}
