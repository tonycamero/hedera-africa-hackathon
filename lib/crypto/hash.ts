import { createHash } from "crypto"

/**
 * Hash a contact request envelope for verification in CONTACT_ACCEPT
 * Uses same hashing rule as seed script for consistency
 */
export function hashContactRequest(reqEnvelope: any): string {
  const minimal = {
    type: "CONTACT_REQUEST",
    from: reqEnvelope.from,
    payload: reqEnvelope.payload
  }
  
  return createHash("sha256")
    .update(JSON.stringify(minimal))
    .digest("hex")
}