/**
 * useXmtpClient Hook
 * 
 * React hook wrapper for XMTP client initialization
 * Manages client lifecycle, loading states, and errors
 * 
 * Phase 1 Constraints:
 * - Client-only ('use client' required)
 * - Reacts to identity changes
 * - Never throws (errors captured in state)
 * - Cleans up on unmount
 * 
 * Usage:
 * ```tsx
 * const { client, loading, error } = useXmtpClient(identity)
 * 
 * if (loading) return <Spinner />
 * if (error) return <Error message={error.message} />
 * if (!client) return <XMTPDisabled />
 * 
 * // Use client for messaging
 * await client.conversations.list()
 * ```
 */

'use client'

import { useEffect, useState } from 'react'
import type { Client } from '@xmtp/xmtp-js'
import type { ScendIdentity } from '@/lib/identity/ScendIdentity'
import { getXMTPClient, resetXMTPClient } from '@/lib/xmtp/client'

/**
 * Hook result shape
 */
interface UseXmtpClientResult {
  client: Client | null      // XMTP client (null if disabled/not ready)
  loading: boolean            // True while initializing
  error: Error | null         // Captured error (if initialization failed)
}

/**
 * useXmtpClient - Initialize and manage XMTP client for messaging
 * 
 * @param identity ScendIdentity with EVM + Hedera accounts (or null if not authenticated)
 * @returns {UseXmtpClientResult} Client state with loading/error tracking
 * 
 * Behavior:
 * - identity === null → returns { client: null, loading: false, error: null }
 * - XMTP_ENABLED === false → client stays null (no error)
 * - Valid identity + flag enabled → client initializes asynchronously
 * - Reacts to identity.evmAddress or identity.hederaAccountId changes
 * - Cleans up on unmount (calls resetXMTPClient)
 */
export function useXmtpClient(identity: ScendIdentity | null): UseXmtpClientResult {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    // Guard: No identity → clear state
    if (!identity) {
      setClient(null)
      setError(null)
      setLoading(false)
      console.log('[useXmtpClient] No identity, clearing state')
      return
    }
    
    // Track if effect was cancelled (cleanup called)
    let cancelled = false
    
    // Start initialization
    setLoading(true)
    setError(null)
    
    console.log('[useXmtpClient] Initializing for identity:', {
      evmAddress: identity.evmAddress,
      hederaAccount: identity.hederaAccountId
    })
    
    getXMTPClient(identity)
      .then((c) => {
        if (!cancelled) {
          setClient(c)
          console.log('[useXmtpClient] Client ready:', c ? 'initialized' : 'null (disabled or failed)')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err as Error)
          setClient(null)
          console.error('[useXmtpClient] Initialization error:', err)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    
    // Cleanup on unmount or identity change
    return () => {
      cancelled = true
      console.log('[useXmtpClient] Cleanup: resetting client')
      resetXMTPClient()
    }
  }, [identity?.evmAddress, identity?.hederaAccountId])
  
  return { client, loading, error }
}
