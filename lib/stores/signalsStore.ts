'use client'

import { useSyncExternalStore } from 'react'

// Type definitions
type SignalSelector<T> = (store: SignalsStore) => T

// Batching state
let _batchDepth = 0
let _pendingNotify = false

// Seen state tracking
const SEEN_KEY = 'tm_seen_ids'
const seenIds: Set<string> = typeof window !== 'undefined' ? new Set<string>(safeLoadSeen()) : new Set<string>()

function safeLoadSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistSeen() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seenIds]))
    }
  } catch {}
}

// Robust ID derivation (works with either canonical SignalEvent or raw HCS)
function deriveId(ev: any): string | null {
  if (!ev) return null
  if (typeof ev.id === 'string') return ev.id
  // Fallback to topic+timestamp/sequence
  const ts = ev.ts || ev.consensus_timestamp || ev.timestamp
  const seq = ev.sequenceNumber || ev.sequence_number || ev.sequence
  const topic = ev.topicId || ev.topic_id
  if (topic && ts) return `${topic}:${ts}`
  if (topic && seq) return `${topic}#${seq}`
  return null
}

// Normalized SignalEvent shape - single source of truth for UI
export interface SignalEvent {
  id?: string
  type: 'CONTACT_REQUEST' | 'CONTACT_ACCEPT' | 'TRUST_ALLOCATE' | 'RECOGNITION_MINT' | 'SIGNAL_MINT' | 'PROFILE_UPDATE' | string
  actor: string                  // who performed the action
  target?: string                // optional counterparty
  ts: number                     // epoch millis
  topicId: string
  metadata?: Record<string, any> // raw payload/extra fields
  source: 'hcs' | 'hcs-cached'   // provenance badge
}

// Legacy types for backward compatibility during transition
export type SignalClass = "contact" | "trust" | "recognition" | "system"
export type SignalStatus = "local" | "onchain" | "error"
export type SignalScope = "global" | "my"
export type RecognitionCategory = "social" | "academic" | "professional"
export type TokenStatus = "active" | "transferred" | "burned"

export interface BondedContact {
  peerId: string
  handle?: string
  evmAddress?: string // EVM address for XMTP messaging
  bondedAt: number | string
  trustLevel?: number
  isBonded?: boolean  // true = mutual ACCEPT, false = pending REQUEST
  isPending?: boolean // true = optimistic update, waiting for Mirror Node confirmation
  hrl?: string
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
  private readonly HARD_CAP = 200
  private recognitionDefinitions: Record<string, any> = {}
  private listeners: (() => void)[] = []
  
  // TODO: T3 - Boost counts for GenZ viral sharing
  private boostCounts: Map<string, number> = new Map()

  // --- Core API ---
  add(event: SignalEvent): void {
    // Generate ID if not provided
    if (!event.id) {
      event.id = `sig_${Date.now()}_${Math.random().toString(36).slice(2)}`
    }
    
    // Special handling for PROFILE_UPDATE: don't overwrite optimistic updates with older HCS data
    if (event.type === 'PROFILE_UPDATE') {
      const existingProfile = this.signals.find(s => 
        s.type === 'PROFILE_UPDATE' && s.actor === event.actor
      )
      
      if (existingProfile) {
        // If existing is optimistic (_optimistic flag) and newer, keep it
        const existingIsOptimistic = existingProfile.metadata?._optimistic === true
        const incomingIsFromHCS = !event.metadata?._optimistic
        
        if (existingIsOptimistic && incomingIsFromHCS && existingProfile.ts > event.ts) {
          console.log('[SignalsStore] Skipping older HCS profile update for:', event.actor, '(keeping optimistic)')
          return // Don't add, keep the optimistic one
        }
        
        // Otherwise, remove the old one
        this.signals = this.signals.filter(s => 
          !(s.type === 'PROFILE_UPDATE' && s.actor === event.actor)
        )
      }
    } else {
      // For non-profile events, remove existing signal with same ID
      this.signals = this.signals.filter(s => s.id !== event.id)
    }
    
    // Add new signal (most recent first)
    this.signals.unshift(event)
    
    // Apply memory cap (simple LRU, no demo branching)
    if (this.signals.length > this.HARD_CAP) {
      this.signals = this.signals.slice(0, this.HARD_CAP)
    }

    console.log('[SignalsStore] Added signal:', event.type, event.source)
    this.persistToStorage()
    this.notifyListeners()
  }

