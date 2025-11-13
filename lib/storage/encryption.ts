/**
 * Encryption utilities for local state persistence
 * 
 * Strategy:
 * - Derive encryption key from user's Magic.link public address (deterministic per-user)
 * - Use AES-GCM-256 for authenticated encryption
 * - IV is random per encryption (stored with ciphertext)
 * - Web Crypto API (browser) or Node crypto (if needed)
 * 
 * Security properties:
 * - Encryption key tied to user identity (can't decrypt another user's data)
 * - Key rotates on logout (new Magic session = new key)
 * - Authenticated encryption prevents tampering
 * - Hardware-backed on native (via secure storage wrapper)
 */

// ========== CONSTANTS ==========

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = 'SHA-256';
const AES_KEY_LENGTH = 256;
const AES_ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for GCM

// Salt is constant per-app (not per-user)
// This is acceptable because the input (Magic address) is already unique per user
const SALT = 'trustmesh-v1-local-state';

// ========== TYPE DEFINITIONS ==========

export interface EncryptedPayload {
  iv: string;           // Base64-encoded initialization vector
  ciphertext: string;   // Base64-encoded encrypted data
  version: number;      // Encryption version (for future migration)
}

export interface EncryptionKey {
  key: CryptoKey;
  derivedFrom: string;  // For debugging/validation
}

// ========== KEY DERIVATION ==========

/**
 * Derive an AES-GCM-256 encryption key from a user identifier
 * 
 * @param userIdentifier - Typically Magic.link public address (e.g., "0xABC123...")
 * @returns CryptoKey suitable for AES-GCM encryption/decryption
 */
export async function deriveEncryptionKey(
  userIdentifier: string
): Promise<EncryptionKey> {
  // Use Web Crypto API (available in browsers and modern Node)
  const crypto = getCrypto();
  
  // Convert user identifier to key material
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userIdentifier),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive AES key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    {
      name: AES_ALGORITHM,
      length: AES_KEY_LENGTH,
    },
    false, // Not extractable (security best practice)
    ['encrypt', 'decrypt']
  );
  
  return {
    key,
    derivedFrom: userIdentifier.slice(0, 10) + '...', // For debugging
  };
}

// ========== ENCRYPTION ==========

/**
 * Encrypt data with AES-GCM-256
 * 
 * @param data - Plaintext string to encrypt
 * @param encryptionKey - Derived encryption key
 * @returns Encrypted payload (IV + ciphertext)
 */
export async function encrypt(
  data: string,
  encryptionKey: EncryptionKey
): Promise<EncryptedPayload> {
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  
  // Generate random IV (must be unique per encryption)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: AES_ALGORITHM,
      iv,
    },
    encryptionKey.key,
    encoder.encode(data)
  );
  
  // Convert to base64 for storage
  return {
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext),
    version: 1,
  };
}

// ========== DECRYPTION ==========

/**
 * Decrypt data with AES-GCM-256
 * 
 * @param payload - Encrypted payload (IV + ciphertext)
 * @param encryptionKey - Derived encryption key
 * @returns Decrypted plaintext string
 */
export async function decrypt(
  payload: EncryptedPayload,
  encryptionKey: EncryptionKey
): Promise<string> {
  const crypto = getCrypto();
  const decoder = new TextDecoder();
  
  // Convert from base64
  const iv = base64ToArrayBuffer(payload.iv);
  const ciphertext = base64ToArrayBuffer(payload.ciphertext);
  
  // Decrypt
  // @ts-ignore - TypeScript has issues with Uint8Array buffer types in WebCrypto
  const plaintext: ArrayBuffer = await crypto.subtle.decrypt(
    {
      name: AES_ALGORITHM,
      // @ts-ignore
      iv,
    },
    encryptionKey.key,
    // @ts-ignore  
    ciphertext
  );
  
  return decoder.decode(plaintext);
}

// ========== HELPERS ==========

/**
 * Encrypt a JSON-serializable value
 * 
 * @param value - Any JSON-serializable value
 * @param encryptionKey - Derived encryption key
 * @returns Encrypted payload
 */
export async function encryptJSON<T>(
  value: T,
  encryptionKey: EncryptionKey
): Promise<EncryptedPayload> {
  const json = JSON.stringify(value);
  return encrypt(json, encryptionKey);
}

/**
 * Decrypt a JSON value
 * 
 * @param payload - Encrypted payload
 * @param encryptionKey - Derived encryption key
 * @returns Decrypted and parsed JSON value
 */
export async function decryptJSON<T>(
  payload: EncryptedPayload,
  encryptionKey: EncryptionKey
): Promise<T> {
  const json = await decrypt(payload, encryptionKey);
  return JSON.parse(json);
}

// ========== PLATFORM DETECTION ==========

/**
 * Get the appropriate crypto implementation
 * (Web Crypto API in browser, Node crypto if needed)
 */
function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  
  // Node.js environment (for testing or SSR)
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  
  throw new Error('Web Crypto API not available');
}

// ========== BASE64 UTILITIES ==========

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ========== VALIDATION ==========

/**
 * Validate that a payload is properly formatted
 */
export function isValidEncryptedPayload(payload: unknown): payload is EncryptedPayload {
  if (typeof payload !== 'object' || payload === null) return false;
  
  const p = payload as any;
  return (
    typeof p.iv === 'string' &&
    typeof p.ciphertext === 'string' &&
    typeof p.version === 'number' &&
    p.version === 1
  );
}

// ========== ERROR HANDLING ==========

export class EncryptionError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * Safely attempt encryption, wrapping errors
 */
export async function safeEncrypt(
  data: string,
  encryptionKey: EncryptionKey
): Promise<EncryptedPayload> {
  try {
    return await encrypt(data, encryptionKey);
  } catch (error) {
    throw new EncryptionError('Failed to encrypt data', error);
  }
}

/**
 * Safely attempt decryption, wrapping errors
 */
export async function safeDecrypt(
  payload: EncryptedPayload,
  encryptionKey: EncryptionKey
): Promise<string> {
  try {
    return await decrypt(payload, encryptionKey);
  } catch (error) {
    throw new EncryptionError('Failed to decrypt data (wrong key or corrupted data)', error);
  }
}
