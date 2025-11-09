import { hederaClient } from "@/packages/hedera/HederaClient"

export interface ProfileData {
  handle: string
  bio?: string
  visibility: 'public' | 'contacts'
  location?: string
  avatar?: string
}

export interface ProfileSnapshot {
  profileSeq: number | string
  profileHrl: string
  ts: number
  data: ProfileData
}

const PROFILE_CACHE_KEY = 'trustmesh_profile_snapshot'
const PROFILE_TTL_HOURS = 24

class ProfileService {
  private cachedSnapshot: ProfileSnapshot | null = null
  private errorCache = new Map<string, { error: Error; ts: number }>()
  private readonly ERROR_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

  // Get current profile snapshot (from cache or create new)
  async getProfileSnapshot(): Promise<ProfileSnapshot> {
    try {
      // Check error cache to avoid repeated failures
      const cachedError = this.errorCache.get('profile_fetch')
      if (cachedError && Date.now() - cachedError.ts < this.ERROR_CACHE_TTL) {
        throw cachedError.error
      }

      if (this.cachedSnapshot) {
        return this.cachedSnapshot
      }

      // Try to load from localStorage
      const cached = this.loadFromStorage()
      if (cached && this.isValid(cached) && this.validateProfileStructure(cached)) {
        this.cachedSnapshot = cached
        return cached
      }

      // Create fresh profile
      return this.createFreshProfile()
    } catch (error) {
      console.error('[ProfileService] Failed to get profile snapshot:', error)
      // Cache the error to prevent immediate retries
      this.errorCache.set('profile_fetch', { error: error as Error, ts: Date.now() })
      throw error
    }
  }

  async publishProfileUpdate(profile: ProfileData, sessionId?: string): Promise<{ seq: number | string; hrl: string }> {
    try {
      // Validate profile data
      if (!this.validateProfileData(profile)) {
        throw new Error('Invalid profile data')
      }

      const hcsEnabled = process.env.NEXT_PUBLIC_HCS_ENABLED === "true"
      let seq: number | string = "local-latest"
      let hrl = `local://profile/${seq}`

      if (hcsEnabled && sessionId) {
        // Skip HCS profile write during initialization
        // User will need to explicitly update profile via Settings which uses signed payloads
        console.log('[ProfileService] Using local profile (HCS publish requires user signature)')
        seq = Date.now()
        hrl = `local://profile/${seq}`
      } else {
        console.log('[ProfileService] Using local profile (HCS disabled or no session ID)')
        seq = Date.now()
        hrl = `local://profile/${seq}`
      }

      // Cache the snapshot
      const snapshot: ProfileSnapshot = {
        profileSeq: seq,
        profileHrl: hrl,
        ts: Date.now(),
        data: profile
      }

      this.cachedSnapshot = snapshot
      this.saveToStorage(snapshot)

      return { seq, hrl }
    } catch (error) {
      console.error('[ProfileService] Failed to publish profile update:', error)
      throw error
    }
  }

  private async createFreshProfile(): Promise<ProfileSnapshot> {
    const defaultProfile: ProfileData = {
      handle: "user_dev",
      bio: "TrustMesh user",
      visibility: "public",
      location: "Local"
    }

    console.log('[ProfileService] Creating fresh local profile (no server-side publishing without sessionId)')
    
    // Create local profile without server-side publishing
    const seq = Date.now()
    const hrl = `local://profile/${seq}`
    
    return {
      profileSeq: seq,
      profileHrl: hrl,
      ts: Date.now(),
      data: defaultProfile
    }
  }

  private loadFromStorage(): ProfileSnapshot | null {
    try {
      const stored = localStorage.getItem(PROFILE_CACHE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  private saveToStorage(snapshot: ProfileSnapshot): void {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(snapshot))
    } catch (error) {
      console.warn('[ProfileService] Failed to save profile to storage:', error)
    }
  }

  private isValid(snapshot: ProfileSnapshot): boolean {
    const ageHours = (Date.now() - snapshot.ts) / (1000 * 60 * 60)
    return ageHours < PROFILE_TTL_HOURS
  }

  // Validation methods
  private validateProfileData(profile: ProfileData): boolean {
    try {
      if (!profile.handle || typeof profile.handle !== 'string' || profile.handle.length < 1) {
        return false
      }
      if (profile.visibility && !['public', 'contacts'].includes(profile.visibility)) {
        return false
      }
      if (profile.bio && (typeof profile.bio !== 'string' || profile.bio.length > 500)) {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  private validateProfileStructure(snapshot: ProfileSnapshot): boolean {
    try {
      return (
        snapshot &&
        typeof snapshot.profileSeq !== 'undefined' &&
        typeof snapshot.profileHrl === 'string' &&
        typeof snapshot.ts === 'number' &&
        snapshot.data &&
        this.validateProfileData(snapshot.data)
      )
    } catch {
      return false
    }
  }

  private generateValidHRL(topicId: string, seq: number | string): string {
    try {
      // HCS-11 compliant HRL format
      const hrl = `hcs://11/${topicId}/${seq}`
      
      // Basic validation
      if (hrl.length > 200) {
        throw new Error('HRL too long')
      }
      
      return hrl
    } catch (error) {
      console.warn('[ProfileService] HRL generation failed, using fallback:', error)
      return `hcs://11/${topicId}/fallback-${Date.now()}`
    }
  }

  // Get error status for UI display
  getErrorStatus(): { hasErrors: boolean; lastError?: string; canRetry: boolean } {
    const errors = Array.from(this.errorCache.values())
    if (errors.length === 0) {
      return { hasErrors: false, canRetry: false }
    }
    
    const latestError = errors.reduce((latest, current) => 
      current.ts > latest.ts ? current : latest
    )
    
    const canRetry = Date.now() - latestError.ts > this.ERROR_CACHE_TTL
    
    return {
      hasErrors: true,
      lastError: latestError.error.message,
      canRetry
    }
  }

  // Clear error cache to allow retry
  clearErrors(): void {
    this.errorCache.clear()
  }

  // Clear cache (for testing)
  clearCache(): void {
    this.cachedSnapshot = null
    this.errorCache.clear()
    localStorage.removeItem(PROFILE_CACHE_KEY)
  }
}

export const profileService = new ProfileService()