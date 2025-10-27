// lib/config/pricing.ts

/**
 * TRST Token Pricing Configuration
 * 
 * **HACKATHON/DEMO MODE**: All prices set to $0.01 for demo purposes.
 * Post-hackathon production pricing:
 * - Recognition minting: $0.05-$0.10
 * - Profile updates: $0.01
 * - Token transfers: $0.02-$0.05
 * 
 * TRST is pegged 1:1 with USD (backed/custodied by Brale)
 * Prices shown are in TRST tokens = USD cents
 * 
 * User pays tiny HBAR gas from auto-funded stipend (~$0.0001/tx)
 * TRST fees are platform revenue, separate from gas
 */

export const TRST_PRICING = {
  // Recognition minting (creating NFT for someone) - $0.01 USD
  RECOGNITION_MINT: 0.01,
  
  // Profile updates - $0.01 USD
  PROFILE_UPDATE: 0.01,
  
  // Trust allocation (spending trust budget) - Free, but limited by budget
  TRUST_ALLOCATE: 0,
  
  // Contact operations - $0.01 USD
  CONTACT_REQUEST: 0.01,
  CONTACT_ACCEPT: 0, // Free to accept
  
  // Token transfers (in addition to network fees) - $0.01 USD
  TOKEN_TRANSFER: 0.01,
} as const

/**
 * Minimum TRST balance required to perform actions
 * (in USD, since TRST is 1:1 pegged)
 */
export const MINIMUM_BALANCE = {
  // Must have enough for at least one recognition ($0.10)
  RECOGNITION: TRST_PRICING.RECOGNITION_MINT,
  
  // Must have enough for profile updates ($0.05)
  PROFILE: TRST_PRICING.PROFILE_UPDATE,
} as const

/**
 * Get the TRST cost for an action
 */
export function getTRSTCost(action: keyof typeof TRST_PRICING): number {
  return TRST_PRICING[action]
}

/**
 * Check if user has sufficient balance for an action
 */
export function hasSufficientBalance(
  currentBalance: number,
  action: keyof typeof TRST_PRICING
): boolean {
  return currentBalance >= getTRSTCost(action)
}

/**
 * Format TRST amount for display (shows USD since 1:1 pegged)
 */
export function formatTRST(amount: number): string {
  return `${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} TRST`
}
