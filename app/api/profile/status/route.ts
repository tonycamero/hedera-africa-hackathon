import { NextRequest, NextResponse } from 'next/server'
import { requireMagic, getAccountId } from '@/lib/server/auth'
import { topics } from '@/lib/registry/serverRegistry'

export const dynamic = 'force-dynamic'

const MIRROR_BASE = process.env.HEDERA_MIRROR_BASE || "https://testnet.mirrornode.hedera.com"

/**
 * GET /api/profile/status
 * 
 * Returns whether user has completed onboarding
 * Checks HCS for profile existence (not in-memory store)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMagic(req)
    const accountId = getAccountId(user)

    console.log(`[API /profile/status] Checking HCS for profile: ${accountId}`)

    // Fetch all profile messages from HCS profile topic
    const PROFILE_TOPIC_ID = topics().profile
    const url = `${MIRROR_BASE}/api/v1/topics/${PROFILE_TOPIC_ID}/messages?order=desc&limit=100`
    
    const response = await fetch(url, { 
      cache: "no-store",
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      console.warn(`[API /profile/status] Mirror node error: ${response.status}`)
      // If mirror fails, assume no profile (safe default for onboarding)
      return NextResponse.json({ 
        accountId,
        hasCompletedOnboarding: false,
        profile: null,
        source: 'hcs-error'
      }, { status: 200 })
    }

    const data = await response.json()
    const messages = data.messages || []

    // Find the most recent PROFILE_UPDATE for this accountId
    let latestProfile = null
    for (const msg of messages) {
      try {
        const decoded = JSON.parse(Buffer.from(msg.message, "base64").toString("utf8"))
        if (decoded.accountId === accountId && decoded.type === "PROFILE_UPDATE") {
          latestProfile = decoded
          break // messages are ordered desc, so first match is most recent
        }
      } catch (e) {
        // Skip malformed messages
        continue
      }
    }

    const hasCompletedOnboarding = !!(latestProfile?.displayName || latestProfile?.bio)

    console.log(`[API /profile/status] Result for ${accountId}: hasCompletedOnboarding=${hasCompletedOnboarding}`)

    return NextResponse.json({ 
      accountId,
      hasCompletedOnboarding,
      profile: latestProfile ? {
        displayName: latestProfile.displayName,
        bio: latestProfile.bio,
        avatar: latestProfile.avatar,
        timestamp: latestProfile.timestamp
      } : null,
      source: 'hcs'
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /profile/status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check profile status' },
      { status: error?.status ?? 500 }
    )
  }
}
