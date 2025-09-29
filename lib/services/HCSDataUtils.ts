import type { SignalEvent, BondedContact } from "@/lib/stores/signalsStore"

// Utility functions to derive data structures from HCS feed events
// This replaces the local storage-based data with HCS chain data

export interface HCSTrustStats {
  allocatedOut: number
  cap: number
  receivedIn: number
}

export interface HCSMetrics {
  bondedContacts: number
  trustAllocated: number
  trustCapacity: number
  recognitionOwned: number
}

// Derive bonded contacts from HCS contact events
export function getBondedContactsFromHCS(events: SignalEvent[], sessionId: string): BondedContact[] {
  console.log('[getBondedContactsFromHCS] Processing events for sessionId:', sessionId)
  console.log('[getBondedContactsFromHCS] Total events:', events.length)
  
  const bondedMap = new Map<string, BondedContact>()
  
  // Process contact events to find bonded relationships
  // Note: Current SignalEvent interface doesn't have 'class' field, so filter by type
  const contactEvents = events
    .filter(e => e.type === 'CONTACT_REQUEST' || e.type === 'CONTACT_ACCEPT')
    .sort((a, b) => a.ts - b.ts) // Process in chronological order
  
  console.log('[getBondedContactsFromHCS] Found', contactEvents.length, 'contact events')
  console.log('[getBondedContactsFromHCS] Contact event types:', contactEvents.map(e => e.type))
  
  for (const event of contactEvents) {
    // Current SignalEvent uses actor/target instead of actors.from/actors.to
    const from = event.actor
    const to = event.target
    const otherParty = from === sessionId ? to : from
    
    console.log('[getBondedContactsFromHCS] Processing event:', {
      type: event.type,
      from,
      to,
      otherParty,
      sessionId
    })
    
    if (!otherParty) {
      console.log('[getBondedContactsFromHCS] Skipping event with no otherParty')
      continue
    }
    
    if (event.type === 'CONTACT_REQUEST') {
      // Track contact request (but not bonded yet)
      if (!bondedMap.has(otherParty)) {
        bondedMap.set(otherParty, {
          peerId: otherParty,
          handle: event.metadata?.handle || `User ${otherParty.slice(-6)}`,
          bondedAt: event.ts,
          trustLevel: undefined // Not bonded yet
        })
      }
    } else if (event.type === 'CONTACT_ACCEPT') {
      // Contact is now bonded
      const existing = bondedMap.get(otherParty)
      bondedMap.set(otherParty, {
        peerId: otherParty,
        handle: existing?.handle || event.metadata?.handle || `User ${otherParty.slice(-6)}`,
        bondedAt: event.ts,
        trustLevel: existing?.trustLevel // Preserve any trust level
      })
    }
  }
  
  // Add consolidated trust levels to bonded contacts (sum all allocations per contact)
  const trustEvents = events
    .filter(e => e.type === 'TRUST_ALLOCATE' || e.type === 'TRUST_REVOKE')
    .filter(e => e.actor === sessionId) // Only outbound trust from this user
    .sort((a, b) => a.ts - b.ts) // Process in chronological order
  
  // Track trust per peer (sum all allocations, subtract revocations)
  const trustByPeer = new Map<string, number>()
  
  for (const trustEvent of trustEvents) {
    const targetId = trustEvent.target
    if (targetId && bondedMap.has(targetId)) {
      const currentTrust = trustByPeer.get(targetId) || 0
      
      if (trustEvent.type === 'TRUST_ALLOCATE') {
        const weight = trustEvent.metadata?.weight || 1
        trustByPeer.set(targetId, currentTrust + weight)
      } else if (trustEvent.type === 'TRUST_REVOKE') {
        const weight = trustEvent.metadata?.weight || 1
        trustByPeer.set(targetId, Math.max(0, currentTrust - weight))
      }
    }
  }
  
  // Apply consolidated trust levels to contacts
  trustByPeer.forEach((totalTrust, peerId) => {
    const contact = bondedMap.get(peerId)!
    contact.trustLevel = totalTrust > 0 ? totalTrust : undefined
  })
  
  // Return only actually bonded contacts (those with CONTACT_ACCEPT) 
  // Exclude self-connections where the user appears as their own contact
  const bondedContacts = Array.from(bondedMap.values()).filter(contact => {
    // Filter out self-connections
    if (contact.peerId === sessionId) {
      console.log('[getBondedContactsFromHCS] Filtering out self-connection:', contact.peerId)
      return false
    }
    
    // Only include contacts that have been accepted (bonded)
    const hasAccept = contactEvents.some(e => 
      e.type === 'CONTACT_ACCEPT' && 
      ((e.actor === sessionId && e.target === contact.peerId) ||
       (e.target === sessionId && e.actor === contact.peerId))
    )
    
    if (!hasAccept) {
      console.log('[getBondedContactsFromHCS] Filtering out non-accepted contact:', contact.peerId)
    }
    
    return hasAccept
  })
  
  console.log('[getBondedContactsFromHCS] Final bonded contacts:', bondedContacts.length)
  console.log('[getBondedContactsFromHCS] Bonded contacts details:', bondedContacts)
  
  return bondedContacts
}

