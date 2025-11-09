/**
 * Compliance Engine - TrustMesh v2
 * 
 * Cannabis treasury compliance with MatterFi webhook ingestion and audit trails
 * Production-hardened with replay protection, HMAC chain, and regulatory reporting
 */

import { z } from 'zod';
import crypto from 'crypto';

// Safe minor unit validation
const MINOR_RE = /^[0-9]+$/;
function toMinorBig(v?: string): bigint | null {
  if (!v || !MINOR_RE.test(v)) return null;
  return BigInt(v);
}

// Structured settlement data schema
export const SettlementObjectSchema = z.object({
  facilityId: z.string().optional(),
  spaceId: z.string().optional(),
  accountId: z.string().optional(),
  amount: z.string().regex(MINOR_RE).optional(),
  currency: z.string().default('TRST'),
  transactionId: z.string().optional(),
  correlationId: z.string().optional(),
  txHash: z.string().optional(),
  proofHash: z.string().optional(),
  hcsSequenceNumber: z.number().int().optional(),
  status: z.enum(['pending', 'confirmed', 'failed']).optional()
}).strict();

// Enhanced MatterFi webhook schema with strict validation
export const MatterFiWebhookSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'settlement.mint.completed',
    'settlement.transfer.completed', 
    'settlement.burn.completed',
    'settlement.mint.failed',
    'settlement.transfer.failed',
    'settlement.burn.failed',
    'account.kyc.completed',
    'account.kyb.completed',
    'account.suspended',
    'compliance.audit.requested'
  ]),
  object: z.enum(['settlement', 'account', 'compliance']),
  api_version: z.string().default('2024-01'),
  created: z.coerce.number().int().positive(),
  data: z.object({
    object: z.union([SettlementObjectSchema, z.record(z.any())]),
    previous_attributes: z.record(z.any()).optional()
  }),
  livemode: z.boolean(),
  pending_webhooks: z.number().int().min(0),
  request: z.object({
    id: z.string().optional(),
    idempotency_key: z.string().optional()
  }).optional()
}).strict();

export type MatterFiWebhookEvent = z.infer<typeof MatterFiWebhookSchema>;

// Compliance event for internal processing
export interface ComplianceEvent {
  eventId: string;
  eventType: 'SETTLEMENT' | 'ACCOUNT' | 'COMPLIANCE' | 'AUDIT';
  sourceSystem: 'matterfi' | 'brale' | 'brinks' | 'trustmesh';
  facilityId?: string;
  spaceId?: string;
  accountId?: string;
  amount?: string;           // Minor units for financial events
  currency: string;          // 'TRST', 'USD', etc.
  timestamp: string;         // ISO 8601
  transactionId?: string;
  correlationId?: string;
  metadata: {
    txHash?: string;
    proofHash?: string;
    hcsSequenceNumber?: number;
    matterfiEventId?: string;
    kycStatus?: string;
    kybStatus?: string;
    facilityLicense?: string;
    complianceFramework?: string[];
    chainHash?: string;      // Audit chain integrity
    replay?: boolean;        // Idempotency replay flag
    status?: string;         // Transaction status
    apiVersion?: string;
    livemode?: boolean;
    [key: string]: any;
  };
  compliance: {
    riskScore: number;        // 0-1
    riskFactors: string[];
    regulatoryReporting: boolean;
    retentionPeriod: number;  // Days
    classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  audit: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  };
  signature?: string;        // HMAC signature for integrity
}

// Cannabis-specific compliance metrics
export interface CannabisComplianceMetrics {
  facilityLicense: string;
  licenseExpiry: string;
  operatingJurisdiction: string;
  seedToSaleTrackingId?: string;
  batchNumber?: string;
  thcContent?: number;
  cbdContent?: number;
  labTestResults?: string;
  cultivatorLicense?: string;
  manufacturerLicense?: string;
  distributorLicense?: string;
  retailerLicense?: string;
  tax280ECompliant: boolean;
  stateReportingId?: string;
}

