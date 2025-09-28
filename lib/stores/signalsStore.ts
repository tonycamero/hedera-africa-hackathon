export type SignalClass = "contact" | "trust" | "recognition" | "system"
export type SignalStatus = "local" | "onchain" | "error"
export type SignalScope = "global" | "my"
export type RecognitionCategory = "social" | "academic" | "professional"
export type TokenStatus = "active" | "transferred" | "burned"

export interface SignalEvent {
  id: string
  class: SignalClass
  topicType: "CONTACT" | "TRUST" | "SIGNAL" | "PROFILE"
  direction: "inbound" | "outbound"
  actors: { from: string; to?: string }
  payload: any
  ts: number
  status: SignalStatus
  seen?: boolean
  type: string // CONTACT_REQUEST, CONTACT_ACCEPT, TRUST_ALLOCATE, TRUST_ACCEPT, TRUST_DECLINE, TRUST_REVOKE, etc.
  meta?: { tag?: string; [key: string]: any }
}

export interface BondedContact {
  peerId: string
  handle?: string
  bondedAt: number
  trustLevel?: number
}

export interface TrustStats {
  allocatedOut: number
  cap: number
}

export interface RecognitionSignal {
  id: string
  category: RecognitionCategory
  name: string
  subtitle?: string
  tokenId: string
  ownerId: string
  issuerId: string
  tokenStatus: TokenStatus
  hrl?: string
  emoji?: string
  ts: number
  status: SignalStatus
}

class SignalsStore {
  private signals: SignalEvent[] = []
  private readonly HARD_CAP = 200   // global/seed showcase
  private readonly VIEW_CAP = 20     // what we render
  private seenTabs = new Set<string>()
  private listeners: (() => void)[] = []

  // Add signal to store with memory management
  addSignal(signal: SignalEvent): void {
    // Remove existing signal with same ID if exists
    this.signals = this.signals.filter(s => s.id !== signal.id)
    
    // Add new signal at beginning
    this.signals.unshift(signal)
    
    // Apply garbage collection
    this.signals = this.cap(this.signals)

    console.log('[SignalsStore] Added signal:', signal.type, signal.direction, signal.status)
    this.persistToStorage()
    this.notifyListeners()
  }

  // Memory management with intelligent pruning
  private cap(arr: SignalEvent[]): SignalEvent[] {
    if (arr.length <= this.HARD_CAP) return arr
    
    // Separate seeded from real signals
    const seeded = arr.filter(e => e.meta?.tag === "seeded")
    const real = arr.filter(e => e.meta?.tag !== "seeded")
    
    // Prioritize real signals, then add seeded up to limit
    const realToKeep = real.slice(-Math.floor(this.HARD_CAP * 0.7)) // 70% for real
    const seededToKeep = seeded.slice(-Math.floor(this.HARD_CAP * 0.3)) // 30% for demo
    
    return [...realToKeep, ...seededToKeep].sort((a, b) => a.ts - b.ts)
  }

  // Update signal status (local -> onchain or error)
  updateSignalStatus(id: string, status: SignalStatus): void {
    const signal = this.signals.find(s => s.id === id)
    if (signal) {
      signal.status = status
      console.log('[SignalsStore] Updated signal status:', id, status)
      this.persistToStorage()
      this.notifyListeners()
    }
  }

  // Listener management
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  // Mark tab as seen (clears unseen indicators)
  markSeen(tab: string): void {
    this.seenTabs.add(tab)
    if (tab === 'signals') {
      this.signals.forEach(s => s.seen = true)
      this.persistToStorage()
    }
  }

  // Get all bonded contacts for a user
  getBondedContacts(myId: string): BondedContact[] {
    const bonds = new Map<string, { requestAt?: number, acceptAt?: number, handle?: string }>()

    // Find all contact signals involving this user
    const contactSignals = this.signals.filter(s => s.class === 'contact')

    for (const signal of contactSignals) {
      const isOutbound = signal.direction === 'outbound' && signal.actors.from === myId
      const isInbound = signal.direction === 'inbound' && signal.actors.to === myId

      if (!isOutbound && !isInbound) continue

      const peerId = isOutbound ? signal.actors.to : signal.actors.from
      if (!peerId) continue

      if (!bonds.has(peerId)) {
        bonds.set(peerId, {})
      }

      const bond = bonds.get(peerId)!

      if (signal.type === 'CONTACT_REQUEST') {
        if (isOutbound) bond.requestAt = signal.ts
        // Extract handle from payload if available
        if (signal.payload?.handle) bond.handle = signal.payload.handle
      } else if (signal.type === 'CONTACT_ACCEPT') {
        if (isInbound || isOutbound) bond.acceptAt = signal.ts
      }
    }

    // Return only fully bonded contacts (have both request and accept)
    const bonded: BondedContact[] = []
    for (const [peerId, bond] of bonds) {
      if (bond.requestAt && bond.acceptAt) {
        bonded.push({
          peerId,
          handle: bond.handle,
          bondedAt: Math.max(bond.requestAt, bond.acceptAt),
          trustLevel: this.getTrustLevel(myId, peerId)
        })
      }
    }

    return bonded.sort((a, b) => b.bondedAt - a.bondedAt)
  }

