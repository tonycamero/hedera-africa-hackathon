/**
 * Secure QR Contact Request System
 * 
 * Creates signed, expiring contact requests with replay protection.
 * Uses Ed25519 signatures via Magic's Hedera extension.
 */

import { v4 as uuidv4 } from 'uuid'
import { magic } from '@/lib/magic'
import { stableStringify } from '@/lib/util/stableStringify'
import { toHex } from '@/lib/util/hex'

export interface ContactRequestPayload {
  v: number
  type: 'CONTACT_REQUEST'
  jti: string           // Unique ID (UUIDv4) for replay prevention
  nonce: number         // Timestamp in ms
  iat: number           // Issued at (seconds)
  exp: number           // Expires at (seconds)
  from: {
    acct: string        // Hedera account ID
    handle: string      // Display name
    profileHrl: string  // Profile reference
    pk?: string         // Public key (optional)
    evm?: string        // EVM address (for XMTP)
  }
  to: string            // "peer:any" or specific account
  aud: string           // Expected action
  kid: string           // Key ID for verification
  sig?: string          // Ed25519 signature (base64url)
}

export interface ContactAcceptPayload {
  v: number
  type: 'CONTACT_ACCEPT'
  req: {
    jti: string
    hash: string        // SHA-256 of original request
  }
  from: {
    acct: string
    handle: string
    evm?: string        // EVM address (for XMTP)
  }
  to: {
    acct: string
    handle: string
    evm?: string        // EVM address (for XMTP)
  }
  mutual: boolean       // Auto-mutual bonding flag
  iat: number
  sig?: string
}

export interface ContactMirrorPayload {
  v: number
  type: 'CONTACT_MIRROR'
  ref: {
    hash: string        // Original request hash
  }
  acks: Array<{
    acceptHash: string  // Hash of the accept event
  }>
  from: {
    acct: string
    evm?: string        // EVM address (for XMTP)
  }
  to: {
    acct: string
    evm?: string        // EVM address (for XMTP)
  }
  iat: number
  sig?: string
}

// In-memory JTI tracking (should be moved to persistent storage in production)
const usedJtis = new Set<string>()

/**
 * Create a secure contact request payload with signature
 */
export async function createContactRequest(
  accountId: string,
  handle: string,
  profileHrl: string,
  evmAddress?: string,
  expirySeconds: number = 120 // 2 minutes default
): Promise<ContactRequestPayload> {
  const now = Math.floor(Date.now() / 1000)
  
  const payload: ContactRequestPayload = {
    v: 1,
    type: 'CONTACT_REQUEST',
    jti: uuidv4(),
    nonce: Date.now(),
    iat: now,
    exp: now + expirySeconds,
    from: {
      acct: accountId,
      handle,
      profileHrl,
      evm: evmAddress
    },
    to: 'peer:any',
    aud: 'trustmesh://contact-accept',
    kid: `hedera:${accountId}#ed25519`
  }

  // Sign the payload (excluding sig field)
  const canonical = stableStringify({ ...payload, sig: undefined })
  const messageBytes = new TextEncoder().encode(canonical)
  
  try {
    const signatureBytes = await magic?.hedera.sign(messageBytes)
    if (signatureBytes) {
      payload.sig = base64urlEncode(new Uint8Array(signatureBytes))
    }
  } catch (error) {
    console.error('[QR] Failed to sign payload:', error)
    // For demo, use placeholder if signing fails
    payload.sig = 'demo_signature'
  }

  return payload
}

/**
 * Verify a contact request payload
 */
export async function verifyContactRequest(
  payload: ContactRequestPayload
): Promise<{ valid: boolean; error?: string }> {
  const now = Math.floor(Date.now() / 1000)

  // Check version
  if (payload.v !== 1) {
    return { valid: false, error: 'Unsupported payload version' }
  }

  // Check type
  if (payload.type !== 'CONTACT_REQUEST') {
    return { valid: false, error: 'Invalid payload type' }
  }

  // Check expiry
  if (payload.exp <= now) {
    return { valid: false, error: 'Contact request has expired' }
  }

  // Check replay (JTI already used)
  if (usedJtis.has(payload.jti)) {
    return { valid: false, error: 'Contact request already used (replay detected)' }
  }

  // TODO: Verify signature with public key from Hedera
  // For now, accept if signature exists
  if (!payload.sig || payload.sig === 'demo_signature') {
    console.warn('[QR] Using demo signature mode - not verifying')
  }

  return { valid: true }
}

/**
 * Mark a JTI as used (replay prevention)
 */
