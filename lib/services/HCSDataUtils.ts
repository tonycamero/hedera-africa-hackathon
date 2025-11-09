import type { SignalEvent, BondedContact } from "@/lib/stores/signalsStore"
import { performanceMonitor } from "@/lib/utils/performanceMonitor"

// Utility functions to derive data structures from HCS feed events
// This replaces the local storage-based data with HCS chain data

// Performance optimization: cache results to avoid excessive recomputation
interface CacheEntry<T> {
  data: T
  eventsHash: string
  timestamp: number
}

const CACHE_TTL = 10000 // 10 seconds
const bondedContactsCache = new Map<string, CacheEntry<BondedContact[]>>()
const trustStatsCache = new Map<string, CacheEntry<any>>()
const personalMetricsCache = new Map<string, CacheEntry<any>>()

// Generate a hash of events to detect changes
function generateEventsHash(events: any[]): string {
  // Use a subset of properties to create a meaningful hash
  const relevantData = events
    .filter(e => {
      const type = normalizeType(e?.type)
      return ['CONTACT_REQUEST', 'CONTACT_ACCEPT', 'CONTACT_ACCEPTED', 'CONTACT_BONDED', 'TRUST_ALLOCATE', 'TRUST_REVOKE', 'TRUST_ACCEPT', 'TRUST_DECLINE'].includes(type)
    })
    .map(e => `${e.id || ''}:${e.type || ''}:${e.actor || ''}:${e.target || ''}:${e.ts || ''}`)
    .join('|')
  
  // Simple hash function
  let hash = 0
  for (let i = 0; i < relevantData.length; i++) {
    const char = relevantData.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

// Clear expired cache entries
function cleanupCache() {
  const now = Date.now()
  for (const [key, entry] of bondedContactsCache) {
    if (now - entry.timestamp > CACHE_TTL) {
      bondedContactsCache.delete(key)
    }
  }
  for (const [key, entry] of trustStatsCache) {
    if (now - entry.timestamp > CACHE_TTL) {
      trustStatsCache.delete(key)
    }
  }
  for (const [key, entry] of personalMetricsCache) {
    if (now - entry.timestamp > CACHE_TTL) {
      personalMetricsCache.delete(key)
    }
  }
}

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
  const payload = ev?.payload || {}
  
  const actor =
    ev?.actor ??
    ev?.actors?.from ??
    ev?.from ??
    payload?.from?.acct ??  // NEW: handle nested acct structure
    payload?.from ??
    ev?.metadata?.from

  const target =
    ev?.target ??
    ev?.actors?.to ??
    ev?.to ??
    payload?.to?.acct ??    // NEW: handle nested acct structure
    payload?.to ??
    ev?.metadata?.to

  return { actor, target }
}

// Make a stable pair key ("a|b") with sorted peers
function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

// Schema-tolerant utility functions - simple and bulletproof
const A = (e: any) => e?.actor ?? e?.actors?.from ?? e?.from ?? e?.payload?.from?.acct ?? e?.payload?.from ?? e?.metadata?.from
const T = (e: any) => e?.target ?? e?.actors?.to ?? e?.to ?? e?.payload?.to?.acct ?? e?.payload?.to ?? e?.metadata?.to
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
  if (!id || typeof id !== 'string') return 'Unknown User'
  
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
  return performanceMonitor.track('getBondedContactsFromHCS', () => {
    // Check cache first
    cleanupCache()
    const cacheKey = `${me}:contacts`
    const eventsHash = generateEventsHash(events)
    const cached = bondedContactsCache.get(cacheKey)
  
  if (cached && cached.eventsHash === eventsHash && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('🔍 [HCSDataUtils] ✅ Using cached bonded contacts for:', me, '(size:', cached.data.length, ')')
    return cached.data
  }
  
  console.log('🔍 [HCSDataUtils] 🔄 Computing bonded contacts for session ID:', me)
  
  const pairs = new Map<string, any>()  // Store full event data, not just IDs
  const contactData = new Map<string, { name?: string, handle?: string, displayName?: string }>() // Store contact info by ID
  
  // First pass: collect profile data from PROFILE_UPDATE events (highest priority)
  for (const ev of events) {
    const t = U(ev?.type)
    if (t === 'PROFILE_UPDATE') {
      const payload = ev?.payload || ev?.metadata || {}
      
      // Try top-level fields first (new format), then fall back to payload (old format)
      const accountId = ev?.accountId || payload?.sessionId || payload?.accountId || A(ev)
      const displayName = ev?.displayName || payload?.displayName || payload?.handle || payload?.name
      const handle = ev?.handle || payload?.handle || payload?.username || displayName
      
      if (accountId && (displayName || handle)) {
        contactData.set(accountId, { 
          name: displayName, 
          handle: handle,
          displayName: displayName 
        })
        console.log('[HCSDataUtils] Loaded profile for', accountId, '→', displayName || handle)
      }
    }
  }
  
  // Second pass: collect contact data from contact events (fallback)
  for (const ev of events) {
    const t = U(ev?.type)
    if (t === 'CONTACT_REQUEST' || t === 'CONTACT_ACCEPT' || t === 'CONTACT_ACCEPTED' || t === 'CONTACT_BONDED' || t === 'CONTACT_MIRROR') {
      const a = A(ev), b = T(ev)
      const payload = ev?.payload || ev?.metadata || {}
      
      // Extract contact info from payload (handle nested from/to structure)
      const fromData = payload?.from || {}
      const toData = payload?.to || {}
      
      const fromName = fromData?.name || fromData?.displayName || fromData?.handle
      const fromHandle = fromData?.handle || fromData?.username || fromData?.nickname
      
      const toName = toData?.name || toData?.displayName || toData?.handle  
      const toHandle = toData?.handle || toData?.username || toData?.nickname
      
      // Store contact data only if not already loaded from profile
      if (a && (fromName || fromHandle) && !contactData.has(a)) {
        contactData.set(a, { name: fromName, handle: fromHandle })
      }
      if (b && (toName || toHandle) && !contactData.has(b)) {
        contactData.set(b, { name: toName, handle: toHandle })
      }
    }
  }
  
  // Second pass: identify all contacts (REQUEST or ACCEPT) and track bonded status
  const contacts = new Set<string>()
  const bondedPairs = new Map<string, any>()  // Track mutual acceptance
  
  for (const ev of events) {
    const t = U(ev?.type)
    const a = A(ev), b = T(ev)
    
    // Anyone in a CONTACT_REQUEST is a contact
    if (t === 'CONTACT_REQUEST' && a && b && a !== b) {
      if (a === me && b !== me && b !== 'peer:unknown') contacts.add(b)
      if (b === me && a !== me && a !== 'peer:unknown') contacts.add(a)
    }
    
    // CONTACT_ACCEPT and CONTACT_MIRROR both mean bonded (mutual acceptance)
    if ((t === 'CONTACT_ACCEPT' || t === 'CONTACT_ACCEPTED' || t === 'CONTACT_BONDED' || t === 'CONTACT_MIRROR') && a && b && a !== b) {
      const key = k(a, b)
      bondedPairs.set(key, ev)
      // Also ensure they're in contacts set
      if (a === me && b !== me) contacts.add(b)
      if (b === me && a !== me) contacts.add(a)
      console.log('🔍 [HCSDataUtils] Found bonded pair:', a, '<->', b, 'from event type:', ev?.type)
    }
  }
  
  console.log('🔍 [HCSDataUtils] Filtering contacts for session ID:', me)
  console.log('🔍 [HCSDataUtils] Total contacts found:', contacts.size)
  console.log('🔍 [HCSDataUtils] Total bonded pairs found:', bondedPairs.size)
  console.log('🔍 [HCSDataUtils] Profile data loaded for:', contactData.size, 'accounts')
  console.log('🔍 [HCSDataUtils] Final contacts:', [...contacts])
  
  // Filter out any invalid IDs (null, undefined, or non-strings)
  const validContacts = [...contacts].filter(id => id && typeof id === 'string')
  
  const result = validContacts.map(id => {
    // Check if this contact is bonded (mutual ACCEPT)
    const isBonded = Array.from(bondedPairs.keys()).some(key => {
      const [a, b] = key.split('|')
      return (a === me && b === id) || (b === me && a === id)
    })
    
    // Priority: USER_NAME_MAPPINGS (curated) > HCS event data > generated from ID
    const knownName = USER_NAME_MAPPINGS[id]
    const info = contactData.get(id) || {}
    const name = knownName || info.name || info.handle || generateUserHandle(id)
    const handle = knownName || info.handle || info.name || generateUserHandle(id)
    
    return { 
      peerId: id,
      handle: name,
      bondedAt: Date.now(),
      isBonded  // Add bonded flag for UI to differentiate
    }
  })
  
  // Cache the result
  bondedContactsCache.set(cacheKey, {
    data: result,
    eventsHash,
    timestamp: Date.now()
  })
  
    console.log('🔍 [HCSDataUtils] ✅ Cached bonded contacts result for:', me)
    return result
  })
}

