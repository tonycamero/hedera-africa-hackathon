/**
 * URE (Universal Recognition Engine) Client
 * 
 * Thin adapter layer between GenZ lens UI and URE v2 APIs
 * Maps URE v2 response shapes to token-gated lens format
 */

import type { UserTokens } from '@/lib/layout/token-types'

/**
 * Fetch user tokens from URE v2 reputation/summary endpoint
 * 
 * Maps URE v2 data to token-gated lens format:
 * - nfts: Hashinal NFTs from HCS/HTS
 * - badges: Recognition badges earned
 * - memberships: PRO subscriptions
 * - trustLevel: Circle-of-9 progress (0-9)
 */
export async function getUserTokens(wallet: string): Promise<UserTokens> {
  try {
    // TODO: Replace with actual URE v2 endpoint when available
    // For now, use reputation summary endpoint
    const res = await fetch(`/api/reputation/summary?wallet=${wallet}`, {
      cache: 'no-store', // Always get fresh data for token gating
    })

    if (!res.ok) {
      console.warn(`[URE Client] Failed to fetch tokens for ${wallet}: ${res.status}`)
      return getEmptyTokens()
    }

    const data = await res.json()

    // Map URE v2 response to UserTokens format
    return {
      nfts: data.nfts ?? data.collectibles ?? [],
      badges: data.badges ?? data.achievements ?? [],
      memberships: data.memberships ?? data.subscriptions ?? [],
      trustLevel: data.trustLevel ?? data.circleSize ?? 0,
    }
  } catch (error) {
    console.error('[URE Client] Error fetching user tokens:', error)
    return getEmptyTokens()
  }
}

/**
 * Get user's NFT collection (subset of tokens)
 */
export async function getUserNFTs(wallet: string): Promise<string[]> {
  const tokens = await getUserTokens(wallet)
  return tokens.nfts
}

/**
 * Get user's trust level (Circle-of-9 progress)
 */
export async function getUserTrustLevel(wallet: string): Promise<number> {
  const tokens = await getUserTokens(wallet)
  return tokens.trustLevel
}

/**
 * Get user's active memberships
 */
export async function getUserMemberships(wallet: string): Promise<string[]> {
  const tokens = await getUserTokens(wallet)
  return tokens.memberships
}

/**
 * Empty tokens fallback (unauthenticated or error state)
 */
function getEmptyTokens(): UserTokens {
  return {
    nfts: [],
    badges: [],
    memberships: [],
    trustLevel: 0,
  }
}

/**
 * Check if user has specific token
 */
export function hasToken(tokens: UserTokens, tokenId: string): boolean {
  return (
    tokens.nfts.includes(tokenId) ||
    tokens.badges.includes(tokenId) ||
    tokens.memberships.includes(tokenId)
  )
}

/**
 * Check if user meets VIP requirements
 */
export function isVIP(tokens: UserTokens): boolean {
  return hasToken(tokens, 'networking-goat@1')
}

/**
 * Check if user meets Civic Leader requirements
 */
export function isCivicLeader(tokens: UserTokens): boolean {
  return tokens.trustLevel >= 9
}

/**
 * Check if user meets Collector requirements
 */
export function isCollector(tokens: UserTokens): boolean {
  return tokens.nfts.length >= 10
}

/**
 * Check if user meets Premium requirements
 */
export function isPremium(tokens: UserTokens): boolean {
  return hasToken(tokens, 'PRO_ANNUAL')
}