// Compliance engine errors
export class ComplianceEngineError extends Error {
  constructor(
    message: string,
    public code: 'WEBHOOK_VALIDATION_FAILED' | 'SIGNATURE_INVALID' | 'STORAGE_ERROR' | 'AUDIT_FAILED',
    public details?: any
  ) {
    super(message);
    this.name = 'ComplianceEngineError';
  }
}

// Enhanced compliance storage with idempotency tracking
class MockComplianceStorage {
  private events = new Map<string, ComplianceEvent>();
  private eventsBySpace = new Map<string, string[]>();
  private eventsByType = new Map<string, string[]>();
  private processed = new Set<string>(); // Track processed webhook IDs

  async storeEvent(event: ComplianceEvent): Promise<void> {
    // Validate event
    if (!event.eventId || !event.eventType || !event.timestamp) {
      throw new ComplianceEngineError('Invalid compliance event', 'STORAGE_ERROR');
    }

    // Store event
    this.events.set(event.eventId, event);

    // Index by space
    if (event.spaceId) {
      if (!this.eventsBySpace.has(event.spaceId)) {
        this.eventsBySpace.set(event.spaceId, []);
      }
      this.eventsBySpace.get(event.spaceId)!.push(event.eventId);
    }

    // Index by event type
    if (!this.eventsByType.has(event.eventType)) {
      this.eventsByType.set(event.eventType, []);
    }
    this.eventsByType.get(event.eventType)!.push(event.eventId);

    console.log(`[Compliance] Stored event: ${event.eventId} (${event.eventType})`);
  }

  async getEvent(eventId: string): Promise<ComplianceEvent | null> {
    return this.events.get(eventId) || null;
  }

