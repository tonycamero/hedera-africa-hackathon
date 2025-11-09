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
 * - 'local': Local development
 */
export const XMTP_ENV = (process.env.NEXT_PUBLIC_XMTP_ENV || 'dev') as 'dev' | 'production' | 'local'

/**
 * XMTP app version identifier
 * Included with API requests for analytics/debugging
 * Format: 'APP_NAME/APP_VERSION'
 * Production apps strongly encouraged to set this
 */
export const XMTP_APP_VERSION = process.env.NEXT_PUBLIC_XMTP_APP_VERSION || 'trustmesh/xmtp-sidecar-v0.1'

// Log configuration on module load (helps with debugging)
if (typeof window !== 'undefined') {
  console.log('[XMTP Config] Enabled:', XMTP_ENABLED, '| Environment:', XMTP_ENV, '| Version:', XMTP_APP_VERSION)
}
