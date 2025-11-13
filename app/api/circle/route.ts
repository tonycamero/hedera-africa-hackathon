import { NextRequest, NextResponse } from 'next/server'
import { circleState } from '@/lib/stores/HcsCircleState'
import { requireMagicAuth } from '@/lib/server/auth/requireMagicAuth'
import { resolveOrProvision } from '@/lib/server/hcs22/resolveOrProvision'

export const dynamic = 'force-dynamic'

// Feature flag for gradual rollout
const CIRCLE_STATE_ENABLED = process.env.CIRCLE_STATE_ENABLED !== 'false' // Enabled by default

// Hard cap on contacts returned (CIR-3: Privacy safeguard)
const MAX_CONTACTS_RETURNED = 250

/**
 * Log circle query metrics for observability (CIR-3)
 */
function logCircleQuery({
  hederaAccountId,
  authLatency,
  queryLatency,
  nodeCount,
  cappedAt
}: {
  hederaAccountId: string
  authLatency: number
  queryLatency: number
  nodeCount: number
  cappedAt?: number
}) {
  console.log('[OBSERVABILITY /circle] Query metrics:', {
    account: hederaAccountId,
    authLatencyMs: authLatency.toFixed(2),
    queryLatencyMs: queryLatency.toFixed(2),
    nodeCount,
    cappedAt: cappedAt || null,
    totalLatencyMs: (authLatency + queryLatency).toFixed(2)
  })
  
  if (cappedAt) {
    console.warn(`[SAFEGUARD /circle] Contact count (${nodeCount}) exceeded limit, capped at ${cappedAt}`)
  }
}

export async function GET(request: NextRequest) {
  try {
    // === NEW: Auth-scoped circle query using HcsCircleState ===
    
    const authStart = performance.now()
    
    // 1. Authenticate user via Magic token
    const auth = await requireMagicAuth(request)
    if (!auth?.issuer) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - please sign in' },
        { status: 401 }
      )
    }
    
    // 2. Resolve Hedera account ID from Magic issuer via HCS-22
    const { hederaAccountId } = await resolveOrProvision(auth.issuer)
    
    const authLatency = performance.now() - authStart
    
    if (!hederaAccountId) {
      return NextResponse.json(
        { success: false, error: 'No Hedera account - identity not bound' },
        { status: 400 }
      )
    }
    
    // 3. Check if circle state is ready (has processed at least one event)
    if (!circleState.isReady()) {
      return NextResponse.json(
        {
          success: false,
          status: 'warming',
          message: 'Circle state initializing, please try again in a moment'
        },
        { status: 202 }
      )
    }
    
    console.log('[API /circle] Loading circle data for:', hederaAccountId)
    
    const queryStart = performance.now()
    
    // 4. Query scoped circle (O(N) where N = user's contacts, NOT total events)
    const circle = circleState.getCircleFor(hederaAccountId)
    
    const queryLatency = performance.now() - queryStart
    
    // 5. Build minimal, privacy-preserving response with hard cap (CIR-3)
    let allContacts = circle.contacts.map(contact => ({
      peerId: contact.accountId,
      handle: contact.handle,
      bondedAt: contact.bondedAt,
      profileHrl: contact.profileHrl,
      // Exclude global metadata - only return what's needed
      isBonded: true
    }))
    
    // Apply hard cap to prevent exposure of large social graphs
    const originalCount = allContacts.length
    let cappedAt: number | undefined
    if (allContacts.length > MAX_CONTACTS_RETURNED) {
      cappedAt = MAX_CONTACTS_RETURNED
      allContacts = allContacts.slice(0, MAX_CONTACTS_RETURNED)
    }
    
    const bondedContacts = allContacts
    
    // Calculate trust stats from edges (if available)
    const trustAllocated = circle.edges
      .filter(e => e.strength !== undefined)
      .reduce((sum, e) => sum + (e.strength || 0), 0)
    
    const response = {
      success: true,
      accountId: hederaAccountId,
      bondedContacts,
      trustStats: {
        allocatedOut: trustAllocated,
        maxSlots: 9, // Fixed from Inner Circle spec
        bondedContacts: bondedContacts.length
      },
      // Placeholder for future Inner Circle integration
      innerCircle: {
        count: circle.innerCircle?.length || 0
      },
      _meta: {
        source: 'HcsCircleState',
        lastUpdated: circle.lastUpdated
      }
    }
    
    // Log observability metrics (CIR-3)
    logCircleQuery({
      hederaAccountId,
      authLatency,
      queryLatency,
      nodeCount: originalCount,
      cappedAt
    })
    
    console.log('[API /circle] ✅ Returning auth-scoped data:', bondedContacts.length, 'contacts')
    console.log('[API /circle] ✅ NO GLOBAL SCAN - query complexity: O(N) where N =', originalCount)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[API /circle] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load circle data' 
      },
      { status: 500 }
    )
  }
}