  addMany(events: SignalEvent[]): void {
    events.forEach(event => this.add(event))
  }

  // --- Primary Queries ---
  getAll(): SignalEvent[] {
    return [...this.signals]
  }

  getSince(tsMs: number): SignalEvent[] {
    return this.signals.filter(s => s.ts >= tsMs)
  }

  getByType(type: string): SignalEvent[] {
    return this.signals.filter(s => s.type === type)
  }

  getByActor(sessionId: string): SignalEvent[] {
    return this.signals.filter(s => s.actor === sessionId)
  }

  getByActorOrTarget(sessionId: string): SignalEvent[] {
    return this.signals.filter(s => s.actor === sessionId || s.target === sessionId)
  }

  // Scoped query used by UI ("My/Global")
  getScoped(opts: { scope: 'my' | 'global'; sessionId: string; types?: string[] }): SignalEvent[] {
    let filtered = [...this.signals]

    // Apply scope filtering
    if (opts.scope === 'my') {
      filtered = filtered.filter(s => s.actor === opts.sessionId || s.target === opts.sessionId)
    }
    // 'global' scope shows all signals (no filtering)

    // Apply type filters if provided
    if (opts.types && opts.types.length > 0) {
      filtered = filtered.filter(s => opts.types!.includes(s.type))
    }

    return filtered
  }

  // --- Contact Helpers ---
  getBondedContacts(sessionId: string): BondedContact[] {
    console.log('[getBondedContacts] Called for sessionId:', sessionId)
    console.log('[getBondedContacts] Total signals in store:', this.signals.length)
    
    // Find all CONTACT_ACCEPT and CONTACT_MIRROR events involving this user
    const contactEvents = this.signals.filter(s => 
      (s.type === 'CONTACT_ACCEPT' || s.type === 'CONTACT_MIRROR') &&
      (s.actor === sessionId || s.target === sessionId)
    )
    
    console.log('[getBondedContacts] Found contactEvents:', contactEvents.length)
    contactEvents.forEach(e => {
      console.log('[getBondedContacts] Event:', e.type, 'actor:', e.actor, 'target:', e.target, 'source:', e.source, 'ts:', e.ts)
    })
    
    // Build unique contact list
    const contactsMap = new Map<string, BondedContact>()
    
    for (const event of contactEvents) {
      const contactId = event.actor === sessionId ? event.target : event.actor
      if (!contactId || contactId === sessionId) continue
      
      const existing = contactsMap.get(contactId)
      
      // If we already have this contact, only update if the new event is from HCS (confirmed)
      if (existing) {
        if (event.source === 'hcs' && existing.isPending) {
          existing.isPending = false // Upgrade from pending to confirmed
        }
        continue
      }
      
      // New contact - add it
      const metadata = event.metadata as any
      
      // Extract contact info based on who initiated vs who accepted
      const isUserActor = event.actor === sessionId
      const contactData = isUserActor ? metadata?.to : metadata?.from
      
      const handle = contactData?.handle || 
                    metadata?.from?.handle || 
                    metadata?.to?.handle || 
                    metadata?.acceptor?.handle ||
                    metadata?.requester?.handle ||
                    `User ${contactId.slice(-6)}`
      
      const hrl = contactData?.hrl ||
                 metadata?.from?.hrl || 
                 metadata?.to?.hrl || 
                 `hrl:tm/${contactId}`
      
      const evmAddress = contactData?.evm ||
                        metadata?.from?.evm ||
                        metadata?.to?.evm
      
      contactsMap.set(contactId, {
        peerId: contactId,
        handle,
        evmAddress,
        hrl,
        bondedAt: event.ts,
        isBonded: true,
        // Mark as pending only if this event is from recent local cache (< 2 min old)
        // AND we haven't seen an HCS confirmation yet
        isPending: event.source === 'hcs-cached' && (Date.now() - event.ts < 120000)
      })
    }
    
    // Get latest profile names for contacts
    const profileUpdates = this.signals.filter(s => s.type === 'PROFILE_UPDATE')
    for (const [contactId, contact] of contactsMap.entries()) {
      const profile = profileUpdates.find(p => p.actor === contactId)
      if (profile && profile.metadata?.displayName) {
        contact.handle = profile.metadata.displayName
      }
    }
    
    const result = Array.from(contactsMap.values())
    console.log('[getBondedContacts] Returning', result.length, 'contacts:', result.map(c => c.peerId))
    return result
  }

