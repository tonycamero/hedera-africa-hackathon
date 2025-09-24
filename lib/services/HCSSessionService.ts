import { hederaClient } from "@/packages/hedera/HederaClient"
import { hcsFeedService } from "./HCSFeedService"

export interface HCSSessionProfile {
  sessionId: string
  handle: string
  profileHrl: string
  bio?: string
  visibility: 'public' | 'private'
  createdAt: string
  topicId: string
}

export class HCSSessionService {
  private profilesTopicId: string | null = null
  private sessionProfiles: Map<string, HCSSessionProfile> = new Map()

  async initialize(): Promise<void> {
    if (!hederaClient.isReady()) {
      await hederaClient.initialize()
    }

    // Get profile topic from HCS feed service or create one
    const topicIds = hcsFeedService.getTopicIds()
    if (topicIds.profile) {
      this.profilesTopicId = topicIds.profile
    } else {
      const profileTopic = await hederaClient.createHCS10Topic(
        "TrustMesh User Profiles",
        "User profiles and session data stored on HCS"
      )
      this.profilesTopicId = profileTopic.topicId
    }

    console.log(`[HCSSessionService] Initialized with profile topic: ${this.profilesTopicId}`)
  }

  async createOrUpdateProfile(sessionId: string, handle?: string, bio?: string): Promise<HCSSessionProfile> {
    if (!this.profilesTopicId) {
      await this.initialize()
    }

    const profile: HCSSessionProfile = {
      sessionId,
      handle: handle || sessionId.toUpperCase(),
      profileHrl: `hcs://11/${this.profilesTopicId}/${sessionId}`,
      bio: bio || `TrustMesh user (${sessionId})`,
      visibility: 'public',
      createdAt: new Date().toISOString(),
      topicId: this.profilesTopicId!
    }

    try {
      // Store profile in HCS
      await hederaClient.submitMessage(this.profilesTopicId!, JSON.stringify(profile))
      
      // Cache locally for faster access
      this.sessionProfiles.set(sessionId, profile)
      
      console.log(`[HCSSessionService] Profile created/updated for ${sessionId}`)
      return profile
    } catch (error) {
      console.error(`[HCSSessionService] Failed to store profile:`, error)
      
      // Return profile anyway, even if HCS storage failed
      this.sessionProfiles.set(sessionId, profile)
      return profile
    }
  }

  async getProfile(sessionId: string): Promise<HCSSessionProfile | null> {
    // Check cache first
    const cached = this.sessionProfiles.get(sessionId)
    if (cached) {
      return cached
    }

    // In a real implementation, you'd query HCS topic for the profile
    // For now, create a default profile
    return await this.createOrUpdateProfile(sessionId)
  }

  async getAllProfiles(): Promise<HCSSessionProfile[]> {
    // In a real implementation, you'd query the HCS topic for all profiles
    // For now, return cached profiles
    return Array.from(this.sessionProfiles.values())
  }

  getProfileTopicId(): string | null {
    return this.profilesTopicId
  }

  isReady(): boolean {
    return this.profilesTopicId !== null
  }
}

export const hcsSessionService = new HCSSessionService()