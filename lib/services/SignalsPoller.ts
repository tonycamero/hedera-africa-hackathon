/**
 * Client-side signals polling service
 * Fetches recent signals from mirror node and updates signals store
 * Designed for serverless environments where persistent connections aren't viable
 */

import { signalsStore, type SignalEvent } from '@/lib/stores/signalsStore'
import { fetchTopicMessages } from '@/lib/mirror/serverMirror'
import { TOPICS } from '@/lib/env'

interface PollerConfig {
  interval: number // Poll interval in milliseconds
  enabled: boolean
  topics: Record<string, string>
}

class SignalsPollerService {
  private pollingInterval: NodeJS.Timeout | null = null
  private config: PollerConfig
  private lastPollTimes: Record<string, number> = {}
  
  constructor() {
    this.config = {
      interval: 30000, // 30 seconds
      enabled: typeof window !== 'undefined', // Only run in browser
      topics: TOPICS
    }
  }

  /**
   * Start polling for signals
   */
  start(): void {
    if (!this.config.enabled) {
      console.info('[SignalsPoller] Skipping - not in browser environment')
      return
    }

    if (this.pollingInterval) {
      console.info('[SignalsPoller] Already running')
      return
    }

    console.info('[SignalsPoller] Starting signals polling...')
    
    // Initial poll
    this.pollAllTopics()
    
    // Set up interval
    this.pollingInterval = setInterval(() => {
      this.pollAllTopics()
    }, this.config.interval)
    
    console.info(`[SignalsPoller] Polling every ${this.config.interval}ms`)
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
      console.info('[SignalsPoller] Stopped polling')
    }
  }

  /**
   * Poll all configured topics for new messages
   */
  private async pollAllTopics(): Promise<void> {
    const topicEntries = Object.entries(this.config.topics).filter(([_, topicId]) => 
      topicId && topicId.trim() !== '' && topicId.match(/^0\.0\.[0-9]+$/)
    )

    console.info(`[SignalsPoller] Polling ${topicEntries.length} topics...`)

    const pollPromises = topicEntries.map(([topicKey, topicId]) => 
      this.pollTopic(topicKey, topicId)
    )

    await Promise.allSettled(pollPromises)
  }

  /**
   * Poll a specific topic for new messages
   */
  private async pollTopic(topicKey: string, topicId: string): Promise<void> {
    try {
      // Get recent messages (limit 50 to catch recent activity)
      const messages = await this.fetchTopicMessagesClient(topicId, 50)
      
      let newMessageCount = 0
      
      for (const message of messages) {
        if (message.json && this.isValidSignalMessage(message.json)) {
          const signal = this.convertToSignalEvent(message, topicKey, topicId)
          
          // Only add if we haven't seen this exact message before
          if (signal && !this.hasSeenMessage(signal.id || '')) {
            signalsStore.add(signal)
            newMessageCount++
          }
        }
      }
      
      if (newMessageCount > 0) {
        console.info(`[SignalsPoller] Added ${newMessageCount} new signals from ${topicKey}`)
      }
      
    } catch (error) {
      console.error(`[SignalsPoller] Failed to poll topic ${topicKey}:`, error)
    }
  }

  /**
   * Client-side mirror node fetch (uses public endpoints)
   */
  private async fetchTopicMessagesClient(topicId: string, limit: number = 50): Promise<any[]> {
    const mirrorUrl = process.env.NEXT_PUBLIC_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com/api/v1'
    const url = `${mirrorUrl}/topics/${topicId}/messages?limit=${limit}&order=desc`
    
    const response = await fetch(url, { cache: 'no-store' })
    
    if (!response.ok) {
      throw new Error(`Mirror node fetch failed: ${response.status}`)
    }
    
    const data = await response.json()
    const messages = (data.messages || []).map((m: any) => {
      const utf8 = atob(m.message) // Browser-compatible base64 decode
      let json: any = null
      try { 
        json = JSON.parse(utf8) 
      } catch {}
      return { ...m, decoded: utf8, json }
    })
    
    return messages
  }

  /**
   * Check if message looks like a valid signal
   */
  private isValidSignalMessage(message: any): boolean {
    return message && 
           typeof message.type === 'string' &&
           (message.type === 'RECOGNITION_MINT' || 
            message.type === 'CONTACT_REQUEST' || 
            message.type === 'CONTACT_ACCEPT' ||
            message.type === 'TRUST_ALLOCATE' ||
            message.type === 'PROFILE_UPDATE')
  }

  /**
   * Convert mirror node message to SignalEvent format
   */
  private convertToSignalEvent(message: any, topicKey: string, topicId: string): SignalEvent | null {
    if (!message.json) return null
    
    const json = message.json
    
    // For PROFILE_UPDATE, fields are at top level (flat structure)
    // For other events, they may be nested in payload
    const isProfileUpdate = json.type === 'PROFILE_UPDATE'
    const metadataSource = isProfileUpdate ? json : (json.payload || {})
    
    return {
      id: `${topicId}:${message.consensus_timestamp}`,
      type: json.type,
      actor: json.accountId || json.from || json.actor || 'unknown',
      target: json.target || json.payload?.recipientId || json.payload?.to,
      ts: Math.floor(parseFloat(message.consensus_timestamp) * 1000), // Convert to millis
      topicId: topicId,
      metadata: {
        ...metadataSource,
        consensusTimestamp: message.consensus_timestamp,
        sequenceNumber: message.sequence_number,
        topicKey: topicKey
      },
      source: 'hcs-cached' as const
    }
  }

  /**
   * Check if we've already processed this message
   */
  private hasSeenMessage(messageId: string): boolean {
    if (!messageId) return false
    
    // Simple check - see if signal with this ID exists
    const existingSignals = signalsStore.getAll()
    return existingSignals.some(signal => signal.id === messageId)
  }

  /**
   * Get current polling status
   */
  getStatus() {
    return {
      running: this.pollingInterval !== null,
      interval: this.config.interval,
      enabled: this.config.enabled,
      topics: Object.keys(this.config.topics).length,
      lastPollTimes: { ...this.lastPollTimes }
    }
  }
}

// Export singleton instance
export const signalsPoller = new SignalsPollerService()

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  // Start after a short delay to let the app initialize
  setTimeout(() => {
    signalsPoller.start()
  }, 2000)
  
  // Add to window for debugging
  ;(window as any).signalsPoller = signalsPoller
}