// Derive trust statistics from HCS trust events
export function getTrustStatsFromHCS(events: SignalEvent[], sessionId: string): HCSTrustStats & { pendingOut: number } {
  const trustEvents = events.filter(e => 
    e.type === 'TRUST_ALLOCATE' || e.type === 'TRUST_REVOKE' || 
    e.type === 'TRUST_ACCEPT' || e.type === 'TRUST_DECLINE'
  ).sort((a, b) => a.ts - b.ts)
  
  let allocatedOut = 0
  let pendingOut = 0
  let receivedIn = 0
  
  // Track outbound trust state per peer
  const outboundTrustByPeer = new Map<string, { weight: number; status: 'pending' | 'bonded' | 'declined' | 'revoked' }>()
  
  // Process outbound trust events in chronological order
  const outboundTrust = trustEvents.filter(e => e.actor === sessionId)
  for (const event of outboundTrust) {
    const peerId = event.target
    if (!peerId) continue
    
    const weight = event.metadata?.weight || 1
    
    if (event.type === 'TRUST_ALLOCATE') {
      outboundTrustByPeer.set(peerId, { weight, status: 'pending' })
    } else if (event.type === 'TRUST_REVOKE') {
      const existing = outboundTrustByPeer.get(peerId)
      if (existing) {
        existing.status = 'revoked'
      }
    }
  }
  
  // Process inbound acceptance/decline signals to update outbound trust status
  const inboundTrust = trustEvents.filter(e => e.target === sessionId)
  for (const event of inboundTrust) {
    const peerId = event.actor
    if (!peerId) continue
    
    if (event.type === 'TRUST_ACCEPT') {
      const existing = outboundTrustByPeer.get(peerId)
      if (existing && existing.status === 'pending') {
        existing.status = 'bonded'
      }
      // Also count as received trust
      receivedIn += event.metadata?.weight || 1
    } else if (event.type === 'TRUST_DECLINE') {
      const existing = outboundTrustByPeer.get(peerId)
      if (existing && existing.status === 'pending') {
        existing.status = 'declined'
      }
    } else if (event.type === 'TRUST_ALLOCATE') {
      // Direct inbound allocation (legacy - should be followed by accept/decline)
      receivedIn += event.metadata?.weight || 1
    } else if (event.type === 'TRUST_REVOKE') {
      // Inbound trust revoked
      receivedIn -= event.metadata?.weight || 1
    }
  }
  
  // Calculate final counts
  for (const { weight, status } of outboundTrustByPeer.values()) {
    if (status === 'bonded') {
      allocatedOut += weight
    } else if (status === 'pending') {
      pendingOut += weight
    }
    // declined and revoked don't count toward slots used
  }
  
  // Trust capacity is always 9 slots, regardless of bonded contacts
  const cap = 9
  
  return {
    allocatedOut: Math.max(0, allocatedOut),
    receivedIn: Math.max(0, receivedIn),
    pendingOut,
    cap
  }
}

// Get count of trust allocated to contacts who aren't fully bonded yet
export function getPendingTrustFromHCS(events: SignalEvent[], sessionId: string): number {
  const bonded = getBondedContactsFromHCS(events, sessionId)
  const bondedIds = new Set(bonded.map(b => b.peerId))
  
  // Find trust allocations to contacts who aren't in the bonded list
  const trustEvents = events.filter(e => 
    e.type === 'TRUST_ALLOCATE' && 
    e.actor === sessionId
  )
  
  let pending = 0
  for (const trustEvent of trustEvents) {
    const targetId = trustEvent.target
    if (targetId && !bondedIds.has(targetId)) {
      pending += trustEvent.metadata?.weight || 1
    }
  }
  
  return pending
}

// Derive personal metrics from HCS events
export function getPersonalMetricsFromHCS(
  events: SignalEvent[], 
  sessionId: string,
  recognitionCount: number = 0
): HCSMetrics {
  const bonded = getBondedContactsFromHCS(events, sessionId)
  const trustStats = getTrustStatsFromHCS(events, sessionId)
  
  return {
    bondedContacts: bonded.length,
    trustAllocated: trustStats.allocatedOut,
    trustCapacity: trustStats.cap,
    recognitionOwned: recognitionCount
  }
}

// Get recent contact and trust events for mini feed
export function getRecentSignalsFromHCS(events: SignalEvent[], sessionId: string, limit: number = 3): SignalEvent[] {
  return events
    .filter(e => 
      e.type === 'CONTACT_REQUEST' || e.type === 'CONTACT_ACCEPT' || 
      e.type === 'TRUST_ALLOCATE' || e.type === 'TRUST_REVOKE'
    )
    .filter(e => e.actor === sessionId || e.target === sessionId)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit)
}
