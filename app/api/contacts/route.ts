import { NextResponse } from 'next/server'
import { TOPIC } from '@/lib/env'
import { backfillFromRest, MirrorMessage } from '@/lib/services/MirrorBackfill'
import { SignalEvent } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS, getTrustLevelsPerContact } from '@/lib/services/HCSDataUtils'

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
 * GET /api/contacts - Server-side contacts data endpoint
 * Returns bonded contacts and trust levels for a given session
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') || 'tm-alex-chen'
    
    console.log(`[API] /api/contacts - Fetching contacts for session: ${sessionId}`)
    
    // Get all topics
    const topics = [TOPIC.contacts, TOPIC.trust, TOPIC.profile, TOPIC.recognition].filter(Boolean)
    
    if (topics.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No topics configured',
        contacts: [],
        trustLevels: {},
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
    
    // Get bonded contacts using the HCS data utils
    const bondedContacts = getBondedContactsFromHCS(signalEvents, sessionId)
    
    // Get trust levels per contact
    const trustLevelsMap = getTrustLevelsPerContact(signalEvents, sessionId)
    
    // Convert Map to plain object for JSON serialization
    const trustLevels: Record<string, { allocatedTo: number, receivedFrom: number }> = {}
    trustLevelsMap.forEach((value, key) => {
      trustLevels[key] = value
    })
    
    console.log(`[API] /api/contacts - Returning ${bondedContacts.length} contacts for ${sessionId}`)
    
    return NextResponse.json({
      success: true,
      contacts: bondedContacts,
      trustLevels,
      sessionId,
      count: bondedContacts.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[API] /api/contacts error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch contacts data',
      contacts: [],
      trustLevels: {},
      count: 0
    }, { status: 500 })
  }
}