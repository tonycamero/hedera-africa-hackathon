import { NextRequest, NextResponse } from 'next/server'
import { hashinalRecognitionService } from '@/lib/services/HashinalRecognitionService'

/**
 * Mint Hashinal Recognition NFT
 * 
 * POST /api/hashinals/mint
 * 
 * Creates a proper transferable NFT following HCS-5 standard:
 * 1. Mints HTS NFT to recipient
 * 2. Inscribes metadata to HCS 
 * 3. Returns transaction details
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, recognitionId, inscription, issuerId } = body

    // Validate required fields
    if (!recipientId || !recognitionId || !inscription || !issuerId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: recipientId, recognitionId, inscription, issuerId'
      }, { status: 400 })
    }

    // Validate Hedera account ID format
    if (!recipientId.match(/^0\.0\.[0-9]+$/)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid recipient ID format. Must be Hedera account ID (0.0.xxxxx)'
      }, { status: 400 })
    }

    console.log('[HashinalAPI] Minting request:', {
      recipientId,
      recognitionId,
      issuerId,
      inscriptionLength: inscription.length
    })

    // Initialize service if not ready
    if (!hashinalRecognitionService.isReady()) {
      console.log('[HashinalAPI] Initializing hashinal service...')
      await hashinalRecognitionService.initialize()
    }

    // Mint the hashinal NFT
    const result = await hashinalRecognitionService.mintHashinal({
      recipientId,
      recognitionId,
      inscription,
      issuerId
    })

    if (!result.success) {
      console.error('[HashinalAPI] Minting failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error || 'Unknown minting error'
      }, { status: 500 })
    }

    console.log('[HashinalAPI] Successfully minted hashinal:', result.tokenId, result.serialNumber)

    return NextResponse.json({
      success: true,
      message: 'Hashinal NFT minted successfully',
      data: {
        tokenId: result.tokenId,
        serialNumber: result.serialNumber,
        transactionId: result.transactionId,
        hcsReference: result.hcsReference,
        recipient: recipientId,
        recognitionId,
        mintedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('[HashinalAPI] Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'Failed to mint hashinal NFT'
    }, { status: 500 })
  }
}

/**
 * Get Hashinal Collections Info
 * 
 * GET /api/hashinals/mint
 * 
 * Returns information about available NFT collections
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize service if not ready
    if (!hashinalRecognitionService.isReady()) {
      await hashinalRecognitionService.initialize()
    }

    const collections = hashinalRecognitionService.getCollections()
    
    return NextResponse.json({
      success: true,
      collections: collections.map(col => ({
        tokenId: col.tokenId,
        name: col.name,
        symbol: col.symbol,
        category: col.category
      }))
    })

  } catch (error: any) {
    console.error('[HashinalAPI] Error getting collections:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get collection info'
    }, { status: 500 })
  }
}