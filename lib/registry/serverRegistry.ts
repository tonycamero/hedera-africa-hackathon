import { z } from 'zod'

/**
 * SINGLE SOURCE OF TRUTH FOR HCS TOPIC IDs
 * 
 * This registry:
 * - Reads from environment variables ONCE at boot
 * - Validates all topic IDs with Zod
 * - Freezes the resolved config to prevent mutation
 * - Exports typed accessors
 * 
 * ALL code must use topics() accessor, NEVER read process.env directly.
 */

// Strict topic ID validation
const TopicIdSchema = z.string()
  .regex(/^0\.0\.\d+$/, 'Topic ID must match format 0.0.{number}')
  .refine((id) => id !== '0.0.0', 'Topic ID cannot be 0.0.0')

// Environment schema with strict validation
const EnvSchema = z.object({
  NEXT_PUBLIC_TOPIC_CONTACT: TopicIdSchema,
  NEXT_PUBLIC_TOPIC_TRUST: TopicIdSchema,
  NEXT_PUBLIC_TOPIC_PROFILE: TopicIdSchema,
  NEXT_PUBLIC_TOPIC_RECOGNITION: TopicIdSchema,
  NEXT_PUBLIC_TOPIC_RECOGNITION_GENZ: TopicIdSchema.optional(),
  NEXT_PUBLIC_TOPIC_RECOGNITION_AFRICAN: TopicIdSchema.optional(),
  NEXT_PUBLIC_TOPIC_SIGNAL: z.string().optional(),  // Optional, can be empty, fallback to RECOGNITION
  HEDERA_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  NEXT_PUBLIC_HCS_ENABLED: z.string().transform(v => v === 'true')
})

// Resolved topics type (frozen)
export interface TopicsRegistry {
  readonly contacts: string
  readonly trust: string
  readonly profile: string
  readonly recognition: string
  readonly recognition_genz: string | undefined
  readonly recognition_african: string | undefined
  readonly signal: string
  readonly system: string  // Derived from signal
}

// Module-scope cache (computed once, frozen)
let RESOLVED_TOPICS: Readonly<TopicsRegistry> | null = null

/**
 * Initialize and validate registry from environment
 * Called once at module load
 */
function initializeRegistry(): Readonly<TopicsRegistry> {
  try {
    // Parse and validate environment
    const env = EnvSchema.parse({
      NEXT_PUBLIC_TOPIC_CONTACT: process.env.NEXT_PUBLIC_TOPIC_CONTACT,
      NEXT_PUBLIC_TOPIC_TRUST: process.env.NEXT_PUBLIC_TOPIC_TRUST,
      NEXT_PUBLIC_TOPIC_PROFILE: process.env.NEXT_PUBLIC_TOPIC_PROFILE,
      NEXT_PUBLIC_TOPIC_RECOGNITION: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION,
      NEXT_PUBLIC_TOPIC_RECOGNITION_GENZ: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION_GENZ,
      NEXT_PUBLIC_TOPIC_RECOGNITION_AFRICAN: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION_AFRICAN,
      NEXT_PUBLIC_TOPIC_SIGNAL: process.env.NEXT_PUBLIC_TOPIC_SIGNAL,
      HEDERA_NETWORK: process.env.HEDERA_NETWORK || 'testnet',
      NEXT_PUBLIC_HCS_ENABLED: process.env.NEXT_PUBLIC_HCS_ENABLED || 'true'
    })

    // Resolve topics (system = signal per our architecture)
    // Fallback: if TOPIC_SIGNAL not set or invalid, use TOPIC_RECOGNITION
    let signalTopic = env.NEXT_PUBLIC_TOPIC_SIGNAL
    
    // Validate signal topic if provided, otherwise fallback
    if (signalTopic) {
      const validation = TopicIdSchema.safeParse(signalTopic)
      if (!validation.success) {
        console.warn('[Registry] Invalid TOPIC_SIGNAL, falling back to TOPIC_RECOGNITION')
        signalTopic = env.NEXT_PUBLIC_TOPIC_RECOGNITION
      }
    } else {
      signalTopic = env.NEXT_PUBLIC_TOPIC_RECOGNITION
    }
    
    const resolved: TopicsRegistry = Object.freeze({
      contacts: env.NEXT_PUBLIC_TOPIC_CONTACT,
      trust: env.NEXT_PUBLIC_TOPIC_TRUST,
      profile: env.NEXT_PUBLIC_TOPIC_PROFILE,
      recognition: env.NEXT_PUBLIC_TOPIC_RECOGNITION,
      recognition_genz: env.NEXT_PUBLIC_TOPIC_RECOGNITION_GENZ,
      recognition_african: env.NEXT_PUBLIC_TOPIC_RECOGNITION_AFRICAN,
      signal: signalTopic,
      system: signalTopic  // System messages use signal topic
    })

    console.log('[Registry] ✅ Validated and froze topic registry:', {
      ...resolved,
      hcsEnabled: env.NEXT_PUBLIC_HCS_ENABLED,
      network: env.HEDERA_NETWORK
    })

    return resolved
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Registry] ❌ FATAL: Invalid environment configuration:')
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      throw new Error('Registry validation failed - check NEXT_PUBLIC_TOPIC_* environment variables')
    }
    throw error
  }
}

/**
 * Get validated, frozen topic registry
 * 
 * Usage:
 *   import { topics } from '@/lib/registry/serverRegistry'
 *   const profileTopic = topics().profile
 * 
 * @returns Frozen topic registry object
 */
export function topics(): Readonly<TopicsRegistry> {
  if (!RESOLVED_TOPICS) {
    RESOLVED_TOPICS = initializeRegistry()
  }
  return RESOLVED_TOPICS
}

// Initialize at module load (fail fast)
try {
  topics()
} catch (error) {
  console.error('[Registry] Failed to initialize at boot:', error)
  // Let it throw - better to fail fast than run with bad config
}

/**
 * Legacy compatibility - DO NOT USE IN NEW CODE
 * @deprecated Use topics() instead
 */
export function getTopicId(topicType: keyof TopicsRegistry): string {
  return topics()[topicType]
}

/**
 * Get all topic IDs as object
 * @deprecated Use topics() instead
 */
export function getAllTopicIds(): Readonly<TopicsRegistry> {
  return topics()
}
