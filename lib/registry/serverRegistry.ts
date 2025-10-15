import { z } from 'zod'

// Registry schema with strict validation
const RegistrySchema = z.object({
  env: z.enum(['testnet', 'mainnet']),
  mirror: z.object({
    rest: z.string().url(),
    ws: z.string().url()
  }),
  topics: z.object({
    contacts: z.string().regex(/^0\.0\.\d+$/),
    trust: z.string().regex(/^0\.0\.\d+$/),
    profile: z.string().regex(/^0\.0\.\d+$/),
    recognition: z.union([
      z.string().regex(/^0\.0\.\d+$/),
      z.object({
        shared: z.boolean(),
        id: z.string().regex(/^0\.0\.\d+$/),
        definitions: z.string().regex(/^0\.0\.\d+$/).optional(),
        instances: z.string().regex(/^0\.0\.\d+$/).optional()
      })
    ])
  }),
  schemas: z.object({
    contact: z.string(),
    trust: z.string(), 
    recDef: z.string(),
    recInst: z.string(),
    profile: z.string()
  }),
  flags: z.object({
    HCS_ENABLED: z.boolean(),
    SHARED_CONTACTS_TRUST_TOPIC: z.boolean()
  }).default({
    HCS_ENABLED: true,
    SHARED_CONTACTS_TRUST_TOPIC: true
  }),
  migration: z.object({
    activeFrom: z.string().datetime().nullable(),
    nextTopics: z.record(z.string()).nullable()
  }).optional()
})

export type RegistryConfig = z.infer<typeof RegistrySchema>

let REGISTRY: RegistryConfig | null = null
let REGISTRY_SOURCE: string | null = null

// Clean environment variable helper
const clean = (s?: string | null) => (s ?? '').replace(/\r|\n/g, '').trim()

export function loadRegistryFromEnv(): RegistryConfig {
  const mirrorRestRaw = clean(process.env.NEXT_PUBLIC_MIRROR_NODE_URL)
  const mirrorWsRaw = clean(process.env.NEXT_PUBLIC_MIRROR_NODE_WS)
  
  // Ensure Mirror REST URL has /api/v1
  const mirrorRest = mirrorRestRaw || 'https://testnet.mirrornode.hedera.com/api/v1'
  const correctedMirrorRest = mirrorRest.endsWith('/api/v1') ? mirrorRest : `${mirrorRest}/api/v1`
  
  const rawConfig = {
    env: clean(process.env.HEDERA_NETWORK) || 'testnet',
    mirror: {
      rest: correctedMirrorRest,
      ws: mirrorWsRaw || 'wss://testnet.mirrornode.hedera.com:5600'
    },
    topics: {
      contacts: clean(process.env.NEXT_PUBLIC_TOPIC_CONTACT) || '0.0.6896005',
      trust: clean(process.env.NEXT_PUBLIC_TOPIC_TRUST) || '0.0.6896005', 
      profile: clean(process.env.NEXT_PUBLIC_TOPIC_PROFILE) || '0.0.6896008',
      recognition: clean(process.env.NEXT_PUBLIC_TOPIC_RECOGNITION) || '0.0.6895261'
    },
    schemas: {
      contact: 'HCS-Contact@1',
      trust: 'HCS-Trust@1',
      recDef: 'HCS-Recognition-Def@1', 
      recInst: 'HCS-Recognition-Instance@1',
      profile: 'HCS-Profile@1'
    },
    flags: {
      HCS_ENABLED: clean(process.env.NEXT_PUBLIC_HCS_ENABLED) === 'true',
      SHARED_CONTACTS_TRUST_TOPIC: true
    }
  }

  const cleaned = RegistrySchema.parse(rawConfig)
  REGISTRY = Object.freeze(cleaned)
  REGISTRY_SOURCE = 'environment'
  
  console.log('[Registry] Loaded from environment variables:', {
    env: REGISTRY.env,
    topics: Object.keys(REGISTRY.topics).length,
    source: REGISTRY_SOURCE
  })
  
  return REGISTRY
}

