/**
 * ScendIdentity: Unified Dual-Key Identity
 * 
 * Binds EVM wallet (Magic.link) with Hedera account (HCS-22)
 * This is the SINGLE SOURCE OF TRUTH for user identity in TrustMesh
 * 
 * Phase 1: Sidecar XMTP
 * - EVM address used for XMTP messaging (E2EE transport)
 * - Hedera account used for trust/recognition (HCS economic memory)
 * - No co-mingling: XMTP = human nervous system, HCS = ledger
 */

/**
 * ScendIdentity: Dual-key user identity
 * Represents a user with both EVM and Hedera accounts
 */
export interface ScendIdentity {
  // Primary keys (required)
  evmAddress: string              // Magic wallet address (0x...) - used for XMTP
  hederaAccountId: string         // HCS-22 resolved account (0.0.xxxxx) - used for HCS
  
  // Identity metadata
  handle: string                  // Display name (from email or profile)
  profileHrl: string              // hcs://11/{profile_topic}/{id}
  email?: string                  // Magic.link email (if available)
  
  // XMTP state (Phase 1)
  xmtpEnabled?: boolean           // Has XMTP keys provisioned
  xmtpInboxId?: string            // XMTP v3 installation ID (future)
  
  // Signing capabilities
  canSignXMTP: boolean            // Can sign XMTP messages (always true for Magic)
  canSignHedera: boolean          // Has Hedera operator access
  
  // Multi-chain support (Phase 4 - stub for now)
  chainBindings?: Map<number, string>  // chainId → address (Polygon, Ethereum, etc.)
  
  // Compliance (Phase 3 - stub for now)
  consentToAnchor?: boolean       // User opted into message anchoring
}

/**
 * HCS22Binding: Proof of EVM ↔ Hedera binding
 * Represents the cryptographic link between keys
 */
export interface HCS22Binding {
  topicId: string                 // HCS-22 identity topic (0.0.7157980)
  consensusTimestamp: string      // When binding was published
  evmAddress: string              // Bound EVM address
  hederaAccountId: string         // Bound Hedera account
  verified: boolean               // Has Mirror Node confirmed?
}

/**
 * Type guard: Check if identity is valid
 */
export function isValidScendIdentity(identity: any): identity is ScendIdentity {
  return (
    identity &&
    typeof identity.evmAddress === 'string' &&
    identity.evmAddress.startsWith('0x') &&
    typeof identity.hederaAccountId === 'string' &&
    identity.hederaAccountId.match(/^0\.0\.\d+$/) &&
    typeof identity.handle === 'string' &&
    typeof identity.canSignXMTP === 'boolean' &&
    typeof identity.canSignHedera === 'boolean'
  )
}
