import { profileService } from './profile/profileService'
import { HCS_ENABLED } from './env'

export interface SessionProfile {
  sessionId: string
  handle: string
  profileHrl: string
  displayName?: string
  email?: string
  hederaAccountId?: string
  bio?: string
}

let _sessionId: string | null = null
let _sessionProfile: SessionProfile | null = null

/**
 * Get the authoritative Hedera account ID via HCS-22 resolution
 * This is the CORRECT way to get the user's account ID
 * 
 * WARNING: Returns null if not authenticated or resolution fails
 */
export async function getResolvedAccountId(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  
  try {
    const { magic } = await import('@/lib/magic')
    const isLoggedIn = await magic.user.isLoggedIn()
    
    if (!isLoggedIn) return null
    
    const token = await magic.user.getIdToken()
    if (!token) return null
    
    // Query HCS-22 resolver via server API
    const response = await fetch('/api/hcs22/resolve?mode=lookup', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      console.warn('[Session] HCS-22 resolution failed:', response.status)
      return null
    }
    
    const data = await response.json()
    const accountId = data.hederaAccountId
    
    if (accountId) {
      console.log('[Session] Resolved account ID via HCS-22:', accountId)
      
      // Update localStorage cache for faster subsequent access
      const usersData = localStorage.getItem('tm:users')
      if (usersData) {
        const allUsers = JSON.parse(usersData)
        if (allUsers[0]) {
          allUsers[0].hederaAccountId = accountId
          localStorage.setItem('tm:users', JSON.stringify(allUsers))
        }
      }
      
      return accountId
    }
    
    return null
  } catch (error) {
    console.error('[Session] Failed to resolve account ID:', error)
    return null
  }
}

/**
 * DEPRECATED: Get session ID from localStorage cache
 * 
 * WARNING: This reads from localStorage which can be stale/cleared.
 * Use getResolvedAccountId() instead for authoritative account ID.
 * 
 * This function remains for backward compatibility with synchronous code,
 * but all new code should use the async getResolvedAccountId().
 */
export function getSessionId(ephemeralStrict?: boolean): string {
  // REMOVED: Demo session override - use real authenticated sessions only
  // const envSession = process.env.NEXT_PUBLIC_SESSION_ID?.trim()
  // if (envSession) {
  //   if (typeof window !== 'undefined') {
  //     sessionStorage.setItem('tm_session_id', envSession)
  //   }
  //   _sessionId = envSession
  //   return envSession
  // }

  // DEPRECATED: Read from localStorage cache (may be stale)
  // Use getResolvedAccountId() for authoritative account ID
  if (typeof window !== 'undefined') {
    try {
      const usersData = localStorage.getItem('tm:users')
      if (usersData) {
        const allUsers = JSON.parse(usersData)
        // For now, use first user as fallback (will be fixed by getCurrentMagicUser in async contexts)
        // This is a synchronous function so we can't await Magic API calls here
        const user = allUsers[0]
        if (user?.hederaAccountId) {
          _sessionId = user.hederaAccountId
          return user.hederaAccountId
        }
      }
    } catch (error) {
      console.warn('[Session] Failed to read Hedera account from localStorage:', error)
    }
  }

  // Use runtime flags to determine ephemeral mode
  const isEphemeral = ephemeralStrict ?? getRuntimeEphemeralMode()
  
  if (isEphemeral && _sessionId) {
    return _sessionId
  }

  // Demo path removed in Step 5: Demo removal

  // Fallback: random session id (only if not logged in)
  const key = 'tm_session_id'
  if (!isEphemeral && typeof window !== 'undefined') {
    const existing = window.sessionStorage.getItem(key)
    if (existing) return existing
  }
  const rnd = Math.random().toString(36).slice(2, 8)
  const t = (Date.now() % 1e7).toString(36)
  const id = `tm-${t}${rnd}`

  if (!isEphemeral && typeof window !== 'undefined') {
    window.sessionStorage.setItem(key, id)
  } else {
    _sessionId = id
  }
  return id
}

export async function getSessionProfile(): Promise<SessionProfile> {
  if (_sessionProfile) {
    return _sessionProfile
  }

  const sessionId = getSessionId()
  
  // Get display name from Magic auth email if available
  let handle = sessionId
  let bio = `TrustMesh user (${sessionId})`
  
  if (typeof window !== 'undefined') {
    try {
      // Import magic and check current user
      const { magic } = await import('@/lib/magic')
      const isLoggedIn = await magic.user.isLoggedIn()
      
      if (isLoggedIn) {
        const metadata = await magic.user.getInfo()
        const currentEmail = metadata?.email
        
        if (currentEmail) {
          const usersData = localStorage.getItem('tm:users')
          if (usersData) {
            const allUsers = JSON.parse(usersData)
            const user = allUsers.find((u: any) => u.email === currentEmail)
            
            if (user?.email) {
              // Use email or extract name from email
              const emailName = user.email.split('@')[0]
              handle = user.displayName || emailName || user.email
              bio = `${user.email}`
            }
          }
        }
      }
    } catch (error) {
      console.warn('[Session] Failed to read user info from localStorage:', error)
    }
  }

  // Try to get/create profile HRL
  let profileHrl = `hcs://11/${process.env.NEXT_PUBLIC_TOPIC_PROFILE}/local-${sessionId}`

  try {
    if (HCS_ENABLED) {
      const result = await profileService.publishProfileUpdate(
        { handle, bio, visibility: 'public' },
        sessionId
      )
      profileHrl = result.hrl
    }
  } catch (error) {
    console.log('[Session] Failed to publish profile, using local HRL:', error)
  }

  // Get additional user data for profile
  let email: string | undefined
  let displayName: string | undefined
  let hederaAccountId: string | undefined
  
  if (typeof window !== 'undefined') {
    try {
      const { magic } = await import('@/lib/magic')
      const isLoggedIn = await magic.user.isLoggedIn()
      
      if (isLoggedIn) {
        const metadata = await magic.user.getInfo()
        const currentEmail = metadata?.email
        
        if (currentEmail) {
          const usersData = localStorage.getItem('tm:users')
          if (usersData) {
            const allUsers = JSON.parse(usersData)
            const user = allUsers.find((u: any) => u.email === currentEmail)
            
            if (user) {
              email = user.email
              displayName = user.displayName
              hederaAccountId = user.hederaAccountId
            }
          }
        }
      }
    } catch (error) {
      // Already warned above
    }
  }
  
  const profile = {
    sessionId,
    handle,
    profileHrl,
    email,
    displayName,
    hederaAccountId,
    bio
  }

  _sessionProfile = profile
  return profile
}

export function resetSession(): void {
  _sessionId = null
  _sessionProfile = null
  
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem('tm_session_id')
  }
}


// Helper to get ephemeral mode from runtime flags
function getRuntimeEphemeralMode(): boolean {
  if (typeof window === 'undefined') return true
  
  // Always use live mode (no demo mode)
  return true
}
