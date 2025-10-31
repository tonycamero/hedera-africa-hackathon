/**
 * Client-side profile normalization
 * 
 * Ensures all UI components work with a consistent profile shape
 * regardless of how the data was fetched or what format it's in
 */

export interface NormalizedProfile {
  accountId: string
  displayName: string
  bio: string
  avatar?: string
  timestamp?: number
}

/**
 * Normalize profile data from any source to consistent shape
 * 
 * Handles:
 * - API responses from /api/profile/status
 * - HCS event payloads
 * - Legacy localStorage formats
 * - Direct profile objects
 * 
 * @param data - Raw profile data from any source
 * @returns Normalized profile or null
 */
export function normalizeProfile(data: any): NormalizedProfile | null {
  if (!data) return null

  // If data has a .profile property (API response wrapper), unwrap it
  const profileData = data.profile || data

  // Support both flat and nested structures
  const source = profileData.payload || profileData

  const accountId = source.accountId || source.sessionId || profileData.accountId || ''
  if (!accountId) return null

  return {
    accountId,
    // Prefer displayName, fall back to handle, then email
    displayName: source.displayName || source.handle || source.email || 'Unnamed',
    bio: source.bio || '',
    avatar: source.avatar,
    timestamp: source.timestamp || profileData.timestamp
  }
}

/**
 * Check if a profile has meaningful data (not just defaults)
 */
export function hasValidProfile(profile: NormalizedProfile | null): boolean {
  if (!profile) return false
  
  const hasRealDisplayName = profile.displayName && 
                            profile.displayName !== 'Unnamed' &&
                            profile.displayName.trim().length > 0
  
  const hasBio = profile.bio && profile.bio.trim().length > 0
  
  return !!(hasRealDisplayName || hasBio)
}

/**
 * Get display text for a profile (for UI rendering)
 */
export function getProfileDisplayText(profile: NormalizedProfile | null): string {
  if (!profile) return 'Unknown User'
  
  // If displayName looks like an email, try to extract a friendly name
  if (profile.displayName.includes('@')) {
    const emailName = profile.displayName.split('@')[0]
    // Convert "tonycamerobiz+test1" to "tonycamerobiz"
    return emailName.split('+')[0] || profile.displayName
  }
  
  return profile.displayName
}
