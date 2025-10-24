import { NextRequest, NextResponse } from 'next/server';
import { getComplianceLedger } from '@/lib/v2/store/ledgers';

/**
 * GET /api/spaces/[id]/ledger/compliance
 * 
 * Query compliance ledger for a space with cursor pagination
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

    const ledger = getComplianceLedger();
    const results = await ledger.queryBySpace(spaceId, limit, cursor);

    return NextResponse.json({
      success: true,
      spaceId,
      complianceEvents: results.entries.map(entry => ({
        eventId: entry.eventId,
        eventType: entry.eventType,
        sourceSystem: entry.sourceSystem,
        timestamp: entry.timestamp,
        facilityId: entry.facilityId,
        accountId: entry.accountId,
        amount: entry.amount,
        currency: entry.currency,
        transactionId: entry.transactionId,
        correlationId: entry.correlationId,
        compliance: {
          riskScore: entry.compliance.riskScore,
          classification: entry.compliance.classification,
          regulatoryReporting: entry.compliance.regulatoryReporting
        },
        metadata: {
          matterfiEventId: entry.metadata.matterfiEventId,
          txHash: entry.metadata.txHash,
          status: entry.metadata.status,
          chainHash: entry.metadata.chainHash
        }
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
    console.error('Compliance ledger API error:', error);
    return NextResponse.json(
      { error: 'Failed to query compliance ledger' },
      { status: 500 }
    );
  }
}