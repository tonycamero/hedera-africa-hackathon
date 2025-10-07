/**
 * Canonical HCS Event Model for TrustMesh
 * 
 * All events are append-only, idempotent, revocable via new events.
 * Unified envelope structure for Contacts, Trust (Circle-of-9), and Signals.
 */

import { ulid } from 'ulid'

// Base event envelope - all HCS messages follow this structure
export interface HCSEvent {
  v: 1                              // Schema version
  eid: string                       // Event ID (ULID for ordering)
  type: 'contact' | 'trust' | 'signal'
  subtype: 'create' | 'accept' | 'revoke' | 'ack' | 'allocate' | 'withdraw'
  actor: string                     // Hedera account ID (0.0.x) or DID
  subject?: string                  // Counterparty for bilateral events
  ctx: {
    domain: 'social' | 'academic' | 'professional'
    timestamp: number               // Client timestamp (ms)
    network: 'testnet' | 'mainnet'
  }
  payload: Record<string, any>      // Event-specific data (may be encrypted)
  refs?: {
    prior?: string                  // Reference to previous event EID
    root?: string                   // Reference to root event in chain
  }
  sig?: string                      // Actor signature (optional for testnet)
  encrypted?: boolean               // Flag if payload is encrypted
}

// Contact Events - mutual relationship building
export interface ContactCreateEvent extends HCSEvent {
  type: 'contact'
  subtype: 'create'
  subject: string                   // Required for bilateral contact
  payload: {
    note?: string                   // Optional context note
    handle?: string                 // Preferred display handle
    name?: string                   // Display name (encrypted if sensitive)
    metadata?: {
      source?: string               // How they met (e.g., "campus fair")
      category?: string[]           // Tags like ["colleague", "classmate"]
    }
  }
}

export interface ContactAcceptEvent extends HCSEvent {
  type: 'contact'
  subtype: 'accept'
  subject: string
  refs: {
    prior: string                   // EID of the create event being accepted
  }
  payload: {
    note?: string                   // Optional acceptance note
    handle?: string                 // How acceptor wants to be known
    name?: string                   // Display name
  }
}

export interface ContactRevokeEvent extends HCSEvent {
  type: 'contact'
  subtype: 'revoke'
  subject: string
  refs: {
    prior: string                   // EID of relationship being revoked
  }
  payload: {
    reason?: string                 // Optional reason
  }
}

// Trust Events - Circle-of-9 allocations
export interface TrustAllocateEvent extends HCSEvent {
  type: 'trust'
  subtype: 'allocate'
  subject: string
  payload: {
    slot: number                    // 1-9, which trust slot being allocated
    weight?: number                 // Optional weight (default 1)
    note?: string                   // Optional note about trust reasoning
    category?: 'personal' | 'professional' | 'academic'
  }
}

export interface TrustAcceptEvent extends HCSEvent {
  type: 'trust'
  subtype: 'accept'
  subject: string                   // Who is accepting (actor receives trust)
  refs: {
    prior: string                   // EID of allocation being accepted
  }
  payload: {
    note?: string                   // Optional acceptance note
  }
}

export interface TrustWithdrawEvent extends HCSEvent {
  type: 'trust'
  subtype: 'withdraw'
  subject: string
  refs: {
    prior: string                   // EID of trust being withdrawn
  }
  payload: {
    reason?: string                 // Optional reason
  }
}

// Signal Events - recognition/achievement system
export interface SignalCreateEvent extends HCSEvent {
  type: 'signal'
  subtype: 'create'
  subject?: string                  // Optional - who signal is about/for
  payload: {
    label: string                   // e.g., "Peer Mentor", "Community Builder"
    category: 'academic' | 'social' | 'professional' | 'community' | 'special'
    description?: string            // Longer description
    issuer?: string                 // Who/what issued this signal
    evidence?: string               // IPFS hash or URL to evidence
    metadata?: {
      course?: string               // Academic context
      project?: string              // Project context  
      organization?: string         // Issuing organization
      skills?: string[]             // Related skills
      impact?: string               // Impact description
    }
    expires?: number                // Optional expiration timestamp
  }
}

export interface SignalAckEvent extends HCSEvent {
  type: 'signal'
  subtype: 'ack'
  refs: {
    prior: string                   // EID of signal being acknowledged
  }
  payload: {
    note?: string                   // Optional acknowledgment note
  }
}

