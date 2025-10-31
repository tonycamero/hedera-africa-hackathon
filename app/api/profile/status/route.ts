import { NextRequest, NextResponse } from 'next/server'
import { requireMagic, getAccountId } from '@/lib/server/auth'
import { getLatestProfileFor } from '@/lib/server/profile/normalizer'

export const dynamic = 'force-dynamic'

/**
 * GET /api/profile/status
 * 
 * Returns whether user has completed onboarding
 * Uses normalized profile fetching with caching
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMagic(req)
    
    // Client can send either EVM (0x...) or Hedera (0.0.x) account ID
    const reqUrl = new URL(req.url)
    const rawId = reqUrl.searchParams.get('accountId') || getAccountId(user)
    const userEmail = user.email
    const isEvm = rawId?.startsWith('0x')

    console.log(`[API /profile/status] Checking profile for ${rawId} (${userEmail})`, {
      type: isEvm ? 'EVM' : 'Hedera',
      willResolve: isEvm
    })

    // Normalizer handles EVM→Hedera resolution via mirror node (read-only, no provisioning)
    const profile = await getLatestProfileFor(rawId, userEmail)

    // Check if profile has meaningful content (not just empty strings)
    const hasDisplayName = profile?.displayName && 
                          profile.displayName.trim().length > 0 && 
                          profile.displayName !== 'Unnamed'
    const hasBio = profile?.bio && profile.bio.trim().length > 0
    const hasCompletedOnboarding = !!(hasDisplayName || hasBio)

    console.log(`[API /profile/status] Result: hasCompletedOnboarding=${hasCompletedOnboarding}`, {
      displayName: profile?.displayName,
      bio: profile?.bio?.slice(0, 50),
      resolvedFrom: isEvm ? 'EVM address' : 'Hedera account ID'
    })

    return NextResponse.json({ 
      accountId: rawId,
      hasCompletedOnboarding,
      profile,
      source: isEvm ? 'hcs-normalized(evmalias)' : 'hcs-normalized'
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /profile/status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check profile status' },
      { status: error?.status ?? 500 }
    )
  }
}
