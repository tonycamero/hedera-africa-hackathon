/**
 * IdentityProvider - Global Identity Context
 * 
 * Provides unified access to:
 * - ScendIdentity (EVM + Hedera dual-key identity)
 * - XMTP Client (messaging)
 * 
 * This is the SINGLE SOURCE OF TRUTH for authenticated user identity
 * and messaging capabilities throughout the app.
 * 
 * Phase 1 Constraints:
 * - Client-only ('use client' required)
 * - Resolves identity on mount
 * - Initializes XMTP client if identity valid
 * - Never throws (returns null states if not authenticated)
 * 
 * Usage:
 * ```tsx
 * 'use client'
 * 
 * import { useIdentity } from '@/app/providers/IdentityProvider'
 * 
 * export function MyComponent() {
 *   const { identity, xmtpClient, identityLoading } = useIdentity()
 *   
 *   if (identityLoading) return <Spinner />
 *   if (!identity) return <LoginPrompt />
 *   
 *   // Use identity.evmAddress for XMTP
 *   // Use identity.hederaAccountId for HCS
 *   // Use xmtpClient for messaging
 * }
 * ```
 */

'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ScendIdentity } from '@/lib/identity/ScendIdentity'
import { resolveScendIdentity } from '@/lib/identity/resolveScendIdentity'
import type { Client as XmtpClient } from '@xmtp/xmtp-js'
import { useXmtpClient } from '@/lib/xmtp/hooks/useXmtpClient'

/**
 * Identity context value shape
 * Provides both identity and XMTP client with separate loading/error states
 */
interface IdentityContextValue {
  // Identity state
  identity: ScendIdentity | null          // Resolved identity (null if not authenticated)
  identityLoading: boolean                // True while resolving identity
  identityError: Error | null             // Error during identity resolution
  
  // XMTP client state
  xmtpClient: XmtpClient | null          // XMTP client (null if disabled/not ready)
  xmtpLoading: boolean                    // True while initializing XMTP
  xmtpError: Error | null                 // Error during XMTP initialization
}

/**
 * Default context value (used before provider mounts)
 */
const defaultValue: IdentityContextValue = {
  identity: null,
  identityLoading: false,
  identityError: null,
  xmtpClient: null,
  xmtpLoading: false,
  xmtpError: null
}

/**
 * Identity context
 */
const IdentityContext = createContext<IdentityContextValue>(defaultValue)

/**
 * IdentityProvider Component
 * 
 * Wraps the app to provide global identity + XMTP access
 * Place this high in the component tree (typically in root layout)
 * 
 * Behavior:
 * 1. On mount → resolves ScendIdentity (Magic + HCS-22)
 * 2. If identity resolved → initializes XMTP client (if flag enabled)
 * 3. Provides context to all children via useIdentity() hook
 * 
 * @param children React tree to wrap
 */
export function IdentityProvider({ children }: { children: ReactNode }) {
  // Identity resolution state
  const [identity, setIdentity] = useState<ScendIdentity | null>(null)
  const [identityLoading, setIdentityLoading] = useState(false)
  const [identityError, setIdentityError] = useState<Error | null>(null)
  
  // Resolve identity on mount
  useEffect(() => {
    let cancelled = false
    
    console.log('[IdentityProvider] Resolving identity...')
    setIdentityLoading(true)
    setIdentityError(null)
    
    resolveScendIdentity()
      .then((resolvedIdentity) => {
        if (!cancelled) {
          setIdentity(resolvedIdentity)
          console.log('[IdentityProvider] Identity resolved:', {
            evmAddress: resolvedIdentity.evmAddress,
            hederaAccountId: resolvedIdentity.hederaAccountId,
            handle: resolvedIdentity.handle
          })
        }
      })
      .catch((err) => {
        console.warn('[IdentityProvider] Failed to resolve identity:', err)
        if (!cancelled) {
          setIdentity(null)
          setIdentityError(err as Error)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIdentityLoading(false)
        }
      })
    
    return () => {
      cancelled = true
    }
  }, [])
  
  // Initialize XMTP client (reacts to identity changes)
  const { 
    client: xmtpClient, 
    loading: xmtpLoading, 
    error: xmtpError 
  } = useXmtpClient(identity)
  
  // Build context value
  const value: IdentityContextValue = {
    identity,
    identityLoading,
    identityError,
    xmtpClient,
    xmtpLoading,
    xmtpError
  }
  
  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  )
}

/**
 * useIdentity Hook
 * 
 * Access identity and XMTP client from anywhere in the app
 * Must be used within <IdentityProvider>
 * 
 * @returns IdentityContextValue with identity + XMTP state
 * @throws Error if used outside IdentityProvider
 * 
 * Example:
 * ```tsx
 * const { identity, xmtpClient, identityLoading, xmtpLoading } = useIdentity()
 * 
 * if (identityLoading || xmtpLoading) return <Spinner />
 * if (!identity) return <LoginPrompt />
 * if (!xmtpClient) return <XMTPDisabled />
 * 
 * // Ready to use messaging
 * const conversations = await xmtpClient.conversations.list()
 * ```
 */
export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext)
  
  if (context === undefined) {
    throw new Error('useIdentity must be used within IdentityProvider')
  }
  
  return context
}
