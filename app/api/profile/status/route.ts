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
    
    const userEmail = user.email
    console.log(`[API /profile/status] Checking profile for user ${userEmail}`)

    // Use HCS-22 resolution to get the authoritative Hedera account ID
    // This handles EVM→Hedera mapping via the identity binding system
    const { resolveOrProvision } = await import('@/lib/server/hcs22/resolveOrProvision')
    const resolution = await resolveOrProvision(user.issuer)
    const hederaAccountId = resolution.hederaAccountId
    
    console.log(`[API /profile/status] Resolved ${user.issuer} → ${hederaAccountId} (source: ${resolution.source})`)

    // Fetch profile using the resolved Hedera account ID
    const profile = await getLatestProfileFor(hederaAccountId, userEmail)

    // Check if profile has meaningful content (not just empty strings)
    const hasDisplayName = profile?.displayName && 
                          profile.displayName.trim().length > 0
    const hasBio = profile?.bio && profile.bio.trim().length > 0
    const hasCompletedOnboarding = !!(hasDisplayName || hasBio)

    console.log(`[API /profile/status] Result: hasCompletedOnboarding=${hasCompletedOnboarding}`, {
      displayName: profile?.displayName,
      bio: profile?.bio?.slice(0, 50),
      hederaAccountId
    })

    return NextResponse.json({ 
      accountId: hederaAccountId,
      hasCompletedOnboarding,
      profile,
      source: 'hcs-normalized(identity-resolved)'
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /profile/status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check profile status' },
      { status: error?.status ?? 500 }
    )
  }
}
