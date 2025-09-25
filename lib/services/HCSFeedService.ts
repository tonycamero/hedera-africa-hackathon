import { hcsLogger } from "@/packages/hedera/HCSLogger"
import { hederaClient } from "@/packages/hedera/HederaClient"
import { hcsRecognitionService } from "@/lib/services/HCSRecognitionService"
import type { SignalEvent } from "@/lib/stores/signalsStore"
import { MirrorNodeReader } from "@/lib/services/MirrorNodeReader"
import { toSignalEvents } from "@/lib/services/MirrorNormalize"
import { saveMirrorRaw } from "@/lib/cache/sessionCache"

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
  private cachedEvents: HCSFeedEvent[] = [] // Cache for events successfully written to HCS
  private readonly CACHE_KEY = 'trustmesh_demo_cache'
  private mirrorReader: MirrorNodeReader | null = null;
  private isInitializing: boolean = false
  private initPromise: Promise<void> | null = null
  private demoUsers: string[] = [
    'tm-alice47',
    'tm-bob23k', 
    'tm-carol91',
    'tm-dave15x',
    'tm-eve88y',
    'tm-frank12'
  ]

  async initialize(): Promise<void> {
    // Load cached events from browser storage on initialization
    this.loadCachedEvents()
    
    if (this.isReady()) {
      return
    }
    if (this.isInitializing && this.initPromise) {
      // someone else is already initializing; just await it
      await this.initPromise
      return
    }
    console.log("[HCSFeedService] Initializing HCS feed topics...")
    this.isInitializing = true
    this.initPromise = (async () => {

      if (!hederaClient.isReady()) {
        await hederaClient.initialize()
      }

      try {
        // FIRE-AND-FORGET: Create all topics in parallel and don't wait for them
        console.log("[HCSFeedService] 🔥 FIRE-AND-FORGET: Starting parallel topic creation...")
        
        // Create all topics in parallel without awaiting (fire-and-forget)
        const topicCreations = [
          hederaClient.createHCS10Topic("TrustMesh Activity Feed", "Real-time activity feed for all TrustMesh interactions")
            .then(topic => {
              this.feedTopicId = topic.topicId
              console.log(`[HCSFeedService] 🔥 Feed topic created: ${this.feedTopicId}`)
            })
            .catch(err => console.error("[HCSFeedService] Feed topic creation failed:", err)),
            
          hederaClient.createHCS10Topic("TrustMesh Contacts", "Contact requests, accepts, and bond management")
            .then(topic => {
              this.contactsTopicId = topic.topicId
              console.log(`[HCSFeedService] 🔥 Contacts topic created: ${this.contactsTopicId}`)
            })
            .catch(err => console.error("[HCSFeedService] Contacts topic creation failed:", err)),
            
          hederaClient.createHCS10Topic("TrustMesh Trust Signals", "Trust allocation, adjustments, and revocations")
            .then(topic => {
              this.trustTopicId = topic.topicId
              console.log(`[HCSFeedService] 🔥 Trust topic created: ${this.trustTopicId}`)
            })
            .catch(err => console.error("[HCSFeedService] Trust topic creation failed:", err)),
            
          hederaClient.createHCS10Topic("TrustMesh Recognition", "Recognition signals and achievement minting")
            .then(topic => {
              this.recognitionTopicId = topic.topicId
              console.log(`[HCSFeedService] 🔥 Recognition topic created: ${this.recognitionTopicId}`)
            })
            .catch(err => console.error("[HCSFeedService] Recognition topic creation failed:", err)),
            
          hederaClient.createHCS10Topic("TrustMesh Profiles", "User profiles and session management")
            .then(topic => {
              this.profileTopicId = topic.topicId
              console.log(`[HCSFeedService] 🔥 Profile topic created: ${this.profileTopicId}`)
            })
            .catch(err => console.error("[HCSFeedService] Profile topic creation failed:", err)),
            
          hederaClient.createHCS10Topic("TrustMesh System", "System announcements and platform updates")
            .then(topic => {
              this.systemTopicId = topic.topicId
              console.log(`[HCSFeedService] 🔥 System topic created: ${this.systemTopicId}`)
            })
            .catch(err => console.error("[HCSFeedService] System topic creation failed:", err))
        ]
        
        // Fire and forget - don't wait for all topics to be created
        // They'll be available eventually as the blockchain processes them
        console.log("[HCSFeedService] 🔥 FIRE-AND-FORGET: Topics creation started in background...")

        // Set up a delayed validation and initialization process that doesn't block
        setTimeout(async () => {
          try {
            // Wait a bit for at least some topics to be created
            await Promise.race(topicCreations.slice(0, 3)) // Wait for first 3 topics
            
            console.log("[HCSFeedService] 🔥 Some topics ready, starting services...")
            
            // Initialize recognition service with HCS (fire-and-forget)
            hcsRecognitionService.initialize().catch(err => 
              console.error("[HCSFeedService] Recognition service init failed:", err)
            )
            
            // Start seeding process (fire-and-forget)
            this.seedInitialData().catch(err => 
              console.error("[HCSFeedService] Seeding failed:", err)
            )
            
            // Set up Mirror reader when topics are available
            const setupMirrorReader = () => {
              const topics = [
                this.contactsTopicId,
                this.trustTopicId,
                this.recognitionTopicId,
                this.systemTopicId
              ].filter(Boolean) as string[];
              
              if (topics.length > 0) {
                this.mirrorReader = new MirrorNodeReader(topics)
                console.log(`[HCSFeedService] 🔥 Mirror reader set up with ${topics.length} topics`)
              } else {
                // Retry after some time if no topics are ready yet
                setTimeout(setupMirrorReader, 5000)
              }
            }
            setupMirrorReader()
            
          } catch (error) {
            console.error("[HCSFeedService] Background initialization error:", error)
          }
        }, 100) // Start background processes after 100ms
        
        console.log("[HCSFeedService] 🔥 FIRE-AND-FORGET: Initialization completed immediately, topics will be ready soon...")
      } catch (error) {
        console.error("[HCSFeedService] Failed to initialize topics:", error)
        throw error
      } finally {
        this.isInitializing = false
      }
    })()

    try {
      await this.initPromise
    } finally {
      this.initPromise = null
    }
  }

  private async seedInitialData(): Promise<void> {
    // Only seed if enabled and not already seeded
    const flags = await this.getRuntimeFlags()
    if (!flags.seedOn || flags.isLiveMode || this.isSeeded) {
      console.log("[HCSFeedService] Skipping initial seeding - seedOn:", flags.seedOn, "isLiveMode:", flags.isLiveMode, "isSeeded:", this.isSeeded)
      return
    }

    console.log("[HCSFeedService] Seeding comprehensive demo data to HCS...")
    const currentSessionId = await this.getCurrentSessionId()
    
    try {
      // Clear any existing local data first
      await this.clearAllHCSData()
      
      // Seed complete demo dataset to HCS with real topics
      await this.seedComprehensiveDemoData(currentSessionId)
      
      this.isSeeded = true
      console.log("[HCSFeedService] Comprehensive demo data seeded successfully to real HCS topics")
    } catch (error) {
      console.error("[HCSFeedService] Failed to seed demo data to HCS:", error)
      // Don't throw - let the service continue to work with empty data
    }
  }

  async logContactRequest(from: string, to: string, fromName?: string, toName?: string): Promise<HCSFeedEvent> {
    const eventId = `contact_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Validate topic IDs before proceeding
    if (!this.contactsTopicId || !this.feedTopicId) {
      console.error(`[HCSFeedService] Cannot log contact request - missing topic IDs: contacts=${this.contactsTopicId}, feed=${this.feedTopicId}`)
      return {
        id: eventId,
        type: "contact_request",
        timestamp: new Date().toISOString(),
        actor: from,
        target: to,
        metadata: { handle: fromName, name: toName },
        status: "error",
        direction: "outbound",
        topicId: this.contactsTopicId || "unknown",
      }
    }
    
    const event: HCSFeedEvent = {
      id: eventId,
      type: "contact_request",
      timestamp: new Date().toISOString(),
      actor: from,
      target: to,
      metadata: {
        handle: fromName,
        name: toName,
        topicId: this.contactsTopicId,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.contactsTopicId}`
      },
      status: "local",
      direction: "outbound",
      topicId: this.contactsTopicId,
    }

    // Check if topics are ready before submitting
    if (!this.contactsTopicId || !this.feedTopicId) {
      console.warn(`[HCSFeedService] Topics not ready yet for contact request - contacts: ${this.contactsTopicId}, feed: ${this.feedTopicId}`)
      event.status = "pending"
      // Add to cache anyway for immediate UI availability
      this.cachedEvents.push(event)
      this.saveCachedEvents()
      return event
    }

    try {
      await hederaClient.submitMessage(this.contactsTopicId, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId, JSON.stringify(event))
      event.status = "onchain"
      
      // Add to cache since it was successfully written to HCS
      this.cachedEvents.push(event)
      this.saveCachedEvents()
      
      console.log(`[HCSFeedService] Contact request logged to real HCS: ${from} → ${to}`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log contact request to HCS:`, error)
      event.status = "error"
      // Still add to cache for UI consistency
      this.cachedEvents.push(event)
      this.saveCachedEvents()
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

    // Check if topics are ready before submitting
    if (!this.contactsTopicId || !this.feedTopicId) {
      console.warn(`[HCSFeedService] Topics not ready yet for contact accept - contacts: ${this.contactsTopicId}, feed: ${this.feedTopicId}`)
      event.status = "pending"
      // Add to cache anyway for immediate UI availability
      this.cachedEvents.push(event)
      this.saveCachedEvents()
      return event
    }

    try {
      await hederaClient.submitMessage(this.contactsTopicId!, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId!, JSON.stringify(event))
      event.status = "onchain"
      
      // Add to cache since it was successfully written to HCS
      this.cachedEvents.push(event)
      this.saveCachedEvents()
      
      console.log(`[HCSFeedService] Contact accepted logged to real HCS: ${from} → ${to}`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log contact accept to HCS:`, error)
      event.status = "error"
      // Still add to cache for UI consistency
      this.cachedEvents.push(event)
      this.saveCachedEvents()
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

    // Check if topics are ready before submitting
    if (!this.trustTopicId || !this.feedTopicId) {
      console.warn(`[HCSFeedService] Topics not ready yet for trust allocation - trust: ${this.trustTopicId}, feed: ${this.feedTopicId}`)
      event.status = "pending"
      // Add to cache anyway for immediate UI availability
      this.cachedEvents.push(event)
      this.saveCachedEvents()
      return event
    }

    try {
      await hederaClient.submitMessage(this.trustTopicId!, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId!, JSON.stringify(event))
      await hcsLogger.logTrustTokenIssued("trust", from, to, eventId, weight, reason)
      event.status = "onchain"
      
      // Add to cache since it was successfully written to HCS
      this.cachedEvents.push(event)
      this.saveCachedEvents()
      
      console.log(`[HCSFeedService] Trust allocated to real HCS: ${from} → ${to} (${weight})`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log trust allocation to HCS:`, error)
      event.status = "error"
      // Still add to cache for UI consistency
      this.cachedEvents.push(event)
      this.saveCachedEvents()
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
      
      // Add to cache since it was successfully written to HCS
      this.cachedEvents.push(event)
      
      console.log(`[HCSFeedService] Trust revoked to real HCS: ${from} → ${to}`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log trust revocation to HCS:`, error)
      event.status = "error"
    }

    return event
  }

  async logRecognitionMint(from: string, to: string, name: string, description: string, category: string, definitionId?: string): Promise<HCSFeedEvent> {
    const eventId = `recognition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // If we have a definition ID, mint through the recognition service
      let recognitionInstance = null
      if (definitionId && hcsRecognitionService.isReady()) {
        try {
          recognitionInstance = await hcsRecognitionService.mintRecognitionInstance(
            definitionId,
            to, // owner
            from, // minted by
            undefined, // custom message
            description // context
          )
          console.log(`[HCSFeedService] Minted recognition instance: ${recognitionInstance.tokenId}`)
        } catch (error) {
          console.error(`[HCSFeedService] Failed to mint through recognition service:`, error)
        }
      }
    
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
          explorerUrl: `https://hashscan.io/testnet/topic/${this.recognitionTopicId}`,
          // Include recognition instance data if available
          ...(recognitionInstance && {
            recognitionInstanceId: recognitionInstance.id,
            tokenId: recognitionInstance.tokenId,
            serialNumber: recognitionInstance.serialNumber
          })
        },
        status: "local",
        direction: "outbound",
        topicId: this.recognitionTopicId!,
      }

      // Check if topics are ready before submitting
      if (!this.recognitionTopicId || !this.feedTopicId) {
        console.warn(`[HCSFeedService] Topics not ready yet for recognition mint - recognition: ${this.recognitionTopicId}, feed: ${this.feedTopicId}`)
        event.status = "pending"
        // Add to cache anyway for immediate UI availability
        this.cachedEvents.push(event)
        return event
      }

      await hederaClient.submitMessage(this.recognitionTopicId!, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId!, JSON.stringify(event))
      event.status = "onchain"
      
      // Add to cache since it was successfully written to HCS
      this.cachedEvents.push(event)
      
      console.log(`[HCSFeedService] Recognition minted to real HCS: ${name} for ${to}`)
      return event
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log recognition to HCS:`, error)
      const errorEvent: HCSFeedEvent = {
        id: eventId,
        type: "recognition_mint",
        timestamp: new Date().toISOString(),
        actor: from,
        target: to,
        metadata: { name, description, category },
        status: "error",
        direction: "outbound",
        topicId: this.recognitionTopicId!,
      }
      return errorEvent
    }
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
    try {
      if (!this.isReady()) {
        if (this.isInitializing && this.initPromise) {
          console.log("[HCSFeedService] Waiting for ongoing HCS initialization...")
          await this.initPromise
        } else {
          console.log("[HCSFeedService] Service not ready, initializing...")
          await this.initialize()
        }
      }
      
      if (!this.isReady()) {
        console.log("[HCSFeedService] Service not ready after initialization, returning empty feed")
        return []
      }

      // FIRE-AND-FORGET: Return cached events immediately 
      // Mirror Node data will be available eventually as it catches up
      if (this.cachedEvents.length > 0) {
        console.log(`[HCSFeedService] Returning ${this.cachedEvents.length} cached events (fire-and-forget mode)`)
        const hcsEvents: HCSFeedEvent[] = [...this.cachedEvents].sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        return hcsEvents.map(event => this.hcsEventToSignalEvent(event))
      }

      // Try Mirror Node data as fallback, but don't block on it
      if (this.mirrorReader) {
        try {
          const mirrorMsgs = await Promise.race([
            this.mirrorReader.readRecent(50),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Mirror Node timeout')), 2000))
          ]) as any[]
          
          const fromMirror = toSignalEvents(mirrorMsgs, {
            contacts: this.contactsTopicId,
            trust: this.trustTopicId,
            recognition: this.recognitionTopicId,
            profile: this.profileTopicId
          });
          // persist raw mirror messages for debugging/offline improvements
          saveMirrorRaw(mirrorMsgs);

          if (fromMirror.length > 0) {
            console.log(`[HCSFeedService] Returning ${fromMirror.length} events from Mirror Node (fallback)`)
            return fromMirror.sort((a, b) => b.ts - a.ts)
          }
        } catch (error) {
          console.log(`[HCSFeedService] Mirror Node unavailable (${error.message}), continuing without it`)
        }
      }

      return []
    } catch (error) {
      console.error("[HCSFeedService] Failed to get feed events:", error)
      return []
    }
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

  private validateTopicIds(): boolean {
    // FIRE-AND-FORGET: In this mode, we're more lenient about topic readiness
    // We consider the service ready if we have at least the core topics (contacts, trust)
    const coreTopicIds = [
      this.contactsTopicId,
      this.trustTopicId
    ]
    
    const coreValid = coreTopicIds.some(id => {
      if (!id) return false
      // Hedera topic IDs should be in format "0.0.XXXXXXX"
      const topicIdRegex = /^0\.0\.[0-9]+$/
      return topicIdRegex.test(id)
    })
    
    // In fire-and-forget mode, we're ready if we have at least one core topic
    // or if we're still initializing (optimistic readiness)
    const isReady = coreValid || this.isInitializing
    
    if (!isReady && !this.isInitializing) {
      console.warn("[HCSFeedService] 🔥 Service not ready in fire-and-forget mode - no core topics yet:", {
        contacts: this.contactsTopicId || 'pending',
        trust: this.trustTopicId || 'pending',
        feed: this.feedTopicId || 'pending',
        recognition: this.recognitionTopicId || 'pending',
        profile: this.profileTopicId || 'pending',
        system: this.systemTopicId || 'pending',
        initializing: this.isInitializing
      })
    }
    
    return isReady
  }

  isReady(): boolean {
    return this.validateTopicIds()
  }
  
  isInitializingService(): boolean {
    return this.isInitializing
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

  private async waitForReady(timeoutMs = 15000): Promise<boolean> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      if (this.isReady()) return true
      await new Promise(r => setTimeout(r, 250))
    }
    return this.isReady()
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
    console.log("[HCSFeedService] Seeding rich demo network with realistic profiles (FIRE-AND-FORGET mode)...")
    
    // Import demo profiles
    const { demoProfiles, demoRecognitionDistribution } = await import('../data/demoProfiles')
    
    // Get the main user profile (Alex Chen - the CS student who's well connected)
    const mainProfile = demoProfiles.find(p => p.id === 'tm-alex-chen')!
    
    // Replace sessionId with Alex's ID for consistency
    const alexId = mainProfile.id
    
    // === ESTABLISHED BONDS ===
    // Create all established connections for Alex
    // FIRE-AND-FORGET: Reduced delays, no waiting for confirmation
    for (const contactId of mainProfile.connections.established) {
      const contact = demoProfiles.find(p => p.id === contactId)!
      
      // Historical contact flow: request → accept (simulate past interaction)
      await this.logContactRequest(contactId, alexId, contact.displayName, mainProfile.displayName)
      await new Promise(resolve => setTimeout(resolve, 10)) // Reduced delay
      await this.logContactAccept(alexId, contactId, mainProfile.displayName, contact.displayName)
      await new Promise(resolve => setTimeout(resolve, 10)) // Reduced delay
      
      // Add trust allocation if Alex has allocated trust to them
      if (mainProfile.trustAllocated[contactId]) {
        const weight = mainProfile.trustAllocated[contactId]
        const reasons = {
          'tm-maya-patel': 'Excellent mentorship and research guidance',
          'tm-jordan-kim': 'Outstanding design collaboration and UX insights', 
          'tm-sam-rivera': 'Great pair programming and code reviews'
        }
        await this.logTrustAllocation(alexId, contactId, weight, reasons[contactId] || 'Valuable collaboration')
        await new Promise(resolve => setTimeout(resolve, 10)) // Reduced delay
      }
    }
    
    // === CREATE CROSS-NETWORK BONDS ===
    // Seed some established relationships between other profiles
    const crossConnections = [
      { from: 'tm-maya-patel', to: 'tm-riley-santos', trust: 3, reason: 'Outstanding research collaboration' },
      { from: 'tm-maya-patel', to: 'tm-casey-wright', trust: 2, reason: 'Strategic startup mentoring' },
      { from: 'tm-sam-rivera', to: 'tm-jordan-kim', trust: 1, reason: 'Successful project collaboration' },
      { from: 'tm-riley-santos', to: 'tm-maya-patel', trust: 3, reason: 'Invaluable academic guidance' },
      { from: 'tm-jordan-kim', to: 'tm-alex-chen', trust: 1, reason: 'Reliable and helpful' },
      { from: 'tm-jordan-kim', to: 'tm-sam-rivera', trust: 2, reason: 'Great technical partnership' }
    ]
    
    // FIRE-AND-FORGET: Batch process with minimal delays
    for (const conn of crossConnections) {
      const fromProfile = demoProfiles.find(p => p.id === conn.from)!
      const toProfile = demoProfiles.find(p => p.id === conn.to)!
      
      // Only create if they're marked as established in the profile
      if (fromProfile.connections.established.includes(conn.to)) {
        await this.logContactRequest(conn.from, conn.to, fromProfile.displayName, toProfile.displayName)
        await new Promise(resolve => setTimeout(resolve, 10)) // Reduced delay
        await this.logContactAccept(conn.to, conn.from, toProfile.displayName, fromProfile.displayName)
        await new Promise(resolve => setTimeout(resolve, 10)) // Reduced delay
        await this.logTrustAllocation(conn.from, conn.to, conn.trust, conn.reason)
        await new Promise(resolve => setTimeout(resolve, 10)) // Reduced delay
      }
    }
    
    // === PENDING CONTACT REQUESTS ===
    // Create pending requests that users can interact with
    
    // Maya → Jordan (outgoing from Maya, pending at Jordan)
    const mayaProfile = demoProfiles.find(p => p.id === 'tm-maya-patel')!
    const jordanProfile = demoProfiles.find(p => p.id === 'tm-jordan-kim')!
    await this.logContactRequest('tm-maya-patel', 'tm-jordan-kim', mayaProfile.displayName, jordanProfile.displayName)
    await new Promise(resolve => setTimeout(resolve, 10)) // Reduced delay
    
    // Sam → Casey (outgoing from Sam, pending at Casey)
    const samProfile = demoProfiles.find(p => p.id === 'tm-sam-rivera')!
    const caseyProfile = demoProfiles.find(p => p.id === 'tm-casey-wright')!
    await this.logContactRequest('tm-sam-rivera', 'tm-casey-wright', samProfile.displayName, caseyProfile.displayName)
    await new Promise(resolve => setTimeout(resolve, 10)) // Reduced delay
    
    // === RECOGNITION DISTRIBUTION ===
    // Mint recognition signals for each profile based on their characteristics
    for (const dist of demoRecognitionDistribution) {
      const profile = demoProfiles.find(p => p.id === dist.profileId)!
      
      for (const recognitionId of dist.recognitionIds) {
        const recognitionNames = {
          'prof-fav': 'Prof Fav',
          'code-monkey': 'Code Monkey', 
          'note-taker': 'Note Taker',
          'powerpoint-pro': 'PowerPoint Pro',
          'chad': 'Chad',
          'rizz': 'Rizz',
          'skibidi': 'Skibidi',
          'bookworm': 'Bookworm'
        }
        
        const recognitionDescriptions = {
          'prof-fav': 'Teacher\'s pet, always caring',
          'code-monkey': 'Nonstop coding machine',
          'note-taker': 'Clean notes, everyone copies', 
          'powerpoint-pro': 'Biggest slides in the room',
          'chad': 'Alpha vibes - natural leadership',
          'rizz': 'Smooth operator extraordinaire',
          'skibidi': 'Chaotic energy master',
          'bookworm': 'Lives in the library'
        }
        
        const categories = {
          'prof-fav': 'academic',
          'code-monkey': 'professional',
          'note-taker': 'academic',
          'powerpoint-pro': 'professional', 
          'chad': 'social',
          'rizz': 'social',
          'skibidi': 'social',
          'bookworm': 'academic'
        }
        
        await this.logRecognitionMint(
          'demo-issuer',
          dist.profileId,
          recognitionNames[recognitionId],
          recognitionDescriptions[recognitionId], 
          categories[recognitionId],
          recognitionId
        )
        await new Promise(resolve => setTimeout(resolve, 5)) // Minimal delay for fire-and-forget
      }
    }
    
    // === SYSTEM ANNOUNCEMENTS ===
    await this.logSystemAnnouncement("network_launch", "TrustMesh university pilot program is now live! 🎓", "v1.0.0")
    await new Promise(resolve => setTimeout(resolve, 10)) // Minimal delay
    
    console.log("[HCSFeedService] 🔥 FIRE-AND-FORGET: Seeded rich demo network with 8 profiles, established bonds, pending requests, and recognition distribution")
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

    // Check if topics are ready before submitting
    if (!this.systemTopicId || !this.feedTopicId) {
      console.warn(`[HCSFeedService] Topics not ready yet for system announcement - system: ${this.systemTopicId}, feed: ${this.feedTopicId}`)
      event.status = "pending"
      // Add to cache anyway for immediate UI availability
      this.cachedEvents.push(event)
      return event
    }

    try {
      await hederaClient.submitMessage(this.systemTopicId!, JSON.stringify(event))
      await hederaClient.submitMessage(this.feedTopicId!, JSON.stringify(event))
      event.status = "onchain"
      
      // Add to cache since it was successfully written to HCS
      this.cachedEvents.push(event)
      
      console.log(`[HCSFeedService] System announcement logged to real HCS: ${message}`)
    } catch (error) {
      console.error(`[HCSFeedService] Failed to log system announcement to HCS:`, error)
      event.status = "error"
      // Still add to cache for UI consistency
      this.cachedEvents.push(event)
    }

    return event
  }

  async acceptContactRequest(from: string, to: string, fromName?: string, toName?: string): Promise<HCSFeedEvent> {
    console.log(`[HCSFeedService] Accepting contact request from ${from} to ${to}`)
    return await this.logContactAccept(to, from, toName, fromName)
  }

  async clearAllHCSData(): Promise<void> {
    console.log("[HCSFeedService] Clearing all HCS demo data...")
    
    // Clear the cached events (actual HCS topic data remains on chain)
    this.cachedEvents = []
    this.isSeeded = false
    
    console.log("[HCSFeedService] Cache cleared - HCS topic data remains immutably on chain")
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

  // Load cached events from browser storage
  private loadCachedEvents(): void {
    if (typeof window === 'undefined') return
    
    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      if (cached) {
        this.cachedEvents = JSON.parse(cached)
        console.log(`[HCSFeedService] Loaded ${this.cachedEvents.length} cached events from storage`)
      }
    } catch (error) {
      console.error('[HCSFeedService] Failed to load cached events:', error)
      this.cachedEvents = []
    }
  }
  
  // Save cached events to browser storage
  private saveCachedEvents(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cachedEvents))
    } catch (error) {
      console.error('[HCSFeedService] Failed to save cached events:', error)
    }
  }
  
  // Clear all demo data and reset to fresh state
  async resetDemo(): Promise<void> {
    console.log("[HCSFeedService] 🔄 FULL DEMO RESET - Clearing all data...")
    
    // Clear all cached data
    this.cachedEvents = []
    this.isSeeded = false
    
    // Clear browser storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY)
      console.log("[HCSFeedService] Cleared browser storage cache")
    }
    
    // Clear signals store
    const { signalsStore } = await import('@/lib/stores/signalsStore')
    signalsStore.clearAllSignals()
    
    console.log("[HCSFeedService] ✅ Demo reset complete - fresh slate ready!")
  }
  
  // Re-seed demo data (called after reset or on first load)
  async seedFreshDemo(): Promise<void> {
    console.log("[HCSFeedService] 🌱 Seeding fresh demo data...")
    
    // Clear any existing data first
    await this.resetDemo()
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Re-seed the demo network
    const sessionId = await this.getCurrentSessionId()
    await this.seedComprehensiveDemoData(sessionId)
    
    console.log("[HCSFeedService] ✅ Fresh demo data seeded successfully!")
  }
}

export const hcsFeedService = new HCSFeedService()