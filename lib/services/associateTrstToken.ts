"use client"

import { magic } from "@/lib/magic"

/**
 * Associate TRST token with user's Hedera account
 * 
 * NOTE: For hackathon demo, this uses operator-paid association since
 * Magic's Hedera accounts are created independently on the backend.
 * Production would use proper Magic-signed transactions.
 */
export async function associateTrstTokenViaMagic(accountId: string) {
  if (!magic) throw new Error("Magic not initialized")

  const token = await magic.user.getIdToken()
  if (!token) throw new Error("Not authenticated")

  console.log('[TRST Association] Associating token for account:', accountId)
  console.log('[TRST Association] Using backend operator-paid association for demo')
  
  // Call backend to handle association (operator pays and signs)
  const response = await fetch("/api/hedera/token/associate", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ accountId }),
  })
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    
    // Token already associated is fine
    if ((err?.error || err?.status || "").includes("ALREADY_ASSOCIATED")) {
      console.log('[TRST Association] Token already associated (OK)')
      return { transactionId: "N/A", status: "ALREADY_ASSOCIATED" }
    }
    
    throw new Error(err?.error || "Failed to associate token")
  }
  
  const result = await response.json()
  console.log(`[TRST Association] Success! Status: ${result.status}`)
  
  return { 
    transactionId: result.transactionId || "N/A", 
    status: result.status 
  }
}