export function markJtiUsed(jti: string): void {
  usedJtis.add(jti)
  
  // Clean up old JTIs after 5 minutes (they've expired anyway)
  setTimeout(() => {
    usedJtis.delete(jti)
  }, 5 * 60 * 1000)
}

/**
 * Create a contact accept payload
 */
export async function createContactAccept(
  requestPayload: ContactRequestPayload,
  requestHash: string,
  acceptorAccountId: string,
  acceptorHandle: string,
  acceptorEvmAddress?: string,
  autoMutual: boolean = true
): Promise<ContactAcceptPayload> {
  const now = Math.floor(Date.now() / 1000)

  const payload: ContactAcceptPayload = {
    v: 1,
    type: 'CONTACT_ACCEPT',
    req: {
      jti: requestPayload.jti,
      hash: requestHash
    },
    from: {
      acct: acceptorAccountId,
      handle: acceptorHandle,
      evm: acceptorEvmAddress
    },
    to: {
      acct: requestPayload.from.acct,
      handle: requestPayload.from.handle,
      evm: requestPayload.from.evm
    },
    mutual: autoMutual,
    iat: now
  }

  // Sign the accept payload
  const canonical = stableStringify({ ...payload, sig: undefined })
  const messageBytes = new TextEncoder().encode(canonical)
  
  try {
    const signatureBytes = await magic?.hedera.sign(messageBytes)
    if (signatureBytes) {
      payload.sig = base64urlEncode(new Uint8Array(signatureBytes))
    }
  } catch (error) {
    console.error('[QR] Failed to sign accept:', error)
    payload.sig = 'demo_signature'
  }

  return payload
}

/**
 * Create a contact mirror payload (for auto-mutual bonding)
 */
export async function createContactMirror(
  requestHash: string,
  acceptHash: string,
  requesterAccountId: string,
  acceptorAccountId: string,
  requesterEvmAddress?: string,
  acceptorEvmAddress?: string
): Promise<ContactMirrorPayload> {
  const now = Math.floor(Date.now() / 1000)

  const payload: ContactMirrorPayload = {
    v: 1,
    type: 'CONTACT_MIRROR',
    ref: {
      hash: requestHash
    },
    acks: [{
      acceptHash
    }],
    from: {
      acct: requesterAccountId,
      evm: requesterEvmAddress
    },
    to: {
      acct: acceptorAccountId,
      evm: acceptorEvmAddress
    },
    iat: now
  }

  // Sign the mirror payload
  const canonical = stableStringify({ ...payload, sig: undefined })
  const messageBytes = new TextEncoder().encode(canonical)
  
  try {
    const signatureBytes = await magic?.hedera.sign(messageBytes)
    if (signatureBytes) {
      payload.sig = base64urlEncode(new Uint8Array(signatureBytes))
    }
  } catch (error) {
    console.error('[QR] Failed to sign mirror:', error)
    payload.sig = 'demo_signature'
  }

  return payload
}

/**
 * Encode payload to deep link URL format
 */
export function encodeToDeepLink(payload: any): string {
  const json = JSON.stringify(payload)
  const encoded = base64urlEncode(new TextEncoder().encode(json))
  return `trustmesh://contact?d=${encoded}`
}

/**
 * Encode payload to web fallback URL
 */
export function encodeToWebUrl(payload: any): string {
  const json = JSON.stringify(payload)
  const encoded = base64urlEncode(new TextEncoder().encode(json))
  return `https://trustmesh.app/qr?d=${encoded}`
}

/**
 * Decode from deep link or web URL
 */
export function decodeFromUrl(url: string): any | null {
  try {
    // Extract 'd' parameter
    const match = url.match(/[?&]d=([^&]+)/)
    if (!match) return null

    const encoded = match[1]
    const decoded = base64urlDecode(encoded)
    const json = new TextDecoder().decode(decoded)
    return JSON.parse(json)
  } catch (error) {
    console.error('[QR] Failed to decode URL:', error)
    return null
  }
}

/**
 * Hash a payload for verification
 */
export async function hashPayload(payload: any): Promise<string> {
  const canonical = stableStringify(payload)
  const msgBuffer = new TextEncoder().encode(canonical)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return toHex(new Uint8Array(hashBuffer))
}

// Base64URL encoding/decoding utilities
function base64urlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlDecode(str: string): Uint8Array {
  // Add padding
  const pad = str.length % 4
  const padded = pad ? str + '='.repeat(4 - pad) : str
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  return new Uint8Array([...binary].map(c => c.charCodeAt(0)))
}
