import { hcsLogger } from "@/packages/hedera/HCSLogger"
import { hederaClient } from "@/packages/hedera/HederaClient"
import type { SignalEvent } from "@/lib/stores/signalsStore"

export type HCSFeedEvent = {
  id: string
  type: "contact_request" | "contact_accept" | "trust_allocate" | "trust_revoke" | "recognition_mint" | "system_update"
  timestamp: string
  actor: string
  target?: string
  metadata: {
    handle?: string
    name?: string
    weight?: number
    category?: string
    description?: string
    rarity?: string
    topicId?: string
    explorerUrl?: string
  }
  status: "onchain" | "local" | "error"
  direction: "inbound" | "outbound"
  topicId: string
  sequenceNumber?: number
}

export class HCSFeedService {
  private feedTopicId: string | null = null
  private contactsTopicId: string | null = null
  private trustTopicId: string | null = null
  private recognitionTopicId: string | null = null
  private profileTopicId: string | null = null
  private systemTopicId: string | null = null
  private isSeeded: boolean = false
  private demoUsers: string[] = [
    'tm-alice47',
    'tm-bob23k', 
    'tm-carol91',
    'tm-dave15x',
    'tm-eve88y',
    'tm-frank12'
  ]

  async initialize(): Promise<void> {
    console.log("[HCSFeedService] Initializing HCS feed topics...")

    if (!hederaClient.isReady()) {
      await hederaClient.initialize()
    }

    // Create dedicated topics for each feed category
    const feedTopic = await hederaClient.createHCS10Topic(
      "TrustMesh Activity Feed",
      "Real-time activity feed for all TrustMesh interactions"
    )
    this.feedTopicId = feedTopic.topicId

    const contactsTopic = await hederaClient.createHCS10Topic(
      "TrustMesh Contacts",
      "Contact requests, accepts, and bond management"
    )
    this.contactsTopicId = contactsTopic.topicId

    const trustTopic = await hederaClient.createHCS10Topic(
      "TrustMesh Trust Signals",
      "Trust allocation, adjustments, and revocations"
    )
    this.trustTopicId = trustTopic.topicId

    const recognitionTopic = await hederaClient.createHCS10Topic(
      "TrustMesh Recognition",
      "Recognition signals and achievement minting"
    )
    this.recognitionTopicId = recognitionTopic.topicId

    const profileTopic = await hederaClient.createHCS10Topic(
      "TrustMesh Profiles",
      "User profiles and session management"
    )
    this.profileTopicId = profileTopic.topicId

    const systemTopic = await hederaClient.createHCS10Topic(
      "TrustMesh System",
      "System announcements and platform updates"
    )
    this.systemTopicId = systemTopic.topicId

    console.log("[HCSFeedService] All feed topics created successfully")
    await this.seedInitialData()
  }

  private async seedInitialData(): Promise<void> {
    // Only seed if enabled and not already seeded
    const flags = await this.getRuntimeFlags()
    if (!flags.seedOn || flags.isLiveMode || this.isSeeded) {
      return
    }

    console.log("[HCSFeedService] Seeding comprehensive demo data to HCS...")
    const currentSessionId = await this.getCurrentSessionId()
    
    try {
      // Clear any existing local data first
      await this.clearAllHCSData()
      
      // Seed complete demo dataset to HCS
      await this.seedComprehensiveDemoData(currentSessionId)
      
      this.isSeeded = true
      console.log("[HCSFeedService] Comprehensive demo data seeded successfully")
    } catch (error) {
      console.error("[HCSFeedService] Failed to seed demo data:", error)
    }
  }

