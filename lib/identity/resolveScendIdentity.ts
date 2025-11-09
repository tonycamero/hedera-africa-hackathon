/**
 * ScendIdentity Resolver
 * 
 * Resolves dual-key identity from Magic.link (EVM) + HCS-22 (Hedera)
 * This is the PRIMARY way to get authenticated user identity
 * 
 * Flow:
 * 1. Check Magic.link authentication → get EVM address
 * 2. Query HCS-22 resolver → get Hedera account ID
 * 3. Return unified ScendIdentity
 * 
 * Phase 1 Constraints:
 * - Client-only function ('use client' required)
 * - Throws if not authenticated
 * - xmtpEnabled defaults to false (provisioned in Phase 1)
 */

import { ScendIdentity } from './ScendIdentity'
import { getResolvedAccountId } from '@/lib/session'
import { TOPIC } from '@/lib/env'

/**
 * Resolve ScendIdentity for current authenticated user
 * 
 * @returns ScendIdentity with EVM + Hedera account IDs
 * @throws Error if not authenticated or HCS-22 binding missing
 */
export async function resolveScendIdentity(): Promise<ScendIdentity> {
  // Guard: Client-side only
  if (typeof window === 'undefined') {
    throw new Error('[ScendIdentity] Can only resolve identity in browser')
  }
  
  try {
    // Step 1: Get Magic.link user
    const { magic } = await import('@/lib/magic')
    
    if (!magic) {
      throw new Error('[ScendIdentity] Magic SDK not initialized')
    }
    
    const isLoggedIn = await magic.user.isLoggedIn()
    if (!isLoggedIn) {
      throw new Error('[ScendIdentity] User not authenticated')
    }
    
    // Step 2: Get EVM address from Magic DID (issuer)
    const metadata = await magic.user.getInfo()
    
    // Magic DID format: did:ethr:0x<address> or did:ethr:<address>
    // We need to extract the EVM address from the issuer
    const issuer = metadata.issuer
    if (!issuer || !issuer.startsWith('did:ethr:')) {
      throw new Error('[ScendIdentity] Invalid Magic issuer format')
    }
    
    // Extract EVM address from DID
    const didParts = issuer.replace('did:ethr:', '')
    let evmAddress = didParts.startsWith('0x') ? didParts : `0x${didParts}`
    evmAddress = evmAddress.toLowerCase()
    
    if (!evmAddress || evmAddress.length !== 42) {
      throw new Error(`[ScendIdentity] Invalid EVM address extracted from DID: ${evmAddress}`)
    }
    
    console.log('[ScendIdentity] Resolved EVM address:', evmAddress)
    
    // Step 3: Resolve Hedera account via HCS-22
    const hederaAccountId = await getResolvedAccountId()
    
    if (!hederaAccountId) {
      throw new Error('[ScendIdentity] No Hedera account binding found via HCS-22')
    }
    
    console.log('[ScendIdentity] Resolved Hedera account:', hederaAccountId)
    
    // Step 4: Extract handle from email (or use account ID)
    const email = metadata.email || undefined
    const handle = email ? email.split('@')[0] : `User ${hederaAccountId.slice(-6)}`
    
    // Step 5: Construct profile HRL
    const profileHrl = `hcs://11/${TOPIC.profile}/${hederaAccountId}`
    
    // Step 6: Build ScendIdentity
    const identity: ScendIdentity = {
      evmAddress,
      hederaAccountId,
      handle,
      profileHrl,
      email,
      
      // XMTP state (Phase 1: not provisioned yet)
      xmtpEnabled: false,
      xmtpInboxId: undefined,
      
      // Signing capabilities
      canSignXMTP: true,   // Magic can always sign for XMTP
      canSignHedera: true, // Assume operator access (validated elsewhere)
      
      // Phase 4 stubs
      chainBindings: undefined,
      consentToAnchor: false
    }
    
    console.log('[ScendIdentity] Resolved full identity:', {
      evmAddress: identity.evmAddress,
      hederaAccountId: identity.hederaAccountId,
      handle: identity.handle
    })
    
    return identity
    
  } catch (error) {
    console.error('[ScendIdentity] Resolution failed:', error)
    throw error
  }
}

/**
 * Resolve ScendIdentity with fallback to null
 * Use this when you want to check auth without throwing
 */
export async function tryResolveScendIdentity(): Promise<ScendIdentity | null> {
  try {
    return await resolveScendIdentity()
  } catch (error) {
    console.warn('[ScendIdentity] Failed to resolve (returning null):', error)
    return null
  }
}
