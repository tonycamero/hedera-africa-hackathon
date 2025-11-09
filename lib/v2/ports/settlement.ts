/**
 * Settlement Port - TrustMesh v2 → CraftTrust Treasury Integration
 * 
 * Connects TrustMesh recognition events to instant mint recycler infrastructure.
 * Each space (facility) has its own Brinks custody → TRST minting capability.
 */

export interface SettlementPort {
  /**
   * Mint TRST to a space (facility) treasury
   * Triggered by cash deposits via Brinks recycler → instant custody proof → mint
   */
  mintToSpace(input: {
    space: string;           // e.g., "crafttrust.dispensary-1"
    amount: string;          // USD amount from recycler deposit
    memo?: string;           // Optional memo for transaction
    correlationId: string;   // Idempotency key
    recyclerRef?: string;    // Reference to recycler deposit event
  }): Promise<{ txId: string; trstMinted: string }>;

  /**
   * Burn TRST from a space (facility) treasury  
   * For cash withdrawals via Brinks pickup/disbursement
   */
  burnFromSpace(input: {
    space: string;
    amount: string;
    memo?: string;
    correlationId: string;
    disbursementRef?: string; // Reference to cash disbursement
  }): Promise<{ txId: string; cashReleased: string }>;

  /**
   * Transfer TRST between facility spaces
   * Inter-facility settlements within the CraftTrust network
   */
  transferBetweenSpaces(input: {
    fromSpace: string;       // e.g., "crafttrust.dispensary-1"  
    toSpace: string;         // e.g., "crafttrust.cultivator-a"
    amount: string;
    memo?: string;
    correlationId: string;
  }): Promise<{ txId: string }>;

  /**
   * Get current TRST balance for a space (facility)
   * Includes both custodied cash backing and available TRST
   */
  getSpaceBalance(space: string): Promise<{
    trstAvailable: string;     // Available TRST tokens
    cashBacking: string;       // USD in Brinks custody backing these tokens
    pendingDeposits: string;   // Cash in recycler awaiting custody transfer
    reconciliationStatus: 'clean' | 'pending' | 'discrepancy';
  }>;

  /**
   * Get settlement history for a space
   * For compliance reporting and audit trails
   */
  getSettlementHistory(input: {
    space: string;
    fromTimestamp?: number;
    toTimestamp?: number;
    limit?: number;
  }): Promise<SettlementRecord[]>;
}

export interface SettlementRecord {
  txId: string;
  timestamp: number;
  type: 'mint' | 'burn' | 'transfer';
  space: string;
  amount: string;
  memo?: string;
  correlationId: string;
  
  // Instant mint recycler specific fields
  recyclerRef?: string;      // Reference to physical cash deposit
  custodyProof?: string;     // Brinks custody verification
  brinksTxId?: string;       // Brinks transaction reference
  
  // Settlement status
  status: 'pending' | 'confirmed' | 'failed';
  confirmationHash?: string; // Hedera transaction hash
}