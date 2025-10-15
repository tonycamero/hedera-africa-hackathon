import { hederaClient } from '@/packages/hedera/HederaClient'

export interface ProfileData {
  handle: string
  bio?: string
  skills?: string[]
  location?: string
  avatar?: string
  website?: string
  github?: string
  twitter?: string
  discord?: string
  email?: string
  verified?: boolean
  reputation?: number
  joinedAt?: number
}


class ProfileService {
  private profileCache: Map<string, ProfileData> = new Map()
  
  // Fetch profile from HCS-11 topic or HRL
  async fetchProfile(profileIdOrHrl: string): Promise<ProfileData | null> {
    // Check cache first
    if (this.profileCache.has(profileIdOrHrl)) {
      return this.profileCache.get(profileIdOrHrl)!
    }
    
    // Fetch from HCS-11 topic
    if (process.env.NEXT_PUBLIC_HCS_ENABLED === 'true') {
      try {
        // TODO: Implement actual HCS-11 profile fetching
        // const messages = await hederaClient.getTopicMessages(PROFILE_TOPIC_ID)
        // const profileMessage = messages.find(msg => msg.profileId === profileId)
        // return profileMessage ? JSON.parse(profileMessage.contents) : null
        console.log(`[ProfileService] HCS-11 profile fetching not yet implemented for ${profileIdOrHrl}`)
        return null
      } catch (error) {
        console.error(`[ProfileService] Error fetching profile ${profileIdOrHrl}:`, error)
        return null
      }
    }
    
    return null
  }
  
  // Get profile data synchronously from cache (for UI rendering)
  getProfileSync(profileIdOrHrl: string): ProfileData | null {
    return this.profileCache.get(profileIdOrHrl) || null
  }
  
  // Cache profile data
  cacheProfile(profileId: string, profile: ProfileData): void {
    this.profileCache.set(profileId, profile)
  }
  
  // Clear profile cache
  clearCache(): void {
    this.profileCache.clear()
  }
}

export const profileService = new ProfileService()
