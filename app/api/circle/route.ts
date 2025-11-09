import { NextRequest, NextResponse } from 'next/server'
import { getBondedContactsFromHCS, getTrustStatsFromHCS, getTrustLevelsPerContact } from '@/lib/services/HCSDataUtils'
import { toLegacyEventArray } from '@/lib/services/HCSDataAdapter'
import { listSince, decodeBase64Json } from '@/lib/mirror/serverMirror'
import { getRegistryTopics } from '@/lib/hcs2/registry'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    // Validate session ID - must be a real Hedera account ID (0.0.X format) or null
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'No session ID provided - user not authenticated' },
        { status: 401 }
      )
    }
    
    // Reject legacy demo IDs
    if (sessionId.startsWith('tm-')) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID - demo accounts not supported. Please sign in with Magic.' },
        { status: 400 }
      )
    }
    
    // Validate Hedera account ID format (0.0.XXXXX)
    if (!sessionId.match(/^0\.0\.\d+$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Hedera account ID format' },
        { status: 400 }
      )
    }
    
    console.log('[API /circle] Loading circle data for:', sessionId)
    
    // Get topics from registry (single source of truth)
    const registry = await getRegistryTopics()
    const trustTopicId = registry.trust
    const contactTopicId = registry.contacts
    const profileTopicId = registry.profile
    
    console.log('[API /circle] Using registry topics:', { trust: trustTopicId, contacts: contactTopicId, profile: profileTopicId })
    
    if (!trustTopicId || !contactTopicId || !profileTopicId) {
      throw new Error('Missing required topic IDs from registry')
    }
    
    // Fetch messages with error handling for empty topics
    const fetchWithFallback = async (topicId: string) => {
      try {
        return await listSince(topicId, undefined, 200)
      } catch (error) {
        // If topic is empty or doesn't exist yet, return empty result
        if (error instanceof Error && error.message.includes('404')) {
          console.warn(`[API /circle] Topic ${topicId} returned 404, treating as empty`)
          return { messages: [], watermark: '0.0' }
        }
        throw error
      }
    }
    
    const [trustResult, contactResult, profileResult] = await Promise.all([
      fetchWithFallback(trustTopicId),
      fetchWithFallback(contactTopicId),
      fetchWithFallback(profileTopicId)
    ])
    
    const trustEvents = trustResult.messages
      .filter((m: any) => m && m.message && m.consensus_timestamp)
      .map((m: any) => {
        const json = decodeBase64Json(m.message)
        if (!json) {
          console.warn('[API /circle] Failed to decode message:', m.consensus_timestamp)
          return null
        }
        return {
          consensus_timestamp: m.consensus_timestamp,
          sequence_number: m.sequence_number,
          topic_id: m.topic_id,
          json,
        }
      })
      .filter((m: any) => m !== null)
    
    const contactEvents = contactResult.messages
      .filter((m: any) => m && m.message && m.consensus_timestamp)
      .map((m: any) => {
        const json = decodeBase64Json(m.message)
        if (!json) {
          console.warn('[API /circle] Failed to decode message:', m.consensus_timestamp)
          return null
        }
        return {
          consensus_timestamp: m.consensus_timestamp,
          sequence_number: m.sequence_number,
          topic_id: m.topic_id,
          json,
        }
      })
      .filter((m: any) => m !== null)
    
    const profileEvents = profileResult.messages
      .filter((m: any) => m && m.message && m.consensus_timestamp)
      .map((m: any) => {
        const json = decodeBase64Json(m.message)
        if (!json) {
          console.warn('[API /circle] Failed to decode profile message:', m.consensus_timestamp)
          return null
        }
        return {
          consensus_timestamp: m.consensus_timestamp,
          sequence_number: m.sequence_number,
          topic_id: m.topic_id,
          json,
        }
      })
      .filter((m: any) => m !== null)
    
    // Filter events by type/version whitelist (v2 schema)
    const filteredEvents = [...trustEvents, ...contactEvents, ...profileEvents].filter((event: any) => {
      const payload = event.json?.payload || event.json
      
      // Type whitelist - only allow real contact/trust/profile operations
      const allowedTypes = [
        'CONTACT_REQUEST',
        'CONTACT_ACCEPT', 
        'CONTACT_MIRROR',
        'TRUST_ALLOCATE',
        'TRUST_REVOKE',
        'PROFILE_UPDATE',
        'RECOGNITION_DEFINITION',
        'RECOGNITION_MINT'
      ]
      
      const type = event.json?.type || payload?.type
      if (!allowedTypes.includes(type)) {
        console.log('[API /circle] Filtered out disallowed type:', type)
        return false
      }
      
      // Schema version check - prefer v:2, allow v:1 for backward compat
      const version = payload?.v || 1
      if (version < 1 || version > 2) {
        console.log('[API /circle] Filtered out invalid version:', version)
        return false
      }
      
      // Audience validation - must be 'trustmesh' for v2
      if (version === 2 && payload?.aud !== 'trustmesh') {
        console.log('[API /circle] Filtered out invalid audience:', payload?.aud)
        return false
      }
      
      return true
    })
    
    console.log('[API /circle] Filtered', trustEvents.length + contactEvents.length, '→', filteredEvents.length, 'events')
    
    // Convert to legacy format
    const allEvents = toLegacyEventArray(filteredEvents as any)
    
    console.log('[API /circle] Loaded', allEvents.length, 'events from HCS')
    console.log('[API /circle] Event types:', allEvents.map(e => e.type).filter((v, i, a) => a.indexOf(v) === i))
    console.log('[API /circle] Sample event:', allEvents[0])
    
    // Calculate circle data using HCS utilities
    const bondedContacts = getBondedContactsFromHCS(allEvents, sessionId)
    const trustStats = getTrustStatsFromHCS(allEvents, sessionId)
    const trustLevels = getTrustLevelsPerContact(allEvents, sessionId)
    
    console.log('[API /circle] Trust events found:', allEvents.filter(e => e.type === 'TRUST_ALLOCATE').length)
    console.log('[API /circle] Sample trust event:', allEvents.find(e => e.type === 'TRUST_ALLOCATE'))
    console.log('[API /circle] Trust levels calculated:', trustLevels.size, 'contacts')
    console.log('[API /circle] Trust levels:', Array.from(trustLevels.entries()))
    
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
