import { profileService } from './profile/profileService'

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

  // 12-char, time-salted, device-safe ID
  const rnd = Math.random().toString(36).slice(2, 8)
  const t = (Date.now() % 1e7).toString(36)
  const id = `tm-${t}${rnd}` // e.g., tm-4f1b9da1k2

  if (!isEphemeral && typeof window !== 'undefined') {
    const key = "tm_session_id"
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    sessionStorage.setItem(key, id)
  }

  if (isEphemeral) {
    _sessionId = id
  }

  return id
}

export async function getSessionProfile(): Promise<SessionProfile> {
  if (_sessionProfile) {
    return _sessionProfile
  }

  const sessionId = getSessionId()
  const handle = sessionId.toUpperCase()

  // Try to get/create profile HRL
  let profileHrl = `hcs://11/${process.env.NEXT_PUBLIC_TOPIC_PROFILE}/local-${sessionId}`

  try {
    const hcsEnabled = process.env.NEXT_PUBLIC_HCS_ENABLED === "true"
    if (hcsEnabled) {
      // Try to publish profile update in background
      const result = await profileService.publishProfileUpdate({
        handle,
        bio: `TrustMesh demo user (${sessionId})`,
        visibility: 'public'
      })
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
    sessionStorage.removeItem("tm_session_id")
  }
}

// Helper to get ephemeral mode from runtime flags
function getRuntimeEphemeralMode(): boolean {
  if (typeof window === 'undefined') return true
  
  const q = new URLSearchParams(window.location.search)
  const live = q.get("live") === "1"
  
  return live ? true : (process.env.NEXT_PUBLIC_DEMO_EPHEMERAL_STRICT === "true")
}