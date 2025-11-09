import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, targetId, weight = 1 } = body
    
    if (!sessionId || !targetId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId and targetId' },
        { status: 400 }
      )
    }
    
    console.log('[API /trust/allocate] Allocating trust:', { sessionId, targetId, weight })
    
    // Submit trust allocation event to HCS via the existing HCS submit endpoint
    const envelope = {
      type: 'TRUST_ALLOCATE',
      from: sessionId,
      nonce: Date.now(),
      ts: Math.floor(Date.now() / 1000),
      payload: {
        actor: sessionId,
        target: targetId,
        trustValue: weight,
        slot: 1, // Slot is not meaningful with equal weight model, but included for compatibility
        status: 'pending'
      }
    }
    
    console.log('[API /trust/allocate] Submitting envelope to HCS:', envelope)
    
    const hcsResponse = await fetch(`${request.nextUrl.origin}/api/hcs/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope) // Submit envelope directly, not wrapped in topicType
    })
    
    const hcsResult = await hcsResponse.json()
    
    console.log('[API /trust/allocate] HCS response:', hcsResult)
    
    if (!hcsResult.ok) {
      throw new Error(hcsResult.error || 'Failed to submit trust allocation to HCS')
    }
    
    const hcsRef = `hcs://${hcsResult.sequenceNumber}/${hcsResult.topicId}/${hcsResult.sequenceNumber}`
    console.log('[API /trust/allocate] Trust allocated successfully:', hcsRef)
    
    return NextResponse.json({
      success: true,
      hcsRef,
      topicId: hcsResult.topicId,
      sequenceNumber: hcsResult.sequenceNumber,
      message: 'Trust allocated successfully'
    })
  } catch (error) {
    console.error('[API /trust/allocate] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to allocate trust'
      },
      { status: 500 }
    )
  }
}
