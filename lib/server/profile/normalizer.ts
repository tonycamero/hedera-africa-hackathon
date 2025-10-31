/**
 * Server-side profile normalization
 * 
 * Handles all historical profile data shapes:
 * - Old: { payload: { handle, sessionId } }
 * - New: { accountId, displayName, bio, avatar }
 * 
 * Provides caching and consistent matching strategies
 */

const MIRROR_BASE = process.env.HEDERA_MIRROR_BASE || "https://testnet.mirrornode.hedera.com"

export interface NormalizedProfile {
  accountId: string
  displayName: string
  bio: string
  avatar?: string
  timestamp?: number
}

/**
 * Resolve EVM address to Hedera account ID via mirror node
 * Returns null if not found or if input is already a Hedera account ID
 */
async function resolveEvmToAccountId(input: string): Promise<string | null> {
  // If already a Hedera account ID format (0.0.xxxxx), return as-is
  if (/^\d+\.\d+\.\d+$/.test(input)) {
    return input
  }
  
  // If looks like an EVM address (0x...), query mirror node
  if (input.startsWith('0x')) {
    try {
      const url = `${MIRROR_BASE}/api/v1/accounts/${input}`
      const response = await fetch(url, { 
        cache: "no-store",
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) {
        console.warn(`[Profile Normalizer] Could not resolve EVM address ${input}: ${response.status}`)
        return null
      }
      
      const data = await response.json()
      const accountId = data.account // e.g., "0.0.123456"
      console.log(`[Profile Normalizer] Resolved EVM ${input} -> ${accountId}`)
      return accountId
    } catch (error: any) {
      console.warn(`[Profile Normalizer] Error resolving EVM address:`, error.message)
      return null
    }
  }
  
  // Unknown format
  return null
}

// Simple in-memory cache with TTL
interface CacheEntry {
  profile: NormalizedProfile | null
  expiresAt: number
}

const profileCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000 // 60 seconds

/**
 * Get the latest profile for an account from HCS
 * Handles legacy formats and caches results
 */
export async function getLatestProfileFor(
  accountId: string, 
  email?: string
): Promise<NormalizedProfile | null> {
  // Resolve EVM address to Hedera account ID if needed
  const resolvedAccountId = await resolveEvmToAccountId(accountId)
  const searchAccountId = resolvedAccountId || accountId
  
  // Check cache first (use resolved account ID for cache key)
  const cacheKey = searchAccountId
  const cached = profileCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[Profile Normalizer] Cache hit for ${searchAccountId}`)
    return cached.profile
  }

  console.log(`[Profile Normalizer] Fetching from HCS for ${searchAccountId} (original: ${accountId})`)

  try {
    const profileTopicId = process.env.NEXT_PUBLIC_TOPIC_PROFILE
    if (!profileTopicId) {
      throw new Error('NEXT_PUBLIC_TOPIC_PROFILE not configured')
    }

    // Fetch recent profile messages from HCS
    const url = `${MIRROR_BASE}/api/v1/topics/${profileTopicId}/messages?order=desc&limit=100`
    const response = await fetch(url, { 
      cache: "no-store",
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      console.warn(`[Profile Normalizer] Mirror node error: ${response.status}`)
      return cacheAndReturn(cacheKey, null)
    }

    const data = await response.json()
    const messages = data.messages || []

    // Find the most recent profile for this account
    const latest = messages.find((msg: any) => {
      try {
        const decoded = JSON.parse(Buffer.from(msg.message, "base64").toString("utf8"))
        
        // Must be PROFILE_UPDATE type
        if (decoded.type !== "PROFILE_UPDATE") return false
        
        // Try multiple matching strategies
        const profileAccountId = decoded.accountId || decoded.payload?.sessionId
        const profileHandle = decoded.payload?.handle
        
        // Match by resolved accountId OR by email/handle (for old messages without accountId)
        return profileAccountId === searchAccountId || 
               profileHandle === email || 
               profileHandle === searchAccountId
      } catch {
        return false
      }
    })

    if (!latest) {
      console.log(`[Profile Normalizer] No profile found for ${searchAccountId} (original: ${accountId})`)
      return cacheAndReturn(cacheKey, null)
    }

    // Normalize to consistent shape
    const normalized = normalizeProfileEvent(
      JSON.parse(Buffer.from(latest.message, "base64").toString("utf8"))
    )

    console.log(`[Profile Normalizer] Found profile for ${searchAccountId} (original: ${accountId}):`, {
      displayName: normalized.displayName,
      bio: normalized.bio?.slice(0, 50)
    })

    return cacheAndReturn(cacheKey, normalized)
  } catch (error: any) {
    console.error('[Profile Normalizer] Error fetching profile:', error.message)
    return cacheAndReturn(cacheKey, null)
  }
}

/**
 * Normalize a profile event to canonical shape
 * Handles all historical formats
 */
function normalizeProfileEvent(event: any): NormalizedProfile {
  // Support both flat and nested structures
  const data = event.payload || event.profile || event
  
  return {
    accountId: data.accountId || data.sessionId || event.accountId || '',
    // Prefer displayName, fall back to handle
    displayName: data.displayName || data.handle || 'Unnamed',
    bio: data.bio || '',
    avatar: data.avatar,
    timestamp: event.timestamp || data.timestamp
  }
}

/**
 * Cache a profile result and return it
 */
function cacheAndReturn(
  cacheKey: string, 
  profile: NormalizedProfile | null
): NormalizedProfile | null {
  profileCache.set(cacheKey, {
    profile,
    expiresAt: Date.now() + CACHE_TTL_MS
  })
  return profile
}

/**
 * Clear cache for a specific account (call after profile update)
 */
export function invalidateProfileCache(accountId: string): void {
  profileCache.delete(accountId)
  console.log(`[Profile Normalizer] Invalidated cache for ${accountId}`)
}

/**
 * Clear entire profile cache (use sparingly)
 */
export function clearProfileCache(): void {
  profileCache.clear()
  console.log('[Profile Normalizer] Cleared entire profile cache')
}
