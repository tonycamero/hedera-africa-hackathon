import { NextRequest, NextResponse } from 'next/server';
import { KiloscribeInceptionService } from '@/lib/services/KiloscribeInceptionService';

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 INCEPTION SERIES MINT REQUESTED 🔥');
    
    const body = await request.json();
    const { 
      createComplete = false, 
      pieceIndex, 
      recipients = [] 
    } = body;

    const inceptionService = new KiloscribeInceptionService();

    // Option 1: Create complete series (all 5 legendary pieces)
    if (createComplete) {
      console.log('🔥🔥🔥 MINTING COMPLETE INCEPTION SERIES 🔥🔥🔥');
      
      const result = await inceptionService.createCompleteInceptionSeries(recipients);
      
      return NextResponse.json({
        success: true,
        type: 'complete_series',
        message: '🎉 TrustMesh Inception Series Created Successfully! 🎉',
        data: {
          collectionId: result.collectionId,
          totalPieces: result.totalPieces,
          pieces: result.pieces.map(p => ({
            name: p.piece.name,
            serial: p.serial,
            recipient: p.recipient,
            inscription_topic: p.inscription.topicId
          })),
          timestamp: result.timestamp
        }
      });
    }

    // Option 2: Create single piece
    if (typeof pieceIndex === 'number') {
      console.log(`🔥 MINTING SINGLE INCEPTION PIECE: ${pieceIndex} 🔥`);
      
      // First need to create collection (or get existing one)
      const tokenId = await inceptionService.createInceptionCollection();
      const result = await inceptionService.createInceptionPiece(
        pieceIndex, 
        tokenId, 
        recipients[0]
      );
      
      return NextResponse.json({
        success: true,
        type: 'single_piece',
        message: `✅ ${result.piece.name} Created Successfully!`,
        data: {
          piece: result.piece,
          serial: result.serial,
          tokenId: result.tokenId,
          recipient: result.recipient,
          inscription: result.inscription
        }
      });
    }

    // Option 3: Get series info
    const seriesInfo = inceptionService.getInceptionSeriesInfo();
    
    return NextResponse.json({
      success: true,
      type: 'series_info',
      message: 'TrustMesh Inception Series Information',
      data: seriesInfo
    });

  } catch (error) {
    console.error('❌ Inception Series Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Inception Series minting failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const inceptionService = new KiloscribeInceptionService();
    const seriesInfo = inceptionService.getInceptionSeriesInfo();
    
    return NextResponse.json({
      success: true,
      message: 'TrustMesh Inception Series - The Original Hashinals',
      data: {
        ...seriesInfo,
        mintEndpoint: '/api/inception/mint',
        documentation: 'https://trustmesh.xyz/docs/inception-series'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get Inception Series info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}