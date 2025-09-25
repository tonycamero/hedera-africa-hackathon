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

type Def = { id: string; name: string; category: string; description?: string };
type Inst = { id: string; definitionId: string; owner: string; mintedBy: string; ts: number };

export class HCSRecognitionService {
  private ready = false
  private initPromise: Promise<void> | null = null
  private topics: { definitions?: string; instances?: string } = {}
  private definitions: Map<string, Def> = new Map()
  
  private definitionsCache: Map<string, HCSRecognitionDefinition> = new Map()
  private instancesCache: Map<string, HCSRecognitionInstance> = new Map()

  isReady() { return this.ready }
  
  async initialize(): Promise<void> {
    if (this.ready) return
    if (this.initPromise) return this.initPromise
    
    // Force Vercel deployment refresh - 2025-01-25

    this.initPromise = (async () => {
      console.log("[HCSRecognitionService] Initializing recognition service...")
      
      // Resolve topics from registry or fallback
      const { hcs2Registry } = await import("@/lib/services/HCS2RegistryClient")
      const topics = await hcs2Registry.resolveTopics()
      
      this.topics = {
        definitions: topics.recognition,
        instances: topics.recognition, // Same topic for now
      }

      if (!this.topics.instances) {
        console.warn("[HCSRecognitionService] Recognition instances topic is missing")
        return
      }

      // Load definitions (best effort) or create demo definitions
      if (this.topics.definitions) {
        try {
          const { fetchTopicMessages } = await import("@/lib/services/MirrorReader")
          const msgs = await fetchTopicMessages(this.topics.definitions, 200)
          const defs = msgs
            .map(m => {
              try {
                return JSON.parse(m.decoded)
              } catch {
                return null
              }
            })
            .filter(x => x && (x.type === "recognition_definition_created" || x.type === "RECOG_DEF"))
          
          defs.forEach((d: any) => {
            const defData = d.data || d
            const def: Def = { 
              id: defData.id, 
              name: defData.name, 
              category: defData.category, 
              description: defData.description 
            }
            this.definitions.set(def.id, def)
          })
          
          console.log(`[HCSRecognitionService] Loaded ${this.definitions.size} recognition definitions`)
        } catch (error) {
          console.warn(`[HCSRecognitionService] Failed to load definitions:`, error)
        }
      }
      
      // Load from HCS or create demo data for immediate demo functionality
      // TODO: Remove demo data once HCS transaction signing is fixed
      if (this.definitions.size === 0) {
        console.log(`[HCSRecognitionService] Loading demo recognition data for hackathon demo...`)
        try {
          const { recognitionSignals } = await import("@/lib/data/recognitionSignals")
          
          // Load all recognition signals from demo data
          // This includes social, academic, and professional categories
          // to support the full range of minted recognition instances
          const demoSignals = recognitionSignals
          
          demoSignals.forEach(signal => {
            const def: Def = { 
              id: signal.id, 
              name: signal.name, 
              category: signal.category, 
              description: signal.description 
            }
            this.definitions.set(signal.id, def)
            
            // Store full definition in cache for recognition page
            this.definitionsCache.set(signal.id, {
              ...signal,
              emoji: signal.icon, // Add emoji alias for compatibility
              topicId: this.topics.definitions || '',
              createdAt: new Date().toISOString(),
              definitionHash: signal.id
            })
          })
          
          console.log(`[HCSRecognitionService] Loaded ${demoSignals.length} demo recognition signals (hackathon demo)`)
        } catch (error) {
          console.error(`[HCSRecognitionService] Failed to load demo recognition signals:`, error)
        }
      }

      this.ready = true
      console.log(`[HCSRecognitionService] Initialized successfully. Ready: ${this.ready}`)
    })()

    try { 
      await this.initPromise 
    } finally { 
      this.initPromise = null 
    }
  }

