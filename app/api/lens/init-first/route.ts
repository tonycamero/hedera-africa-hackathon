import { NextRequest, NextResponse } from 'next/server'
import { requireMagic, getAccountId } from '@/lib/server/auth'
import { profileStore } from '@/lib/server/profileStore'
import { LENSES, type LensKey, DEFAULT_LENS } from '@/lib/lens/lensConfig'

export const dynamic = 'force-dynamic'

/**
 * POST /api/lens/init-first
 * 
 * Initialize first lens during onboarding (free, no TRST charge)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireMagic(req)
    
    // Use HCS-22 resolution to get the authoritative Hedera account ID
    const { resolveOrProvision } = await import('@/lib/server/hcs22/resolveOrProvision')
    const resolution = await resolveOrProvision(user.issuer)
    const accountId = resolution.hederaAccountId
    
    const { lens }: { lens?: LensKey } = await req.json()

    const firstLens = lens && LENSES[lens] ? lens : DEFAULT_LENS
    const profile = (await profileStore.get(accountId)) || {}

    // If already initialized, return existing state
    if (profile.lens?.owned?.length) {
      return NextResponse.json({ 
        ok: true, 
        alreadyInitialized: true, 
        active: profile.lens.active,
        owned: profile.lens.owned
      })
    }

    // Initialize first lens (free)
    const updated = {
      ...profile,
      accountId,
      lens: {
        active: firstLens,
        owned: [firstLens],
        lastSwitch: new Date().toISOString(),
        unlocks: {},
      },
      createdAt: profile.createdAt ?? new Date().toISOString(),
    }

    await profileStore.set(accountId, updated)
    
    console.log(`[init-first] Initialized ${firstLens} lens for ${accountId}`)
    
    return NextResponse.json({ 
      ok: true, 
      active: firstLens, 
      owned: [firstLens] 
    })
  } catch (error: any) {
    console.error('[API /lens/init-first] Error:', error)
    const status = error?.status ?? 500
    return NextResponse.json(
      { error: error?.message ?? 'Init failed' },
      { status }
    )
  }
}
