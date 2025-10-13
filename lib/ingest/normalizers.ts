/**
 * Idempotent message normalization for HCS to SignalEvent conversion
 * Provides defensive parsing and consistent event shape transformation
 */

import { SignalEvent } from '../stores/signalsStore'
import { toMillis } from './time'
import { HCS21_TYPE_TO_STRING } from '../hcs21/enums'
import { isHcs21Message, extractPayload, extractFrom } from '../hcs21/build'

/**
 * Normalize HCS message to SignalEvent format
 * @param raw Raw HCS message from Mirror Node
 * @param source Data source ('hcs' for real-time, 'hcs-cached' for backfilled)
 * @returns Normalized SignalEvent or null if invalid
 */
export function normalizeHcsMessage(raw: any, source: 'hcs' | 'hcs-cached'): SignalEvent | null {
  try {
    const decoded = decodeBase64Json(raw.message) ?? {}
    const isHcs21 = decoded?.hcs === "21" && typeof decoded?.type === 'number'
    
    // For HCS-21: metadata = inner payload, actor from envelope
    // For legacy: metadata = full decoded, actor from payload
    const metadata = isHcs21 ? (decoded.payload ?? {}) : decoded
    const type = inferSignalType(decoded, raw)
    const actor = isHcs21 ? (decoded.from ?? extractActor(metadata)) : extractActor(decoded)
    const target = isHcs21 ? 
      (metadata?.target ?? extractTarget(metadata)) : 
      (extractTarget(decoded) ?? extractTarget(decoded.payload))
    const timestamp = toMillis(raw.consensus_timestamp) ?? Date.now()
    const topicId = raw.topic_id ?? raw.topicId ?? ''
    const id = raw.sequence_number ? `${topicId}/${raw.sequence_number}` : `${topicId}/${Date.now()}-${Math.random()}`

    // Validate required fields
    if (!type || !actor) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Normalizer] Skipping message - missing type or actor', { type, actor, isHcs21, payload: metadata })
      }
      return null
    }

    return {
      id,
      type,
      actor,
      target,
      ts: timestamp,
      topicId,
      metadata, // Inner payload for HCS-21, full decoded for legacy
      source,
    }
  } catch (error) {
    console.warn('[Normalizer] Failed to normalize message:', error, { raw })
    return null
  }
}

/**
 * Decode base64-encoded JSON message payload
 * @param base64String Base64 encoded string
 * @returns Parsed JSON object or null if invalid
 */
function decodeBase64Json(base64String?: string): any | null {
  if (!base64String) return null
  
  try {
    // Handle both raw strings and base64-encoded strings
    let jsonString: string
    
    if (base64String.startsWith('{')) {
      // Already decoded JSON
      jsonString = base64String
    } else {
      // Base64 encoded - decode it
      jsonString = atob(base64String)
    }
    
    return JSON.parse(jsonString)
  } catch (error) {
    // If base64 decode fails, try as raw JSON
    try {
      return JSON.parse(base64String)
    } catch {
      console.debug('[Normalizer] Failed to decode message payload:', base64String)
      return null
    }
  }
}

/**
 * Infer signal type from payload and raw message
 * @param payload Decoded message payload
 * @param raw Raw HCS message
 * @returns Signal type string
 */
