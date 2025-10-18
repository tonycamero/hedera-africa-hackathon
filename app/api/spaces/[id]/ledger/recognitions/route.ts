import { NextRequest, NextResponse } from 'next/server';
import { getRecognitionLedger } from '@/lib/v2/store/ledgers';

/**
 * GET /api/spaces/[id]/ledger/recognitions
 * 
 * Query recognition ledger for a space with cursor pagination
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const spaceId = params.id;
    const { searchParams } = new URL(request.url);
    
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Cap at 100

    if (!spaceId) {
      return NextResponse.json(
        { error: 'Space ID is required' },
        { status: 400 }
      );
    }

    const ledger = getRecognitionLedger();
    const results = await ledger.queryBySpace(spaceId, limit, cursor);

    return NextResponse.json({
      success: true,
      spaceId,
      recognitions: results.entries.map(entry => ({
        recognitionId: entry.recognitionId,
        timestamp: entry.timestamp,
        senderId: entry.senderId,
        recipientId: entry.recipientId,
        lens: entry.lens,
        proofHash: entry.proofHash,
        correlationId: entry.correlationId,
        hcs: entry.hcs,
        // Include minimal metadata to avoid bloating response
        title: entry.recognition.metadata.title,
        category: entry.recognition.metadata.category,
        visibility: entry.recognition.metadata.visibility
      })),
      pagination: {
        total: results.total,
        hasMore: results.hasMore,
        nextCursor: results.nextCursor,
        prevCursor: results.prevCursor,
        limit
      }
    });

  } catch (error) {
    console.error('Recognition ledger API error:', error);
    return NextResponse.json(
      { error: 'Failed to query recognition ledger' },
      { status: 500 }
    );
  }
}