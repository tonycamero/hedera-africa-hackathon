/**
 * XMTP Client Helper (Browser SDK v3)
 * 
 * Creates and manages XMTP client for E2EE messaging
 * Uses @xmtp/browser-sdk (stable v3, NOT legacy xmtp-js)
 * 
 * Phase 1 Constraints:
 * - Client-only ('use client' required in calling components)
 * - Respects XMTP_ENABLED feature flag
 * - Returns null if disabled (fail-soft, no errors)
 * - Singleton pattern (cached client per session)
 * - Magic.link as EVM signer (ECDSA)
 * 
 * TODO Phase 2: Migrate to @xmtp/react-sdk if available
 */

'use client'

import { Client, type Signer, type Identifier } from '@xmtp/browser-sdk'
import { BrowserProvider } from 'ethers' // ethers v6
import { XMTP_ENABLED, XMTP_ENV, XMTP_APP_VERSION } from '@/lib/config/xmtp'
import { magic } from '@/lib/magic'
import type { ScendIdentity } from '@/lib/identity/ScendIdentity'

// Singleton cache
let cachedClient: Client | null = null
let initPromise: Promise<Client | null> | null = null

/**
 * Create XMTP Signer from Magic.link wallet
 * Adapts Magic's EVM signer to XMTP's Signer interface
 * 
 * @param identity ScendIdentity with EVM address
 * @returns XMTP Signer (EOA type with signMessage capability)
 */
async function createXMTPSigner(identity: ScendIdentity): Promise<Signer> {
  if (!magic) {
    throw new Error('[XMTP] Magic SDK not initialized')
  }
  
  try {
    // Step 1: Get Magic wallet provider
    const rpcProvider = await magic.wallet.getProvider()
    
    // Step 2: Wrap in ethers v6 BrowserProvider
    const ethersProvider = new BrowserProvider(rpcProvider)
    
    // Step 3: Get signer from provider
    const ethersSigner = await ethersProvider.getSigner()
    
    // Step 4: Get address (normalize to lowercase for consistency)
    const address = (await ethersSigner.getAddress()).toLowerCase()
    
    console.log('[XMTP] Creating signer for address:', address)
    
    // Step 5: Create XMTP identifier
    const identifier: Identifier = {
      identifier: address,
      identifierKind: 'Ethereum'
    }
    
    // Step 6: Create XMTP Signer (EOA type)
    const xmtpSigner: Signer = {
      type: 'EOA',
      
      // Returns the account identifier
      getIdentifier: async () => identifier,
      
      // Signs messages using Magic's EVM signer
      // Note: XMTP expects Uint8Array, ethers returns hex string
      signMessage: async (message: string): Promise<Uint8Array> => {
        try {
          // Sign with ethers (returns hex string like "0x...")
          const signatureHex = await ethersSigner.signMessage(message)
          
          // Convert hex string to Uint8Array
          // Remove '0x' prefix and convert to bytes
          const signatureBytes = new Uint8Array(
            signatureHex.slice(2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
          )
          
          return signatureBytes
        } catch (error) {
          console.error('[XMTP] Failed to sign message:', error)
          throw error
        }
      }
    }
    
    return xmtpSigner
    
  } catch (error) {
    console.error('[XMTP] Failed to create signer:', error)
    throw error
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
      console.log('[XMTP] Initializing client...', {
        env: XMTP_ENV,
        appVersion: XMTP_APP_VERSION,
        evmAddress: identity.evmAddress,
        hederaAccount: identity.hederaAccountId
      })
      
      // Step 1: Create signer
      const signer = await createXMTPSigner(identity)
      
      // Step 2: Create XMTP client
      const client = await Client.create(signer, {
        env: XMTP_ENV,                    // 'dev' | 'production' | 'local'
        appVersion: XMTP_APP_VERSION      // 'trustmesh/xmtp-sidecar-v0.1'
        // Note: dbEncryptionKey is not used in browser environments (per XMTP docs)
      })
      
      console.log('[XMTP] Client initialized successfully', {
        inboxId: client.inboxId,
        installationId: client.installationId,
        accountAddresses: client.accountAddresses
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
