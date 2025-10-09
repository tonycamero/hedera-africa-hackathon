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

// Schema-tolerant utility functions
function normalizeType(t?: string): string {
  return (t || '').trim().toUpperCase()
}

// Returns {actor, target} no matter which shape the event uses
function getParties(ev: any): { actor?: string; target?: string } {
  const actor =
    ev?.actor ??
    ev?.actors?.from ??
    ev?.from ??
    ev?.payload?.from ??
    ev?.metadata?.from

  const target =
    ev?.target ??
    ev?.actors?.to ??
    ev?.to ??
    ev?.payload?.to ??
    ev?.metadata?.to

  return { actor, target }
}

// Make a stable pair key ("a|b") with sorted peers
function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

// Schema-tolerant utility functions - simple and bulletproof
const A = (e: any) => e?.actor ?? e?.actors?.from ?? e?.from ?? e?.payload?.from ?? e?.metadata?.from
const T = (e: any) => e?.target ?? e?.actors?.to ?? e?.to ?? e?.payload?.to ?? e?.metadata?.to
const U = (t?: string) => (t || '').toUpperCase()
const k = (a: string, b: string) => [a, b].sort().join('|')

// Known user ID to name mappings from hackathon seed data
const USER_NAME_MAPPINGS: Record<string, string> = {
  'tm-alex-chen': 'Alex Chen',
  'tm-amara-okafor': 'Amara Okafor',
  'tm-kofi-asante': 'Kofi Asante',
  'tm-zara-mwangi': 'Zara Mwangi',
  'tm-fatima-alrashid': 'Fatima Al-Rashid',
  'tm-kwame-nkomo': 'Kwame Nkomo',
  'tm-aisha-diallo': 'Aisha Diallo',
  'tm-boma-nwachukwu': 'Boma Nwachukwu',
  'tm-sekai-mandela': 'Sekai Mandela',
  'tm-omar-hassan': 'Omar Hassan',
  // Additional fallback patterns
  'tm-sam-rivera': 'Sam Rivera',
  'tm-jordan-kim': 'Jordan Kim',
  'tm-maya-patel': 'Maya Patel',
  'tm-riley-santos': 'Riley Santos',
  'tm-casey-wright': 'Casey Wright'
}

// Generate a proper display handle from user ID
function generateUserHandle(id: string): string {
  if (!id) return 'Unknown User'
  
  // Check if we have a known mapping first
  if (USER_NAME_MAPPINGS[id]) {
    return USER_NAME_MAPPINGS[id]
  }
  
  // Remove common prefixes and clean up the ID
  let cleanId = id
    .replace(/^tm-/, '')  // Remove "tm-" prefix
    .replace(/^user-/, '') // Remove "user-" prefix
    .replace(/^0\.0\./, '') // Remove Hedera account format
  
  // Split by hyphens or underscores and take meaningful parts
  const parts = cleanId.split(/[-_]+/).filter(part => part.length > 0)
  
  if (parts.length === 0) {
    // Fallback to last 6 characters if no meaningful parts
    const suffix = id.slice(-6).replace(/^[-_]+/, '')
    return `User ${suffix || 'Unknown'}`
  }
  
  // If we have multiple parts, try to construct first and last name
  if (parts.length >= 2) {
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    const lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
    return `${firstName} ${lastName}`
  }
  
  // Single part - capitalize first letter
  const singleName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  return singleName
}