  // --- Profile Update Helper ---
  updateProfile(accountId: string, profile: { displayName?: string; bio?: string; avatar?: string }): void {
    // Remove ALL existing profile updates for this account (optimistic + HCS)
    this.signals = this.signals.filter(s => 
      !(s.type === 'PROFILE_UPDATE' && s.actor === accountId)
    )

    const profileEvent: SignalEvent = {
      id: `profile:${accountId}`, // Consistent ID format
      type: 'PROFILE_UPDATE',
      actor: accountId,
      ts: Date.now(),
      topicId: 'local', // will be replaced by HCS
      source: 'hcs-cached',
      metadata: {
        ...profile,
        accountId,
        displayName: profile.displayName, // Explicitly set for extraction
        _optimistic: true // Mark as optimistic update
      }
    }

    // Add at the beginning (most recent)
    this.signals.unshift(profileEvent)

    console.log('[SignalsStore] Updated profile for:', accountId, profile.displayName)
    this.persistToStorage()
    this.notifyListeners()
  }

  // --- Recognition Helpers ---
  getRecognitionsFor(ownerId: string): SignalEvent[] {
    return this.signals.filter(s => 
      s.type === 'RECOGNITION_MINT' && s.target === ownerId
    )
  }

  getRecognitionDefinitions(): Record<string, any> {
    return { ...this.recognitionDefinitions }
  }

  upsertRecognitionDefinition(def: any): void {
    if (def.id) {
      this.recognitionDefinitions[def.id] = def
    }
  }

  // --- UI State Helpers ---
  hasUnseen(filter?: unknown): boolean {
    const all = this.getAll()
    const predicate = typeof filter === 'function' ? (filter as (ev: any) => boolean) : undefined
    for (const ev of all) {
      const key = deriveId(ev)
      if (!key) continue
      if (!seenIds.has(key) && (!predicate || predicate(ev))) {
        return true
      }
    }
    return false
  }

  unseenCount(filter?: unknown): number {
    const all = this.getAll()
    const predicate = typeof filter === 'function' ? (filter as (ev: any) => boolean) : undefined
    let count = 0
    for (const ev of all) {
      const key = deriveId(ev)
      if (!key) continue
      if (!seenIds.has(key) && (!predicate || predicate(ev))) count++
    }
    return count
  }

  markSeen(idsOrEvents: string | any | Array<string | any>): void {
    const items = Array.isArray(idsOrEvents) ? idsOrEvents : [idsOrEvents]
    let changed = false
    for (const it of items) {
      const key = typeof it === 'string' ? it : deriveId(it)
      if (key && !seenIds.has(key)) {
        seenIds.add(key)
        changed = true
      }
    }
    if (changed) persistSeen()
    console.log('[SignalsStore] Marked seen:', items.length, 'items')
  }

  // TODO: T3 - Boost count management
  getBoostCount(signalId: string): number {
    return this.boostCounts.get(signalId) || 0
  }

  incrementBoostCount(signalId: string): void {
    const current = this.boostCounts.get(signalId) || 0
    this.boostCounts.set(signalId, current + 1)
    console.log('[SignalsStore] Boosted signal:', signalId, 'count:', current + 1)
    this.persistToStorage()
    this.notifyListeners()
  }

  // --- Debug Summary ---
  getSummary(): {
    countsByType: Record<string, number>,
    countsBySource: Record<'hcs' | 'hcs-cached', number>,
    total: number,
    totalBoosts: number,
    lastTs?: number
  } {
    const countsByType: Record<string, number> = {}
    const countsBySource: Record<'hcs' | 'hcs-cached', number> = { 'hcs': 0, 'hcs-cached': 0 }
    let lastTs: number | undefined

    for (const signal of this.signals) {
      // Count by type
      countsByType[signal.type] = (countsByType[signal.type] || 0) + 1
      
      // Count by source
      countsBySource[signal.source] = (countsBySource[signal.source] || 0) + 1
      
      // Track latest timestamp
      if (!lastTs || signal.ts > lastTs) {
        lastTs = signal.ts
      }
    }

    const totalBoosts = Array.from(this.boostCounts.values()).reduce((sum, count) => sum + count, 0)

    return {
      countsByType,
      countsBySource,
      total: this.signals.length,
      totalBoosts,
      lastTs
    }
  }

  // --- Infrastructure ---
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  // Public notify method for batching
  _notify(): void {
    this.notifyListeners()
  }

