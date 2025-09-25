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
  const contactEvents = events
    .filter(e => e.class === 'contact')
    .sort((a, b) => a.ts - b.ts) // Process in chronological order
  
  for (const event of contactEvents) {
    const { actors } = event
    const otherParty = actors.from === sessionId ? actors.to : actors.from
    
    if (!otherParty) continue
    
    if (event.type === 'CONTACT_REQUEST') {
      // Track contact request (but not bonded yet)
      if (!bondedMap.has(otherParty)) {
        bondedMap.set(otherParty, {
          peerId: otherParty,
          handle: event.payload?.handle || `User ${otherParty.slice(-6)}`,
          bondedAt: event.ts,
          trustLevel: undefined // Not bonded yet
        })
      }
    } else if (event.type === 'CONTACT_ACCEPT') {
      // Contact is now bonded
      const existing = bondedMap.get(otherParty)
      bondedMap.set(otherParty, {
        peerId: otherParty,
        handle: existing?.handle || event.payload?.handle || `User ${otherParty.slice(-6)}`,
        bondedAt: event.ts,
        trustLevel: existing?.trustLevel // Preserve any trust level
      })
    }
  }
  
  // Add consolidated trust levels to bonded contacts (sum all allocations per contact)
  const trustEvents = events
    .filter(e => e.class === 'trust' && e.actors.from === sessionId)
    .sort((a, b) => a.ts - b.ts) // Process in chronological order
  
  // Track trust per peer (sum all allocations, subtract revocations)
  const trustByPeer = new Map<string, number>()
  
  for (const trustEvent of trustEvents) {
    const targetId = trustEvent.actors.to
    if (targetId && bondedMap.has(targetId)) {
      const currentTrust = trustByPeer.get(targetId) || 0
      
      if (trustEvent.type === 'TRUST_ALLOCATE') {
        const weight = trustEvent.payload?.weight || 1
        trustByPeer.set(targetId, currentTrust + weight)
      } else if (trustEvent.type === 'TRUST_REVOKE') {
        const weight = trustEvent.payload?.weight || 1
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
  const bondedContacts = Array.from(bondedMap.values()).filter(contact => 
    contactEvents.some(e => 
      e.type === 'CONTACT_ACCEPT' && 
      (e.actors.from === contact.peerId || e.actors.to === contact.peerId)
    )
  )
  
  console.log('[getBondedContactsFromHCS] Final bonded contacts:', bondedContacts.length)
  console.log('[getBondedContactsFromHCS] Bonded contacts details:', bondedContacts)
  
  return bondedContacts
}

// Derive trust statistics from HCS trust events
export function getTrustStatsFromHCS(events: SignalEvent[], sessionId: string): HCSTrustStats & { pendingOut: number } {
  const trustEvents = events.filter(e => e.class === 'trust').sort((a, b) => a.ts - b.ts)
  
  let allocatedOut = 0
  let pendingOut = 0
  let receivedIn = 0
  
  // Track outbound trust state per peer
  const outboundTrustByPeer = new Map<string, { weight: number; status: 'pending' | 'bonded' | 'declined' | 'revoked' }>()
  
  // Process outbound trust events in chronological order
  const outboundTrust = trustEvents.filter(e => e.actors.from === sessionId)
  for (const event of outboundTrust) {
    const peerId = event.actors.to
    if (!peerId) continue
    
    const weight = event.payload?.weight || 1
    
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
  const inboundTrust = trustEvents.filter(e => e.actors.to === sessionId)
  for (const event of inboundTrust) {
    const peerId = event.actors.from
    if (!peerId) continue
    
    if (event.type === 'TRUST_ACCEPT') {
      const existing = outboundTrustByPeer.get(peerId)
      if (existing && existing.status === 'pending') {
        existing.status = 'bonded'
      }
      // Also count as received trust
      receivedIn += event.payload?.weight || 1
    } else if (event.type === 'TRUST_DECLINE') {
      const existing = outboundTrustByPeer.get(peerId)
      if (existing && existing.status === 'pending') {
        existing.status = 'declined'
      }
    } else if (event.type === 'TRUST_ALLOCATE') {
      // Direct inbound allocation (legacy - should be followed by accept/decline)
      receivedIn += event.payload?.weight || 1
    } else if (event.type === 'TRUST_REVOKE') {
      // Inbound trust revoked
      receivedIn -= event.payload?.weight || 1
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
    e.class === 'trust' && 
    e.type === 'TRUST_ALLOCATE' && 
    e.actors.from === sessionId
  )
  
  let pending = 0
  for (const trustEvent of trustEvents) {
    const targetId = trustEvent.actors.to
    if (targetId && !bondedIds.has(targetId)) {
      pending += trustEvent.payload?.weight || 1
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
    .filter(e => e.class === 'contact' || e.class === 'trust')
    .filter(e => e.actors.from === sessionId || e.actors.to === sessionId)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit)
}