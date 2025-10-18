/**
 * TrustMesh v2 Append-Only Ledgers
 * 
 * In-memory implementation for development. In production, replace with:
 * - PostgreSQL with append-only tables
 * - Apache Kafka with compacted topics  
 * - EventStore or similar event sourcing database
 */

import { TMRecognitionV1 } from '../schema/tm.recognition@1';
import { ComplianceEvent } from '../engine/compliance';

// Recognition ledger entry
export interface RecognitionLedgerEntry {
  recognitionId: string;
  timestamp: string;
  recognition: TMRecognitionV1;
  proofHash: string;
  hcs?: {
    topicId: string;
    sequenceNumber: number;
    consensusTimestamp: string;
  };
  correlationId: string;
  spaceId: string;
  senderId: string;
  recipientId: string;
  lens: string;
}

// Settlement ledger entry
export interface SettlementLedgerEntry {
  txId: string;
  timestamp: string;
  spaceId: string;
  accountId: string;
  operation: 'mint' | 'transfer' | 'burn';
  tokenRef: {
    symbol: string;
    network: string;
    id: string;
    decimals: number;
  };
  amountMinor: string;
  result: 'success' | 'pending' | 'failed';
  providerTxHash?: string;
  providerResponse?: Record<string, unknown>;
  idempotencyKey: string;
  policyDecisionId?: string;
}

// Compliance ledger entry (reusing existing ComplianceEvent)
export interface ComplianceLedgerEntry extends ComplianceEvent {}

// Cursor-based pagination result
export interface PaginatedResult<T> {
  entries: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// Mock in-memory storage
class MockAppendOnlyStorage<T extends { timestamp: string }> {
  private entries: T[] = [];
  private indexedEntries = new Map<string, T[]>(); // indexed by space/account

  async append(entry: T): Promise<void> {
    this.entries.push(entry);
    
    // Sort by timestamp to maintain order
    this.entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    console.log(`[Ledger] Appended entry at ${entry.timestamp}`);
  }

  async appendBatch(entries: T[]): Promise<void> {
    this.entries.push(...entries);
    this.entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    console.log(`[Ledger] Appended ${entries.length} entries`);
  }

  async query(
    filter?: (entry: T) => boolean,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<T>> {
    let filtered = filter ? this.entries.filter(filter) : this.entries;
    
    // Find cursor position
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = filtered.findIndex(entry => entry.timestamp === cursor);
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }
    
    const page = filtered.slice(startIndex, startIndex + limit);
    
    return {
      entries: page,
      total: filtered.length,
      hasMore: startIndex + limit < filtered.length,
      nextCursor: page.at(-1)?.timestamp,
      prevCursor: startIndex > 0 ? filtered[Math.max(0, startIndex - limit)]?.timestamp : undefined
    };
  }

