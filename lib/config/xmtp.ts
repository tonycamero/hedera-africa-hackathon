/**
 * XMTP Configuration
 * Feature flag and environment settings for XMTP integration
 * 
 * Phase 1: Sidecar Messaging
 * - XMTP runs independently from HCS pipeline
 * - Feature flag controlled (default: disabled)
 * - Client-only initialization
 */

/**
 * Feature flag: Enable/disable XMTP messaging
 * Default: false (disabled for safety)
 */
export const XMTP_ENABLED = process.env.NEXT_PUBLIC_XMTP_ENABLED === 'true'

/**
 * XMTP network environment
 * - 'dev': Development network (for testing)
 * - 'production': Production network (live users)
 */
export const XMTP_ENV = (process.env.NEXT_PUBLIC_XMTP_ENV || 'dev') as 'dev' | 'production'

// Log configuration on module load (helps with debugging)
if (typeof window !== 'undefined') {
  console.log('[XMTP Config] Enabled:', XMTP_ENABLED, '| Environment:', XMTP_ENV)
}
