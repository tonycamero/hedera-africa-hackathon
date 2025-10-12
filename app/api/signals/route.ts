import { NextResponse } from 'next/server'
import { TOPIC } from '@/lib/env'
import { backfillFromRest, MirrorMessage } from '@/lib/services/MirrorBackfill'
import { SignalEvent } from '@/lib/stores/signalsStore'

/**
 * Convert Mirror message to SignalEvent format
 */
function mirrorToSignalEvent(message: MirrorMessage): SignalEvent | null {
  try {
    const hcsData = JSON.parse(message.decoded)
    
    // Normalize to SignalEvent format
    const normalized = {
      type: hcsData.type,
      actor: hcsData.from || hcsData.actor,
      target: hcsData.to || hcsData.target || hcsData.payload?.to,
      ts: hcsData.ts || (hcsData.timestamp ? new Date(hcsData.timestamp).getTime() : Date.now()),
      metadata: hcsData.payload || hcsData.metadata || {}
    }
    
    if (!normalized.type || !normalized.actor) {
      return null
    }
    
    // Determine signal type
    let signalType = normalized.type.toUpperCase()
    if (normalized.type.includes('contact_request')) signalType = 'CONTACT_REQUEST'
    else if (normalized.type.includes('contact_accept')) signalType = 'CONTACT_ACCEPT'
    else if (normalized.type.includes('trust_allocate')) signalType = 'TRUST_ALLOCATE'
    else if (normalized.type.includes('recognition')) signalType = 'RECOGNITION_MINT'
    
    const signalEvent: SignalEvent = {
      id: hcsData.id || `mirror_${message.topicId}_${message.sequenceNumber}`,
      type: signalType,
      actor: normalized.actor,
      target: normalized.target,
      ts: normalized.ts,
      topicId: message.topicId,
      source: 'hcs' as const,
      metadata: normalized.metadata
    }
    
    return signalEvent
  } catch (error) {
    console.error('[API] Parse error:', error)
    return null
  }
}

/**
 * GET /api/signals - Server-side signals data endpoint
 * Fetches data directly from HCS Mirror Node
 */
export async function GET() {
  try {
    console.log('[API] /api/signals - Fetching from Mirror Node...')
    
    // Get all topics
    const topics = [TOPIC.contacts, TOPIC.trust, TOPIC.profile, TOPIC.recognition].filter(Boolean)
    
    if (topics.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No topics configured',
        signals: [],
        count: 0
      })
    }
    
    // Fetch from all topics
    const allMessages: MirrorMessage[] = []
    const fetchPromises = topics.map(async (topic) => {
      try {
        const messages = await backfillFromRest(topic, 50)
        return messages
      } catch (error) {
        console.error(`[API] Failed to fetch topic ${topic}:`, error)
        return []
      }
    })
    
    const results = await Promise.all(fetchPromises)
    results.forEach(messages => allMessages.push(...messages))
    
    // Convert to SignalEvents
    const signalEvents: SignalEvent[] = allMessages
      .map(mirrorToSignalEvent)
      .filter(Boolean) as SignalEvent[]
    
    // Sort by timestamp (newest first)
    signalEvents.sort((a, b) => b.ts - a.ts)
    
    console.log(`[API] /api/signals - Returning ${signalEvents.length} events from ${allMessages.length} messages`)
    
    return NextResponse.json({
      success: true,
      signals: signalEvents,
      count: signalEvents.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[API] /api/signals error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch signals data',
      signals: [],
      count: 0
    }, { status: 500 })
  }
}
