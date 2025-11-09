import { NextRequest, NextResponse } from 'next/server'
import { requireMagic, getAccountId } from '@/lib/server/auth'
import { profileStore } from '@/lib/server/profileStore'
import { DEFAULT_LENS } from '@/lib/lens/lensConfig'

export const dynamic = 'force-dynamic'

/**
 * GET /api/profile/get-lens
 * 
 * Returns user's lens state (active, owned, unlocks)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMagic(req)
    
    // Use HCS-22 resolution to get the authoritative Hedera account ID
    const { resolveOrProvision } = await import('@/lib/server/hcs22/resolveOrProvision')
    const resolution = await resolveOrProvision(user.issuer)
    const accountId = resolution.hederaAccountId
    
    const profile = (await profileStore.get(accountId)) || {}

    // normalize shape
    const owned = profile.lens?.owned ?? (profile.createdAt ? [profile.lens?.active ?? DEFAULT_LENS] : [])
    const active = profile.lens?.active ?? owned[0] ?? DEFAULT_LENS
    
    // Include profile metadata for existing user detection
    const hasProfile = !!(profile.displayName || profile.createdAt)

    return NextResponse.json({ 
      accountId,
      owned, 
      active,
      hasProfile,
      displayName: profile.displayName,
      createdAt: profile.createdAt
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /profile/get-lens] Error:', error)
    const status = error?.status ?? 500
    return NextResponse.json(
      { error: error.message || 'Failed to get lens' },
      { status }
    )
  }
}
