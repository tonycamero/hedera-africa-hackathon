import { NextRequest, NextResponse } from 'next/server'
import { TOPIC } from '@/lib/env'
import { backfillFromRest, MirrorMessage } from '@/lib/services/MirrorBackfill'
import { SignalEvent } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS, getTrustStatsFromHCS, getTrustLevelsPerContact } from '@/lib/services/HCSDataUtils'

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
      target: hcsData.to || hcsData.target || hcsData.payload?.to || hcsData.payload?.target,
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
 * GET /api/debug/topic?topic=trust&sessionId=tm-alex-chen
 * Test individual topics to debug intermittent issues
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicName = searchParams.get('topic') || 'trust'
    const sessionId = searchParams.get('sessionId') || 'tm-alex-chen'
    
    console.log(`[Debug API] Testing topic: ${topicName} for session: ${sessionId}`)
    
    // Get the specific topic
    let topicId: string | undefined
    switch (topicName) {
      case 'contacts':
        topicId = TOPIC.contacts
        break
      case 'trust':
        topicId = TOPIC.trust
        break
      case 'profile':
        topicId = TOPIC.profile
        break
      case 'recognition':
        topicId = TOPIC.recognition
        break
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown topic: ${topicName}. Use: contacts, trust, profile, recognition`
        }, { status: 400 })
    }
    
    if (!topicId) {
      return NextResponse.json({
        success: false,
        error: `Topic ${topicName} not configured`,
        topicId: null
      })
    }
    
    console.log(`[Debug API] Fetching from topic ${topicName} (${topicId})`)
    
    // Fetch from the specific topic
    const startTime = Date.now()
    const messages = await backfillFromRest(topicId, 50)
    const fetchTime = Date.now() - startTime
    
    // Convert to SignalEvents
    const signalEvents: SignalEvent[] = messages
      .map(mirrorToSignalEvent)
      .filter(Boolean) as SignalEvent[]
    
    // Filter events for the session
    const sessionEvents = signalEvents.filter(e => 
      e.actor === sessionId || e.target === sessionId
    )
    
    // Get specific analysis based on topic type
    let analysis: any = {}
    
    if (topicName === 'contacts') {
      const bondedContacts = getBondedContactsFromHCS(signalEvents, sessionId)
      analysis = {
        bondedContactsCount: bondedContacts.length,
        bondedContacts: bondedContacts.map(c => ({ peerId: c.peerId, handle: c.handle })),
        contactEvents: sessionEvents.filter(e => 
          e.type === 'CONTACT_REQUEST' || e.type === 'CONTACT_ACCEPT'
        ).map(e => ({
          type: e.type,
          actor: e.actor,
          target: e.target,
          timestamp: new Date(e.ts).toISOString()
        }))
      }
    } else if (topicName === 'trust') {
      const trustStats = getTrustStatsFromHCS(signalEvents, sessionId)
      const trustLevelsMap = getTrustLevelsPerContact(signalEvents, sessionId)
      const trustLevels: Record<string, any> = {}
      trustLevelsMap.forEach((value, key) => {
        trustLevels[key] = value
      })
      
      analysis = {
        trustStats,
        trustLevels,
        trustEvents: sessionEvents.filter(e => 
          e.type === 'TRUST_ALLOCATE' || e.type === 'TRUST_REVOKE'
        ).map(e => ({
          type: e.type,
          actor: e.actor,
          target: e.target,
          weight: e.metadata?.weight || 1,
          timestamp: new Date(e.ts).toISOString()
        }))
      }
    } else {
      // For profile and recognition, just show the events
      analysis = {
        sessionEvents: sessionEvents.map(e => ({
          type: e.type,
          actor: e.actor,
          target: e.target,
          timestamp: new Date(e.ts).toISOString(),
          metadata: e.metadata
        }))
      }
    }
    
    return NextResponse.json({
      success: true,
      topic: topicName,
      topicId,
      sessionId,
      fetchTimeMs: fetchTime,
      totalMessages: messages.length,
      totalSignalEvents: signalEvents.length,
      sessionSpecificEvents: sessionEvents.length,
      analysis,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[Debug API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch topic data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}