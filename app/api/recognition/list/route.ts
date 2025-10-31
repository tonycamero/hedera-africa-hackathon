import { NextRequest, NextResponse } from 'next/server'
import { requireMagic, getAccountId } from '@/lib/server/auth'
import { recognitionStore } from '@/lib/server/recognitionStore'

export const dynamic = 'force-dynamic'

/**
 * GET /api/recognition/list
 * 
 * Returns ALL recognition signals with frozen metadata.
 * No lens filtering - everyone sees the same labels/emojis.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMagic(req)
    
    // Use HCS-22 resolution to get the authoritative Hedera account ID
    const { resolveOrProvision } = await import('@/lib/server/hcs22/resolveOrProvision')
    const resolution = await resolveOrProvision(user.issuer)
    const accountId = resolution.hederaAccountId
    
    console.log(`[API /recognition/list] Resolved ${user.issuer} → ${accountId}`)

    // Fetch ALL signals for user with frozen metadata
    const signals = await recognitionStore.listForUser(accountId)

    return NextResponse.json({ signals }, { status: 200 })
  } catch (error: any) {
    console.error('[API /recognition/list] Error:', error)
    const status = error?.status ?? 500
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch signals' },
      { status }
    )
  }
}