export interface SignalRevokeEvent extends HCSEvent {
  type: 'signal'
  subtype: 'revoke'
  refs: {
    prior: string                   // EID of signal being revoked
  }
  payload: {
    reason?: string                 // Revocation reason
    authority?: string              // Who authorized revocation
  }
}

// Union type for all event types
export type CanonicalHCSEvent = 
  | ContactCreateEvent 
  | ContactAcceptEvent 
  | ContactRevokeEvent
  | TrustAllocateEvent 
  | TrustAcceptEvent 
  | TrustWithdrawEvent
  | SignalCreateEvent 
  | SignalAckEvent 
  | SignalRevokeEvent

// Topic routing
export const HCS_TOPICS = {
  CONTACT: 'contact',
  TRUST: 'trust', 
  SIGNAL: 'signal'
} as const

// Event builders with validation
export class HCSEventBuilder {
  static createContact(
    actor: string,
    subject: string,
    payload: ContactCreateEvent['payload'],
    ctx: HCSEvent['ctx']
  ): ContactCreateEvent {
    return {
      v: 1,
      eid: ulid(),
      type: 'contact',
      subtype: 'create',
      actor,
      subject,
      ctx,
      payload
    }
  }

  static acceptContact(
    actor: string,
    subject: string,
    priorEid: string,
    payload: ContactAcceptEvent['payload'],
    ctx: HCSEvent['ctx']
  ): ContactAcceptEvent {
    return {
      v: 1,
      eid: ulid(),
      type: 'contact',
      subtype: 'accept',
      actor,
      subject,
      ctx,
      payload,
      refs: { prior: priorEid }
    }
  }

  static allocateTrust(
    actor: string,
    subject: string,
    slot: number,
    payload: Omit<TrustAllocateEvent['payload'], 'slot'>,
    ctx: HCSEvent['ctx']
  ): TrustAllocateEvent {
    if (slot < 1 || slot > 9) {
      throw new Error('Trust slot must be between 1 and 9')
    }
    
    return {
      v: 1,
      eid: ulid(),
      type: 'trust',
      subtype: 'allocate',
      actor,
      subject,
      ctx,
      payload: { ...payload, slot }
    }
  }

  static createSignal(
    actor: string,
    payload: SignalCreateEvent['payload'],
    ctx: HCSEvent['ctx'],
    subject?: string
  ): SignalCreateEvent {
    return {
      v: 1,
      eid: ulid(),
      type: 'signal',
      subtype: 'create',
      actor,
      subject,
      ctx,
      payload
    }
  }
}

// State folding utilities
export interface ContactState {
  id: string                        // Contact pair key (sorted)
  actor: string
  subject: string
  status: 'pending' | 'bonded' | 'revoked'
  createdAt: number
  acceptedAt?: number
  revokedAt?: number
  actorHandle?: string
  subjectHandle?: string
  notes: string[]
}

export interface TrustState {
  id: string                        // Trust allocation key
  actor: string                     // Who allocated trust
  subject: string                   // Who received trust
  slot: number                      // Trust slot (1-9)
  status: 'allocated' | 'accepted' | 'withdrawn'
  allocatedAt: number
  acceptedAt?: number
  withdrawnAt?: number
  weight: number
  category?: string
}

export interface SignalState {
  id: string                        // Signal EID
  actor: string                     // Who created signal
  subject?: string                  // Who signal is about (if applicable)
  label: string
  category: string
  description?: string
  issuer?: string
  status: 'active' | 'acknowledged' | 'revoked'
  createdAt: number
  acknowledgedAt?: number
  revokedAt?: number
  evidence?: string
  metadata?: Record<string, any>
}

// Event validation
export function validateHCSEvent(event: any): event is CanonicalHCSEvent {
  if (!event || typeof event !== 'object') return false
  if (event.v !== 1) return false
  if (!event.eid || !event.type || !event.subtype || !event.actor || !event.ctx) return false
  if (!['contact', 'trust', 'signal'].includes(event.type)) return false
  if (!event.ctx.domain || !event.ctx.timestamp || !event.ctx.network) return false
  return true
}

