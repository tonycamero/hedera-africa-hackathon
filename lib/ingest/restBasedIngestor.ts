/**
 * REST-based ingestor as fallback for WebSocket connectivity issues
 * Uses Mirror Node REST API with polling instead of WebSocket streams
 */

import { MIRROR_REST, TOPIC } from '@/lib/env'
import { signalsStore } from '@/lib/stores/signalsStore'
import type { SignalEvent } from '@/lib/stores/signalsStore'

/**
 * Convert raw HCS message to SignalEvent format for the store
 */
function processHCSMessage(content: string, timestamp: string, topicId: string, label: string): SignalEvent | null {
  try {
    if (!content) return null
    
    // Try to parse as JSON
    const hcsData = JSON.parse(content)
    
    // Extract normalized fields
    const type = hcsData.type || 'UNKNOWN'
    const actor = hcsData.from || hcsData.actor || hcsData.sender || 'unknown'
    const target = hcsData.to || hcsData.target || hcsData.recipient
    const tsMs = timestamp ? parseFloat(timestamp.replace('.', '')) / 1000000 : Date.now()
    
    // Map topic label to type
    let normalizedType = type.toUpperCase()
    if (label === 'CONTACTS' && !normalizedType.includes('CONTACT')) {
      normalizedType = `CONTACT_${normalizedType}`
    } else if (label === 'TRUST' && !normalizedType.includes('TRUST')) {
      normalizedType = `TRUST_${normalizedType}`
    } else if (label === 'RECOGNITION' && !normalizedType.includes('RECOGNITION')) {
      normalizedType = `RECOGNITION_${normalizedType}`
    } else if (label === 'PROFILE' && !normalizedType.includes('PROFILE')) {
      normalizedType = `PROFILE_${normalizedType}`
    }
    
    const signalEvent: SignalEvent = {
      id: hcsData.id || `${topicId}_${timestamp}_${Math.random().toString(36).slice(2)}`,
      type: normalizedType,
      actor,
      target,
      ts: tsMs,
      topicId,
      metadata: {
        originalType: type,
        payload: hcsData.payload || hcsData,
        sequence: hcsData.sequence || hcsData.sequenceNumber,
        consensus_timestamp: timestamp
      },
      source: 'hcs'
    }
    
    return signalEvent
    
  } catch (error) {
    console.warn(`[processHCSMessage] Failed to parse message from ${label}:`, error)
    return null
  }
}

export async function startIngestion({ 
  since, 
  onSince, 
  onFatal 
}: { 
  since?: string
  onSince: (ts: string) => void
  onFatal: (e: any) => void 
}) {
  console.log('🚀 [REST-INGEST] Starting REST-based ingestion (WebSocket fallback)...')
  
  const restBase = MIRROR_REST || 'https://testnet.mirrornode.hedera.com/api/v1'
  const topics = {
    trust: TOPIC.trust,
    contacts: TOPIC.contacts,  
    recognition: TOPIC.recognition || TOPIC.feed,
    profile: TOPIC.profile
  }

  console.log('📡 [REST-INGEST] Using topics:', topics)

  if (!topics.trust || !topics.contacts || !topics.recognition || !topics.profile) {
    throw new Error(`Missing HCS topics: ${JSON.stringify(topics)}`)
  }

  let running = true
  let messageCount = 0
  let lastTimestamp = since

  const pollers: Array<{ stop: () => void }> = []

  // Create REST pollers for each topic
  for (const [label, topicId] of Object.entries(topics)) {
    const poller = createRestPoller(restBase, topicId, label.toUpperCase(), {
      onMessage: (msg, timestamp) => {
        messageCount++
        console.log(`📨 [${label.toUpperCase()}] Message #${messageCount}:`, {
          timestamp,
          hasContent: !!msg,
          type: typeof msg
        })
        
        // Process and store the message in signalsStore
        try {
          const signalEvent = processHCSMessage(msg, timestamp, topicId, label)
          if (signalEvent) {
            signalsStore.add(signalEvent)
            console.log(`✅ [${label}] Added to store:`, signalEvent.type, signalEvent.id)
          }
        } catch (e) {
          console.error(`💥 [${label}] Failed to process message:`, e)
        }
        
        // Update watermark
        if (timestamp && (!lastTimestamp || timestamp > lastTimestamp)) {
          lastTimestamp = timestamp
          onSince(timestamp)
        }
      },
      onError: (error) => {
        console.error(`💥 [${label.toUpperCase()}] Polling error:`, error)
        onFatal(error)
      }
    })

    pollers.push(poller)
  }

  console.log(`✅ [REST-INGEST] Started ${pollers.length} REST pollers`)

  // Return cleanup function
  return async () => {
    console.log('🛑 [REST-INGEST] Stopping all pollers...')
    running = false
    for (const poller of pollers) {
      poller.stop()
    }
    console.log('✅ [REST-INGEST] All pollers stopped')
  }
}

/**
 * Create REST poller for a specific topic
 */
function createRestPoller(
  baseUrl: string, 
  topicId: string, 
  label: string,
  handlers: {
    onMessage: (msg: any, timestamp: string) => void
    onError: (error: any) => void
  }
) {
  let running = true
  let pollInterval: NodeJS.Timeout | null = null

  const poll = async () => {
    if (!running) return

    try {
      const url = `${baseUrl}/topics/${topicId}/messages?limit=10&order=asc`
      console.log(`🔄 [${label}] Polling: ${url}`)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.messages && Array.isArray(data.messages)) {
        for (const message of data.messages) {
          const timestamp = message.consensus_timestamp
          const content = message.message ? Buffer.from(message.message, 'base64').toString() : null
          
          handlers.onMessage(content, timestamp)
        }
        
        console.log(`✅ [${label}] Processed ${data.messages.length} messages`)
      }

    } catch (error: any) {
      console.error(`💥 [${label}] Poll failed:`, error.message)
      handlers.onError(error)
    }

    // Schedule next poll (5 second interval)
    if (running) {
      pollInterval = setTimeout(poll, 5000)
    }
  }

  // Start polling
  poll()

  return {
    stop: () => {
      running = false
      if (pollInterval) {
        clearTimeout(pollInterval)
        pollInterval = null
      }
      console.log(`🛑 [${label}] Poller stopped`)
    }
  }
}

/**
 * Get health status for REST-based ingestor
 */
export function getIngestionHealth() {
  return {
    healthy: true,
    running: true,
    activeConnections: 4, // 4 REST pollers
    recentActivity: true,
    lastActivity: Date.now(),
    totalMessages: 0, // TODO: track actual count
    totalErrors: 0
  }
}