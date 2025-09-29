/**
 * Derived selectors for SignalsStore - fast, memo-friendly patterns
 * These selectors provide efficient access to common UI data patterns
 */

import type { SignalEvent, SignalSelector } from './signalsStore'

// Type helper for handling timestamp compatibility
type SignalWithTimestamp = SignalEvent & { ts?: number }

// ===== BASIC SELECTORS =====

export const selectAll = (): SignalSelector<SignalEvent[]> => (store) => {
  return store.getAll()
}

export const selectByType = (type: string): SignalSelector<SignalEvent[]> => (store) => {
  return store.getByType(type)
}

export const selectByActor = (actor: string): SignalSelector<SignalEvent[]> => (store) => {
  return store.getByActor(actor)
}

export const selectByTarget = (target: string): SignalSelector<SignalEvent[]> => (store) => {
  return store.getByActorOrTarget(target).filter(e => e.target === target)
}

export const selectSince = (timestamp: number): SignalSelector<SignalEvent[]> => (store) => {
  return store.getSince(timestamp)
}

// ===== SCOPED SELECTORS =====

export const selectScoped = (
  sessionId: string,
  scope: 'my' | 'global',
  type?: string
): SignalSelector<SignalEvent[]> => (store) => {
  return store.getScoped(sessionId, scope, type)
}

export const selectMySignals = (sessionId: string, type?: string): SignalSelector<SignalEvent[]> => (store) => {
  return store.getScoped(sessionId, 'my', type)
}

export const selectGlobalSignals = (sessionId: string, type?: string): SignalSelector<SignalEvent[]> => (store) => {
  return store.getScoped(sessionId, 'global', type)
}

// ===== CONTACT & TRUST SELECTORS =====

export const selectBondedContacts = (sessionId: string): SignalSelector<string[]> => (store) => {
  const bonded = new Set<string>()
  const contactEvents = store.getByType('CONTACT_ACCEPT')
  
  for (const event of contactEvents) {
    const { actor, target } = event
    if (actor === sessionId && target) {
      bonded.add(target)
    } else if (target === sessionId && actor) {
      bonded.add(actor)
    }
  }
  
  return Array.from(bonded).sort()
}

export const selectContactRequests = (sessionId: string): SignalSelector<SignalEvent[]> => (store) => {
  return store.getByType('CONTACT_REQUEST').filter(event => event.target === sessionId)
}

export const selectTrustStats = (sessionId: string): SignalSelector<{
  given: number
  received: number
  balance: number
}> => (store) => {
  let given = 0
  let received = 0
  
  const trustEvents = store.getByType('TRUST_ALLOCATE')
  
  for (const event of trustEvents) {
    if (event.actor === sessionId && event.metadata?.amount) {
      given += event.metadata.amount
    } else if (event.target === sessionId && event.metadata?.amount) {
      received += event.metadata.amount
    }
  }
  
  return {
    given,
    received,
    balance: received - given
  }
}

// ===== RECOGNITION SELECTORS =====

export const selectRecognitionsFor = (userId: string): SignalSelector<SignalEvent[]> => (store) => {
  return store.getRecognitionsFor(userId)
}

export const selectRecognitionDefinitions = (): SignalSelector<Record<string, any>> => (store) => {
  return store.getRecognitionDefinitions()
}

export const selectRecognitionByType = (recognitionId: string): SignalSelector<SignalEvent[]> => (store) => {
  return store.getByType('RECOGNITION_MINT').filter(event => 
    event.metadata?.recognitionId === recognitionId ||
    event.metadata?.definition?.id === recognitionId ||
    event.metadata?.definition?.slug === recognitionId
  )
}

// ===== FEED & ACTIVITY SELECTORS =====

export const selectRecentActivity = (
  sessionId: string,
  limit: number = 50,
  types?: string[]
): SignalSelector<SignalEvent[]> => (store) => {
  let events = store.getScoped(sessionId, 'global')
  
  if (types && types.length > 0) {
    events = events.filter(event => types.includes(event.type))
  }
  
  return events
    .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
    .slice(0, limit)
}

export const selectFeedStats = (sessionId: string): SignalSelector<{
  totalEvents: number
  myEvents: number
  globalEvents: number
  eventsByType: Record<string, number>
  lastActivity?: number
}> => (store) => {
  const myEvents = store.getScoped(sessionId, 'my')
  const globalEvents = store.getScoped(sessionId, 'global')
  
  const eventsByType: Record<string, number> = {}
  for (const event of globalEvents) {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
  }
  
  const lastActivity = globalEvents.length > 0 
    ? Math.max(...globalEvents.map(e => e.timestamp))
    : undefined
  
  return {
    totalEvents: globalEvents.length,
    myEvents: myEvents.length,
    globalEvents: globalEvents.length,
    eventsByType,
    lastActivity
  }
}

// ===== SEARCH & FILTER SELECTORS =====

export const selectFilteredSignals = (
  sessionId: string,
  scope: 'my' | 'global',
  filters: {
    types?: string[]
    actors?: string[]
    search?: string
    dateRange?: { start: number; end: number }
  }
): SignalSelector<SignalEvent[]> => (store) => {
  let events = store.getScoped(sessionId, scope)
  
  if (filters.types && filters.types.length > 0) {
    events = events.filter(event => filters.types!.includes(event.type))
  }
  
  if (filters.actors && filters.actors.length > 0) {
    events = events.filter(event => filters.actors!.includes(event.actor))
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    events = events.filter(event => {
      return (
        event.type.toLowerCase().includes(searchLower) ||
        event.actor.toLowerCase().includes(searchLower) ||
        (event.target && event.target.toLowerCase().includes(searchLower)) ||
        JSON.stringify(event.metadata).toLowerCase().includes(searchLower)
      )
    })
  }
  
  if (filters.dateRange) {
    events = events.filter(event => 
      event.timestamp >= filters.dateRange!.start && 
      event.timestamp <= filters.dateRange!.end
    )
  }
  
  return events
}

// ===== SUMMARY SELECTORS =====

export const selectSummary = (): SignalSelector<{
  countsByType: Record<string, number>
  countsBySource: Record<'hcs' | 'hcs-cached', number>
  total: number
  lastTs?: number
}> => (store) => {
  return store.getSummary()
}

export const selectHealthStats = (): SignalSelector<{
  isReady: boolean
  hasData: boolean
  errorRate: number
  recentActivity: boolean
}> => (store) => {
  const summary = store.getSummary()
  const now = Date.now()
  const fiveMinutesAgo = now - (5 * 60 * 1000)
  
  return {
    isReady: summary.total > 0,
    hasData: summary.total > 0,
    errorRate: 0, // TODO: Track errors in store
    recentActivity: summary.lastTs ? summary.lastTs > fiveMinutesAgo : false
  }
}