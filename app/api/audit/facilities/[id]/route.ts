import { NextRequest, NextResponse } from 'next/server';
import { getComplianceLedger } from '@/lib/v2/store/ledgers';

/**
 * GET /api/audit/facilities/[id]
 * 
 * Chronological compliance trail for regulatory audits
 * Used by regulators and compliance officers
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const facilityId = params.id;
    const { searchParams } = new URL(request.url);
    
    const fromDate = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = searchParams.get('to') || new Date().toISOString();
    const format = searchParams.get('format') || 'JSON';

    if (!facilityId) {
      return NextResponse.json(
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(fromDate) > new Date(toDate)) {
      return NextResponse.json(
        { error: 'Invalid date range: from date must be before to date' },
        { status: 400 }
      );
    }

    // Limit audit range to 1 year max for performance
    const maxRange = 365 * 24 * 60 * 60 * 1000;
    if (new Date(toDate).getTime() - new Date(fromDate).getTime() > maxRange) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 1 year' },
        { status: 400 }
      );
    }

    const ledger = getComplianceLedger();
    const auditTrail = await ledger.getAuditTrail(facilityId, fromDate, toDate);

    // Generate audit report
    const auditReport = {
      facilityId,
      reportPeriod: {
        from: fromDate,
        to: toDate
      },
      generatedAt: new Date().toISOString(),
      reportingOfficer: 'TrustMesh v2 Compliance Engine',
      totalEvents: auditTrail.length,
      summary: {
        settlementEvents: auditTrail.filter(e => e.eventType === 'SETTLEMENT').length,
        accountEvents: auditTrail.filter(e => e.eventType === 'ACCOUNT').length,
        auditEvents: auditTrail.filter(e => e.eventType === 'AUDIT').length,
        totalTransactionVolume: auditTrail
          .filter(e => e.amount)
          .reduce((sum, e) => sum + BigInt(e.amount!), BigInt(0))
          .toString(),
        riskDistribution: {
          LOW: auditTrail.filter(e => e.compliance.classification === 'LOW').length,
          MEDIUM: auditTrail.filter(e => e.compliance.classification === 'MEDIUM').length,
          HIGH: auditTrail.filter(e => e.compliance.classification === 'HIGH').length,
          CRITICAL: auditTrail.filter(e => e.compliance.classification === 'CRITICAL').length
        },
        failedTransactions: auditTrail.filter(e => e.metadata.status === 'failed').length
      },
      complianceStatus: {
        regulatoryReportingRate: auditTrail.filter(e => e.compliance.regulatoryReporting).length / auditTrail.length,
        averageRiskScore: auditTrail.reduce((sum, e) => sum + e.compliance.riskScore, 0) / auditTrail.length,
        highRiskEvents: auditTrail.filter(e => e.compliance.riskScore >= 0.7).length
      },
      auditTrail: auditTrail.map(event => ({
        eventId: event.eventId,
        timestamp: event.timestamp,
        eventType: event.eventType,
        sourceSystem: event.sourceSystem,
        accountId: event.accountId,
        amount: event.amount,
        currency: event.currency,
        transactionId: event.transactionId,
        correlationId: event.correlationId,
        riskScore: event.compliance.riskScore,
        riskClassification: event.compliance.classification,
        riskFactors: event.compliance.riskFactors,
        regulatoryReporting: event.compliance.regulatoryReporting,
        retentionPeriod: event.compliance.retentionPeriod,
        txHash: event.metadata.txHash,
        matterfiEventId: event.metadata.matterfiEventId,
        chainHash: event.metadata.chainHash,
        verificationStatus: event.audit.verificationStatus
      }))
    };

    // Return as CSV for regulatory filing if requested
    if (format.toUpperCase() === 'CSV') {
      const csvContent = generateComplianceCSV(auditReport);
      
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="compliance-audit-${facilityId}-${fromDate.split('T')[0]}-to-${toDate.split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      auditReport
    });

  } catch (error) {
    console.error('Audit facility API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audit report' },
      { status: 500 }
    );
  }
}

// CSV generation with formula injection protection
function generateComplianceCSV(report: any): string {
  const headers = [
    'Event ID', 'Timestamp', 'Event Type', 'Source System', 'Account ID',
    'Amount', 'Currency', 'Transaction ID', 'Risk Score', 'Risk Classification',
    'Regulatory Reporting', 'TX Hash', 'MatterFi Event ID', 'Verification Status'
  ];

  const sanitizeCell = (value: any): string => {
    const str = String(value ?? '');
    // Prevent formula injection
    return /^[=+\-@]/.test(str) ? `'${str}` : str;
  };

  const rows = report.auditTrail.map((event: any) => [
    event.eventId,
    event.timestamp,
    event.eventType,
    event.sourceSystem,
    event.accountId || '',
    event.amount || '',
    event.currency,
    event.transactionId || '',
    event.riskScore,
    event.riskClassification,
    event.regulatoryReporting ? 'YES' : 'NO',
    event.txHash || '',
    event.matterfiEventId || '',
    event.verificationStatus
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${sanitizeCell(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

// Method guards
const ALLOW = { headers: { Allow: 'GET' } };

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW });
}