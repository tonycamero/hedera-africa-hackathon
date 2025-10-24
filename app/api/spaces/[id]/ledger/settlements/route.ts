import { NextRequest, NextResponse } from 'next/server';
import { getSettlementLedger } from '@/lib/v2/store/ledgers';

/**
 * GET /api/spaces/[id]/ledger/settlements
 * 
 * Query settlement ledger for a space with cursor pagination
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const spaceId = params.id;
    const { searchParams } = new URL(request.url);
    
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    if (!spaceId) {
      return NextResponse.json(
        { error: 'Space ID is required' },
        { status: 400 }
      );
    }

    const ledger = getSettlementLedger();
    const results = await ledger.queryBySpace(spaceId, limit, cursor);

    return NextResponse.json({
      success: true,
      spaceId,
      settlements: results.entries.map(entry => ({
        txId: entry.txId,
        timestamp: entry.timestamp,
        accountId: entry.accountId,
        operation: entry.operation,
        tokenRef: entry.tokenRef,
        amountMinor: entry.amountMinor,
        result: entry.result,
        providerTxHash: entry.providerTxHash,
        idempotencyKey: entry.idempotencyKey,
        policyDecisionId: entry.policyDecisionId
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
    console.error('Settlement ledger API error:', error);
    return NextResponse.json(
      { error: 'Failed to query settlement ledger' },
      { status: 500 }
    );
  }
}