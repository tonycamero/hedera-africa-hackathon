import { PublicKey } from '@hashgraph/sdk'
import { stableStringify } from '@/lib/util/stableStringify'

/**
 * In-memory replay protection cache (for demo/hackathon)
 * In production, use Redis or DB with TTL
 */
declare global {
  var __signatureNonce: Set<string> | undefined
}

if (!globalThis.__signatureNonce) {
  globalThis.__signatureNonce = new Set<string>()
}

export interface SignatureVerificationOptions {
  /**
   * Maximum age of signature in milliseconds (default: 5 minutes)
   */
  maxAge?: number
  
  /**
   * Whether to check for replay attacks (default: true)
   */
  checkReplay?: boolean
  
  /**
   * Cache key prefix for replay protection (default: 'sig')
   */
  cachePrefix?: string
}

export interface SignatureVerificationResult {
  valid: boolean
  error?: 'INVALID_SIGNATURE' | 'STALE_PAYLOAD' | 'REPLAY' | 'MISSING_FIELDS' | 'INVALID_KEY'
  message?: string
}

/**
 * Verify a signed payload with freshness and replay protection
 * 
 * @param payload - The payload object (without signature/publicKeyDer fields)
 * @param signature - Hex-encoded signature
 * @param publicKeyDer - DER-encoded public key as number array
 * @param timestamp - ISO timestamp string from payload
 * @param options - Verification options
 */
export async function verifySignature(
  payload: Record<string, any>,
  signature: string,
  publicKeyDer: number[],
  timestamp: string,
  options: SignatureVerificationOptions = {}
): Promise<SignatureVerificationResult> {
  const {
    maxAge = 5 * 60_000, // 5 minutes default
    checkReplay = true,
    cachePrefix = 'sig'
  } = options

  // 1) Check required fields
  if (!signature || !publicKeyDer || !timestamp) {
    return {
      valid: false,
      error: 'MISSING_FIELDS',
      message: 'Missing signature, publicKeyDer, or timestamp'
    }
  }

  // 2) Freshness check (±maxAge)
  const payloadTime = Date.parse(timestamp)
  if (isNaN(payloadTime)) {
    return {
      valid: false,
      error: 'STALE_PAYLOAD',
      message: 'Invalid timestamp format'
    }
  }

  const skew = Math.abs(Date.now() - payloadTime)
  if (skew > maxAge) {
    return {
      valid: false,
      error: 'STALE_PAYLOAD',
      message: `Payload is ${Math.round(skew / 1000)}s old (max ${Math.round(maxAge / 1000)}s)`
    }
  }

  // 3) Replay protection
  if (checkReplay) {
    const nonceKey = `${cachePrefix}:${JSON.stringify(payload)}:${timestamp}`
    if (globalThis.__signatureNonce!.has(nonceKey)) {
      return {
        valid: false,
        error: 'REPLAY',
        message: 'This signature has already been used'
      }
    }
    
    // Add to cache with cleanup after 24h
    globalThis.__signatureNonce!.add(nonceKey)
    setTimeout(() => {
      globalThis.__signatureNonce!.delete(nonceKey)
    }, 24 * 60 * 60 * 1000)
  }

  // 4) Verify cryptographic signature
  try {
    // Rebuild canonical message
    const canonical = stableStringify(payload)
    const messageBytes = new TextEncoder().encode(canonical)

    // Convert DER bytes → Hedera PublicKey
    // Try ECDSA first (Magic uses ECDSA), fallback to ED25519
    const derBytes = Uint8Array.from(publicKeyDer)
    let pubKey: any
    try {
      // Try as ECDSA key first (Magic's default)
      pubKey = PublicKey.fromBytesECDSA(derBytes)
    } catch (e) {
      // Fallback to ED25519
      pubKey = PublicKey.fromBytesED25519(derBytes)
    }

    // Verify signature
    const sigBytes = Buffer.from(signature, 'hex')
    const isValid = pubKey.verify(messageBytes, sigBytes)

    if (!isValid) {
      return {
        valid: false,
        error: 'INVALID_SIGNATURE',
        message: 'Signature verification failed'
      }
    }

    return { valid: true }
  } catch (e: any) {
    return {
      valid: false,
      error: 'INVALID_KEY',
      message: `Key or signature error: ${e.message}`
    }
  }
}
