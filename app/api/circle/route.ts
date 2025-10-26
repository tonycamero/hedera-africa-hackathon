import { NextRequest, NextResponse } from 'next/server'
import { getBondedContactsFromHCS, getTrustStatsFromHCS, getTrustLevelsPerContact } from '@/lib/services/HCSDataUtils'
import { toLegacyEventArray } from '@/lib/services/HCSDataAdapter'
import { listSince, decodeBase64Json } from '@/lib/mirror/serverMirror'

const TOPICS = {
  contact: process.env.TOPIC_CONTACT,
  trust: process.env.TOPIC_TRUST,
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') || 'tm-alex-chen'
    
    console.log('[API /circle] Loading circle data for:', sessionId)
    
    // Load all HCS events from server-side using mirror API
    const trustTopicId = TOPICS.trust
    const contactTopicId = TOPICS.contact
    
    if (!trustTopicId || !contactTopicId) {
      throw new Error('Missing required topic IDs')
    }
    
    const [trustResult, contactResult] = await Promise.all([
      listSince(trustTopicId, undefined, 200),
      listSince(contactTopicId, undefined, 200)
    ])
    
    const trustEvents = trustResult.messages.map((m: any) => ({
      consensus_timestamp: m.consensus_timestamp,
      sequence_number: m.sequence_number,
      topic_id: m.topic_id,
      json: decodeBase64Json(m.message),
    }))
    
    const contactEvents = contactResult.messages.map((m: any) => ({
      consensus_timestamp: m.consensus_timestamp,
      sequence_number: m.sequence_number,
      topic_id: m.topic_id,
      json: decodeBase64Json(m.message),
    }))
    
    // Convert to legacy format
    const allEvents = toLegacyEventArray([
      ...trustEvents,
      ...contactEvents
    ] as any)
    
    console.log('[API /circle] Loaded', allEvents.length, 'events from HCS')
    console.log('[API /circle] Event types:', allEvents.map(e => e.type).filter((v, i, a) => a.indexOf(v) === i))
    console.log('[API /circle] Sample event:', allEvents[0])
    
    // Calculate circle data using HCS utilities
    const bondedContacts = getBondedContactsFromHCS(allEvents, sessionId)
    const trustStats = getTrustStatsFromHCS(allEvents, sessionId)
    const trustLevels = getTrustLevelsPerContact(allEvents, sessionId)
    
    // Convert Map to plain object for JSON serialization
    const trustLevelsObject: Record<string, { allocatedTo: number, receivedFrom: number }> = {}
    trustLevels.forEach((value, key) => {
      trustLevelsObject[key] = value
    })
    
    const response = {
      success: true,
      bondedContacts,
      trustStats: {
        allocatedOut: trustStats.allocatedOut,
        maxSlots: trustStats.cap,
        bondedContacts: bondedContacts.length
      },
      trustLevels: trustLevelsObject
    }
    
    console.log('[API /circle] Returning:', response.bondedContacts.length, 'contacts,', response.trustStats.allocatedOut, 'trust allocated')
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[API /circle] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load circle data' 
      },
      { status: 500 }
    )
  }
}
