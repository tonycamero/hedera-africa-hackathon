import { NextRequest, NextResponse } from 'next/server'
import { submitToTopic } from '@/lib/hedera/serverClient'
import { getRegistryTopics } from '@/lib/hcs2/registry'

/**
 * @deprecated This endpoint writes old nested payload format.
 * Use /api/hcs/profile instead which writes flat structure with accountId.
 * This endpoint is kept for backward compatibility but should not be used in new code.
 */

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
  console.warn('[DEPRECATED] /api/profile/update is deprecated and DISABLED. Use /api/hcs/profile instead.')
  
  // DISABLED: This endpoint writes old nested payload format and conflicts with user-signed profiles
  // All profile updates should go through /api/hcs/profile which uses flat structure with signatures
  return NextResponse.json({ 
    ok: false, 
    error: 'This endpoint is deprecated. Use /api/hcs/profile for user-signed profile updates.' 
  }, { status: 410 }) // 410 Gone
}
