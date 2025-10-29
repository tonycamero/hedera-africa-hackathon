import { NextRequest, NextResponse } from 'next/server'
import { LENSES, ENABLE_LENS_UNLOCK } from '@/lib/lens/lensConfig'

export const dynamic = 'force-dynamic'

/**
 * POST /api/profile/unlock-lens
 * 
 * Unlocks a new lens after TRST payment
 * Body: { lens: 'genz' | 'african', payment: { txId: string, amount: number } }
 * 
 * ROLLBACK: Disabled for hackathon (single-lens mode)
 */
export async function POST(req: NextRequest) {
  // Rollback: disable unlock endpoint
  if (!ENABLE_LENS_UNLOCK) {
    return NextResponse.json(
      { ok: false, disabled: true, message: 'Lens unlock is currently disabled' },
      { status: 410 }
    )
  }
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { lens, payment } = body as {
      lens: keyof typeof LENSES
      payment: { txId: string; amount: number }
    }

    if (!lens || !LENSES[lens]) {
      return NextResponse.json({ error: 'Invalid lens' }, { status: 400 })
    }

    const expectedAmount = LENSES[lens].priceTRST
    if (payment.amount !== expectedAmount) {
      return NextResponse.json(
        { error: `Incorrect payment amount. Expected: ${expectedAmount} TRST` },
        { status: 400 }
      )
    }

    // TODO: Verify TRST payment on-chain (txId, amount, context)
    // TODO: Update HCS profile/database with new owned lens
    // For now, accept mock payment and return updated state
    
    const lensState = {
      active: lens,
      owned: ['base', lens], // TODO: merge with existing owned
      lastSwitch: new Date().toISOString(),
      unlocks: {
        [lens]: {
          txId: payment.txId,
          amount: payment.amount,
        },
      },
    }

    return NextResponse.json(lensState, { status: 200 })
  } catch (error: any) {
    console.error('[API /profile/unlock-lens] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unlock lens' },
      { status: 500 }
    )
  }
}
