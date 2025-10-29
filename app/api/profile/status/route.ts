import { NextRequest, NextResponse } from 'next/server'
import { requireMagic, getAccountId } from '@/lib/server/auth'
import { profileStore } from '@/lib/server/profileStore'

export const dynamic = 'force-dynamic'

/**
 * GET /api/profile/status
 * 
 * Returns whether user has completed onboarding
 * Used to route returning users correctly
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMagic(req)
    const accountId = getAccountId(user)
    const profile = await profileStore.get(accountId)

    const hasCompletedOnboarding = !!(
      profile?.displayName || 
      profile?.createdAt ||
      (profile?.lens?.owned && profile.lens.owned.length > 0)
    )

    return NextResponse.json({ 
      accountId,
      hasCompletedOnboarding,
      profile: profile ? {
        displayName: profile.displayName,
        bio: profile.bio,
        createdAt: profile.createdAt,
        hasLens: !!(profile.lens?.owned && profile.lens.owned.length > 0),
        lens: profile.lens
      } : null
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /profile/status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check profile status' },
      { status: error?.status ?? 500 }
    )
  }
}
