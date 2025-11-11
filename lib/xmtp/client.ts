/**
 * XMTP Client Helper (browser-sdk V3)
 * 
 * Creates and manages XMTP client for E2EE messaging
 * Uses @xmtp/browser-sdk v5 (XMTP V3 protocol)
 * 
 * Phase 1 Constraints:
 * - Client-only ('use client' required in calling components)
 * - Respects XMTP_ENABLED feature flag
 * - Returns null if disabled (fail-soft, no errors)
 * - Singleton pattern (cached client per session)
 * - Magic.link as EVM signer
 * - Automatic installation cleanup (keeps 5 most recent, revokes oldest)
 */

'use client'

import { Client, Utils } from '@xmtp/browser-sdk'
import type { Identifier } from '@xmtp/browser-sdk'
import { XMTP_ENABLED, XMTP_ENV, XMTP_APP_VERSION } from '@/lib/config/xmtp'
import { magic } from '@/lib/magic'
import type { ScendIdentity } from '@/lib/identity/ScendIdentity'

// Singleton cache
let cachedClient: Client | null = null
let initPromise: Promise<Client | null> | null = null

// Maximum number of installations to keep (XMTP allows 10 total)
// Keep 5 to allow room for new devices/browsers without hitting limit immediately
const MAX_INSTALLATIONS = 5

/**
 * Create XMTP V3 Signer from Magic.link
 * V3 uses a simpler interface: { type, getIdentifier, signMessage }
 * 
 * @param identity ScendIdentity with EVM address
 * @returns Signer compatible with XMTP V3
 */
function createXMTPSigner(identity: ScendIdentity) {
  if (!magic) {
    throw new Error('[XMTP] Magic SDK not initialized')
  }
  
  return {
    type: 'EOA' as const,
    
    getIdentifier: (): Identifier => {
      return {
        identifier: identity.evmAddress.toLowerCase(),
        identifierKind: 'Ethereum' as const
      }
    },
    
    signMessage: async (message: string): Promise<Uint8Array> => {
      console.log('[XMTP] Signing message with Magic:', {
        address: identity.evmAddress,
        messagePreview: message.slice(0, 50)
      })
      
      try {
        // Use Magic's personal_sign via RPC provider
        const signature = await magic.rpcProvider.request({
          method: 'personal_sign',
          params: [message, identity.evmAddress]
        }) as string
        
        console.log('[XMTP] Message signed successfully')
        
        // Convert hex signature to Uint8Array
        const cleanSig = signature.startsWith('0x') ? signature.slice(2) : signature
        const bytes = new Uint8Array(cleanSig.length / 2)
        for (let i = 0; i < cleanSig.length; i += 2) {
          bytes[i / 2] = parseInt(cleanSig.slice(i, i + 2), 16)
        }
        
        return bytes
        
      } catch (error) {
        console.error('[XMTP] Failed to sign message:', error)
        throw error
      }
    }
  }
}

/**
 * Prune old XMTP installations using Utils (before client creation).
 * Fetches inbox state and revokes oldest installations to stay under limit.
 * 
 * @param utils XMTP Utils instance
 * @param signer XMTP signer
 * @param identifier User identifier
 */
async function pruneOldInstallationsPreCreate(
  utils: Utils,
  signer: ReturnType<typeof createXMTPSigner>,
  identifier: Identifier
): Promise<void> {
  try {
    // Step 1: Get inboxId for this identifier (without creating client)
    const inboxId = await utils.getInboxIdForIdentifier(identifier, XMTP_ENV as 'dev' | 'production' | 'local')
    
    if (!inboxId) {
      console.log('[XMTP] No inbox found — new user, skip cleanup')
      return
    }
    
    console.log(`[XMTP] Found existing inbox: ${inboxId}`)
    
    // Step 2: Fetch inbox state using Utils (no client needed)
    const states = await utils.inboxStateFromInboxIds([inboxId], XMTP_ENV as 'dev' | 'production' | 'local')
    
    if (!states || states.length === 0) {
      console.warn('[XMTP] No inbox state found')
      return
    }
    
    const state = states[0]
    const installations = state.installations || []

    console.log(`[XMTP] Found ${installations.length} installations`)

    if (installations.length < 10) {
      console.log(`[XMTP] Under limit (${installations.length}/10), no cleanup needed`)
      return
    }

    // Step 3: Sort by timestamp (oldest first)
    const sorted = [...installations].sort(
      (a, b) => Number((a.clientTimestampNs || 0n) - (b.clientTimestampNs || 0n))
    )

    // Step 4: Revoke oldest installations to bring count under limit
    // Keep the 5 most recent for multi-device resilience
    const keepCount = Math.min(MAX_INSTALLATIONS, installations.length - 1)
    const revokeTargets = sorted.slice(0, installations.length - keepCount).map(i => i.bytes)
    
    console.log(`[XMTP] Revoking ${revokeTargets.length} old installations (keeping ${keepCount} most recent)...`)

    // Step 5: Use Utils.revokeInstallations (no client needed)
    await utils.revokeInstallations(
      signer,
      inboxId,
      revokeTargets,
      XMTP_ENV as 'dev' | 'production' | 'local'
    )
    
    console.log('[XMTP] Old installations revoked successfully')
  } catch (err) {
    console.error('[XMTP] Pre-creation installation cleanup failed:', err)
    throw err
  }
}

