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

// HRL-based demo profiles (maps to actual HCS-11 sequence numbers from seed data)
const HRL_DEMO_PROFILES: Record<string, ProfileData> = {
  // Alice Chen - hcs://11/0.0.6889641/42
  'hcs://11/0.0.6889641/42': {
    handle: 'Alice Chen',
    bio: 'Blockchain developer & DeFi enthusiast. Building the future of finance one smart contract at a time.',
    skills: ['Solidity', 'React', 'Node.js', 'TypeScript', 'DeFi Protocols'],
    location: 'San Francisco, CA',
    avatar: '👩‍💻',
    website: 'alicechen.dev',
    github: 'alice-crypto-dev',
    twitter: 'alice_builds',
    verified: true,
    reputation: 4.8,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 180 // 6 months ago
  },
  
  // Bob Martinez - hcs://11/0.0.6889641/58
  'hcs://11/0.0.6889641/58': {
    handle: 'Bob Martinez',
    bio: 'UI/UX Designer specializing in Web3 applications. Making crypto accessible through great design.',
    skills: ['Figma', 'Design Systems', 'Frontend', 'User Research', 'Prototyping'],
    location: 'Austin, TX',
    avatar: '🎨',
    website: 'bobmartinez.design',
    github: 'bob-web3-design',
    discord: 'bob#1234',
    verified: true,
    reputation: 4.6,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 120 // 4 months ago
  },
  
  // Carol Wang - hcs://11/0.0.6889641/91
  'hcs://11/0.0.6889641/91': {
    handle: 'Carol Wang',
    bio: 'DeFi trader and yield farming strategist. Alpha seeker and risk management expert.',
    skills: ['Trading', 'DeFi Protocols', 'Analytics', 'Risk Management', 'MEV'],
    location: 'Singapore',
    avatar: '📊',
    twitter: 'carol_defi_alpha',
    discord: 'carol.eth#5678',
    verified: true,
    reputation: 4.7,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 90 // 3 months ago
  },
  
  // Dave Kim - hcs://11/0.0.6889641/123
  'hcs://11/0.0.6889641/123': {
    handle: 'Dave Kim',
    bio: 'Digital artist creating NFT collections. Bridging traditional art with blockchain technology.',
    skills: ['Digital Art', 'NFTs', 'Photoshop', 'Blender', 'Creative Direction'],
    location: 'Seoul, South Korea',
    avatar: '🎭',
    website: 'davekim.art',
    twitter: 'dave_nft_artist',
    verified: false,
    reputation: 4.2,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 60 // 2 months ago
  }
}

// Legacy user ID profiles (for backwards compatibility)
const DEMO_PROFILES: Record<string, ProfileData> = {
  'tm-alice47': HRL_DEMO_PROFILES['hcs://11/0.0.6889641/42'],
  'tm-bob23k': HRL_DEMO_PROFILES['hcs://11/0.0.6889641/58'],
  'tm-carol91': HRL_DEMO_PROFILES['hcs://11/0.0.6889641/91'],
  'tm-dave15x': HRL_DEMO_PROFILES['hcs://11/0.0.6889641/123'],
  'tm-eve88y': {
    handle: 'Eve Thompson',
    bio: 'DAO governance expert and community builder. Passionate about decentralized decision making.',
    skills: ['Governance', 'Community Management', 'Strategy', 'Token Economics', 'Facilitation'],
    location: 'London, UK',
    avatar: '🏛️',
    website: 'evethompson.eth',
    github: 'eve-dao-tools',
    twitter: 'eve_dao_gov',
    discord: 'eve.eth#9999',
    verified: true,
    reputation: 4.9,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 200 // 7+ months ago
  },
  'tm-frank12': {
    handle: 'Frank Wilson',
    bio: 'Smart contract security auditor. Finding bugs before they find users.',
    skills: ['Security Auditing', 'Solidity', 'Formal Verification', 'Bug Bounties', 'Code Review'],
    location: 'Toronto, Canada',
    avatar: '🔒',
    website: 'frankwilson.security',
    github: 'frank-security-audit',
    twitter: 'frank_audits',
    verified: true,
    reputation: 5.0,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 300 // 10 months ago
  }
}

class ProfileService {
  private profileCache: Map<string, ProfileData> = new Map()
  
  // Fetch profile from HCS-11 topic or HRL
  async fetchProfile(profileIdOrHrl: string): Promise<ProfileData | null> {
    // Check cache first
    if (this.profileCache.has(profileIdOrHrl)) {
      return this.profileCache.get(profileIdOrHrl)!
    }
    
    // Check HRL-based demo profiles first
    if (HRL_DEMO_PROFILES[profileIdOrHrl]) {
      const profile = HRL_DEMO_PROFILES[profileIdOrHrl]
      this.profileCache.set(profileIdOrHrl, profile)
      return profile
    }
    
    // Fall back to legacy user ID profiles
    if (DEMO_PROFILES[profileIdOrHrl]) {
      const profile = DEMO_PROFILES[profileIdOrHrl]
      this.profileCache.set(profileIdOrHrl, profile)
      return profile
    }
    
    // In production, this would fetch from HCS-11 topic
    if (process.env.NEXT_PUBLIC_HCS_ENABLED === 'true') {
      try {
        // TODO: Implement actual HCS-11 profile fetching
        // const messages = await hederaClient.getTopicMessages(PROFILE_TOPIC_ID)
        // const profileMessage = messages.find(msg => msg.profileId === profileId)
        // return profileMessage ? JSON.parse(profileMessage.contents) : null
        console.log(`[ProfileService] Would fetch HCS-11 profile for ${profileIdOrHrl}`)
        return null
      } catch (error) {
        console.error(`[ProfileService] Error fetching profile ${profileIdOrHrl}:`, error)
        return null
      }
    }
    
    // Fallback to basic profile
    return {
      handle: `User ${profileIdOrHrl.slice(-6)}`,
      bio: 'Web3 enthusiast',
      verified: false
    }
  }
  
  // Get profile data synchronously from cache (for UI rendering)
  getProfileSync(profileIdOrHrl: string): ProfileData | null {
    return this.profileCache.get(profileIdOrHrl) || 
           HRL_DEMO_PROFILES[profileIdOrHrl] || 
           DEMO_PROFILES[profileIdOrHrl] || 
           null
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
export { HRL_DEMO_PROFILES }
