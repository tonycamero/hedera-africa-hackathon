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
    // Prefer root displayName (new format), then nested displayName, then handle, then email
    // Empty string if none exist (don't default to 'Unnamed' in data layer)
    displayName: profileData.displayName || source.displayName || source.handle || source.email || '',
    bio: profileData.bio || source.bio || '',
    avatar: profileData.avatar || source.avatar || '',
    timestamp: source.timestamp || profileData.timestamp
  }
}

/**
 * Check if a profile has meaningful data (not just defaults)
 */
export function hasValidProfile(profile: NormalizedProfile | null): boolean {
  if (!profile) return false
  
  // Profile is valid if it has any non-empty displayName OR bio
  const hasRealDisplayName = profile.displayName && profile.displayName.trim().length > 0
  const hasBio = profile.bio && profile.bio.trim().length > 0
  
  return !!(hasRealDisplayName || hasBio)
}

/**
 * Get display text for a profile (for UI rendering)
 * Falls back to truncated account ID if no displayName set
 */
export function getProfileDisplayText(profile: NormalizedProfile | null): string {
  if (!profile) return 'Unknown User'
  
  // If no displayName, show truncated account ID
  if (!profile.displayName || profile.displayName.trim().length === 0) {
    // Show last 6 digits of account ID (e.g., "0.0.7168693" -> "...8693")
    const parts = profile.accountId.split('.')
    const lastPart = parts[parts.length - 1]
    return lastPart.length > 4 ? `...${lastPart.slice(-4)}` : profile.accountId
  }
  
  // If displayName looks like an email, try to extract a friendly name
  if (profile.displayName.includes('@')) {
    const emailName = profile.displayName.split('@')[0]
    // Convert "tonycamerobiz+test1" to "tonycamerobiz"
    return emailName.split('+')[0] || profile.displayName
  }
  
  return profile.displayName
}