// State folder - computes current state from event stream
export class HCSStateFoldr {
  static foldContacts(events: CanonicalHCSEvent[]): ContactState[] {
    const contacts = new Map<string, ContactState>()
    
    const contactEvents = events.filter(e => e.type === 'contact') as (ContactCreateEvent | ContactAcceptEvent | ContactRevokeEvent)[]
    
    for (const event of contactEvents.sort((a, b) => a.ctx.timestamp - b.ctx.timestamp)) {
      const pairKey = [event.actor, event.subject].sort().join('|')
      
      if (event.subtype === 'create') {
        contacts.set(pairKey, {
          id: pairKey,
          actor: event.actor,
          subject: event.subject,
          status: 'pending',
          createdAt: event.ctx.timestamp,
          actorHandle: event.payload.handle || event.payload.name,
          notes: [event.payload.note].filter(Boolean)
        })
      } else if (event.subtype === 'accept') {
        const existing = contacts.get(pairKey)
        if (existing) {
          existing.status = 'bonded'
          existing.acceptedAt = event.ctx.timestamp
          existing.subjectHandle = event.payload.handle || event.payload.name
          if (event.payload.note) existing.notes.push(event.payload.note)
        }
      } else if (event.subtype === 'revoke') {
        const existing = contacts.get(pairKey)
        if (existing) {
          existing.status = 'revoked'
          existing.revokedAt = event.ctx.timestamp
          if (event.payload.reason) existing.notes.push(`Revoked: ${event.payload.reason}`)
        }
      }
    }
    
    return Array.from(contacts.values()).filter(c => c.status !== 'revoked')
  }

  static foldTrust(events: CanonicalHCSEvent[]): TrustState[] {
    const trust = new Map<string, TrustState>()
    
    const trustEvents = events.filter(e => e.type === 'trust') as (TrustAllocateEvent | TrustAcceptEvent | TrustWithdrawEvent)[]
    
    for (const event of trustEvents.sort((a, b) => a.ctx.timestamp - b.ctx.timestamp)) {
      const trustKey = `${event.actor}|${event.subject}`
      
      if (event.subtype === 'allocate') {
        trust.set(trustKey, {
          id: trustKey,
          actor: event.actor,
          subject: event.subject,
          slot: event.payload.slot,
          status: 'allocated',
          allocatedAt: event.ctx.timestamp,
          weight: event.payload.weight || 1,
          category: event.payload.category
        })
      } else if (event.subtype === 'accept') {
        const existing = trust.get(trustKey)
        if (existing) {
          existing.status = 'accepted'
          existing.acceptedAt = event.ctx.timestamp
        }
      } else if (event.subtype === 'withdraw') {
        const existing = trust.get(trustKey)
        if (existing) {
          existing.status = 'withdrawn'
          existing.withdrawnAt = event.ctx.timestamp
        }
      }
    }
    
    return Array.from(trust.values()).filter(t => t.status !== 'withdrawn')
  }

  static foldSignals(events: CanonicalHCSEvent[]): SignalState[] {
    const signals = new Map<string, SignalState>()
    
    const signalEvents = events.filter(e => e.type === 'signal') as (SignalCreateEvent | SignalAckEvent | SignalRevokeEvent)[]
    
    for (const event of signalEvents.sort((a, b) => a.ctx.timestamp - b.ctx.timestamp)) {
      if (event.subtype === 'create') {
        signals.set(event.eid, {
          id: event.eid,
          actor: event.actor,
          subject: event.subject,
          label: event.payload.label,
          category: event.payload.category,
          description: event.payload.description,
          issuer: event.payload.issuer,
          status: 'active',
          createdAt: event.ctx.timestamp,
          evidence: event.payload.evidence,
          metadata: event.payload.metadata
        })
      } else if (event.subtype === 'ack' && event.refs?.prior) {
        const existing = signals.get(event.refs.prior)
        if (existing) {
          existing.status = 'acknowledged'
          existing.acknowledgedAt = event.ctx.timestamp
        }
      } else if (event.subtype === 'revoke' && event.refs?.prior) {
        const existing = signals.get(event.refs.prior)
        if (existing) {
          existing.status = 'revoked'
          existing.revokedAt = event.ctx.timestamp
        }
      }
    }
    
    return Array.from(signals.values()).filter(s => s.status !== 'revoked')
  }
}

export default {
  HCSEventBuilder,
  HCSStateFoldr,
  validateHCSEvent,
  HCS_TOPICS
}