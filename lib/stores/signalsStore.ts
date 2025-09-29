'use client'

import { useSyncExternalStore } from 'react'

// Type definitions
type SignalSelector<T> = (store: SignalsStore) => T

// Batching state
let _batchDepth = 0
let _pendingNotify = false

// Normalized SignalEvent shape - single source of truth for UI
export interface SignalEvent {
  id?: string
  type: 'CONTACT_REQUEST' | 'CONTACT_ACCEPT' | 'TRUST_ALLOCATE' | 'RECOGNITION_MINT' | 'PROFILE_UPDATE' | string
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
  private readonly HARD_CAP = 200
  private recognitionDefinitions: Record<string, any> = {}
  private listeners: (() => void)[] = []

  // --- Core API ---
  add(event: SignalEvent): void {
    // Generate ID if not provided
    if (!event.id) {
      event.id = `sig_${Date.now()}_${Math.random().toString(36).slice(2)}`
    }
    
    // Remove existing signal with same ID if exists
    this.signals = this.signals.filter(s => s.id !== event.id)
    
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
  hasUnseen(category?: string): boolean {
    // For now, return false as the unseen functionality needs more complex state tracking
    // This prevents the JavaScript error in the UI
    return false
  }

  // --- Debug Summary ---
  getSummary(): {
    countsByType: Record<string, number>,
    countsBySource: Record<'hcs' | 'hcs-cached', number>,
    total: number,
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

    return {
      countsByType,
      countsBySource,
      total: this.signals.length,
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
    console.log('[SignalsStore] Cleared all signals')
    this.notifyListeners()
  }

  // --- Storage (simplified) ---
  private persistToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const data = {
          signals: this.signals,
          recognitionDefinitions: this.recognitionDefinitions
        }
        localStorage.setItem('trustmesh_signals', JSON.stringify(data))
      }
    } catch (error) {
      console.warn('[SignalsStore] Failed to persist to storage:', error)
    }
  }

  loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('trustmesh_signals')
        if (stored) {
          const data = JSON.parse(stored)
          this.signals = data.signals || []
          this.recognitionDefinitions = data.recognitionDefinitions || {}
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

// Debug helper for development
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.signalsStore = {
    getSummary: () => signalsStore.getSummary(),
    getAll: () => signalsStore.getAll(),
    getScopedMy: (sid: string) => signalsStore.getScoped({ scope: 'my', sessionId: sid }),
    getScopedGlobal: (sid: string) => signalsStore.getScoped({ scope: 'global', sessionId: sid }),
    batchSignals,
    useSignals,
  }
}