function inferSignalType(payload: any, raw: any): string | undefined {
  // HCS-21 envelope format - check decoded payload first
  if (payload?.hcs === "21" && typeof payload?.type === 'number') {
    return HCS21_TYPE_TO_STRING[payload.type] || 'UNKNOWN'
  }
  
  // HCS-21 envelope format - check raw message second
  if (raw?.hcs === "21" && typeof raw?.type === 'number') {
    return HCS21_TYPE_TO_STRING[raw.type] || 'UNKNOWN'
  }
  
  // Explicit type field (preferred for legacy)
  if (payload.type) return payload.type
  if (raw.type) return raw.type
  
  // Kind field (common pattern)
  if (payload.kind) {
    switch (payload.kind) {
      case 'CONTACT_REQUEST': return 'CONTACT_REQUEST'
      case 'CONTACT_ACCEPT': return 'CONTACT_ACCEPT'
      case 'TRUST_ALLOCATE': return 'TRUST_ALLOCATE'
      case 'RECOGNITION_MINT': return 'RECOGNITION_MINT'
      case 'RECOGNITION_DEFINITION': return 'RECOGNITION_DEFINITION'
      case 'PROFILE_UPDATE': return 'PROFILE_UPDATE'
      default: return payload.kind
    }
  }
  
  // Pattern-based inference
  if (payload.recognitionId || payload.owner) return 'RECOGNITION_MINT'
  if (payload.profile || payload.displayName) return 'PROFILE_UPDATE'
  if (payload.amount && payload.to) return 'TRUST_ALLOCATE'
  if (payload.from && payload.to && payload.status) return 'CONTACT_REQUEST'
  
  // HCS-11 schema patterns
  if (payload.schema === 'hcs-11-recognition-definition') return 'RECOGNITION_DEFINITION'
  if (payload.schema === 'hcs-11-recognition-instance') return 'RECOGNITION_MINT'
  if (payload.schema === 'hcs-11-contact-request') return 'CONTACT_REQUEST'
  if (payload.schema === 'hcs-11-trust-allocation') return 'TRUST_ALLOCATE'
  
  // Fall back to analyzing field patterns
  return inferTypeFromFields(payload)
}

/**
 * Infer type from payload field patterns
 * @param payload Message payload
 * @returns Inferred type or undefined
 */
function inferTypeFromFields(payload: any): string | undefined {
  const fields = Object.keys(payload || {})
  
  // Recognition patterns
  if (fields.includes('recognitionId') && fields.includes('owner')) return 'RECOGNITION_MINT'
  if (fields.includes('slug') && fields.includes('title')) return 'RECOGNITION_DEFINITION'
  
  // Contact patterns
  if (fields.includes('from') && fields.includes('to') && !fields.includes('amount')) {
    return 'CONTACT_REQUEST'
  }
  
  // Trust patterns
  if (fields.includes('amount') && fields.includes('to')) return 'TRUST_ALLOCATE'
  
  // Profile patterns
  if (fields.includes('displayName') || fields.includes('avatar') || fields.includes('profile')) {
    return 'PROFILE_UPDATE'
  }
  
  return undefined
}

/**
 * Extract actor (sender) from payload
 * @param payload Message payload
 * @returns Actor identifier
 */
function extractActor(payload: any): string | undefined {
  // Standard fields
  if (payload.actor) return String(payload.actor)
  if (payload.from) return String(payload.from)
  if (payload.issuer) return String(payload.issuer)
  if (payload.sender) return String(payload.sender)
  
  // Recognition-specific
  if (payload.issuer) return String(payload.issuer)
  
  // Profile-specific (self-updates)
  if (payload.owner && payload.type === 'PROFILE_UPDATE') return String(payload.owner)
  
  return undefined
}

/**
 * Extract target (recipient) from payload
 * @param payload Message payload
 * @returns Target identifier or undefined
 */
function extractTarget(payload: any): string | undefined {
  // Standard fields
  if (payload.target) return String(payload.target)
  if (payload.to) return String(payload.to)
  if (payload.recipient) return String(payload.recipient)
  
  // Recognition-specific
  if (payload.owner) return String(payload.owner)
  
  // Contact-specific
  if (payload.contactId) return String(payload.contactId)
  
  return undefined
}

/**
 * Validate SignalEvent has required fields
 * @param event Potential SignalEvent
 * @returns true if valid
 */
export function isValidSignalEvent(event: any): event is SignalEvent {
  return (
    event &&
    typeof event.id === 'string' &&
    typeof event.type === 'string' &&
    typeof event.actor === 'string' &&
    typeof event.ts === 'number' &&
    typeof event.topicId === 'string' &&
    typeof event.source === 'string' &&
    (event.source === 'hcs' || event.source === 'hcs-cached') &&
    (event.target === undefined || typeof event.target === 'string')
  )
}

/**
 * Normalize batch of HCS messages
 * @param messages Array of raw HCS messages
 * @param source Data source
 * @returns Array of normalized SignalEvents (filtered for valid ones)
 */
export function normalizeHcsMessageBatch(
  messages: any[], 
  source: 'hcs' | 'hcs-cached'
): SignalEvent[] {
  const results: SignalEvent[] = []
  
  for (const msg of messages) {
    const normalized = normalizeHcsMessage(msg, source)
    if (normalized && isValidSignalEvent(normalized)) {
      results.push(normalized)
    }
  }
  
  return results
}