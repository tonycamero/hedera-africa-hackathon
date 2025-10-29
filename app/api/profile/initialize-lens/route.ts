import { NextRequest, NextResponse } from 'next/server'
import { LENSES } from '@/lib/lens/lensConfig'

export const dynamic = 'force-dynamic'

/**
 * POST /api/profile/initialize-lens
 * 
 * Sets user's first lens choice (free, idempotent)
 * Body: { firstLens: 'base' | 'genz' | 'african' }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { firstLens } = body as { firstLens: keyof typeof LENSES }

    if (!firstLens || !LENSES[firstLens]) {
      return NextResponse.json({ error: 'Invalid lens' }, { status: 400 })
    }

    // TODO: Get accountId from Magic token
    // For now, use localStorage key pattern to store lens state
    // In production, this would write to HCS profile or database
    
    const lensState = {
      active: firstLens,
      owned: [firstLens],
      lastSwitch: new Date().toISOString(),
      unlocks: {},
    }

    // Return the lens state (client will store in localStorage)
    return NextResponse.json(lensState, { status: 200 })
  } catch (error: any) {
    console.error('[API /profile/initialize-lens] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize lens' },
      { status: 500 }
    )
  }
}