  async logContactRequest(from: string, to: string, fromName?: string, toName?: string): Promise<HCSFeedEvent> {
    const eventId = `contact_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const event: HCSFeedEvent = {
      id: eventId,
      type: "contact_request",
      timestamp: new Date().toISOString(),
      actor: from,
      target: to,
      metadata: {
        handle: fromName,
        name: toName,
        topicId: this.contactsTopicId!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.contactsTopicId}`
      },
      status: "local",
      direction: "outbound",
      topicId: this.contactsTopicId!,
    }

    try {
      await hederaClient.submitMessage(this.contactsTopicId!, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId!, JSON.stringify(event))
      event.status = "onchain"
      console.log(`[HCSFeedService] Contact request logged: ${from} → ${to}`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log contact request:`, error)
      event.status = "error"
    }

    return event
  }

  async logContactAccept(from: string, to: string, fromName?: string, toName?: string): Promise<HCSFeedEvent> {
    const eventId = `contact_acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const event: HCSFeedEvent = {
      id: eventId,
      type: "contact_accept",
      timestamp: new Date().toISOString(),
      actor: from,
      target: to,
      metadata: {
        handle: fromName,
        name: toName,
        topicId: this.contactsTopicId!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.contactsTopicId}`
      },
      status: "local",
      direction: "outbound",
      topicId: this.contactsTopicId!,
    }

    try {
      await hederaClient.submitMessage(this.contactsTopicId!, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId!, JSON.stringify(event))
      event.status = "onchain"
      console.log(`[HCSFeedService] Contact accepted: ${from} → ${to}`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log contact accept:`, error)
      event.status = "error"
    }

    return event
  }

  async logTrustAllocation(from: string, to: string, weight: number, reason?: string): Promise<HCSFeedEvent> {
    const eventId = `trust_alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const event: HCSFeedEvent = {
      id: eventId,
      type: "trust_allocate",
      timestamp: new Date().toISOString(),
      actor: from,
      target: to,
      metadata: {
        weight,
        description: reason,
        topicId: this.trustTopicId!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.trustTopicId}`
      },
      status: "local",
      direction: "outbound",
      topicId: this.trustTopicId!,
    }

    try {
      await hederaClient.submitMessage(this.trustTopicId!, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId!, JSON.stringify(event))
      await hcsLogger.logTrustTokenIssued("trust", from, to, eventId, weight, reason)
      event.status = "onchain"
      console.log(`[HCSFeedService] Trust allocated: ${from} → ${to} (${weight})`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log trust allocation:`, error)
      event.status = "error"
    }

    return event
  }

  async logTrustRevocation(from: string, to: string, reason?: string): Promise<HCSFeedEvent> {
    const eventId = `trust_rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const event: HCSFeedEvent = {
      id: eventId,
      type: "trust_revoke",
      timestamp: new Date().toISOString(),
      actor: from,
      target: to,
      metadata: {
        description: reason,
        topicId: this.trustTopicId!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.trustTopicId}`
      },
      status: "local",
      direction: "outbound",
      topicId: this.trustTopicId!,
    }

    try {
      await hederaClient.submitMessage(this.trustTopicId!, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId!, JSON.stringify(event))
      await hcsLogger.logTrustTokenRevoked("trust", from, to, eventId, reason)
      event.status = "onchain"
      console.log(`[HCSFeedService] Trust revoked: ${from} → ${to}`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log trust revocation:`, error)
      event.status = "error"
    }

    return event
  }

  async logRecognitionMint(from: string, to: string, name: string, description: string, category: string): Promise<HCSFeedEvent> {
    const eventId = `recognition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const event: HCSFeedEvent = {
      id: eventId,
      type: "recognition_mint",
      timestamp: new Date().toISOString(),
      actor: from,
      target: to,
      metadata: {
        name,
        description,
        category,
        rarity: Math.random() > 0.7 ? "rare" : "common",
        topicId: this.recognitionTopicId!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.recognitionTopicId}`
      },
      status: "local",
      direction: "outbound",
      topicId: this.recognitionTopicId!,
    }

    try {
      await hederaClient.submitMessage(this.recognitionTopicId!, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId!, JSON.stringify(event))
      event.status = "onchain"
      console.log(`[HCSFeedService] Recognition minted: ${name} for ${to}`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log recognition:`, error)
      event.status = "error"
    }

    return event
  }

  // Convert HCSFeedEvent to SignalEvent format for existing components
  private hcsEventToSignalEvent(hcsEvent: HCSFeedEvent): SignalEvent {
    let signalType: SignalEvent['type']
    let signalClass: SignalEvent['class']

    switch (hcsEvent.type) {
      case "contact_request":
        signalType = "CONTACT_REQUEST"
        signalClass = "contact"
        break
      case "contact_accept":
        signalType = "CONTACT_ACCEPT"
        signalClass = "contact"
        break
      case "trust_allocate":
        signalType = "TRUST_ALLOCATE"
        signalClass = "trust"
        break
      case "trust_revoke":
        signalType = "TRUST_REVOKE"
        signalClass = "trust"
        break
      case "recognition_mint":
        signalType = "NFT_MINT"
        signalClass = "recognition"
        break
      default:
        signalType = "SYSTEM_UPDATE"
        signalClass = "system"
    }

    return {
      id: hcsEvent.id,
      type: signalType,
      class: signalClass,
      status: hcsEvent.status,
      direction: hcsEvent.direction,
      ts: new Date(hcsEvent.timestamp).getTime(),
      actors: {
        from: hcsEvent.actor,
        to: hcsEvent.target
      },
      payload: {
        handle: hcsEvent.metadata.handle,
        name: hcsEvent.metadata.name,
        weight: hcsEvent.metadata.weight,
        category: hcsEvent.metadata.category,
        description: hcsEvent.metadata.description,
        explorerUrl: hcsEvent.metadata.explorerUrl
      },
      topicType: this.getTopicTypeFromId(hcsEvent.topicId)
    }
  }

  private getTopicTypeFromId(topicId: string): "CONTACT" | "TRUST" | "SIGNAL" | "PROFILE" {
    if (topicId === this.contactsTopicId) return "CONTACT"
    if (topicId === this.trustTopicId) return "TRUST"  
    if (topicId === this.recognitionTopicId) return "SIGNAL"
    return "PROFILE"
  }

  async getAllFeedEvents(): Promise<SignalEvent[]> {
    if (!this.feedTopicId) {
      await this.initialize()
    }

    // In a real implementation, this would query HCS topics for messages
    // For now, we'll simulate by returning the seeded data
    const mockEvents: HCSFeedEvent[] = [
      {
        id: "contact_req_1",
        type: "contact_request", 
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        actor: "alice.hey",
        target: "bob.hey",
        metadata: { handle: "Alice Chen", name: "Bob Wilson", explorerUrl: `https://hashscan.io/testnet/topic/${this.contactsTopicId}` },
        status: "onchain",
        direction: "outbound",
        topicId: this.contactsTopicId!
      },
      {
        id: "contact_acc_1",
        type: "contact_accept",
        timestamp: new Date(Date.now() - 3000000).toISOString(), // 50 min ago
        actor: "bob.hey", 
        target: "alice.hey",
        metadata: { handle: "Bob Wilson", name: "Alice Chen", explorerUrl: `https://hashscan.io/testnet/topic/${this.contactsTopicId}` },
        status: "onchain",
        direction: "inbound",
        topicId: this.contactsTopicId!
      },
      {
        id: "trust_alloc_1",
        type: "trust_allocate",
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        actor: "alice.hey",
        target: "bob.hey", 
        metadata: { weight: 5, description: "Great collaboration on hackathon", explorerUrl: `https://hashscan.io/testnet/topic/${this.trustTopicId}` },
        status: "onchain",
        direction: "outbound",
        topicId: this.trustTopicId!
      },
      {
        id: "recognition_1",
        type: "recognition_mint",
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        actor: "bob.hey",
        target: "alice.hey",
        metadata: { 
          name: "Code Wizard", 
          description: "Exceptional coding skills demonstrated",
          category: "academic",
          rarity: "rare",
          explorerUrl: `https://hashscan.io/testnet/topic/${this.recognitionTopicId}`
        },
        status: "onchain",
        direction: "inbound", 
        topicId: this.recognitionTopicId!
      },
      {
        id: "contact_req_2",
        type: "contact_request",
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
        actor: "charlie.hey",
        target: "alice.hey",
        metadata: { handle: "Charlie Kim", name: "Alice Chen", explorerUrl: `https://hashscan.io/testnet/topic/${this.contactsTopicId}` },
        status: "onchain", 
        direction: "inbound",
        topicId: this.contactsTopicId!
      },
      {
        id: "trust_alloc_2",
        type: "trust_allocate",
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        actor: "alice.hey",
        target: "charlie.hey",
        metadata: { weight: 3, description: "Good communication skills", explorerUrl: `https://hashscan.io/testnet/topic/${this.trustTopicId}` },
        status: "local", // Still processing
        direction: "outbound",
        topicId: this.trustTopicId!
      }
    ]

    return mockEvents.map(event => this.hcsEventToSignalEvent(event))
  }

  async getEventsByTopic(topicType: "contacts" | "trust" | "recognition"): Promise<SignalEvent[]> {
    const allEvents = await this.getAllFeedEvents()
    return allEvents.filter(event => {
      switch (topicType) {
        case "contacts": return event.class === "contact"
        case "trust": return event.class === "trust"  
        case "recognition": return event.class === "recognition"
        default: return false
      }
    })
  }

  async retryFailedEvent(eventId: string): Promise<boolean> {
    console.log(`[HCSFeedService] Retrying failed event: ${eventId}`)
    // In real implementation, would resubmit the event to HCS
    // For demo, we'll simulate success after delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    return true
  }

  isReady(): boolean {
    return this.feedTopicId !== null
  }

  getTopicIds() {
    return {
      feed: this.feedTopicId,
      contacts: this.contactsTopicId,  
      trust: this.trustTopicId,
      recognition: this.recognitionTopicId,
      profile: this.profileTopicId,
      system: this.systemTopicId
    }
  }

  // === COMPREHENSIVE DEMO DATA METHODS ===
  
  private async getRuntimeFlags() {
    // Import getRuntimeFlags dynamically to avoid circular deps
    const { getRuntimeFlags } = await import('../runtimeFlags')
    return getRuntimeFlags()
  }

  private async getCurrentSessionId() {
    // Import getSessionId dynamically to avoid circular deps
    const { getSessionId } = await import('../session')
    return getSessionId()
  }

  private async seedComprehensiveDemoData(sessionId: string): Promise<void> {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const hour = 60 * 60 * 1000

    // === BONDED CONTACTS SEQUENCE ===
    
    // Alice Chen - 3 days ago request → accept → trust allocation
    await this.logContactRequest(this.demoUsers[0], sessionId, "Alice Chen", "You")
    await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
    await this.logContactAccept(sessionId, this.demoUsers[0], "You", "Alice Chen")
    await new Promise(resolve => setTimeout(resolve, 100))
    await this.logTrustAllocation(sessionId, this.demoUsers[0], 3, "Excellent code reviews and collaboration")

    // Bob Martinez - 2 days ago request → accept → trust allocation  
    await this.logContactRequest(this.demoUsers[1], sessionId, "Bob Martinez", "You")
    await new Promise(resolve => setTimeout(resolve, 100))
    await this.logContactAccept(sessionId, this.demoUsers[1], "You", "Bob Martinez")
    await new Promise(resolve => setTimeout(resolve, 100))
    await this.logTrustAllocation(sessionId, this.demoUsers[1], 2, "Great UX feedback and design insights")

    // Carol Wang - 1 day ago request → accept → inbound trust
    await this.logContactRequest(this.demoUsers[2], sessionId, "Carol Wang", "You")
    await new Promise(resolve => setTimeout(resolve, 100))
    await this.logContactAccept(sessionId, this.demoUsers[2], "You", "Carol Wang")
    await new Promise(resolve => setTimeout(resolve, 100))
    await this.logTrustAllocation(this.demoUsers[2], sessionId, 1, "Helpful technical insights")

    // === PENDING CONTACT REQUESTS ===
    
    // Dave Kim - 2 hours ago, pending
    await this.logContactRequest(this.demoUsers[3], sessionId, "Dave Kim", "You")
    
    // Outgoing to Eve Thompson - 30 minutes ago, waiting for response
    await this.logContactRequest(sessionId, this.demoUsers[4], "You", "Eve Thompson")

    // === RECOGNITION SIGNALS (HASHINALS) ===
    
    await this.logRecognitionMint("system-issuer", sessionId, "Community Leader", "Organized 5+ blockchain meetups", "social")
    await this.logRecognitionMint("ethereum-foundation", sessionId, "Solidity Expert", "Advanced smart contract certification", "academic") 
    await this.logRecognitionMint("tech-skills-dao", sessionId, "Full-Stack Developer", "3+ years React & Node.js experience", "professional")

    // === SYSTEM ANNOUNCEMENTS ===
    
    await this.logSystemAnnouncement("platform_update", "TrustMesh network now supports instant settlements", "v2.1.0")
    
    // === NETWORK ACTIVITY (peer-to-peer) ===
    
    await this.logTrustAllocation(this.demoUsers[4], this.demoUsers[5], 1, "First collaboration on hackathon project")
    
    console.log("[HCSFeedService] Seeded comprehensive demo data with realistic interaction flows")
  }

  async logSystemAnnouncement(type: string, message: string, version?: string): Promise<HCSFeedEvent> {
    const eventId = `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const event: HCSFeedEvent = {
      id: eventId,
      type: "system_update",
      timestamp: new Date().toISOString(),
      actor: "system",
      target: "all",
      metadata: {
        description: message,
        category: type,
        name: version,
        topicId: this.systemTopicId!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.systemTopicId}`
      },
      status: "local",
      direction: "inbound",
      topicId: this.systemTopicId!,
    }

    try {
      await hederaClient.submitMessage(this.systemTopicId!, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId!, JSON.stringify(event))
      event.status = "onchain"
      console.log(`[HCSFeedService] System announcement logged: ${message}`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log system announcement:`, error)
      event.status = "error"
    }

    return event
  }

  async clearAllHCSData(): Promise<void> {
    console.log("[HCSFeedService] Clearing all HCS demo data...")
    // Note: In a real implementation, you'd need to track message IDs to mark them as deleted
    // For demo purposes, we'll just reset the seeded flag and let new data overwrite old
    this.isSeeded = false
  }

  async enableSeedMode(): Promise<void> {
    console.log("[HCSFeedService] Enabling seed mode - will seed HCS data...")
    this.isSeeded = false
    await this.initialize() // This will trigger seeding
  }

  async disableSeedMode(): Promise<void> {
    console.log("[HCSFeedService] Disabling seed mode - clearing HCS data...")
    await this.clearAllHCSData()
  }

  async resetDemo(): Promise<void> {
    console.log("[HCSFeedService] Resetting complete demo...")
    await this.clearAllHCSData()
    
    // Reset topic IDs to force re-creation
    this.feedTopicId = null
    this.contactsTopicId = null
    this.trustTopicId = null
    this.recognitionTopicId = null
    this.profileTopicId = null
    this.systemTopicId = null
    this.isSeeded = false
  }
}

export const hcsFeedService = new HCSFeedService()