// Ultra-simple bonded contacts extraction - works with ANY event shape and never counts Alex
export function getBondedContactsFromHCS(events: any[], me: string): BondedContact[] {
  const pairs = new Map<string, any>()  // Store full event data, not just IDs
  const contactData = new Map<string, { name?: string, handle?: string }>() // Store contact info by ID
  
  // First pass: collect contact data from all contact events
  for (const ev of events) {
    const t = U(ev?.type)
    if (t === 'CONTACT_REQUEST' || t === 'CONTACT_ACCEPT' || t === 'CONTACT_ACCEPTED' || t === 'CONTACT_BONDED') {
      const a = A(ev), b = T(ev)
      const payload = ev?.payload || ev?.metadata || {}
      
      // Extract contact info from payload
      const name = payload?.name || payload?.displayName || payload?.fullName
      const handle = payload?.handle || payload?.username || payload?.nickname
      
      // Store contact data for both actors
      if (a && (name || handle)) {
        contactData.set(a, { name, handle })
      }
      if (b && (name || handle)) {
        contactData.set(b, { name, handle })
      }
    }
  }
  
  // Second pass: identify bonded pairs
  for (const ev of events) {
    const t = U(ev?.type)
    if (t === 'CONTACT_ACCEPT' || t === 'CONTACT_ACCEPTED' || t === 'CONTACT_BONDED') {
      const a = A(ev), b = T(ev)
      if (a && b && a !== b) {
        const key = k(a, b)
        pairs.set(key, ev)
        console.log('🔍 [HCSDataUtils] Found bonded pair:', a, '<->', b, 'from event type:', ev?.type)
      }
    }
  }
  
  const bonded = new Set<string>()
  console.log('🔍 [HCSDataUtils] Filtering bonded pairs for session ID:', me)
  console.log('🔍 [HCSDataUtils] Total pairs found:', pairs.size)
  
  for (const key of pairs.keys()) {
    const [a, b] = key.split('|')
    console.log('🔍 [HCSDataUtils] Checking pair:', a, '<->', b)
    if (a === me && b !== me) {
      bonded.add(b)
      console.log('🔍 [HCSDataUtils] Added bonded contact:', b)
    }
    if (b === me && a !== me) {
      bonded.add(a)
      console.log('🔍 [HCSDataUtils] Added bonded contact:', a)
    }
  }
  
  console.log('🔍 [HCSDataUtils] Final bonded set size:', bonded.size)
  console.log('🔍 [HCSDataUtils] Final bonded contacts:', [...bonded])
  
  return [...bonded].map(id => {
    const info = contactData.get(id) || {}
    const name = info.name || info.handle || generateUserHandle(id)
    const handle = info.handle || info.name || generateUserHandle(id)
    
    return { 
      peerId: id,
      handle: name, // Use the real name/handle from HCS, not generated
      bondedAt: Date.now()
    }
  })
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
  const outboundTrust = trustEvents.filter(e => {
    const actor = e.actor || (e as any).actors?.from
    return actor === sessionId
  })
  for (const event of outboundTrust) {
    const peerId = event.target || (event as any).actors?.to
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
  const inboundTrust = trustEvents.filter(e => {
    const target = e.target || (e as any).actors?.to
    return target === sessionId
  })
  for (const event of inboundTrust) {
    const peerId = event.actor || (event as any).actors?.from
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

// Get trust levels for each contact
export function getTrustLevelsPerContact(events: SignalEvent[], sessionId: string): Map<string, { allocatedTo: number, receivedFrom: number }> {
  const trustLevels = new Map<string, { allocatedTo: number, receivedFrom: number }>()
  
  // Initialize trust levels for all contacts
  const initializeTrustLevel = (contactId: string) => {
    if (!trustLevels.has(contactId)) {
      trustLevels.set(contactId, { allocatedTo: 0, receivedFrom: 0 })
    }
  }
  
  // Get all trust-related events
  const trustEvents = events.filter(e => 
    e.type === 'TRUST_ALLOCATE' || e.type === 'TRUST_REVOKE' || 
    e.type === 'TRUST_ACCEPT' || e.type === 'TRUST_DECLINE'
  ).sort((a, b) => a.ts - b.ts)
  
  // Track outbound and inbound trust per peer
  const outboundTrustByPeer = new Map<string, { weight: number; status: 'pending' | 'bonded' | 'declined' | 'revoked' }>()
  const inboundTrustByPeer = new Map<string, { weight: number; status: 'pending' | 'bonded' | 'declined' | 'revoked' }>()
  
  // Process all trust events
  for (const event of trustEvents) {
    const actor = event.actor || (event as any).actors?.from
    const target = event.target || (event as any).actors?.to
    const weight = event.metadata?.weight || 1
    
    if (!actor || !target) continue
    
    // Initialize trust levels for both parties
    initializeTrustLevel(actor)
    initializeTrustLevel(target)
    
    if (event.type === 'TRUST_ALLOCATE') {
      if (actor === sessionId) {
        // Outbound trust allocation
        outboundTrustByPeer.set(target, { weight, status: 'pending' })
      } else if (target === sessionId) {
        // Inbound trust allocation
        inboundTrustByPeer.set(actor, { weight, status: 'pending' })
      }
    } else if (event.type === 'TRUST_ACCEPT') {
      if (actor === sessionId) {
        // We accepted someone's trust
        const existing = inboundTrustByPeer.get(target)
        if (existing && existing.status === 'pending') {
          existing.status = 'bonded'
        }
      } else if (target === sessionId) {
        // Someone accepted our trust
        const existing = outboundTrustByPeer.get(actor)
        if (existing && existing.status === 'pending') {
          existing.status = 'bonded'
        }
      }
    } else if (event.type === 'TRUST_DECLINE') {
      if (actor === sessionId) {
        // We declined someone's trust
        const existing = inboundTrustByPeer.get(target)
        if (existing && existing.status === 'pending') {
          existing.status = 'declined'
        }
      } else if (target === sessionId) {
        // Someone declined our trust
        const existing = outboundTrustByPeer.get(actor)
        if (existing && existing.status === 'pending') {
          existing.status = 'declined'
        }
      }
    } else if (event.type === 'TRUST_REVOKE') {
      if (actor === sessionId) {
        // We revoked trust to someone
        const existing = outboundTrustByPeer.get(target)
        if (existing) {
          existing.status = 'revoked'
        }
      } else if (target === sessionId) {
        // Someone revoked trust from us
        const existing = inboundTrustByPeer.get(actor)
        if (existing) {
          existing.status = 'revoked'
        }
      }
    }
  }
  
  // Calculate final trust levels
  for (const [contactId, data] of outboundTrustByPeer.entries()) {
    if (data.status === 'bonded') {
      const current = trustLevels.get(contactId) || { allocatedTo: 0, receivedFrom: 0 }
      current.allocatedTo = data.weight
      trustLevels.set(contactId, current)
    }
  }
  
  for (const [contactId, data] of inboundTrustByPeer.entries()) {
    if (data.status === 'bonded') {
      const current = trustLevels.get(contactId) || { allocatedTo: 0, receivedFrom: 0 }
      current.receivedFrom = data.weight
      trustLevels.set(contactId, current)
    }
  }
  
  return trustLevels
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