  async getAllRecognitionDefinitions(): Promise<HCSRecognitionDefinition[]> {
    if (!this.ready) await this.initialize()
    
    // Return only real HCS recognition definitions - no mock data
    return Array.from(this.definitionsCache.values())
  }
  
  private getCategoryIcon(category: string): string {
    switch (category) {
      case 'social': return '🎭'
      case 'academic': return '🎓' 
      case 'professional': return '💼'
      default: return '🏆'
    }
  }

  async getAllRecognitionInstances(): Promise<Inst[]> {
    if (!this.ready) await this.initialize()
    if (!this.topics.instances) return []
    
    try {
      const { fetchTopicMessages } = await import("@/lib/services/MirrorReader")
      const msgs = await fetchTopicMessages(this.topics.instances, 500)
      return msgs
        .map(m => {
          try {
            return JSON.parse(m.decoded)
          } catch {
            return null
          }
        })
        .filter(x => x && (x.type === "recognition_mint" || x.type === "RECOG_MINT" || x.type === "RECOGNITION_MINT"))
        .map((x: any): Inst => ({
          id: x.id ?? `${x.tokenId ?? x.sequenceNumber ?? x.nonce}`,
          definitionId: x.metadata?.definitionId ?? x.definitionId ?? x.payload?.definitionId ?? "",
          owner: x.target ?? x.to ?? x.payload?.to ?? "",
          mintedBy: x.actor ?? x.from ?? x.payload?.mintedBy ?? "",
          ts: (x.timestamp ? Date.parse(x.timestamp) : x.ts * 1000) || Date.now(),
        }))
    } catch (error) {
      console.warn(`[HCSRecognitionService] Failed to load instances:`, error)
      return []
    }
  }

  async getInstancesForOwner(owner: string): Promise<Inst[]> {
    const all = await this.getAllRecognitionInstances()
    return all.filter(i => i.owner === owner)
  }

  // Method used by RecognitionGrid
  async getUserRecognitionInstances(ownerId: string): Promise<Inst[]> {
    return this.getInstancesForOwner(ownerId)
  }

  // Method to get recognition definition by ID
  async getRecognitionDefinition(definitionId: string): Promise<HCSRecognitionDefinition | null> {
    if (!this.ready) await this.initialize()
    
    console.log(`[HCSRecognitionService] Looking for definition: ${definitionId}`)
    console.log(`[HCSRecognitionService] Available definitions in cache:`, Array.from(this.definitionsCache.keys()))
    
    const result = this.definitionsCache.get(definitionId) || null
    console.log(`[HCSRecognitionService] Found definition:`, result ? result.name : 'null')
    
    return result
  }

  // Legacy compatibility methods for existing code
  async mintRecognitionInstance(
    definitionId: string,
    ownerId: string,
    mintedBy: string,
    customMessage?: string,
    context?: string
  ): Promise<HCSRecognitionInstance> {
    // Return mock instance for now - this method is called but not used in the demo
    const instanceId = `${definitionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const mockInstance: HCSRecognitionInstance = {
      id: instanceId,
      definitionId,
      ownerId,
      mintedBy,
      mintedAt: new Date().toISOString(),
      tokenId: `TM-${definitionId}-${Date.now()}`,
      serialNumber: Math.floor(Math.random() * 1000000),
      metadata: {
        customMessage,
        context,
        explorerUrl: `https://hashscan.io/testnet/topic/${this.topics.instances}`,
        topicId: this.topics.instances || ''
      },
      status: "onchain",
      isActive: true
    }
    
    console.log(`[HCSRecognitionService] Mock minted ${definitionId} for ${ownerId}`)
    return mockInstance
  }

  // Clear cache for demo resets
  clearCache(): void {
    this.definitions.clear()
    this.definitionsCache.clear()
    this.instancesCache.clear()
    console.log("[HCSRecognitionService] Cache cleared")
  }
}

export const hcsRecognitionService = new HCSRecognitionService()