  // Check if two users have a bond
  hasBond(myId: string, peerId: string): boolean {
    return this.getBondedContacts(myId).some(contact => contact.peerId === peerId)
  }

  // Get trust statistics for capacity management
  getTrustStats(myId: string): TrustStats {
    const trustSignals = this.signals.filter(s => 
      s.class === 'trust' && 
      s.direction === 'outbound' && 
      s.actors.from === myId
    ).sort((a, b) => a.ts - b.ts) // Process in chronological order

    let allocatedOut = 0
    const trustByPeer = new Map<string, { weight: number; status: 'pending' | 'bonded' | 'declined' | 'revoked' }>()

    // Process trust lifecycle events in chronological order
    for (const signal of trustSignals) {
      if (!signal.actors.to) continue

      const peerId = signal.actors.to
      const weight = signal.payload?.weight || 1

      if (signal.type === 'TRUST_ALLOCATE') {
        // New trust allocation starts as pending
        trustByPeer.set(peerId, { weight, status: 'pending' })
      } else if (signal.type === 'TRUST_ACCEPT') {
        // Recipient accepted - becomes bonded (but this would be inbound signal, not outbound)
        const existing = trustByPeer.get(peerId)
        if (existing) {
          existing.status = 'bonded'
        }
      } else if (signal.type === 'TRUST_DECLINE') {
        // Recipient declined - frees my slot
        const existing = trustByPeer.get(peerId)
        if (existing) {
          existing.status = 'declined'
        }
      } else if (signal.type === 'TRUST_REVOKE') {
        // I revoked - frees my slot
        const existing = trustByPeer.get(peerId)
        if (existing) {
          existing.status = 'revoked'
        }
      }
    }

    // Check for inbound acceptance signals to mark outbound trust as bonded
    const inboundTrustSignals = this.signals.filter(s => 
      s.class === 'trust' && 
      s.direction === 'inbound' && 
      s.actors.to === myId
    )

    for (const signal of inboundTrustSignals) {
      if (signal.type === 'TRUST_ACCEPT' && signal.actors.from) {
        const existing = trustByPeer.get(signal.actors.from)
        if (existing && existing.status === 'pending') {
          existing.status = 'bonded'
        }
      }
    }

    // Count slots consumed by pending + bonded trust (not declined/revoked)
    for (const { weight, status } of trustByPeer.values()) {
      if (status === 'pending' || status === 'bonded') {
        allocatedOut += weight
      }
    }

    return {
      allocatedOut,
      cap: 9
    }
  }

  // Get trust level between two users
  private getTrustLevel(fromId: string, toId: string): number | undefined {
    const trustSignals = this.signals.filter(s => 
      s.class === 'trust' && 
      s.actors.from === fromId && 
      s.actors.to === toId
    )

    if (trustSignals.length === 0) return undefined

    // Get latest trust signal
    const latest = trustSignals.sort((a, b) => b.ts - a.ts)[0]
    
    if (latest.type === 'TRUST_ALLOCATE') {
      return latest.payload?.weight || 1
    } else if (latest.type === 'TRUST_REVOKE') {
      return undefined
    }

    return undefined
  }

  // Get signals with scoping and filters
  getSignals(filters?: {
    class?: SignalClass
    topicType?: string
    direction?: 'inbound' | 'outbound'
    status?: SignalStatus
    scope?: SignalScope
    sessionId?: string
  }): SignalEvent[] {
    let filtered = [...this.signals]

    // Apply scope filtering first
    if (filters?.scope === 'my' && filters?.sessionId) {
      filtered = filtered.filter(s => 
        s.actors.from === filters.sessionId || s.actors.to === filters.sessionId
      )
    }
    // 'global' scope shows all signals (default)

    // Apply other filters
    if (filters?.class) {
      filtered = filtered.filter(s => s.class === filters.class)
    }
    if (filters?.topicType) {
      filtered = filtered.filter(s => s.topicType === filters.topicType)
    }
    if (filters?.direction) {
      filtered = filtered.filter(s => s.direction === filters.direction)
    }
    if (filters?.status) {
      filtered = filtered.filter(s => s.status === filters.status)
    }

    // Apply view cap and return most recent first
    return filtered.slice(-this.VIEW_CAP).reverse()
  }

