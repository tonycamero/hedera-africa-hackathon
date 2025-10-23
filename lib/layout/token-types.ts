export type TokenId = string; // e.g. "networking-goat@1" or HTS token id

export interface UserTokens {
  nfts: TokenId[];        // Hashinals/collectibles this user owns
  badges: TokenId[];      // Recognition badges
  memberships: TokenId[]; // e.g. "PRO_ANNUAL"
  trustLevel: number;     // 0..9 (Circle of 9 progress)
}

export const TOKEN_CONST = {
  VIP_GOAT: 'networking-goat@1',
  PRO_ANNUAL: 'PRO_ANNUAL',
} as const;
