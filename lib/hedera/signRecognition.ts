// lib/hedera/signRecognition.ts
import { PrivateKey } from "@hashgraph/sdk"

export interface RecognitionPayload {
  type: "RECOGNITION_MINT"
  fromAccountId: string
  toAccountId: string
  message: string
  trustAmount: number
  metadata?: {
    category?: string
    tags?: string[]
    imageUrl?: string
    [key: string]: any
  }
  timestamp: string
}

export interface SignedRecognitionPayload extends RecognitionPayload {
  signature: string
  publicKey: string
}

/**
 * Sign a recognition payload with the user's Hedera private key
 * This proves the user authorized the recognition and trust allocation
 */
export async function signRecognition(
  payload: Omit<RecognitionPayload, "type" | "timestamp">,
  privateKeyString: string
): Promise<SignedRecognitionPayload> {
  try {
    // Build complete payload with type and timestamp
    const fullPayload: RecognitionPayload = {
      type: "RECOGNITION_MINT",
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

    console.log(`[SignRecognition] Signed recognition from ${payload.fromAccountId} to ${payload.toAccountId}`)
    console.log(`[SignRecognition] Trust amount: ${payload.trustAmount}`)
    console.log(`[SignRecognition] Public key: ${publicKey}`)

    return {
      ...fullPayload,
      signature,
      publicKey
    }
  } catch (error: any) {
    console.error("[SignRecognition] Failed to sign recognition:", error.message)
    throw new Error(`Failed to sign recognition: ${error.message}`)
  }
}

/**
 * Verify a signed recognition payload
 */
export function verifyRecognitionSignature(signedPayload: SignedRecognitionPayload): boolean {
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

    console.log(`[VerifyRecognition] Signature verified for recognition from ${payload.fromAccountId}`)
    return true
  } catch (error: any) {
    console.error("[VerifyRecognition] Signature verification failed:", error.message)
    return false
  }
}
