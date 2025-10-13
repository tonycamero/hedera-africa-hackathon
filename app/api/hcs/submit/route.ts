import { NextRequest, NextResponse } from 'next/server'
import { submitToTopic } from '@/lib/hedera/serverClient'
import { getRegistryTopics, type RegistryTopics } from '@/lib/hcs2/registry'
import { HCS21_TYPE_TO_STRING } from '@/lib/hcs21/enums'

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

    const topics = await getRegistryTopics()
    const topicId = routeTopicByEnvelope(body, topics)
    if (!topicId) throw new Error(`No topic for envelope: ${JSON.stringify({hcs: body.hcs, type: body.type})}`)

    const message = JSON.stringify(body)
    const result = await submitToTopic(topicId, message)

    // Structured log (expand with request ID in prod)
    const logType = body.hcs === "21" ? `${body.hcs}:${body.type}` : body.type
    console.log(`[HCS Submit] Success: from=${body.from}, type=${logType}, seq=${result.sequenceNumber}`)

    return NextResponse.json({ ok: true, topicId, ...result })
  } catch (e: any) {
    console.error(`[HCS Submit] Error: ${e.message}`)
    return NextResponse.json({ ok: false, error: e.message || 'Submit failed' }, { status: 400 })
  }
}

function routeTopicByEnvelope(body: any, t: RegistryTopics): string | undefined {
  // HCS-21 numeric enum format
  if (body?.hcs === "21" && typeof body?.type === 'number') {
    const typeName = HCS21_TYPE_TO_STRING[body.type]
    if (!typeName) return t.feed
    
    switch (typeName) {
      case 'CONTACT_REQUEST':
      case 'CONTACT_ACCEPT':
      case 'CONTACT_REVOKE':  return t.contacts
      case 'TRUST_ALLOCATE':
      case 'TRUST_REVOKE':    return t.trust
      case 'RECOGNITION_MINT':
      case 'RECOGNITION_VALIDATE': return t.recognitionInstances || t.recognition
      default: return t.feed
    }
  }
  
  // Legacy string-based types (backward compatibility)
  return routeTopic(body.type, t)
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
