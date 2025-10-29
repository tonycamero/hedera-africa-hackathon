import { NextRequest, NextResponse } from 'next/server'
import { LENSES } from '@/lib/lens/lensConfig'

export const dynamic = 'force-dynamic'

/**
 * POST /api/profile/set-lens
 * 
 * Switches active lens (must already be owned)
 * Body: { active: 'base' | 'genz' | 'african' }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { active } = body as { active: keyof typeof LENSES }

    if (!active || !LENSES[active]) {
      return NextResponse.json({ error: 'Invalid lens' }, { status: 400 })
    }

    // TODO: Verify lens is owned, update HCS profile/database
    // For now, trust the client has verified ownership
    
    const lensState = {
      active,
      owned: ['base'], // TODO: fetch actual owned lenses
      lastSwitch: new Date().toISOString(),
      unlocks: {},
    }

    return NextResponse.json(lensState, { status: 200 })
  } catch (error: any) {
    console.error('[API /profile/set-lens] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set lens' },
      { status: 500 }
    )
  }
}
