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

export function getSessionId(ephemeralStrict?: boolean): string {
  // Honor explicit session override in preview/demo
  const envSession = process.env.NEXT_PUBLIC_SESSION_ID?.trim()
  if (envSession) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tm_session_id', envSession)
    }
    _sessionId = envSession
    return envSession
  }

  // Use Hedera Account ID from Magic auth if available
  if (typeof window !== 'undefined') {
    try {
      const usersData = localStorage.getItem('tm:users')
      if (usersData) {
        const [user] = JSON.parse(usersData)
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
      const usersData = localStorage.getItem('tm:users')
      if (usersData) {
        const [user] = JSON.parse(usersData)
        if (user?.email) {
          // Use email or extract name from email
          const emailName = user.email.split('@')[0]
          handle = user.displayName || emailName || user.email
          bio = `${user.email}`
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
      const usersData = localStorage.getItem('tm:users')
      if (usersData) {
        const [user] = JSON.parse(usersData)
        email = user?.email
        displayName = user?.displayName
        hederaAccountId = user?.hederaAccountId
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
