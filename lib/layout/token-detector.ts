import type { UserTokens } from './token-types'

/**
 * Adapter boundaries. Implement these in your services layer.
 * Keep this file framework-agnostic and pure for easy testing.
 */
export interface TokenSource {
  getUserNFTs(wallet: string): Promise<string[]>;
  getUserBadges(wallet: string): Promise<string[]>;
  getMemberships(wallet: string): Promise<string[]>;
  getTrustLevel(wallet: string): Promise<number>;
}

/**
 * Default implementation delegates to your existing services.
 * Replace the stubs with real calls when wiring in Hedera/HCS.
 * 
 * TESTING STUBS:
 * - Uncomment lines below to test specific token-gated modes locally
 */
export const DefaultTokenSource: TokenSource = {
  async getUserNFTs(wallet) {
    // TODO: plug HCS/HTS or your collection service
    // return await hcsAssetCollection.getUserCollection(wallet).then(cs => cs.map(c => c.type_id))
    
    // STUB: Uncomment to test VIP mode
    // return ['networking-goat@1'];
    
    // STUB: Uncomment to test Collector mode (10+ NFTs)
    // return Array.from({ length: 10 }, (_, i) => `nft-${i}`);
    
    return [];
  },
  async getUserBadges(wallet) {
    // TODO: recognition badges from HCS
    return [];
  },
  async getMemberships(wallet) {
    // TODO: PRO subscription tokens (Stripe/Brale hook)
    
    // STUB: Uncomment to test Premium mode
    // return ['PRO_ANNUAL'];
    
    return [];
  },
  async getTrustLevel(wallet) {
    // TODO: count of Circle-of-9 allocations
    // return await trustAllocationService.getCircleSize(wallet)
    
    // STUB: Uncomment to test Civic Leader mode
    // return 9;
    
    return 0;
  },
};

export async function getUserTokens(
  walletAddress: string,
  source: TokenSource = DefaultTokenSource
): Promise<UserTokens> {
  const [nfts, badges, memberships, trustLevel] = await Promise.all([
    source.getUserNFTs(walletAddress),
    source.getUserBadges(walletAddress),
    source.getMemberships(walletAddress),
    source.getTrustLevel(walletAddress),
  ]);
  return { nfts, badges, memberships, trustLevel };
}