  async queryByIndex(
    indexKey: string,
    indexValue: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<T>> {
    // Simple implementation - in production, use proper indexing
    const filter = (entry: T) => (entry as any)[indexKey] === indexValue;
    return this.query(filter, limit, cursor);
  }

  async getByTimestamp(timestamp: string): Promise<T | null> {
    return this.entries.find(entry => entry.timestamp === timestamp) || null;
  }

  // Audit methods
  async getEntryCount(): Promise<number> {
    return this.entries.length;
  }

  async getFirstEntry(): Promise<T | null> {
    return this.entries[this.entries.length - 1] || null;
  }

  async getLastEntry(): Promise<T | null> {
    return this.entries[0] || null;
  }

  // Checkpoint for integrity verification
  async generateCheckpointHash(): Promise<string> {
    const crypto = require('crypto');
    const sortedHashes = this.entries
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(entry => crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex'));
    
    return crypto
      .createHash('sha256')
      .update(sortedHashes.join(''))
      .digest('hex');
  }
}

// Ledger managers
export class RecognitionLedger {
  private storage = new MockAppendOnlyStorage<RecognitionLedgerEntry>();

  async append(recognition: TMRecognitionV1, hcsData?: any): Promise<void> {
    const entry: RecognitionLedgerEntry = {
      recognitionId: recognition.recognitionId,
      timestamp: recognition.issuedAt,
      recognition,
      proofHash: recognition.proofHash!,
      hcs: hcsData ? {
        topicId: hcsData.topicId,
        sequenceNumber: hcsData.sequenceNumber,
        consensusTimestamp: hcsData.consensusTimestamp
      } : undefined,
      correlationId: recognition.correlationId,
      spaceId: recognition.spaceId,
      senderId: recognition.senderId,
      recipientId: recognition.recipientId,
      lens: recognition.lens
    };

    await this.storage.append(entry);
  }

  async queryBySpace(
    spaceId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<RecognitionLedgerEntry>> {
    return this.storage.queryByIndex('spaceId', spaceId, limit, cursor);
  }

  async queryBySender(
    senderId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<RecognitionLedgerEntry>> {
    return this.storage.queryByIndex('senderId', senderId, limit, cursor);
  }

  async queryByRecipient(
    recipientId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<RecognitionLedgerEntry>> {
    return this.storage.queryByIndex('recipientId', recipientId, limit, cursor);
  }

  async queryByLens(
    lens: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<RecognitionLedgerEntry>> {
    return this.storage.queryByIndex('lens', lens, limit, cursor);
  }
}

export class SettlementLedger {
  private storage = new MockAppendOnlyStorage<SettlementLedgerEntry>();

  async append(
    txId: string,
    spaceId: string,
    accountId: string,
    operation: 'mint' | 'transfer' | 'burn',
    tokenRef: SettlementLedgerEntry['tokenRef'],
    amountMinor: string,
    result: 'success' | 'pending' | 'failed',
    idempotencyKey: string,
    providerData?: {
      txHash?: string;
      response?: Record<string, unknown>;
    }
  ): Promise<void> {
    const entry: SettlementLedgerEntry = {
      txId,
      timestamp: new Date().toISOString(),
      spaceId,
      accountId,
      operation,
      tokenRef,
      amountMinor,
      result,
      providerTxHash: providerData?.txHash,
      providerResponse: providerData?.response,
      idempotencyKey
    };

    await this.storage.append(entry);
  }

  async queryBySpace(
    spaceId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<SettlementLedgerEntry>> {
    return this.storage.queryByIndex('spaceId', spaceId, limit, cursor);
  }

  async queryByAccount(
    accountId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<SettlementLedgerEntry>> {
    return this.storage.queryByIndex('accountId', accountId, limit, cursor);
  }

  async queryByIdempotencyKey(idempotencyKey: string): Promise<SettlementLedgerEntry | null> {
    const results = await this.storage.queryByIndex('idempotencyKey', idempotencyKey, 1);
    return results.entries[0] || null;
  }
}

export class ComplianceLedger {
  private storage = new MockAppendOnlyStorage<ComplianceLedgerEntry>();

  async append(event: ComplianceEvent): Promise<void> {
    await this.storage.append(event);
  }

  async queryBySpace(
    spaceId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<ComplianceLedgerEntry>> {
    return this.storage.queryByIndex('spaceId', spaceId, limit, cursor);
  }

  async queryByEventType(
    eventType: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<ComplianceLedgerEntry>> {
    return this.storage.queryByIndex('eventType', eventType, limit, cursor);
  }

  async queryByFacility(
    facilityId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResult<ComplianceLedgerEntry>> {
    return this.storage.queryByIndex('facilityId', facilityId, limit, cursor);
  }

  async getAuditTrail(
    facilityId: string,
    fromDate: string,
    toDate: string,
    limit = 1000
  ): Promise<ComplianceLedgerEntry[]> {
    const filter = (entry: ComplianceLedgerEntry) => {
      return entry.facilityId === facilityId &&
             entry.timestamp >= fromDate &&
             entry.timestamp <= toDate;
    };

    const results = await this.storage.query(filter, limit);
    return results.entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
}

// Global ledger instances
let recognitionLedger: RecognitionLedger;
let settlementLedger: SettlementLedger;
let complianceLedger: ComplianceLedger;

export function getRecognitionLedger(): RecognitionLedger {
  if (!recognitionLedger) {
    recognitionLedger = new RecognitionLedger();
  }
  return recognitionLedger;
}

export function getSettlementLedger(): SettlementLedger {
  if (!settlementLedger) {
    settlementLedger = new SettlementLedger();
  }
  return settlementLedger;
}

export function getComplianceLedger(): ComplianceLedger {
  if (!complianceLedger) {
    complianceLedger = new ComplianceLedger();
  }
  return complianceLedger;
}