import { NextRequest, NextResponse } from 'next/server'
import { Magic } from '@magic-sdk/admin'
import { verifySignature } from '@/lib/hedera/verifySignature'

const magic = new Magic(process.env.MAGIC_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    // 1) Auth: validate DID token
    const auth = req.headers.get('Authorization') || ''
    const didToken = auth.replace(/^Bearer\s+/i, '')
    if (!didToken) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }
    
    await magic.token.validate(didToken) // throws on invalid
    const meta = await magic.users.getMetadataByToken(didToken)

    // 2) Parse signed payload
    const body = await req.json()
    const {
      type, accountId, displayName, bio, avatar, timestamp,
      publicKeyDer, signature
    } = body || {}

    if (!type || !accountId || !displayName || !timestamp || !publicKeyDer || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3) Verify signature with freshness + replay protection
    const fullPayload = { type, accountId, displayName, bio, avatar, timestamp }
    const verification = await verifySignature(
      fullPayload,
      signature,
      publicKeyDer,
      timestamp,
      {
        maxAge: 5 * 60_000, // 5 minutes
        checkReplay: true,
        cachePrefix: 'profile'
      }
    )

    if (!verification.valid) {
      const statusCode = verification.error === 'REPLAY' ? 409 : 
                        verification.error === 'STALE_PAYLOAD' ? 400 : 401
      return NextResponse.json({ 
        error: verification.error,
        message: verification.message 
      }, { status: statusCode })
    }

    // 4) Persist profile to DB (upsert)
    // await db.profiles.upsert({ accountId, displayName, bio, avatar, signedAt: timestamp, email: meta.email })

    console.log('[verify-profile] Signature verified for', displayName, 'by', meta.email)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[verify-profile] Error:', e)
    return NextResponse.json({ error: e.message || 'VERIFY_FAILED' }, { status: 500 })
  }
}
