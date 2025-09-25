import { hederaClient } from "@/packages/hedera/HederaClient"
import type { RecognitionSignal, SignalCategory } from "@/lib/data/recognitionSignals"

// HCS-based recognition signal definition and instance management
export interface HCSRecognitionDefinition {
  id: string
  name: string
  description: string
  category: SignalCategory
  number: number
  icon: string
  isActive: boolean
  extendedDescription: string
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'
  stats: {
    popularity: number
    impact: number
    authenticity: number
    difficulty: number
  }
  traits: {
    personality: string[]
    skills: string[]
    environment: string[]
  }
  relatedLinks: {
    name: string
    url: string
    type: 'article' | 'meme' | 'guide' | 'reference'
  }[]
  backstory: string
  tips: string[]
  // HCS-specific fields
  topicId: string
  createdAt: string
  definitionHash: string // Hash of the definition for integrity
}

// Recognition signal instance (when someone gets awarded one)
export interface HCSRecognitionInstance {
  id: string
  definitionId: string // References the recognition definition
  ownerId: string // User who owns this instance
  mintedBy: string // Who awarded it
  mintedAt: string
  tokenId: string // Hedera NFT token ID if minted as NFT
  serialNumber?: number
  metadata: {
    customMessage?: string // Personal message when awarded
    context?: string // Context of why it was awarded
    explorerUrl?: string
    topicId: string
  }
  status: "onchain" | "local" | "error"
  isActive: boolean
}

export class HCSRecognitionService {
  private registryTopicId: string | null = null // For signal definitions
  private instancesTopicId: string | null = null // For signal instances/ownership
  private ownershipTopicId: string | null = null // For ownership tracking
  
  private definitionsCache: Map<string, HCSRecognitionDefinition> = new Map()
  private instancesCache: Map<string, HCSRecognitionInstance> = new Map()
  
  async initialize(): Promise<void> {
    console.log("[HCSRecognitionService] Initializing recognition service...")
    
    if (!hederaClient.isReady()) {
      await hederaClient.initialize()
    }

    try {
      // Create recognition registry topic for signal definitions
      console.log("[HCSRecognitionService] Creating recognition registry topic...")
      const registryTopic = await hederaClient.createHCS10Topic(
        "TrustMesh Recognition Registry",
        "Master registry of all recognition signal definitions and metadata"
      )
      this.registryTopicId = registryTopic.topicId
      console.log(`[HCSRecognitionService] Registry topic created: ${this.registryTopicId}`)

      // Create instances topic for minted/awarded signals
      console.log("[HCSRecognitionService] Creating recognition instances topic...")
      const instancesTopic = await hederaClient.createHCS10Topic(
        "TrustMesh Recognition Instances", 
        "Individual recognition signal instances awarded to users"
      )
      this.instancesTopicId = instancesTopic.topicId
      console.log(`[HCSRecognitionService] Instances topic created: ${this.instancesTopicId}`)

      // Create ownership topic for tracking who owns what
      console.log("[HCSRecognitionService] Creating ownership tracking topic...")
      const ownershipTopic = await hederaClient.createHCS10Topic(
        "TrustMesh Recognition Ownership",
        "Tracks ownership and transfers of recognition signal instances"
      )
      this.ownershipTopicId = ownershipTopic.topicId
      console.log(`[HCSRecognitionService] Ownership topic created: ${this.ownershipTopicId}`)

      console.log("[HCSRecognitionService] All recognition topics created successfully")
      
      // Seed the recognition definitions to HCS
      await this.seedRecognitionDefinitions()

    } catch (error) {
      console.error("[HCSRecognitionService] Failed to initialize:", error)
      throw error
    }
  }

  private async seedRecognitionDefinitions(): Promise<void> {
    console.log("[HCSRecognitionService] Seeding recognition definitions to HCS...")
    
    // Import the static data to migrate it to HCS
    const { recognitionSignals } = await import("@/lib/data/recognitionSignals")
    
    for (const signal of recognitionSignals) {
      await this.createRecognitionDefinition(signal)
      // Small delay to avoid overwhelming HCS
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`[HCSRecognitionService] Seeded ${recognitionSignals.length} recognition definitions to HCS`)
  }

  async createRecognitionDefinition(signal: RecognitionSignal): Promise<HCSRecognitionDefinition> {
    if (!this.registryTopicId) {
      throw new Error("Registry topic not initialized")
    }

    // Fill in missing fields if they don't exist in the signal
    const definition: HCSRecognitionDefinition = {
      ...signal,
      extendedDescription: signal.extendedDescription || signal.description,
      rarity: signal.rarity || 'Common',
      stats: signal.stats || {
        popularity: Math.floor(Math.random() * 100),
        impact: Math.floor(Math.random() * 100),
        authenticity: Math.floor(Math.random() * 100), 
        difficulty: Math.floor(Math.random() * 100),
      },
      traits: signal.traits || {
        personality: [],
        skills: [],
        environment: []
      },
      relatedLinks: signal.relatedLinks || [],
      backstory: signal.backstory || `A ${signal.category} recognition signal representing ${signal.description}.`,
      tips: signal.tips || [`Master the art of ${signal.description}`, `Practice makes perfect`, `Stay authentic to yourself`],
      topicId: this.registryTopicId,
      createdAt: new Date().toISOString(),
      definitionHash: await this.hashDefinition(signal)
    }

    try {
      await hederaClient.submitMessage(this.registryTopicId, JSON.stringify({
        type: "recognition_definition_created",
        data: definition,
        timestamp: new Date().toISOString()
      }))

      this.definitionsCache.set(definition.id, definition)
      console.log(`[HCSRecognitionService] Created definition for ${definition.name} in HCS`)
      
      return definition
    } catch (error) {
      console.error(`[HCSRecognitionService] Failed to create definition ${definition.id}:`, error)
      throw error
    }
  }