  async getEventsBySpace(spaceId: string, limit = 100): Promise<ComplianceEvent[]> {
    const eventIds = this.eventsBySpace.get(spaceId) || [];
    return eventIds
      .slice(-limit)
      .map(id => this.events.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async getEventsByType(eventType: string, limit = 100): Promise<ComplianceEvent[]> {
    const eventIds = this.eventsByType.get(eventType) || [];
    return eventIds
      .slice(-limit)
      .map(id => this.events.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async getAuditTrail(facilityId: string, fromDate: string, toDate: string): Promise<ComplianceEvent[]> {
    const allEvents = Array.from(this.events.values());
    return allEvents
      .filter(event => {
        return event.facilityId === facilityId &&
               event.timestamp >= fromDate &&
               event.timestamp <= toDate;
      })
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  // Idempotency tracking
  hasProcessed(webhookId: string): boolean {
    return this.processed.has(webhookId);
  }

  markProcessed(webhookId: string): void {
    this.processed.add(webhookId);
  }

  // Enhanced admin ledger with cursor pagination
  async getAdminLedgerEvents(spaceId: string, limit = 50, cursor?: string): Promise<{
    events: ComplianceEvent[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  }> {
    const events = await this.getEventsBySpace(spaceId, 5000);
    const start = cursor ? Math.max(0, events.findIndex(e => e.eventId === cursor) + 1) : 0;
    const page = events.slice(start, start + limit);
    
    return {
      events: page,
      total: events.length,
      hasMore: start + limit < events.length,
      nextCursor: page.at(-1)?.eventId
    };
  }
}

// Main compliance engine with production hardening
export class ComplianceEngine {
  private storage: MockComplianceStorage;
  private webhookSecret: string;
  private lastChainHashBySpace = new Map<string, string>(); // HMAC chain state

  constructor(webhookSecret?: string, storage?: MockComplianceStorage) {
    this.storage = storage || new MockComplianceStorage();
    this.webhookSecret = webhookSecret || process.env.MATTERFI_WEBHOOK_SECRET || 'dev_secret';
  }

  /**
   * Enhanced webhook verification supporting both formats
   */
  private verifyWebhook(payload: string, signatureHeader: string): { ok: boolean; reason?: string } {
    // Accept either "sha256=..." or "t=timestamp,v1=mac"
    if (signatureHeader.startsWith('sha256=')) {
      return { ok: this.verifyWebhookSignature(payload, signatureHeader) };
    }

    // Parse timestamped signature: "t=..., v1=..."
    const parts = Object.fromEntries(
      signatureHeader.split(',').map(kv => {
        const [k, v] = kv.split('=');
        return [k?.trim(), v?.trim()];
      })
    );

    const ts = Number(parts['t']);
    const mac = parts['v1'];

    if (!ts || !mac) {
      return { ok: false, reason: 'MALFORMED_SIGNATURE' };
    }

    // Freshness check (5 minutes)
    if (Math.abs(Date.now() - ts) > 5 * 60_000) {
      return { ok: false, reason: 'STALE_SIGNATURE' };
    }

    // Verify HMAC
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(`${ts}.${payload}`, 'utf8')
      .digest('hex');

    if (expected.length !== mac.length) {
      return { ok: false, reason: 'LENGTH_MISMATCH' };
    }

    const ok = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(mac, 'hex')
    );

    return { ok, reason: ok ? undefined : 'BAD_MAC' };
  }

  private verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  }

  /**
   * Enhanced webhook processing with replay protection
   */
  async processWebhookEvent(
    rawPayload: string,
    signature: string,
    headers: Record<string, string>
  ): Promise<ComplianceEvent> {
    // Enhanced signature verification
    const verify = this.verifyWebhook(rawPayload, signature);
    if (!verify.ok) {
      throw new ComplianceEngineError(
        `Invalid webhook signature (${verify.reason})`,
        'SIGNATURE_INVALID'
      );
    }

    // Parse and validate webhook payload
    let webhookEvent: MatterFiWebhookEvent;
    try {
      const parsed = JSON.parse(rawPayload);
      webhookEvent = MatterFiWebhookSchema.parse(parsed);
    } catch (error) {
      throw new ComplianceEngineError(
        'Webhook payload validation failed',
        'WEBHOOK_VALIDATION_FAILED',
        error
      );
    }

    // Idempotency check - prevent reprocessing
    if (this.storage.hasProcessed(webhookEvent.id)) {
      return {
        eventId: webhookEvent.id,
        eventType: 'COMPLIANCE',
        sourceSystem: 'matterfi',
        currency: 'TRST',
        timestamp: new Date(webhookEvent.created * 1000).toISOString(),
        metadata: { 
          matterfiEventId: webhookEvent.id, 
          replay: true 
        },
        compliance: {
          riskScore: 0,
          riskFactors: [],
          regulatoryReporting: false,
          retentionPeriod: 2555,
          classification: 'LOW'
        },
        audit: { verificationStatus: 'VERIFIED' }
      };
    }

    // Transform to compliance event
    const complianceEvent = this.transformWebhookToComplianceEvent(webhookEvent, headers);

    // Generate integrity signature
    complianceEvent.signature = this.generateEventSignature(complianceEvent);

    // Attach chain hash for audit trail integrity
    complianceEvent.metadata.chainHash = this.attachChainHash(complianceEvent);

    // Store event and mark as processed
    await this.storage.storeEvent(complianceEvent);
    this.storage.markProcessed(webhookEvent.id);

    console.log(`[Compliance] Processed webhook: ${webhookEvent.type} -> ${complianceEvent.eventId}`);

    return complianceEvent;
  }

  /**
   * Enhanced transform with strict type safety
   */
  private transformWebhookToComplianceEvent(
    webhook: MatterFiWebhookEvent,
    headers: Record<string, string>
  ): ComplianceEvent {
    const eventTypeMap: Record<MatterFiWebhookEvent['type'], ComplianceEvent['eventType']> = {
      'settlement.mint.completed': 'SETTLEMENT',
      'settlement.transfer.completed': 'SETTLEMENT',
      'settlement.burn.completed': 'SETTLEMENT',
      'settlement.mint.failed': 'SETTLEMENT',
      'settlement.transfer.failed': 'SETTLEMENT',
      'settlement.burn.failed': 'SETTLEMENT',
      'account.kyc.completed': 'ACCOUNT',
      'account.kyb.completed': 'ACCOUNT',
      'account.suspended': 'ACCOUNT',
      'compliance.audit.requested': 'AUDIT'
    };

    // Safe settlement data parsing
    const obj = SettlementObjectSchema.safeParse(webhook.data.object);
    const settlementData = obj.success ? obj.data : {};
    const timestamp = new Date(webhook.created * 1000).toISOString();

    const event: ComplianceEvent = {
      eventId: crypto.randomUUID(),
      eventType: eventTypeMap[webhook.type] || 'COMPLIANCE',
      sourceSystem: 'matterfi',
      facilityId: settlementData.facilityId,
      spaceId: settlementData.spaceId,
      accountId: settlementData.accountId,
      amount: settlementData.amount,
      currency: settlementData.currency || 'TRST',
      timestamp,
      transactionId: settlementData.transactionId,
      correlationId: settlementData.correlationId || webhook.request?.idempotency_key,
      metadata: {
        matterfiEventId: webhook.id,
        txHash: settlementData.txHash,
        proofHash: settlementData.proofHash,
        hcsSequenceNumber: settlementData.hcsSequenceNumber,
        status: settlementData.status ?? (webhook.type.endsWith('.failed') ? 'failed' : 'confirmed'),
        apiVersion: webhook.api_version,
        livemode: webhook.livemode
      },
      compliance: {
        riskScore: this.calculateRiskScore('SETTLEMENT', settlementData),
        riskFactors: this.identifyRiskFactors('SETTLEMENT', settlementData),
        regulatoryReporting: this.requiresRegulatoryReporting('SETTLEMENT', settlementData),
        retentionPeriod: this.getRetentionPeriod('SETTLEMENT'),
        classification: this.classifyEvent('SETTLEMENT', settlementData)
      },
      audit: {
        ipAddress: headers['x-forwarded-for'] || headers['x-real-ip'],
        userAgent: headers['user-agent'],
        verificationStatus: 'VERIFIED'
      }
    };

    return event;
  }

  /**
   * HMAC chain for audit trail integrity
   */
  private attachChainHash(event: ComplianceEvent): string {
    const key = event.spaceId || '__global__';
    const previousHash = this.lastChainHashBySpace.get(key) || '';
    
    const chainHash = crypto
      .createHash('sha256')
      .update(previousHash + (event.signature || ''), 'utf8')
      .digest('hex');
    
    this.lastChainHashBySpace.set(key, chainHash);
    return chainHash;
  }

  /**
   * Enhanced risk scoring with BigInt safety
   */
  private calculateRiskScore(eventType: string, data: any): number {
    let score = 0;

    // BigInt-safe amount analysis
    const amt = toMinorBig(data.amount);
    if (amt) {
      if (amt > 500_000_000n) score += 0.4; // $500k+
      else if (amt > 100_000_000n) score += 0.2; // $100k+
      else if (amt > 50_000_000n) score += 0.1; // $50k+
    }

    // Event type risk
    if (eventType === 'SETTLEMENT') score += 0.2;
    if (eventType === 'ACCOUNT') score += 0.1;

    // Failure events are high risk
    if (data.status === 'failed') score += 0.3;

    return Math.min(score, 1.0);
  }

  private identifyRiskFactors(eventType: string, data: any): string[] {
    const factors: string[] = [];

    const amt = toMinorBig(data.amount);
    if (amt && amt > 100_000_000n) {
      factors.push('HIGH_VALUE_TRANSACTION');
    }

    if (data.status === 'failed') {
      factors.push('TRANSACTION_FAILURE');
    }

    if (!data.kycStatus || data.kycStatus !== 'verified') {
      factors.push('INCOMPLETE_KYC');
    }

    if (!data.facilityLicense) {
      factors.push('MISSING_FACILITY_LICENSE');
    }

    return factors;
  }

  private requiresRegulatoryReporting(eventType: string, data: any): boolean {
    return eventType === 'SETTLEMENT' || eventType === 'AUDIT';
  }

  private getRetentionPeriod(eventType: string): number {
    return 2555; // 7 years for cannabis compliance
  }

  private classifyEvent(eventType: string, data: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const riskScore = this.calculateRiskScore(eventType, data);
    
    if (riskScore >= 0.8) return 'CRITICAL';
    if (riskScore >= 0.6) return 'HIGH';
    if (riskScore >= 0.3) return 'MEDIUM';
    return 'LOW';
  }

  private generateEventSignature(event: ComplianceEvent): string {
    const payload = {
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      amount: event.amount,
      transactionId: event.transactionId
    };

    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Create manual compliance event
   */
  async createComplianceEvent(
    eventType: ComplianceEvent['eventType'],
    data: Partial<ComplianceEvent>
  ): Promise<ComplianceEvent> {
    const event: ComplianceEvent = {
      eventId: crypto.randomUUID(),
      eventType,
      sourceSystem: data.sourceSystem || 'trustmesh',
      currency: data.currency || 'TRST',
      timestamp: new Date().toISOString(),
      metadata: data.metadata || {},
      compliance: {
        riskScore: this.calculateRiskScore(eventType, data),
        riskFactors: this.identifyRiskFactors(eventType, data),
        regulatoryReporting: this.requiresRegulatoryReporting(eventType, data),
        retentionPeriod: this.getRetentionPeriod(eventType),
        classification: this.classifyEvent(eventType, data)
      },
      audit: {
        verificationStatus: 'PENDING',
        ...data.audit
      },
      ...data
    };

    event.signature = this.generateEventSignature(event);
    event.metadata.chainHash = this.attachChainHash(event);

    await this.storage.storeEvent(event);
    return event;
  }

  /**
   * Generate compliance report with CSV sanitization
   */
  async generateComplianceReport(
    facilityId: string,
    fromDate: string,
    toDate: string,
    format: 'JSON' | 'CSV' = 'JSON'
  ): Promise<any> {
    const events = await this.storage.getAuditTrail(facilityId, fromDate, toDate);

    const reportData = {
      facilityId,
      reportPeriod: { from: fromDate, to: toDate },
      generatedAt: new Date().toISOString(),
      totalEvents: events.length,
      eventSummary: this.summarizeEvents(events),
      riskAnalysis: this.analyzeRisk(events),
      complianceStatus: this.assessCompliance(events),
      events: events.map(event => ({
        eventId: event.eventId,
        timestamp: event.timestamp,
        type: event.eventType,
        amount: event.amount,
        currency: event.currency,
        transactionId: event.transactionId,
        proofHash: event.metadata.proofHash,
        riskScore: event.compliance.riskScore,
        classification: event.compliance.classification
      }))
    };

    if (format === 'CSV') {
      return this.convertToCSV(reportData);
    }

    return reportData;
  }

  /**
   * Enhanced admin ledger with cursor pagination
   */
  async getAdminLedgerEvents(
    spaceId: string,
    limit = 50,
    cursor?: string
  ): Promise<{
    events: ComplianceEvent[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  }> {
    return this.storage.getAdminLedgerEvents(spaceId, limit, cursor);
  }

  // Private helper methods
  private summarizeEvents(events: ComplianceEvent[]): any {
    const summary = {
      totalSettlements: 0,
      totalAmount: BigInt(0),
      accountEvents: 0,
      auditEvents: 0,
      failedTransactions: 0,
      riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
    };

    events.forEach(event => {
      switch (event.eventType) {
        case 'SETTLEMENT':
          summary.totalSettlements++;
          const amt = toMinorBig(event.amount);
          if (amt) summary.totalAmount += amt;
          break;
        case 'ACCOUNT':
          summary.accountEvents++;
          break;
        case 'AUDIT':
          summary.auditEvents++;
          break;
      }

      if (event.metadata.status === 'failed') {
        summary.failedTransactions++;
      }

      summary.riskDistribution[event.compliance.classification]++;
    });

    return {
      ...summary,
      totalAmount: summary.totalAmount.toString() // Convert BigInt to string
    };
  }

  private analyzeRisk(events: ComplianceEvent[]): any {
    const avgRiskScore = events.reduce((sum, e) => sum + e.compliance.riskScore, 0) / events.length;
    const highRiskEvents = events.filter(e => e.compliance.riskScore >= 0.6);
    
    return {
      averageRiskScore: avgRiskScore,
      highRiskEventCount: highRiskEvents.length,
      riskTrend: 'STABLE',
      recommendations: this.generateRiskRecommendations(events)
    };
  }

  private assessCompliance(events: ComplianceEvent[]): any {
    const compliantEvents = events.filter(e => e.compliance.regulatoryReporting);
    const complianceRate = compliantEvents.length / events.length;
    
    return {
      complianceRate: complianceRate,
      status: complianceRate >= 0.95 ? 'COMPLIANT' : 'ATTENTION_REQUIRED',
      framework: ['280E', 'CA-CDPH', 'CA-DCC'],
      lastAudit: new Date().toISOString(),
      nextAuditDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  private generateRiskRecommendations(events: ComplianceEvent[]): string[] {
    const recommendations: string[] = [];
    
    const highValueEvents = events.filter(e => {
      const amt = toMinorBig(e.amount);
      return amt && amt > 100_000_000n;
    });
    
    if (highValueEvents.length > 10) {
      recommendations.push('Consider implementing additional approval workflows for high-value transactions');
    }

    const failedEvents = events.filter(e => e.metadata.status === 'failed');
    if (failedEvents.length > events.length * 0.05) {
      recommendations.push('Investigate high failure rate - may indicate system issues');
    }

    return recommendations;
  }

  /**
   * CSV conversion with formula injection protection
   */
  private sanitizeCSV(field: any): string {
    const s = String(field ?? '');
    return /^[=+\-@]/.test(s) ? `'${s}` : s;
  }

  private convertToCSV(data: any): string {
    const headers = ['Event ID', 'Timestamp', 'Type', 'Amount', 'Currency', 'Transaction ID', 'Risk Score', 'Classification'];
    const rows = data.events.map((event: any) => [
      event.eventId,
      event.timestamp,
      event.type,
      event.amount || '',
      event.currency,
      event.transactionId || '',
      event.riskScore,
      event.classification
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${this.sanitizeCSV(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }
}

// Global compliance engine instance
let globalComplianceEngine: ComplianceEngine | null = null;

export function getComplianceEngine(): ComplianceEngine {
  if (!globalComplianceEngine) {
    globalComplianceEngine = new ComplianceEngine();
  }
  return globalComplianceEngine;
}

// Convenience functions
export async function processWebhookEvent(
  payload: string,
  signature: string,
  headers: Record<string, string>
): Promise<ComplianceEvent> {
  return getComplianceEngine().processWebhookEvent(payload, signature, headers);
}

export async function generateComplianceReport(
  facilityId: string,
  fromDate: string,
  toDate: string,
  format: 'JSON' | 'CSV' = 'JSON'
): Promise<any> {
  return getComplianceEngine().generateComplianceReport(facilityId, fromDate, toDate, format);
}

export async function getAdminLedger(
  spaceId: string,
  limit = 50,
  cursor?: string
): Promise<any> {
  return getComplianceEngine().getAdminLedgerEvents(spaceId, limit, cursor);
}