  // Get all signals (for debugging)
  getAllSignals(): SignalEvent[] {
    return [...this.signals]
  }

  // Get recent signals for mini-feed
  getRecentSignals(limit = 3): SignalEvent[] {
    return this.signals
      .filter(s => s.class === 'contact' || s.class === 'trust')
      .slice(0, limit)
  }

  // Check for unseen signals
  hasUnseen(tab?: string): boolean {
    if (tab && this.seenTabs.has(tab)) return false
    return this.signals.some(s => !s.seen)
  }

  // Derive contacts from signals (new enhanced version)
  deriveContacts(sessionId: string): Array<BondedContact & {
    bonded: boolean
    lastSeen?: string
    profileHrl?: string
    trustWeightOut?: number
  }> {
    const contactSignals = this.getSignals({ class: 'contact' })
    const trustSignals = this.getSignals({ class: 'trust' })
    
    // Group by peer ID
    const contactMap = new Map<string, {
      peerId: string
      handle?: string
      profileHrl?: string
      lastSeen?: string
      requests: SignalEvent[]
      accepts: SignalEvent[]
      bonded: boolean
      trustWeightOut?: number
      bondedAt?: number
    }>()
    
    // Process contact signals
    contactSignals.forEach(signal => {
      const isMySignal = signal.actors.from === sessionId || signal.actors.to === sessionId
      if (!isMySignal) return
      
      const peerId = signal.actors.from === sessionId ? signal.actors.to : signal.actors.from
      if (!peerId || peerId === sessionId) return
      
      if (!contactMap.has(peerId)) {
        contactMap.set(peerId, {
          peerId,
          requests: [],
          accepts: [],
          bonded: false
        })
      }
      
      const contact = contactMap.get(peerId)!
      
      if (signal.type === 'CONTACT_REQUEST') {
        contact.requests.push(signal)
        // If this is a request FROM the peer TO me, capture their profile info
        if (signal.actors.from === peerId) {
          contact.handle = signal.payload?.handle || contact.handle
          contact.profileHrl = signal.payload?.fromProfileHrl || contact.profileHrl
        }
      } else if (signal.type === 'CONTACT_ACCEPT') {
        contact.accepts.push(signal)
        contact.bonded = true
        contact.bondedAt = signal.ts
        // If this is an accept FROM the peer, capture their handle
        if (signal.actors.from === peerId) {
          contact.handle = signal.payload?.handle || contact.handle
        }
      }
      
      // Update last seen
      const allTimes = [...contact.requests, ...contact.accepts].map(s => s.ts)
      if (allTimes.length > 0) {
        contact.lastSeen = new Date(Math.max(...allTimes)).toLocaleDateString()
      }
    })
    
    // Add trust weights
    trustSignals.forEach(signal => {
      const isMySignal = signal.actors.from === sessionId || signal.actors.to === sessionId
      if (!isMySignal) return
      
      if (signal.direction === 'outbound' && signal.type === 'TRUST_ALLOCATE' && signal.actors.from === sessionId) {
        const peerId = signal.actors.to
        if (peerId && contactMap.has(peerId)) {
          const contact = contactMap.get(peerId)!
          contact.trustWeightOut = (contact.trustWeightOut || 0) + (signal.payload?.weight || 0)
        }
      }
    })
    
    return Array.from(contactMap.values()).map(contact => ({
      peerId: contact.peerId,
      handle: contact.handle || contact.peerId,
      bonded: contact.bonded,
      lastSeen: contact.lastSeen,
      profileHrl: contact.profileHrl,
      trustWeightOut: contact.trustWeightOut,
      bondedAt: contact.bondedAt || Date.now(),
      trustLevel: contact.trustWeightOut
    }))
  }
  
  // Get peer's profile HRL from latest contact request
  getPeerProfileHrl(peerId: string): string | undefined {
    const signals = this.getSignals({ class: 'contact' })
    const peerRequests = signals
      .filter(s => s.type === 'CONTACT_REQUEST' && s.actors.from === peerId)
      .sort((a, b) => b.ts - a.ts)
    
    // Try both payload and metadata locations for compatibility
    const latestRequest = peerRequests[0]
    if (!latestRequest) return undefined
    
    // Check for profile HRL in various possible locations
    return latestRequest.payload?.fromProfileHrl || 
           latestRequest.payload?.profileHrl ||
           latestRequest.meta?.profileHrl ||
           undefined
  }