  async mintRecognitionInstance(
    definitionId: string,
    ownerId: string,
    mintedBy: string,
    customMessage?: string,
    context?: string
  ): Promise<HCSRecognitionInstance> {
    if (!this.instancesTopicId) {
      throw new Error("Instances topic not initialized")
    }

    const definition = await this.getRecognitionDefinition(definitionId)
    if (!definition) {
      throw new Error(`Recognition definition not found: ${definitionId}`)
    }

    const instanceId = `${definitionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const tokenId = `TM-${definition.category.toUpperCase()}-${definition.number.toString().padStart(3, '0')}-${Date.now()}`

    const instance: HCSRecognitionInstance = {
      id: instanceId,
      definitionId,
      ownerId,
      mintedBy,
      mintedAt: new Date().toISOString(),
      tokenId,
      serialNumber: Math.floor(Math.random() * 1000000),
      metadata: {
        customMessage,
        context,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.instancesTopicId}`,
        topicId: this.instancesTopicId
      },
      status: "local",
      isActive: true
    }

    try {
      await hederaClient.submitMessage(this.instancesTopicId, JSON.stringify({
        type: "recognition_instance_minted",
        data: instance,
        timestamp: new Date().toISOString()
      }))

      // Also log to ownership topic
      await hederaClient.submitMessage(this.ownershipTopicId!, JSON.stringify({
        type: "recognition_ownership_created",
        instanceId: instance.id,
        ownerId,
        mintedBy,
        timestamp: new Date().toISOString()
      }))

      instance.status = "onchain"
      this.instancesCache.set(instance.id, instance)
      
      console.log(`[HCSRecognitionService] Minted ${definition.name} for ${ownerId} to HCS`)
      return instance
    } catch (error) {
      console.error(`[HCSRecognitionService] Failed to mint instance:`, error)
      instance.status = "error"
      throw error
    }
  }

  async getRecognitionDefinition(definitionId: string): Promise<HCSRecognitionDefinition | null> {
    // Check cache first
    if (this.definitionsCache.has(definitionId)) {
      return this.definitionsCache.get(definitionId)!
    }

    // TODO: In full implementation, query HCS mirror node
    // For now, return from cache only
    console.log(`[HCSRecognitionService] Definition ${definitionId} not found in cache`)
    return null
  }

  async getAllRecognitionDefinitions(): Promise<HCSRecognitionDefinition[]> {
    // TODO: In full implementation, query HCS mirror node for all definitions
    // For now, return cached definitions
    return Array.from(this.definitionsCache.values())
  }

  async getUserRecognitionInstances(userId: string): Promise<HCSRecognitionInstance[]> {
    // TODO: In full implementation, query HCS mirror node for user's instances
    // For now, return cached instances for user
    return Array.from(this.instancesCache.values()).filter(
      instance => instance.ownerId === userId
    )
  }

  async getRecognitionInstance(instanceId: string): Promise<HCSRecognitionInstance | null> {
    return this.instancesCache.get(instanceId) || null
  }

  private async hashDefinition(signal: RecognitionSignal): Promise<string> {
    // Simple hash for data integrity - handle Unicode characters properly
    const data = JSON.stringify(signal)
    try {
      // Use TextEncoder to handle Unicode characters properly
      const encoder = new TextEncoder()
      const bytes = encoder.encode(data)
      // Convert to base64-safe string using simple method
      const hash = Array.from(bytes).slice(0, 16).map(b => b.toString(36)).join('').slice(0, 16)
      return hash
    } catch (error) {
      // Fallback: simple hash without btoa
      return data.slice(0, 16).replace(/[^a-zA-Z0-9]/g, '')
    }
  }

  isReady(): boolean {
    return !!(this.registryTopicId && this.instancesTopicId && this.ownershipTopicId)
  }

  getTopicIds() {
    return {
      registry: this.registryTopicId,
      instances: this.instancesTopicId, 
      ownership: this.ownershipTopicId
    }
  }

  // Clear cache for demo resets
  clearCache(): void {
    this.definitionsCache.clear()
    this.instancesCache.clear()
    console.log("[HCSRecognitionService] Cache cleared")
  }
}

export const hcsRecognitionService = new HCSRecognitionService()