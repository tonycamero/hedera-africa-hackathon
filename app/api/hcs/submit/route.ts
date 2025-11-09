import { NextRequest, NextResponse } from 'next/server'
import { submitToTopic } from '@/lib/hedera/serverClient'
import { getRegistryTopics, type RegistryTopics } from '@/lib/hcs2/registry'
import { getTemplate, templateExists } from '@/lib/templates'

// In-memory nonce store (per from); use Redis in prod
const nonceStore: Record<string, number> = {}

type Envelope = {
  type: string
  from: string // e.g., Alex Chen's account ID
  nonce: number
  ts: number // Unix seconds
  payload: Record<string, any>
}

function validateEnvelope(e: Envelope) {
  if (!e || typeof e !== 'object') throw new Error('Invalid body')
  if (!e.type || !e.from || typeof e.nonce !== 'number' || typeof e.ts !== 'number') {
    throw new Error('Missing required envelope fields')
  }
  const now = Math.floor(Date.now() / 1000)
  if (e.ts < now - 600 || e.ts > now + 120) throw new Error('Timestamp out of bounds')
  
  // Monotonic nonce per from (replay protection)
  const lastNonce = nonceStore[e.from] ?? -1
  if (e.nonce <= lastNonce) throw new Error('Nonce must be monotonic increasing')
  nonceStore[e.from] = e.nonce
}

export async function POST(req: NextRequest) {
  try {
    const body: Envelope = await req.json()
    validateEnvelope(body)
    
    // Additional validation for signal mints
    if (body.type === 'RECOGNITION_MINT' && body.payload?.t === 'signal.mint@1') {
      const validationResult = validateSignalMint(body.payload)
      if (!validationResult.valid) {
        throw new Error(validationResult.error)
      }
    }

    const topics = await getRegistryTopics()
    const topicId = routeTopic(body.type, topics)
    if (!topicId) throw new Error(`No topic for type ${body.type}`)

    const message = JSON.stringify(body)
    const result = await submitToTopic(topicId, message)

    // Structured log (expand with request ID in prod)
    console.log(`[HCS Submit] Success: from=${body.from}, type=${body.type}, seq=${result.sequenceNumber}`)

    return NextResponse.json({ ok: true, topicId, ...result })
  } catch (e: any) {
    console.error(`[HCS Submit] Error: ${e.message}`)
    return NextResponse.json({ ok: false, error: e.message || 'Submit failed' }, { status: 400 })
  }
}

/**
 * Validate signal mint payload against template library
 */
function validateSignalMint(payload: any): { valid: boolean; error?: string } {
  try {
    // Extract template ID from def_id (format: grit.template_id@1)
    const templateId = payload.def_id?.replace(/^grit\.|@1$/g, '')
    if (!templateId) {
      return { valid: false, error: 'Missing or invalid template ID in def_id' }
    }
    
    // Check if template exists in library
    if (!templateExists(templateId)) {
      return { valid: false, error: `Template '${templateId}' not found in library` }
    }
    
    // Get template for validation
    const template = getTemplate(templateId)
    if (!template) {
      return { valid: false, error: `Template '${templateId}' not available` }
    }
    
    // Validate fill length
    const fill = payload.fill || ''
    if (fill.length > template.maxFill) {
      return { 
        valid: false, 
        error: `Fill text too long: ${fill.length} chars (max ${template.maxFill})` 
      }
    }
    
    if (fill.length === 0) {
      return { valid: false, error: 'Fill text cannot be empty' }
    }
    
    // Validate note length if present
    const note = payload.note || ''
    if (note.length > 120) {
      return { 
        valid: false, 
        error: `Note too long: ${note.length} chars (max 120)` 
      }
    }
    
    // Basic positivity check
    const negativeWords = ['hate', 'terrible', 'awful', 'horrible', 'worst', 'stupid', 'dumb', 'suck', 'sucks']
    const textToCheck = (fill + ' ' + note).toLowerCase()
    const foundNegative = negativeWords.find(word => textToCheck.includes(word))
    
    if (foundNegative) {
      return { 
        valid: false, 
        error: `Please keep your message positive and encouraging (found: '${foundNegative}')` 
      }
    }
    
    // All checks passed
    return { valid: true }
    
  } catch (error) {
    return { 
      valid: false, 
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

function routeTopic(type: string, t: RegistryTopics) {
  switch (type) {
    case 'CONTACT_REQUEST':
    case 'CONTACT_ACCEPT': return t.contacts
    case 'TRUST_ALLOCATE':
    case 'TRUST_REVOKE':   return t.trust
    case 'RECOGNITION_MINT':
    case 'NFT_MINT':       return t.recognitionInstances || t.recognition
    case 'RECOGNITION_DEFINITION': return t.recognition  // For publishing definitions
    case 'PROFILE_UPDATE': return t.profile
    case 'SYSTEM_UPDATE':  return t.system
    default:               return t.feed
  }
}
