/**
 * TrustMesh Encryption Layer
 * Ensures PII never hits blockchain in plaintext
 */

import { randomBytes, createCipher, createDecipher, scryptSync } from 'crypto'

export interface EncryptedPayload {
  data: string              // AES-256-GCM encrypted data
  salt: string              // Unique salt for this encryption
  consentRequired: string[] // Types of consent needed to decrypt
}

export interface ConsentSignature {
  userId: string
  requester: string
  dataTypes: string[]
  purpose: string
  expiration: number
  signature: string
}

/**
 * Encrypt PII data for HCS storage
 */
export async function encryptForHCS(
  plaintext: any, 
  userPublicKey: string,
  requiredConsent: string[]
): Promise<EncryptedPayload> {
  try {
    // Generate unique salt for this message
    const salt = randomBytes(32).toString('hex')
    
    // Derive encryption key from user's public key + salt
    const key = scryptSync(userPublicKey, salt, 32)
    
    // Encrypt the plaintext data
    const cipher = createCipher('aes-256-gcm', key)
    let encrypted = cipher.update(JSON.stringify(plaintext), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return {
      data: encrypted,
      salt,
      consentRequired: requiredConsent
    }
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`)
  }
}

/**
 * Decrypt HCS data (requires consent verification)
 */
export async function decryptFromHCS(
  encryptedPayload: EncryptedPayload,
  userPrivateKey: string,
  consentProof: ConsentSignature
): Promise<any> {
  try {
    // Verify consent covers required data types
    const hasConsent = encryptedPayload.consentRequired.every(
      dataType => consentProof.dataTypes.includes(dataType)
    )
    
    if (!hasConsent) {
      throw new Error('Insufficient consent for data decryption')
    }
    
    // Verify consent hasn't expired
    if (consentProof.expiration < Date.now()) {
      throw new Error('Consent has expired')
    }
    
    // Derive decryption key
    const key = scryptSync(userPrivateKey, encryptedPayload.salt, 32)
    
    // Decrypt the data
    const decipher = createDecipher('aes-256-gcm', key)
    let decrypted = decipher.update(encryptedPayload.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return JSON.parse(decrypted)
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`)
  }
}

/**
 * Generate consent signature for data access
 */
export function generateConsentSignature(
  userId: string,
  requester: string, 
  dataTypes: string[],
  purpose: string,
  durationDays: number = 30
): ConsentSignature {
  const expiration = Date.now() + (durationDays * 24 * 60 * 60 * 1000)
  
  // Create consent payload
  const consentPayload = {
    userId,
    requester,
    dataTypes,
    purpose,
    expiration
  }
  
  // Generate cryptographic signature (simplified - use proper signing in production)
  const signature = Buffer.from(JSON.stringify(consentPayload)).toString('base64')
  
  return {
    ...consentPayload,
    signature
  }
}

/**
 * Verify consent signature is valid
 */
export function verifyConsentSignature(consent: ConsentSignature): boolean {
  try {
    const payload = {
      userId: consent.userId,
      requester: consent.requester,
      dataTypes: consent.dataTypes,
      purpose: consent.purpose,
      expiration: consent.expiration
    }
    
    const expectedSignature = Buffer.from(JSON.stringify(payload)).toString('base64')
    return consent.signature === expectedSignature
  } catch {
    return false
  }
}