  clear(): void {
    this.signals = []
    this.recognitionDefinitions = {}
    this.boostCounts.clear()
    console.log('[SignalsStore] Cleared all signals')
    this.notifyListeners()
  }

  // --- Storage (simplified) ---
  private persistToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const data = {
          signals: this.signals,
          recognitionDefinitions: this.recognitionDefinitions,
          boostCounts: Array.from(this.boostCounts.entries())
        }
        localStorage.setItem('trustmesh:signals', JSON.stringify(data))
      }
    } catch (error) {
      console.warn('[SignalsStore] Failed to persist to storage:', error)
    }
  }

  loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('trustmesh:signals')
        if (stored) {
          const data = JSON.parse(stored)
          this.signals = data.signals || []
          this.recognitionDefinitions = data.recognitionDefinitions || {}
          this.boostCounts = new Map(data.boostCounts || [])
          console.log('[SignalsStore] Loaded', this.signals.length, 'signals from storage')
        }
      }
    } catch (error) {
      console.warn('[SignalsStore] Failed to load from storage:', error)
    }
  }
}

// Singleton instance
export const signalsStore = new SignalsStore()

// Initialize on load
if (typeof window !== 'undefined') {
  signalsStore.loadFromStorage()
}

// Batching utility to prevent re-render storms
export function batchSignals<T>(fn: () => T): T {
  _batchDepth++
  try {
    const result = fn()
    return result
  } finally {
    _batchDepth--
    if (_batchDepth === 0 && _pendingNotify) {
      _pendingNotify = false
      signalsStore._notify()
      signalsStore.persistToStorage() // Persist after batch
    }
  }
}

// React hook for efficient subscriptions
export function useSignals<T>(
  selector: SignalSelector<T>,
  compare?: (a: T, b: T) => boolean
): T {
  return useSyncExternalStore(
    signalsStore.subscribe.bind(signalsStore),
    () => selector(signalsStore),
    () => selector(signalsStore) // SSR fallback
  )
}

// Add compatibility methods for legacy code (both client and server)
if (!('addSignal' in signalsStore)) {
  (signalsStore as any).addSignal = signalsStore.add.bind(signalsStore)
}
if (!('getAllSignals' in signalsStore)) {
  (signalsStore as any).getAllSignals = signalsStore.getAll.bind(signalsStore)
}
if (!('clearSignals' in signalsStore)) {
  (signalsStore as any).clearSignals = signalsStore.clear.bind(signalsStore)
}
if (!('updateSignalStatus' in signalsStore)) {
  (signalsStore as any).updateSignalStatus = () => {} // No-op for legacy compatibility
}

// Debug helper for development
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.signalsStore = {
    getSummary: () => signalsStore.getSummary(),
    getAll: () => signalsStore.getAll(),
    getAllSignals: () => signalsStore.getAll(), // Legacy alias
    getSignals: (opts: { class?: string } = {}) => {
      // Legacy support for class-based filtering
      if (opts.class === 'contact') {
        return signalsStore.getAll().filter(s => s.type.includes('CONTACT'))
      } else if (opts.class === 'trust') {
        return signalsStore.getAll().filter(s => s.type.includes('TRUST'))
      } else if (opts.class === 'recognition') {
        return signalsStore.getAll().filter(s => s.type.includes('RECOGNITION'))
      }
      return signalsStore.getAll()
    },
    getScopedMy: (sid: string) => signalsStore.getScoped({ scope: 'my', sessionId: sid }),
    getScopedGlobal: (sid: string) => signalsStore.getScoped({ scope: 'global', sessionId: sid }),
    getScoped: (opts: { scope: 'my' | 'global'; sessionId: string; types?: string[] }) => signalsStore.getScoped(opts),
    getByType: (type: string) => signalsStore.getByType(type),
    getByActor: (sessionId: string) => signalsStore.getByActor(sessionId),
    getByActorOrTarget: (sessionId: string) => signalsStore.getByActorOrTarget(sessionId),
    hasUnseen: (filter?: (ev: any) => boolean) => signalsStore.hasUnseen(filter),
    unseenCount: (filter?: (ev: any) => boolean) => signalsStore.unseenCount(filter),
    markSeen: (idsOrEvents: string | any | Array<string | any>) => signalsStore.markSeen(idsOrEvents),
    batchSignals,
    useSignals,
  }
}
