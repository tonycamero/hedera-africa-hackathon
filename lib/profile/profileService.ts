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

  async publishProfileUpdate(profile: ProfileData): Promise<{ seq: number | string; hrl: string }> {
    try {
      // Validate profile data
      if (!this.validateProfileData(profile)) {
        throw new Error('Invalid profile data')
      }

      const operatorId = process.env.NEXT_PUBLIC_HEDERA_OPERATOR_ID || "0.0.5864559"
      const profileTopic = process.env.NEXT_PUBLIC_TOPIC_PROFILE || ""
      const hcsEnabled = process.env.NEXT_PUBLIC_HCS_ENABLED === "true"

      let seq: number | string = "local-latest"
      let hrl = `hcs://11/${profileTopic}/${seq}`

      if (hcsEnabled && profileTopic) {
        try {
          // Build HCS-11 compliant envelope
          const envelope = {
            type: "PROFILE_UPDATE",
            from: operatorId,
            nonce: Date.now(),
            ts: Math.floor(Date.now() / 1000),
            payload: {
              handle: profile.handle,
              bio: profile.bio || "",
              visibility: profile.visibility,
              location: profile.location || "",
              avatar: profile.avatar || ""
            },
            sig: "demo_signature"
          }

          console.log('[ProfileService] Publishing profile to HCS:', profileTopic)
          
          // Submit to HCS (this should return sequence number in real implementation)
          await hederaClient.submitMessage(profileTopic, JSON.stringify(envelope))
          
          // For demo, use timestamp as sequence
          seq = Date.now()
          hrl = this.generateValidHRL(profileTopic, seq)
          
          console.log('[ProfileService] Profile published with HRL:', hrl)
          
          // Clear error cache on success
          this.errorCache.delete('profile_publish')
          
        } catch (error) {
          console.error('[ProfileService] Failed to publish profile:', error)
          // Cache the error
          this.errorCache.set('profile_publish', { error: error as Error, ts: Date.now() })
          // Fall back to local mode
        }
      } else {
        console.log('[ProfileService] HCS disabled, using local profile')
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
      handle: "alice_dev",
      bio: "TrustMesh demo user",
      visibility: "public",
      location: "Demo City"
    }

    console.log('[ProfileService] Creating fresh profile')
    const { seq, hrl } = await this.publishProfileUpdate(defaultProfile)
    
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