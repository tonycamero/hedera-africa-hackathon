/**
 * Lightweight auth helpers
 * 
 * Provides simple auth state checks without full auth context
 */

import { cookies } from 'next/headers'

/**
 * Check if user is authenticated (server-side)
 * 
 * Returns true if valid session token exists
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session-token')
  
  // Basic validation - extend with JWT verification if needed
  return !!sessionToken && sessionToken.value.length > 0
}

/**
 * Get current wallet address (server-side)
 * 
 * Returns wallet address from session or null if not authenticated
 */
export async function getCurrentWallet(): Promise<string | null> {
  const cookieStore = await cookies()
  const wallet = cookieStore.get('wallet-address')
  
  return wallet?.value || null
}