/**
 * Initialize XMTP client (internal)
 * Handles singleton caching and concurrent init protection
 * 
 * @param identity ScendIdentity with EVM + Hedera accounts
 * @returns XMTP Client or null if disabled/error
 */
async function initClient(identity: ScendIdentity): Promise<Client | null> {
  // Guard: Feature flag disabled
  if (!XMTP_ENABLED) {
    console.log('[XMTP] Feature disabled, returning null')
    return null
  }
  
  // Guard: Identity must have both EVM and Hedera
  if (!identity?.evmAddress || !identity?.hederaAccountId) {
    console.warn('[XMTP] Identity missing required fields:', {
      hasEVM: !!identity?.evmAddress,
      hasHedera: !!identity?.hederaAccountId
    })
    return null
  }
  
  // Return cached client if available
  if (cachedClient) {
    console.log('[XMTP] Returning cached client')
    return cachedClient
  }
  
  // If already initializing, wait for that promise
  if (initPromise) {
    console.log('[XMTP] Init already in progress, waiting...')
    return initPromise
  }
  
  // Start initialization
  initPromise = (async () => {
    try {
      console.log('[XMTP] Initializing client with pre-cleanup...', {
        env: XMTP_ENV,
        evmAddress: identity.evmAddress,
        hederaAccount: identity.hederaAccountId
      })
      
      // Create XMTP V3 signer from Magic
      const signer = createXMTPSigner(identity)
      
      // Build identifier
      const identifier: Identifier = {
        identifier: identity.evmAddress.toLowerCase(),
        identifierKind: 'Ethereum' as const
      }
      
      // Create Utils instance for pre-creation operations
      const utils = new Utils()
      
      // PRE-CREATION CLEANUP: Check and clean installations BEFORE client creation
      try {
        await pruneOldInstallationsPreCreate(utils, signer, identifier)
      } catch (cleanupError) {
        // Log cleanup failure but continue - might be a new user
        console.warn('[XMTP] Pre-creation cleanup failed (might be new user):', cleanupError)
      }
      
      // Create XMTP client (should succeed now with room for new installation)
      const client = await Client.create(signer, {
        env: XMTP_ENV as 'dev' | 'production' | 'local',
        // Use in-memory storage for browser compatibility
        dbPath: null
      })
      
      console.log('[XMTP] Client ready:', {
        inboxId: client.inboxId,
        installationId: client.installationId,
        accountIdentifier: client.accountIdentifier
      })
      
      cachedClient = client
      return client
      
    } catch (error) {
      console.error('[XMTP] Failed to initialize client:', error)
      cachedClient = null
      return null
      
    } finally {
      initPromise = null
    }
  })()
  
  return initPromise
}

/**
 * Get XMTP Client for messaging
 * 
 * PRIMARY API for Phase 1
 * Returns null if:
 * - Feature flag disabled
 * - Identity invalid
 * - Initialization fails
 * 
 * @param identity ScendIdentity (or null if not authenticated)
 * @returns XMTP Client or null (never throws)
 */
export async function getXMTPClient(identity: ScendIdentity | null): Promise<Client | null> {
  if (!identity) {
    console.log('[XMTP] No identity provided, returning null')
    return null
  }
  
  try {
    return await initClient(identity)
  } catch (error) {
    console.error('[XMTP] getXMTPClient error:', error)
    return null
  }
}

/**
 * Reset XMTP client cache
 * Call on logout or when switching users
 */
export function resetXMTPClient(): void {
  console.log('[XMTP] Resetting client cache')
  cachedClient = null
  initPromise = null
}

/**
 * List all installations for the current user's XMTP inbox
 * Useful for debugging and monitoring installation usage
 * 
 * @param client Authenticated XMTP client (from getXMTPClient)
 * @returns Array of installations with metadata, or null if error
 */
export async function listInstallations(client: Client | null): Promise<Array<{
  id: string
  timestamp: string | null
  isCurrent: boolean
}> | null> {
  if (!client) {
    return null
  }
  
  try {
    const state = await client.inboxState(true)
    const installations = state.installations || []
    const currentInstallationId = client.installationId
    
    return installations.map(i => ({
      id: i.id,
      timestamp: i.clientTimestampNs ? new Date(Number(i.clientTimestampNs / 1000000n)).toISOString() : null,
      isCurrent: i.id === currentInstallationId
    }))
    
  } catch (error) {
    console.error('[XMTP] Failed to list installations:', error)
    return null
  }
}
