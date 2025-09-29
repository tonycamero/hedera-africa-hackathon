/**
 * Recognition message decoder for two-phase ingestion
 * Handles both recognition definitions and instances with proper classification
 */

interface RecognitionDefinition {
  _kind: 'definition'
  id: string
  slug?: string
  title: string
  icon?: string
  description?: string
  schema?: string
  meta: any
}

interface RecognitionInstance {
  _kind: 'instance'
  owner: string
  recognitionId: string
  actor?: string
  note?: string
  timestamp?: number
  topicId?: string
  meta: any
}

interface UnknownRecognition {
  _kind: 'unknown'
  payload?: any
  raw: any
}

export type DecodedRecognition = RecognitionDefinition | RecognitionInstance | UnknownRecognition

/**
 * Decode and classify recognition message
 * @param raw Raw HCS message
 * @returns Classified recognition object
 */
export function decodeRecognition(raw: any): DecodedRecognition {
  const payload = tryDecodeBase64Json(raw.message)
  
  if (!payload) {
    return { _kind: 'unknown', raw }
  }

  // Strategy 1: Explicit classification by type/kind
  if (isExplicitDefinition(payload)) {
    return { _kind: 'definition', ...coerceDefinition(payload) }
  }
  
  if (isExplicitInstance(payload)) {
    return { 
      _kind: 'instance', 
      ...coerceInstance(payload),
      topicId: raw.topic_id || raw.topicId 
    }
  }

  // Strategy 2: Pattern-based classification
  if (isPatternDefinition(payload)) {
    return { _kind: 'definition', ...coerceDefinition(payload) }
  }
  
  if (isPatternInstance(payload)) {
    return { 
      _kind: 'instance', 
      ...coerceInstance(payload),
      topicId: raw.topic_id || raw.topicId 
    }
  }

  // Strategy 3: Structure-based inference
  if (hasDefinitionStructure(payload)) {
    return { _kind: 'definition', ...coerceDefinition(payload) }
  }
  
  if (hasInstanceStructure(payload)) {
    return { 
      _kind: 'instance', 
      ...coerceInstance(payload),
      topicId: raw.topic_id || raw.topicId 
    }
  }

  // Unknown - return with payload for potential manual processing
  return { _kind: 'unknown', payload, raw }
}

/**
 * Try to decode base64 JSON payload
 */
function tryDecodeBase64Json(message?: string): any | null {
  if (!message) return null
  
  try {
    // Handle both raw JSON and base64-encoded JSON
    if (message.startsWith('{')) {
      return JSON.parse(message)
    } else {
      const decoded = atob(message)
      return JSON.parse(decoded)
    }
  } catch (error) {
    // Try parsing as direct JSON in case it's not base64
    try {
      return JSON.parse(message)
    } catch {
      console.debug('[Recognition] Failed to decode message:', message)
      return null
    }
  }
}

/**
 * Check if payload is explicitly marked as a definition
 */
function isExplicitDefinition(payload: any): boolean {
  return (
    payload.kind === 'RECOGNITION_DEFINITION' ||
    payload.type === 'RECOGNITION_DEFINITION' ||
    payload.type === 'HCS11_DEF' ||
    payload.messageType === 'RECOGNITION_DEFINITION'
  )
}

/**
 * Check if payload is explicitly marked as an instance
 */
function isExplicitInstance(payload: any): boolean {
  return (
    payload.kind === 'RECOGNITION_MINT' ||
    payload.type === 'RECOGNITION_MINT' ||
    payload.type === 'HCS11_INSTANCE' ||
    payload.messageType === 'RECOGNITION_MINT'
  )
}

/**
 * Check if payload matches definition pattern
 */
function isPatternDefinition(payload: any): boolean {
  return (
    payload.schema === 'hcs-11-recognition-definition' ||
    (payload.slug && payload.title && !payload.owner)
  )
}

/**
 * Check if payload matches instance pattern
 */
function isPatternInstance(payload: any): boolean {
  return (
    payload.schema === 'hcs-11-recognition-instance' ||
    (payload.owner && payload.recognitionId)
  )
}

/**
 * Check if payload has definition-like structure
 */
function hasDefinitionStructure(payload: any): boolean {
  const fields = Object.keys(payload || {})
  
  // Definitions typically have metadata fields
  const definitionFields = ['title', 'description', 'icon', 'slug', 'schema', 'criteria']
  const instanceFields = ['owner', 'issuer', 'issuedAt', 'note']
  
  const definitionScore = definitionFields.filter(f => fields.includes(f)).length
  const instanceScore = instanceFields.filter(f => fields.includes(f)).length
  
  return definitionScore > instanceScore && definitionScore >= 2
}

/**
 * Check if payload has instance-like structure
 */
function hasInstanceStructure(payload: any): boolean {
  const fields = Object.keys(payload || {})
  
  // Instances typically have ownership/issuance fields
  return (
    fields.includes('owner') ||
    (fields.includes('to') && fields.includes('recognitionId')) ||
    (fields.includes('recipient') && fields.includes('recognitionId'))
  )
}

/**
 * Coerce payload into definition format
 */
function coerceDefinition(payload: any): Omit<RecognitionDefinition, '_kind'> {
  return {
    id: String(payload.id ?? payload.recognitionId ?? payload.slug ?? generateId()),
    slug: payload.slug,
    title: payload.title ?? payload.name ?? payload.slug ?? 'Untitled Recognition',
    icon: payload.icon ?? payload.emoji ?? '🏷️',
    description: payload.description ?? payload.desc,
    schema: payload.schema,
    meta: payload,
  }
}

/**
 * Coerce payload into instance format
 */
function coerceInstance(payload: any): Omit<RecognitionInstance, '_kind'> {
  return {
    owner: payload.owner ?? payload.target ?? payload.to ?? payload.recipient,
    recognitionId: String(payload.recognitionId ?? payload.slug ?? payload.id ?? 'unknown'),
    actor: payload.actor ?? payload.issuer ?? payload.from ?? payload.sender,
    note: payload.note ?? payload.reason ?? payload.message,
    timestamp: payload.timestamp ?? payload.issuedAt,
    meta: payload,
  }
}

/**
 * Generate a random ID for missing identifiers
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Utility to check if a decoded recognition is a definition
 */
export function isRecognitionDefinition(decoded: DecodedRecognition): decoded is RecognitionDefinition {
  return decoded._kind === 'definition'
}

/**
 * Utility to check if a decoded recognition is an instance
 */
export function isRecognitionInstance(decoded: DecodedRecognition): decoded is RecognitionInstance {
  return decoded._kind === 'instance'
}