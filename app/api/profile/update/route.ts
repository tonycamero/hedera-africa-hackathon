import { NextRequest, NextResponse } from 'next/server'
import { submitToTopic } from '@/lib/hedera/serverClient'
import { getRegistryTopics } from '@/lib/hcs2/registry'

// In-memory nonce store (per from); use Redis in prod
const nonceStore: Record<string, number> = {}

type ProfileUpdateRequest = {
  sessionId: string
  handle: string
  bio?: string
  visibility: 'public' | 'contacts'
  location?: string
  avatar?: string
}

function validateProfileUpdate(req: ProfileUpdateRequest) {
  if (!req || typeof req !== 'object') throw new Error('Invalid body')
  if (!req.sessionId || !req.handle) throw new Error('Missing required fields: sessionId, handle')
  if (!['public', 'contacts'].includes(req.visibility)) throw new Error('Invalid visibility')
  if (req.bio && req.bio.length > 500) throw new Error('Bio too long (max 500 chars)')
  if (req.handle.length < 1 || req.handle.length > 50) throw new Error('Invalid handle length')
}

export async function POST(req: NextRequest) {
  try {
    const body: ProfileUpdateRequest = await req.json()
    validateProfileUpdate(body)

    const topics = await getRegistryTopics()
    const topicId = topics.profile
    if (!topicId) throw new Error('No profile topic configured')

    // Use server account for signing
    const serverAccount = process.env.HEDERA_OPERATOR_ID || "0.0.5864559"
    
    // Create HCS-11 compliant envelope
    const nonce = Math.floor(Date.now() / 1000)
    const envelope = {
      type: "PROFILE_UPDATE",
      from: serverAccount,
      nonce,
      ts: nonce,
      payload: {
        sessionId: body.sessionId,
        handle: body.handle,
        bio: body.bio || "",
        visibility: body.visibility,
        location: body.location || "",
        avatar: body.avatar || ""
      }
    }

    const message = JSON.stringify(envelope)
    const result = await submitToTopic(topicId, message)

    console.log(`[Profile Update] Success: sessionId=${body.sessionId}, handle=${body.handle}, seq=${result.sequenceNumber}`)

    return NextResponse.json({ 
      ok: true, 
      topicId,
      profileHrl: `hcs://11/${topicId}/${result.sequenceNumber}`,
      ...result 
    })
  } catch (e: any) {
    console.error(`[Profile Update] Error: ${e.message}`)
    return NextResponse.json({ ok: false, error: e.message || 'Profile update failed' }, { status: 400 })
  }
}