// Derive trust statistics from HCS trust events
export function getTrustStatsFromHCS(events: SignalEvent[], sessionId: string): HCSTrustStats & { pendingOut: number } {
  return performanceMonitor.track('getTrustStatsFromHCS', () => {
    // Check cache first
  cleanupCache()
  const cacheKey = `${sessionId}:trust`
  const eventsHash = generateEventsHash(events)
  const cached = trustStatsCache.get(cacheKey)
  
  if (cached && cached.eventsHash === eventsHash && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('🔍 [HCSDataUtils] ✅ Using cached trust stats for:', sessionId)
    return cached.data
  }
  
  console.log('🔍 [HCSDataUtils] 🔄 Computing trust stats for session ID:', sessionId)
  
  const trustEvents = events.filter(e => 
    e.type === 'TRUST_ALLOCATE' || e.type === 'TRUST_REVOKE' || 
    e.type === 'TRUST_ACCEPT' || e.type === 'TRUST_DECLINE'
  ).sort((a, b) => a.ts - b.ts)
  
  let allocatedOut = 0
  let pendingOut = 0
  let receivedIn = 0
  
  // Track outbound trust state per peer (unilateral staking model)
  const outboundTrustByPeer = new Map<string, { weight: number; status: 'allocated' | 'revoked' }>()
  
  // Process outbound trust events in chronological order
  const outboundTrust = trustEvents.filter(e => {
    const payload = (e as any).payload || {}
    const actor = e.actor || payload.actor || (e as any).from || (e as any).actors?.from
    return actor === sessionId
  })
  for (const event of outboundTrust) {
    const payload = (event as any).payload || {}
    const peerId = event.target || payload.target || (event as any).to || (event as any).actors?.to
    if (!peerId) continue
    
    // Always use weight of 1 - equal trust for all circle members (deprecated graduated distribution)
    const weight = 1
    
    if (event.type === 'TRUST_ALLOCATE') {
      // Unilateral allocation - no acceptance needed
      outboundTrustByPeer.set(peerId, { weight, status: 'allocated' })
    } else if (event.type === 'TRUST_REVOKE') {
      const existing = outboundTrustByPeer.get(peerId)
      if (existing) {
        existing.status = 'revoked'
      }
    }
  }
  
  // Process inbound trust allocations (trust received from others)
  const inboundTrust = trustEvents.filter(e => {
    const payload = (e as any).payload || {}
    const target = e.target || payload.target || (e as any).to || (e as any).actors?.to
    return target === sessionId
  })
  for (const event of inboundTrust) {
    const payload = (event as any).payload || {}
    const peerId = event.actor || payload.actor || (event as any).from || (event as any).actors?.from
    if (!peerId) continue
    
    if (event.type === 'TRUST_ALLOCATE') {
      // Count trust received from others (always weight 1)
      receivedIn += 1
    } else if (event.type === 'TRUST_REVOKE') {
      // Inbound trust revoked (always weight 1)
      receivedIn -= 1
    }
  }
  
  // Calculate final counts (allocated = in your inner circle)
  for (const { weight, status } of outboundTrustByPeer.values()) {
    if (status === 'allocated') {
      allocatedOut += weight
    }
    // revoked don't count toward slots used
  }
  
  // pendingOut is no longer relevant in unilateral model
  pendingOut = 0
  
  // Trust capacity is always 9 slots, regardless of bonded contacts
  const cap = 9
  
  const result = {
    allocatedOut: Math.max(0, allocatedOut),
    receivedIn: Math.max(0, receivedIn),
    pendingOut,
    cap
  }
  
  // Cache the result
  trustStatsCache.set(cacheKey, {
    data: result,
    eventsHash,
    timestamp: Date.now()
  })
  
    console.log('🔍 [HCSDataUtils] ✅ Cached trust stats result for:', sessionId)
    return result
  })
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
      // Always weight 1 per trust allocation
      pending += 1
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
  return performanceMonitor.track('getPersonalMetricsFromHCS', () => {
    // Check cache first
  cleanupCache()
  const cacheKey = `${sessionId}:metrics:${recognitionCount}`
  const eventsHash = generateEventsHash(events)
  const cached = personalMetricsCache.get(cacheKey)
  
  if (cached && cached.eventsHash === eventsHash && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('🔍 [HCSDataUtils] ✅ Using cached personal metrics for:', sessionId)
    return cached.data
  }
  
  console.log('🔍 [HCSDataUtils] 🔄 Computing personal metrics for session ID:', sessionId)
  
  const bonded = getBondedContactsFromHCS(events, sessionId)
  const trustStats = getTrustStatsFromHCS(events, sessionId)
  
  const result = {
    bondedContacts: bonded.length,
    trustAllocated: trustStats.allocatedOut,
    trustCapacity: trustStats.cap,
    recognitionOwned: recognitionCount
  }
  
  // Cache the result
  personalMetricsCache.set(cacheKey, {
    data: result,
    eventsHash,
    timestamp: Date.now()
  })
  
    console.log('🔍 [HCSDataUtils] ✅ Cached personal metrics result for:', sessionId)
    return result
  })
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
    // Extract actor/target from multiple possible locations (top-level, payload, or actors)
    const payload = (event as any).payload || {}
    const actor = event.actor || payload.actor || (event as any).from || (event as any).actors?.from
    const target = event.target || payload.target || (event as any).to || (event as any).actors?.to
    // Always use weight of 1 - equal trust for all circle members (deprecated graduated distribution)
    const weight = 1
    
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
  
  // Calculate final trust levels (unilateral model - trust is allocated immediately, no acceptance needed)
  for (const [contactId, data] of outboundTrustByPeer.entries()) {
    if (data.status === 'pending' || data.status === 'bonded') {
      const current = trustLevels.get(contactId) || { allocatedTo: 0, receivedFrom: 0 }
      current.allocatedTo = data.weight
      trustLevels.set(contactId, current)
    }
  }
  
  for (const [contactId, data] of inboundTrustByPeer.entries()) {
    if (data.status === 'pending' || data.status === 'bonded') {
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
