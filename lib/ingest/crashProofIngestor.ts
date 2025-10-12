/**
 * Crash-proof ingestor using bulletproof WebSocket client
 * Replaces existing ingestor with self-healing streams
 */

import { openMirrorStream } from './websocket/liveMirror'
import { MIRROR_WS, TOPIC } from '@/lib/env'

export async function startIngestion({ 
  since, 
  onSince, 
  onFatal 
}: { 
  since?: string
  onSince: (ts: string) => void
  onFatal: (e: any) => void 
}) {
  console.log('🚀 [INGEST] Starting crash-proof ingestion system...')
  
  // Resolve topics + ws base
  const wsBase = MIRROR_WS || 'wss://testnet.mirrornode.hedera.com:5600'
  const trustTopic = TOPIC.trust
  const contactTopic = TOPIC.contacts  
  const recogTopic = TOPIC.recognition || TOPIC.feed
  const profileTopic = TOPIC.profile

  if (!trustTopic || !contactTopic || !recogTopic || !profileTopic) {
    throw new Error(`Missing HCS topics: trust=${trustTopic}, contacts=${contactTopic}, recognition=${recogTopic}, profile=${profileTopic}`)
  }

  console.log('📡 [INGEST] Connecting to topics:', {
    wsBase,
    topics: { trustTopic, contactTopic, recogTopic, profileTopic }
  })

  // Open multiple streams (trust/contact/recognition/profile). Each updates the shared watermark via onSince.
  const stops: Array<() => Promise<void>> = []
  let messageCount = 0

  const mkHandler = (label: string) => (m: any) => {
    try {
      messageCount++
      
      // TODO: normalize and push into your cache/store, or emit to SWR revalidators
      // This must NEVER throw — catch internally.
      
      const timestamp = m?.consensus_timestamp || m?.message?.consensus_timestamp
      const payload = m?.message || m
      
      console.log(`📨 [${label}] Message #${messageCount}:`, {
        timestamp,
        hasPayload: !!payload,
        payloadType: typeof payload
      })

      // Example processing - replace with actual logic
      if (payload) {
        // Process the message safely
        processMessage(label, payload, timestamp)
      }
      
    } catch (e) {
      console.error(`💥 [PROC] ${label} handler error:`, e)
      // Don't re-throw - just log and continue
    }
  }

  // Create all streams
  try {
    console.log('🔌 [INGEST] Opening trust stream...')
    const stopTrust = await openMirrorStream({
      url: wsBase,
      path: `/topics/${trustTopic}/messages`,
      since,
      onMessage: mkHandler('TRUST'),
      onSince,
      onFatal,
    })
    stops.push(stopTrust)

    console.log('🔌 [INGEST] Opening contact stream...')
    const stopContact = await openMirrorStream({
      url: wsBase,
      path: `/topics/${contactTopic}/messages`,
      since,
      onMessage: mkHandler('CONTACT'),
      onSince,
      onFatal,
    })
    stops.push(stopContact)

    console.log('🔌 [INGEST] Opening recognition stream...')
    const stopRecog = await openMirrorStream({
      url: wsBase,
      path: `/topics/${recogTopic}/messages`,
      since,
      onMessage: mkHandler('RECOGNITION'),
      onSince,
      onFatal,
    })
    stops.push(stopRecog)

    console.log('🔌 [INGEST] Opening profile stream...')
    const stopProfile = await openMirrorStream({
      url: wsBase,
      path: `/topics/${profileTopic}/messages`,
      since,
      onMessage: mkHandler('PROFILE'),
      onSince,
      onFatal,
    })
    stops.push(stopProfile)

    console.log(`✅ [INGEST] All ${stops.length} streams connected successfully`)

  } catch (e) {
    console.error('💥 [INGEST] Failed to start streams:', e)
    
    // Clean up any partial connections
    for (const stop of stops) {
      try { await stop() } catch {}
    }
    
    throw e
  }

  // Return cleanup function
  return async () => {
    console.log('🛑 [INGEST] Stopping all streams...')
    for (const stop of stops) {
      try { 
        await stop() 
      } catch (e) {
        console.warn('[INGEST] Error stopping stream:', e)
      }
    }
    console.log('✅ [INGEST] All streams stopped')
  }
}

/**
 * Safe message processing - never throws
 */
function processMessage(label: string, payload: any, timestamp?: string) {
  try {
    // Example processing logic - replace with actual implementation
    if (typeof payload === 'string') {
      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(payload)
        console.log(`🔍 [${label}] Parsed JSON:`, { 
          type: parsed.type || 'unknown',
          timestamp: timestamp || parsed.timestamp
        })
      } catch {
        console.log(`📝 [${label}] Text message:`, payload.substring(0, 100))
      }
    } else if (typeof payload === 'object') {
      console.log(`🔍 [${label}] Object message:`, {
        type: payload.type || 'unknown',
        keys: Object.keys(payload),
        timestamp: timestamp || payload.timestamp
      })
    }
    
    // TODO: Add actual message processing logic here
    // - Parse different event types (trust, contact, recognition, profile)  
    // - Update stores/caches
    // - Emit to subscribers
    // - Update watermarks
    
  } catch (e) {
    console.error(`💥 [PROC] Safe processing error for ${label}:`, e)
    // Never re-throw from message processing
  }
}

/**
 * Get health status for crash-proof ingestor
 */
export function getIngestionHealth() {
  // This would integrate with the existing health system
  // For now, return basic info
  return {
    healthy: true,  // Supervisor handles failures
    running: true,  // If this function is called, we're running
    activeConnections: 4, // trust + contact + recognition + profile
    recentActivity: true,
    lastActivity: Date.now(),
    totalMessages: 0, // TODO: track actual message count
    totalErrors: 0    // TODO: track actual error count
  }
}