export function loadRegistry(raw: unknown, source: string = 'manual'): RegistryConfig {
  const cleaned = RegistrySchema.parse(raw)
  REGISTRY = Object.freeze(cleaned)
  REGISTRY_SOURCE = source
  
  console.log('[Registry] Loaded configuration:', {
    env: REGISTRY.env,
    topics: Object.keys(REGISTRY.topics).length,
    source: REGISTRY_SOURCE
  })
  
  return REGISTRY
}

export function getRegistry(): RegistryConfig {
  if (!REGISTRY) {
    console.warn('[Registry] No registry loaded, falling back to environment')
    return loadRegistryFromEnv()
  }
  return REGISTRY
}

export function getRegistrySource(): string {
  return REGISTRY_SOURCE || 'unknown'
}

// Validation helpers
export function validateRegistry(config: unknown): { valid: boolean; errors?: string[] } {
  try {
    RegistrySchema.parse(config)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    return {
      valid: false,
      errors: [String(error)]
    }
  }
}

// Topic resolution helpers
export function getTopicId(topicType: keyof RegistryConfig['topics']): string {
  const registry = getRegistry()
  const topic = registry.topics[topicType]
  
  if (typeof topic === 'string') {
    return topic
  } else if (typeof topic === 'object' && 'id' in topic) {
    return topic.id
  }
  
  throw new Error(`Invalid topic configuration for ${topicType}`)
}

export function getAllTopicIds(): Record<string, string> {
  const registry = getRegistry()
  const result: Record<string, string> = {}
  
  Object.entries(registry.topics).forEach(([key, value]) => {
    if (typeof value === 'string') {
      result[key] = value
    } else if (typeof value === 'object' && 'id' in value) {
      result[key] = value.id
      if (value.definitions) result[`${key}_definitions`] = value.definitions
      if (value.instances) result[`${key}_instances`] = value.instances
    }
  })
  
  return result
}

// URL builders (single source of truth)
export function mirrorRestUrl(topicId?: string): string {
  const registry = getRegistry()
  const baseUrl = registry.mirror.rest
  
  if (topicId) {
    return `${baseUrl}/topics/${encodeURIComponent(topicId)}/messages`
  }
  return baseUrl
}

export function mirrorWsUrl(topicId: string): string {
  const registry = getRegistry()
  const baseUrl = registry.mirror.ws
  return `${baseUrl}/api/v1/topics/${encodeURIComponent(topicId)}/messages`
}

// HRL helpers
export function buildHRL(topicId: string, sequenceNumber?: number): string {
  const registry = getRegistry()
  const networkId = registry.env === 'mainnet' ? '1' : '11' // Testnet = 11
  
  if (sequenceNumber !== undefined) {
    return `hcs://${networkId}/${topicId}/${sequenceNumber}`
  }
  return `hcs://${networkId}/${topicId}`
}

export function parseHRL(hrl: string): { networkId: string; topicId: string; sequenceNumber?: number } | null {
  const match = hrl.match(/^hcs:\/\/(\d+)\/([0-9.]+)(?:\/(\d+))?$/)
  if (!match) return null
  
  return {
    networkId: match[1],
    topicId: match[2],
    sequenceNumber: match[3] ? parseInt(match[3], 10) : undefined
  }
}

// Migration support
export function shouldUseMigration(): boolean {
  const registry = getRegistry()
  if (!registry.migration?.activeFrom || !registry.migration?.nextTopics) {
    return false
  }
  
  const activationTime = new Date(registry.migration.activeFrom)
  return new Date() >= activationTime
}

export function getMigrationTopics(): Record<string, string> | null {
  const registry = getRegistry()
  if (!shouldUseMigration()) return null
  
  return registry.migration?.nextTopics || null
}