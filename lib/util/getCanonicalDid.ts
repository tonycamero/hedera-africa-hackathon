import crypto from 'crypto';

/**
 * PII-Safe Canonical DID Generator
 * 
 * HARD GUARD: Never expose email addresses or PII on-chain.
 * 
 * Derives pseudonymous DIDs from Magic issuer or EVM address.
 * All on-chain HCS events must use this function to ensure privacy.
 * 
 * @param issuer - Magic issuer string (e.g., "did:ethr:0xabc123..." or email-based)
 * @returns Canonical DID safe for on-chain use
 */
export function getCanonicalDid(issuer: string): string {
  if (!issuer) {
    throw new Error('[getCanonicalDid] Issuer required');
  }

  // CRITICAL: Handle email: prefix (stable identifier format)
  // This ensures same email always maps to same DID regardless of Magic issuer format
  if (issuer.startsWith('email:')) {
    const email = issuer.replace('email:', '');
    const hash = hashEmail(email);
    return `did:ethr:0x${hash}`;
  }

  // If already a proper did:ethr with hex address, use as-is
  if (issuer.startsWith('did:ethr:0x')) {
    return issuer;
  }

  // If Magic returned a did:ethr with email (UNSAFE for on-chain)
  if (issuer.startsWith('did:ethr:') && issuer.includes('@')) {
    console.warn('[getCanonicalDid] Email-based DID detected, hashing for privacy');
    // Extract email and hash it
    const email = issuer.replace('did:ethr:', '');
    const hash = hashEmail(email);
    return `did:ethr:0x${hash}`;
  }

  // If raw email (should not happen, but handle defensively)
  if (issuer.includes('@')) {
    console.warn('[getCanonicalDid] Raw email detected, hashing for privacy');
    const hash = hashEmail(issuer);
    return `did:ethr:0x${hash}`;
  }

  // If it's already a hex address without did:ethr prefix
  if (/^0x[a-fA-F0-9]{40}$/.test(issuer)) {
    return `did:ethr:${issuer}`;
  }

  // Fallback: hash the issuer string
  console.warn('[getCanonicalDid] Unknown issuer format, hashing');
  const hash = hashString(issuer);
  return `did:ethr:0x${hash}`;
}

/**
 * Hash email with salt for pseudonymous identity
 * Uses SHA-256 for deterministic mapping (same email → same hash)
 * 
 * @param email - Email address to hash
 * @returns 40-character hex string (Ethereum address format)
 */
function hashEmail(email: string): string {
  const salt = process.env.HCS22_DID_SALT || 'trustmesh-default-salt';
  
  if (salt === 'trustmesh-default-salt') {
    console.warn('[getCanonicalDid] Using default salt - set HCS22_DID_SALT in production');
  }

  const normalized = email.toLowerCase().trim();
  const hash = crypto
    .createHash('sha256')
    .update(`${salt}:${normalized}`)
    .digest('hex')
    .substring(0, 40); // Take first 40 chars to match Ethereum address length

  return hash;
}

/**
 * Hash arbitrary string for DID generation
 */
function hashString(input: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(input)
    .digest('hex')
    .substring(0, 40);

  return hash;
}

/**
 * Validate that a DID contains no PII
 * Use this as a final safety check before publishing to HCS
 * 
 * @param did - DID to validate
 * @returns true if safe, false if contains potential PII
 */
export function validateNoPII(did: string): boolean {
  // Check for email patterns
  if (did.includes('@')) {
    console.error('[validateNoPII] BLOCKED: DID contains @ symbol');
    return false;
  }

  // Check for common TLDs that indicate email domain
  // Skip this check if DID is a proper did:ethr format (hex addresses can contain TLD-like bytes)
  if (!did.startsWith('did:ethr:0x')) {
    const unsafePatterns = ['.com', '.org', '.net', '.io', '.edu', '.gov'];
    for (const pattern of unsafePatterns) {
      if (did.toLowerCase().includes(pattern)) {
        console.error(`[validateNoPII] BLOCKED: DID contains potential domain: ${pattern}`);
        return false;
      }
    }
  }

  // Check for phone number patterns (10+ consecutive digits)
  // Skip this check if DID is a proper did:ethr format (hex addresses can contain digit sequences)
  if (!did.startsWith('did:ethr:0x')) {
    if (/\d{10,}/.test(did)) {
      console.error('[validateNoPII] BLOCKED: DID contains potential phone number');
      return false;
    }
  }

  return true;
}

/**
 * Safe wrapper for HCS publishing
 * Throws if DID contains PII
 */
export function assertSafeForHCS(did: string): void {
  if (!validateNoPII(did)) {
    throw new Error(`[HCS22] SECURITY: Attempted to publish PII to HCS - DID: ${did.substring(0, 20)}...`);
  }
}
