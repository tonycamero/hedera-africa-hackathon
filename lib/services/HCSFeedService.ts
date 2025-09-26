import { hcsLogger } from "@/packages/hedera/HCSLogger"
import { hederaClient } from "@/packages/hedera/HederaClient"
import { hcsRecognitionService } from "@/lib/services/HCSRecognitionService"
import type { SignalEvent } from "@/lib/stores/signalsStore"
import { MirrorNodeReader } from "@/lib/services/MirrorNodeReader"
import { toSignalEvents } from "@/lib/services/MirrorNormalize"
import { saveMirrorRaw } from "@/lib/cache/sessionCache"
import { hcs2Registry, type TrustMeshTopics } from "@/lib/services/HCS2RegistryClient"

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
  private topics: TrustMeshTopics = {}
  private isSeeded: boolean = false
  private cachedEvents: HCSFeedEvent[] = [] // Cache for events successfully written to HCS
  private readonly CACHE_KEY = 'trustmesh_demo_cache'
  private mirrorReader: MirrorNodeReader | null = null;
  private isInitializing: boolean = false
  private initPromise: Promise<void> | null = null
  private useVerifiedTopics: boolean = true // Flag to use verified topics first
  private registryPollHandle: any = null
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
        // First, try to load verified topics from environment
        if (this.useVerifiedTopics) {
          console.log("[HCSFeedService] Loading verified topics from environment...")
          await this.loadVerifiedTopics()
        }

        // If we don't have all topics, create new ones or use HCS-2 registry
        if (!this.hasEssentialTopics()) {
          console.log("[HCSFeedService] Missing essential topics, initializing HCS-2 registry...")
          await this.initializeWithRegistry()
        }

        // Log the final topic configuration
        console.log("[HCSFeedService] Final topic configuration:", this.topics)

        // Initialize services with the topics we have
        await this.initializeServices()
        
        console.log("[HCSFeedService] Initialization completed with verified topics")
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

  private async loadVerifiedTopics(): Promise<void> {
    // Helper function to clean environment variables of whitespace/newlines
    const clean = (value?: string) => (value || '').trim();
    
    // Load the verified topics from environment variables
    this.topics = {
      feed: clean(process.env.NEXT_PUBLIC_TOPIC_CONTACT) || '0.0.6896005', // Using contacts topic as feed
      contacts: clean(process.env.NEXT_PUBLIC_TOPIC_CONTACT) || '0.0.6896005',
      trust: clean(process.env.NEXT_PUBLIC_TOPIC_TRUST) || '0.0.6896005',
      recognition: clean(process.env.NEXT_PUBLIC_TOPIC_SIGNAL) || '0.0.6895261',
      profiles: clean(process.env.NEXT_PUBLIC_TOPIC_PROFILE) || '0.0.6896008',
      system: clean(process.env.NEXT_PUBLIC_TOPIC_PROFILE) || '0.0.6896008' // Using profile topic as system
    }
    console.log('[HCSFeedService] Loaded verified topics:', this.topics)
  }

  private hasEssentialTopics(): boolean {
    return !!(this.topics.contacts && this.topics.trust && this.topics.recognition)
  }

  private async initializeWithRegistry(): Promise<void> {
    try {
      // Initialize HCS-2 registry
      await hcs2Registry.initialize()
      
      // Try to resolve topics from registry
      const registryTopics = await hcs2Registry.resolveTopics()
      
      // Use registry topics if available, otherwise use our verified ones as fallback
      this.topics = {
        feed: registryTopics.feed || this.topics.feed || '0.0.6896005',
        contacts: registryTopics.contacts || this.topics.contacts || '0.0.6896005',
        trust: registryTopics.trust || this.topics.trust || '0.0.6896005',
        recognition: registryTopics.recognition || this.topics.recognition || '0.0.6895261',
        profiles: registryTopics.profiles || this.topics.profiles || '0.0.6896008',
        system: registryTopics.system || this.topics.system || '0.0.6896008'
      }
      
      // Register our verified topics in the registry if not already there
      if (!registryTopics.feed || !registryTopics.contacts) {
        console.log('[HCSFeedService] Registering verified topics in HCS-2 registry...')
        await hcs2Registry.registerTopics(this.topics)
      }
      
      console.log('[HCSFeedService] Registry initialization complete:', this.topics)
      
    } catch (error) {
      console.error('[HCSFeedService] Registry initialization failed:', error)
      // Fall back to our verified topics
      console.log('[HCSFeedService] Using verified topics as fallback')
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize recognition service with HCS (fire-and-forget)
      hcsRecognitionService.initialize().catch(err => 
        console.error("[HCSFeedService] Recognition service init failed:", err)
      )
      
      // Start seeding process (fire-and-forget)  
      this.seedInitialData().catch(err => 
        console.error("[HCSFeedService] Seeding failed:", err)
      )
      
      // Set up Mirror reader with available topics
      this.setupMirrorReader()
      
      // Start registry watcher for hot-swapping
      this.startRegistryWatcher()
      
    } catch (error) {
      console.error('[HCSFeedService] Service initialization failed:', error)
    }
  }

  private setupMirrorReader(): void {
    const topicIds = [
      this.topics.contacts,
      this.topics.trust, 
      this.topics.recognition,
      this.topics.system
    ].filter(Boolean) as string[]
    
    if (topicIds.length > 0) {
      this.mirrorReader = new MirrorNodeReader(topicIds)
      console.log(`[HCSFeedService] Mirror reader set up with ${topicIds.length} topics:`, topicIds)
    } else {
      console.warn('[HCSFeedService] No topics available for Mirror reader')
    }
  }

  private startRegistryWatcher(intervalMs = 15000): void {
    if (this.registryPollHandle) return;
    
    console.log('[HCSFeedService] Starting registry watcher for hot-swapping');
    
    this.registryPollHandle = setInterval(async () => {
      try {
        // Re-resolve topics from registry
        const resolved = await hcs2Registry.resolveTopics();
        
        // Check if topics changed
        const currentTopics = JSON.stringify(this.topics);
        const resolvedTopics = JSON.stringify(resolved);
        
        if (currentTopics !== resolvedTopics) {
          console.log('[HCSFeedService] Registry rotation detected:', resolved);
          
          // Update local topics
          this.topics = {
            feed: resolved.feed || this.topics.feed,
            contacts: resolved.contacts || this.topics.contacts,
            trust: resolved.trust || this.topics.trust,
            recognition: resolved.recognition || this.topics.recognition,
            profiles: resolved.profiles || this.topics.profiles,
            system: resolved.system || this.topics.system
          };
          
          // Trigger hot-swap handler
          const { handleRegistryRotation } = await import('@/lib/boot/bootstrapFlex');
          handleRegistryRotation(resolved as any);
          
          // Re-setup Mirror reader with new topics
          this.setupMirrorReader();
          
          console.log('[HCSFeedService] Hot-swap complete, new topics:', this.topics);
        }
        
      } catch (error) {
        // Non-fatal: keep previous topics
        console.warn('[HCSFeedService] Registry watcher failed:', error);
      }
    }, intervalMs);
  }

  stopRegistryWatcher(): void {
    if (this.registryPollHandle) {
      clearInterval(this.registryPollHandle);
      this.registryPollHandle = null;
      console.log('[HCSFeedService] Registry watcher stopped');
    }
  }

  private async seedInitialData(): Promise<void> {
    // Client-side seeding is disabled for security - would require HCS writes
    console.log("[HCSFeedService] Client-side seeding disabled for security. Demo data should be seeded server-side.")
    console.log("[HCSFeedService] The app will display live recognition data from HCS topics and cached local data.")
    
    this.isSeeded = true // Mark as seeded to avoid further attempts
  }

  async logContactRequest(from: string, to: string, fromName?: string, toName?: string): Promise<HCSFeedEvent> {
    const eventId = `contact_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Validate topic IDs before proceeding
    if (!this.topics.contacts || !this.topics.feed) {
      console.error(`[HCSFeedService] Cannot log contact request - missing topic IDs: contacts=${this.topics.contacts}, feed=${this.topics.feed}`)
      return {
        id: eventId,
        type: "contact_request",
        timestamp: new Date().toISOString(),
        actor: from,
        target: to,
        metadata: { handle: fromName, name: toName },
        status: "error",
        direction: "outbound",
        topicId: this.topics.contacts || "unknown",
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
        topicId: this.topics.contacts!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.topics.contacts}`
      },
      status: "local",
      direction: "outbound",
      topicId: this.topics.contacts!,
    }

    // Check if topics are ready before submitting
    if (!this.topics.contacts || !this.topics.feed) {
      console.warn(`[HCSFeedService] Topics not ready yet for contact request - contacts: ${this.topics.contacts}, feed: ${this.topics.feed}`)
      event.status = "pending"
      // Add to cache anyway for immediate UI availability
      this.cachedEvents.push(event)
      this.saveCachedEvents()
      return event
    }

    // Client-side HCS writes are disabled for security - cache locally only
    console.log(`[HCSFeedService] Contact request cached locally (client-side HCS write disabled): ${from} → ${to}`)
    event.status = "local" // Keep as local since we can't write to HCS from client
    
    // Add to cache for UI consistency
    this.cachedEvents.push(event)
    this.saveCachedEvents()

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
        topicId: this.topics.contacts!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.topics.contacts}`
      },
      status: "local",
      direction: "outbound",
      topicId: this.topics.contacts!,
    }

    // Check if topics are ready before submitting
    if (!this.topics.contacts || !this.topics.feed) {
      console.warn(`[HCSFeedService] Topics not ready yet for contact accept - contacts: ${this.topics.contacts}, feed: ${this.topics.feed}`)
      event.status = "pending"
      // Add to cache anyway for immediate UI availability
      this.cachedEvents.push(event)
      this.saveCachedEvents()
      return event
    }

    // Client-side HCS writes are disabled for security - cache locally only
    console.log(`[HCSFeedService] Contact accept cached locally (client-side HCS write disabled): ${from} → ${to}`)
    event.status = "local" // Keep as local since we can't write to HCS from client
    
    // Add to cache for UI consistency
    this.cachedEvents.push(event)
    this.saveCachedEvents()

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
        topicId: this.topics.trust!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.topics.trust}`
      },
      status: "local",
      direction: "outbound",
      topicId: this.topics.trust!,
    }

    // Check if topics are ready before submitting
    if (!this.topics.trust || !this.topics.feed) {
      console.warn(`[HCSFeedService] Topics not ready yet for trust allocation - trust: ${this.topics.trust}, feed: ${this.topics.feed}`)
      event.status = "pending"
      // Add to cache anyway for immediate UI availability
      this.cachedEvents.push(event)
      this.saveCachedEvents()
      return event
    }

    // Client-side HCS writes are disabled for security - cache locally only
    console.log(`[HCSFeedService] Trust allocation cached locally (client-side HCS write disabled): ${from} → ${to} (${weight})`)
    event.status = "local" // Keep as local since we can't write to HCS from client
    
    // Add to cache for UI consistency
    this.cachedEvents.push(event)
    this.saveCachedEvents()

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
        topicId: this.topics.trust!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.topics.trust}`
      },
      status: "local",
      direction: "outbound",
      topicId: this.topics.trust!,
    }

    // Client-side HCS writes are disabled for security - cache locally only
    console.log(`[HCSFeedService] Trust revocation cached locally (client-side HCS write disabled): ${from} → ${to}`)
    event.status = "local" // Keep as local since we can't write to HCS from client
    
    // Add to cache for UI consistency
    this.cachedEvents.push(event)
    this.saveCachedEvents()

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
          topicId: this.topics.recognition!,
          explorerUrl: `https://hashscan.io/testnet/topic/${this.topics.recognition}`,
          // Include recognition instance data if available
          ...(recognitionInstance && {
            recognitionInstanceId: recognitionInstance.id,
            tokenId: recognitionInstance.tokenId,
            serialNumber: recognitionInstance.serialNumber
          })
        },
        status: "local",
        direction: "outbound",
        topicId: this.topics.recognition!,
      }

      // Check if topics are ready before submitting
      if (!this.topics.recognition || !this.topics.feed) {
        console.warn(`[HCSFeedService] Topics not ready yet for recognition mint - recognition: ${this.topics.recognition}, feed: ${this.topics.feed}`)
        event.status = "pending"
        // Add to cache anyway for immediate UI availability
        this.cachedEvents.push(event)
        return event
      }

      // Client-side HCS writes are disabled for security - cache locally only
      console.log(`[HCSFeedService] Recognition cached locally (client-side HCS write disabled): ${name} for ${to}`)
      event.status = "local" // Keep as local since we can't write to HCS from client
      
      // Add to cache for UI consistency
      this.cachedEvents.push(event)
      this.saveCachedEvents()
      
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
        topicId: this.topics.recognition!,
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

    const base = {
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
      }
    } as const

    // Hard override: recognition events should be SIGNAL even if topic id is wrong
    const topicType =
      hcsEvent.type === "recognition_mint"
        ? "SIGNAL"
        : this.getTopicTypeFromId(hcsEvent.topicId)

    return { ...base, topicType }
  }

  private getTopicTypeFromId(topicId: string): "CONTACT" | "TRUST" | "SIGNAL" | "PROFILE" {
    if (topicId && this.topics.recognition && topicId === this.topics.recognition) return "SIGNAL"
    if (topicId && this.topics.trust && topicId === this.topics.trust) return "TRUST"
    if (topicId && this.topics.contacts && topicId === this.topics.contacts) return "CONTACT"
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

      // Fetch LIVE Mirror data first (this is the key fix!)
      const topics = [
        this.topics.feed!,
        this.topics.contacts!,
        this.topics.trust!,
        this.topics.recognition!,
        this.topics.system!
      ].filter(Boolean) as string[];

      console.log(`[HCSFeedService] Fetching from ${topics.length} topics:`, topics);

      const { fetchTopicMessages } = await import("@/lib/services/MirrorReader");
      const perTopic = await Promise.all(
        topics.map(async tid => {
          try {
            const messages = await fetchTopicMessages(tid, 50);
            console.log(`[HCSFeedService] Topic ${tid}: ${messages.length} messages`);
            return messages;
          } catch (e) {
            console.warn(`[HCSFeedService] Topic ${tid} failed:`, e);
            return [];
          }
        })
      );
      const flat = perTopic.flat();
      console.log(`[HCSFeedService] Total raw messages: ${flat.length}`);

      const live: HCSFeedEvent[] = [];
      for (const m of flat) {
        try {
          const obj = JSON.parse(m.decoded);
          if (obj?.type && obj?.timestamp && obj?.actor) {
            live.push({
              id: obj.id || `${obj.type}_${m.topicId}_${m.sequenceNumber}`,
              type: obj.type,
              timestamp: obj.timestamp,
              actor: obj.actor,
              target: obj.target,
              metadata: obj.metadata || {},
              status: obj.status || "onchain",
              direction: obj.direction || "inbound",
              topicId: m.topicId,
              sequenceNumber: m.sequenceNumber,
            });
          } else {
            console.log(`[HCSFeedService] Skipping non-Flex payload:`, obj?.type || 'no-type');
          }
        } catch (e) {
          // Not JSON - ignore
          console.log(`[HCSFeedService] Skipping non-JSON message from ${m.topicId}`);
        }
      }

      console.log(`[HCSFeedService] Parsed ${live.length} live events, cached: ${this.cachedEvents.length}`);

      // Merge with cached events and dedupe by ID
      const merged = [...live, ...this.cachedEvents]
        .filter((event, index, array) => array.findIndex(e => e.id === event.id) === index)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log(`[HCSFeedService] Returning ${merged.length} total events (${live.length} live + ${this.cachedEvents.length} cached)`);
      
      return merged.map(event => this.hcsEventToSignalEvent(event));
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
      this.topics.contacts,
      this.topics.trust
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
        contacts: this.topics.contacts || 'pending',
        trust: this.topics.trust || 'pending',
        feed: this.topics.feed || 'pending',
        recognition: this.topics.recognition || 'pending',
        profile: this.topics.profiles || 'pending',
        system: this.topics.system || 'pending',
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
      feed: this.topics.feed,
      contacts: this.topics.contacts,  
      trust: this.topics.trust,
      recognition: this.topics.recognition,
      profile: this.topics.profiles,
      system: this.topics.system
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
        topicId: this.topics.system!,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.topics.system}`
      },
      status: "local",
      direction: "inbound",
      topicId: this.topics.system!,
    }

    // Check if topics are ready before submitting
    if (!this.topics.system || !this.topics.feed) {
      console.warn(`[HCSFeedService] Topics not ready yet for system announcement - system: ${this.topics.system}, feed: ${this.topics.feed}`)
      event.status = "pending"
      // Add to cache anyway for immediate UI availability
      this.cachedEvents.push(event)
      return event
    }

    // Client-side HCS writes are disabled for security - cache locally only
    console.log(`[HCSFeedService] System announcement cached locally (client-side HCS write disabled): ${message}`)
    event.status = "local" // Keep as local since we can't write to HCS from client
    
    // Add to cache for UI consistency
    this.cachedEvents.push(event)
    this.saveCachedEvents()

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