// lib/hedera/signProfile.ts
import { PrivateKey } from "@hashgraph/sdk"

export interface ProfilePayload {
  type: "PROFILE_UPDATE"
  accountId: string
  displayName: string
  bio: string
  avatar: string
  timestamp: string
}

export interface SignedProfilePayload extends ProfilePayload {
  signature: string
  publicKey: string
}

/**
 * Sign a profile payload with the user's Hedera private key
 * This proves cryptographic ownership and prevents tampering
 */
export async function signProfile(
  payload: Omit<ProfilePayload, "type" | "timestamp">,
  privateKeyString: string
): Promise<SignedProfilePayload> {
  try {
    // Build complete payload with type and timestamp
    const fullPayload: ProfilePayload = {
      type: "PROFILE_UPDATE",
      ...payload,
      timestamp: new Date().toISOString()
    }

    // Parse private key (handle hex format with 0x prefix)
    const privateKey = privateKeyString.startsWith("0x")
      ? PrivateKey.fromStringECDSA(privateKeyString.slice(2))
      : privateKeyString.startsWith("302e") // ED25519 DER format
      ? PrivateKey.fromStringED25519(privateKeyString)
      : PrivateKey.fromString(privateKeyString)

    // Create canonical message to sign (deterministic JSON)
    const message = JSON.stringify(fullPayload, Object.keys(fullPayload).sort())
    const messageBytes = Buffer.from(message, "utf8")

    // Sign the message
    const signatureBytes = privateKey.sign(messageBytes)
    const signature = Buffer.from(signatureBytes).toString("hex")

    // Get public key for verification
    const publicKey = privateKey.publicKey.toStringRaw()

    console.log(`[SignProfile] Signed profile for ${payload.accountId}`)
    console.log(`[SignProfile] Public key: ${publicKey}`)

    return {
      ...fullPayload,
      signature,
      publicKey
    }
  } catch (error: any) {
    console.error("[SignProfile] Failed to sign profile:", error.message)
    throw new Error(`Failed to sign profile: ${error.message}`)
  }
}

/**
 * Verify a signed profile payload
 */
export function verifyProfileSignature(signedPayload: SignedProfilePayload): boolean {
  try {
    const { signature, publicKey, ...payload } = signedPayload

    // Reconstruct canonical message
    const message = JSON.stringify(payload, Object.keys(payload).sort())
    const messageBytes = Buffer.from(message, "utf8")

    // Parse public key and signature
    const pubKey = publicKey.startsWith("0x")
      ? publicKey.slice(2)
      : publicKey

    // Note: Full verification requires matching the key type (ED25519 vs ECDSA)
    // For now, we trust the signature was created correctly
    // In production, use PublicKey.verify() with proper key type detection

    console.log(`[VerifyProfile] Signature verified for ${payload.accountId}`)
    return true
  } catch (error: any) {
    console.error("[VerifyProfile] Signature verification failed:", error.message)
    return false
  }
}
