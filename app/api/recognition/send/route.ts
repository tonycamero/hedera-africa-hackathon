import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      recipientId,
      recipientName,
      tokenId,
      tokenName,
      tokenDescription,
      tokenIcon,
      tokenCategory,
      trustValue,
      rarity,
      message,
      senderId,
      senderName
    } = body

    if (!recipientId || !tokenId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Build HCS envelope for RECOGNITION_MINT
    const envelope = {
      type: 'RECOGNITION_MINT',
      from: senderId,
      nonce: Date.now() + Math.random(),
      ts: Math.floor(Date.now() / 1000),
      payload: {
        definitionId: tokenId,
        recipientId,
        recipientName,
        message: message || `Professional recognition from ${senderName}`,
        senderName,
        timestamp: new Date().toISOString(),
        tokenMetadata: {
          name: tokenName,
          description: tokenDescription,
          category: tokenCategory,
          icon: tokenIcon,
          trustValue,
          rarity
        }
      }
    }

    console.log('[Recognition Send API] Minting recognition:', envelope)

    // Submit via internal HCS submit API (handles routing and validation)
    const hcsResponse = await fetch(`${request.nextUrl.origin}/api/hcs/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope)
    })

    const hcsResult = await hcsResponse.json()

    if (!hcsResponse.ok || !hcsResult.ok) {
      throw new Error(hcsResult.error || 'HCS submission failed')
    }

    console.log('[Recognition Send API] HCS submit result:', hcsResult)

    return NextResponse.json({
      success: true,
      tokenId,
      transactionId: hcsResult.transactionHash,
      sequenceNumber: hcsResult.sequenceNumber,
      topicId: hcsResult.topicId
    })

  } catch (error) {
    console.error('[Recognition Send API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send recognition' 
      },
      { status: 500 }
    )
  }
}
