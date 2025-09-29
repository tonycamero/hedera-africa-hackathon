import { profileService } from './profile/profileService'
import { ALLOW_DEMO, HCS_ENABLED } from './env'

export interface SessionProfile {
  sessionId: string
  handle: string
  profileHrl: string
}

let _sessionId: string | null = null
let _sessionProfile: SessionProfile | null = null

export function getSessionId(ephemeralStrict?: boolean): string {
  // Use runtime flags to determine ephemeral mode
  const isEphemeral = ephemeralStrict ?? getRuntimeEphemeralMode()
  
  if (isEphemeral && _sessionId) {
    return _sessionId
  }

  // Demo path removed in Step 5: Demo removal

  // Live/random session id path (prod default)
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
  // Default handle just mirrors the id unless demo decoration is allowed
  let handle = sessionId
  let bio = `TrustMesh user (${sessionId})`

  // Demo decoration removed in Step 5: Demo removal

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

  const profile = {
    sessionId,
    handle,
    profileHrl
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

// Demo mode: honor URL only when demo is explicitly allowed
function isInDemoMode(): boolean {
  if (!ALLOW_DEMO) return false
  if ((process.env.NEXT_PUBLIC_DEMO_SEED ?? '').trim().toLowerCase() === 'on') return true
  if (typeof window !== 'undefined') {
    const isLive = new URLSearchParams(window.location.search).get('live') === '1'
    return !isLive
  }
  return true
}

// Helper to get ephemeral mode from runtime flags
function getRuntimeEphemeralMode(): boolean {
  if (typeof window === 'undefined') return true
  
  const q = new URLSearchParams(window.location.search)
  const live = q.get("live") === "1"
  
  return live ? true : (process.env.NEXT_PUBLIC_DEMO_EPHEMERAL_STRICT === "true")
}