  // Get owned hashinals (recognition tokens) by replaying SIGNAL_MINT/TRANSFER events
  getOwnedHashinals(ownerId: string): RecognitionSignal[] {
    const recognitionSignals = this.getSignals({ class: 'recognition' })
    const ownedTokens = new Map<string, RecognitionSignal>()
    
    // Process all recognition signals in chronological order
    const chronological = recognitionSignals.sort((a, b) => a.ts - b.ts)
    
    for (const signal of chronological) {
      const tokenId = signal.payload?.tokenId
      if (!tokenId) continue
      
      if (signal.type === 'SIGNAL_MINT') {
        // Initial mint - set owner
        const initialOwner = signal.payload.to || signal.actors.to
        if (initialOwner) {
          ownedTokens.set(tokenId, {
            id: signal.id,
            category: signal.payload.kind || 'social',
            name: signal.payload.name || 'Unknown Signal',
            subtitle: signal.payload.subtitle,
            tokenId,
            ownerId: initialOwner,
            issuerId: signal.actors.from || 'unknown',
            tokenStatus: 'active',
            hrl: signal.payload.uri || signal.payload.hrl,
            emoji: signal.payload.emoji || '🏆',
            ts: signal.ts,
            status: signal.status
          })
        }
      } else if (signal.type === 'SIGNAL_TRANSFER') {
        // Transfer - update owner
        const existingToken = ownedTokens.get(tokenId)
        if (existingToken) {
          existingToken.ownerId = signal.actors.to || existingToken.ownerId
          existingToken.tokenStatus = 'active'
        }
      } else if (signal.type === 'SIGNAL_BURN') {
        // Burn - mark as burned
        const existingToken = ownedTokens.get(tokenId)
        if (existingToken) {
          existingToken.tokenStatus = 'burned'
        }
      }
    }
    
    // Return only tokens owned by the specified user that aren't burned
    return Array.from(ownedTokens.values())
      .filter(token => token.ownerId === ownerId && token.tokenStatus !== 'burned')
      .sort((a, b) => b.ts - a.ts)
  }

  // Initialize from storage adapter
  loadFromStorage(): void {
    try {
      // Import here to avoid circular dependency
      const { storeGet } = require('../store/storage')
      const stored = storeGet('trustmesh_signals')
      if (stored) {
        const data = JSON.parse(stored)
        this.signals = data.signals || []
        this.seenTabs = new Set(data.seenTabs || [])
        console.log('[SignalsStore] Loaded', this.signals.length, 'signals from storage')
      }
    } catch (error) {
      console.warn('[SignalsStore] Failed to load from storage:', error)
    }
  }

  // Persist to storage adapter
  private persistToStorage(): void {
    try {
      // Import here to avoid circular dependency
      const { storeSet } = require('../store/storage')
      const data = {
        signals: this.signals,
        seenTabs: Array.from(this.seenTabs)
      }
      storeSet('trustmesh_signals', JSON.stringify(data))
    } catch (error) {
      console.warn('[SignalsStore] Failed to persist to storage:', error)
    }
  }

  // Clear storage data
  private clearStorageData(): void {
    try {
      const { storeRemove } = require('../store/storage')
      storeRemove('trustmesh_signals')
    } catch (error) {
      console.warn('[SignalsStore] Failed to clear storage:', error)
    }
  }

  // Remove signals by tag (for seed data management)
  removeByTag(tag: string): void {
    const originalLength = this.signals.length
    this.signals = this.signals.filter(s => s.meta?.tag !== tag)
    console.log(`[SignalsStore] Removed ${originalLength - this.signals.length} signals with tag '${tag}'`)
    this.persistToStorage()
    this.notifyListeners()
  }

  // Clear all signals (for testing)
  clear(): void {
    this.signals = []
    this.seenTabs.clear()
    this.clearStorageData()
    console.log('[SignalsStore] Cleared all signals')
    this.notifyListeners()
  }

  // Alias for clear()
  clearSignals(): void {
    this.clear()
  }

  // Get all signals without filters
  getAllSignals(): SignalEvent[] {
    return [...this.signals]
  }
}

// Singleton instance
export const signalsStore = new SignalsStore()

// Initialize on load
if (typeof window !== 'undefined') {
  signalsStore.loadFromStorage()
}