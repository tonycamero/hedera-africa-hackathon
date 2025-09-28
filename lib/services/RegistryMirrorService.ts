/**
 * Registry-aware Mirror Node service
 * 
 * This service consumes ONLY from the registry, never from environment variables.
 * This ensures no drift between what the registry declares and what services use.
 */

import { fetchRegistry, buildMirrorRestUrl, buildMirrorWsUrl } from '@/lib/registry/clientRegistry'
import type { RegistryConfig } from '@/lib/registry/serverRegistry'

export interface MirrorMessage {
  topicId: string
  sequenceNumber: number
  consensusTimestamp: string
  message: string
  decoded: string
}

export class RegistryMirrorService {
  private registry: RegistryConfig | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('[Registry Mirror] Initializing with registry...')
    this.registry = await fetchRegistry()
    this.isInitialized = true

    console.log('[Registry Mirror] Initialized with registry:', {
      env: this.registry.env,
      restUrl: this.registry.mirror.rest,
      wsUrl: this.registry.mirror.ws,
      hcsEnabled: this.registry.flags.HCS_ENABLED
    })
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  async fetchTopicMessages(topicId: string, limit = 50): Promise<MirrorMessage[]> {
    await this.ensureInitialized()

    if (!this.registry!.flags.HCS_ENABLED) {
      console.warn('[Registry Mirror] HCS disabled by registry flags')
      return []
    }

    try {
      const url = await buildMirrorRestUrl(topicId)
      const fullUrl = `${url}?limit=${limit}&order=desc`
      
      console.log(`[Registry Mirror] Fetching from registry-configured URL:`, fullUrl)

      const response = await fetch(fullUrl, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrustMesh Registry Service/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`REST ${response.status} for ${fullUrl}`)
      }

      const data = await response.json()
      const messages = data?.messages || []

      console.log(`[Registry Mirror] Topic ${topicId}: ${messages.length} messages`)

      return messages.map((msg: any) => ({
        topicId,
        sequenceNumber: msg.sequence_number,
        consensusTimestamp: msg.consensus_timestamp,
        message: msg.message,
        decoded: msg.message ? Buffer.from(msg.message, 'base64').toString('utf8') : ''
      }))
    } catch (error) {
      console.error(`[Registry Mirror] Failed to fetch topic ${topicId}:`, error)
      throw error
    }
  }

  async subscribeToTopic(
    topicId: string, 
    onMessage: (message: MirrorMessage) => void
  ): Promise<() => void> {
    await this.ensureInitialized()

    if (!this.registry!.flags.HCS_ENABLED) {
      console.warn('[Registry Mirror] HCS disabled by registry flags, no WebSocket subscription')
      return () => {}
    }

    const wsUrl = await buildMirrorWsUrl(topicId)
    console.log(`[Registry Mirror] Subscribing to WebSocket:`, wsUrl)

    let ws: WebSocket | null = null

    try {
      ws = new WebSocket(wsUrl)

      ws.addEventListener('open', () => {
        console.log(`[Registry Mirror] WebSocket connected: ${topicId}`)
      })

      ws.addEventListener('error', (error) => {
        console.error(`[Registry Mirror] WebSocket error ${topicId}:`, error)
      })

      ws.addEventListener('close', (event) => {
        console.log(`[Registry Mirror] WebSocket closed ${topicId}:`, event.code, event.reason)
      })

      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data)
          const message: MirrorMessage = {
            topicId,
            sequenceNumber: data.sequence_number,
            consensusTimestamp: data.consensus_timestamp,
            message: data.message,
            decoded: data.message ? Buffer.from(data.message, 'base64').toString('utf8') : ''
          }
          onMessage(message)
        } catch (parseError) {
          console.error(`[Registry Mirror] WebSocket parse error ${topicId}:`, parseError)
        }
      })
    } catch (error) {
      console.error(`[Registry Mirror] WebSocket connection failed ${topicId}:`, error)
    }

    // Return cleanup function
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log(`[Registry Mirror] Closing WebSocket ${topicId}`)
        ws.close()
      }
    }
  }

  // Get all configured topic IDs from registry
  async getConfiguredTopics(): Promise<Record<string, string>> {
    await this.ensureInitialized()
    
    const result: Record<string, string> = {}
    const topics = this.registry!.topics
    
    Object.entries(topics).forEach(([key, value]) => {
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

  // Check if a topic should use shared configuration
  async isSharedTopic(topicType: string): Promise<boolean> {
    await this.ensureInitialized()
    
    if (topicType === 'contacts' || topicType === 'trust') {
      return this.registry!.flags.SHARED_CONTACTS_TRUST_TOPIC
    }
    
    return false
  }

  // Get registry flags for feature detection
  async getFlags(): Promise<Record<string, any>> {
    await this.ensureInitialized()
    return this.registry!.flags
  }

  // Health check that uses registry URLs
  async healthCheck(): Promise<{ healthy: boolean; details: Record<string, any> }> {
    await this.ensureInitialized()

    const details: Record<string, any> = {
      registry: {
        initialized: this.isInitialized,
        env: this.registry!.env,
        hcsEnabled: this.registry!.flags.HCS_ENABLED
      }
    }

    if (!this.registry!.flags.HCS_ENABLED) {
      return {
        healthy: false,
        details: { ...details, reason: 'HCS disabled by registry flags' }
      }
    }

    try {
      // Test REST endpoint
      const restUrl = this.registry!.mirror.rest
      const response = await fetch(`${restUrl}/accounts?limit=1`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })

      details.rest = {
        url: restUrl,
        status: response.status,
        healthy: response.ok
      }

      return {
        healthy: response.ok,
        details
      }
    } catch (error) {
      details.rest = {
        url: this.registry!.mirror.rest,
        error: error instanceof Error ? error.message : String(error),
        healthy: false
      }

      return {
        healthy: false,
        details
      }
    }
  }
}

// Singleton instance
export const registryMirrorService = new RegistryMirrorService()