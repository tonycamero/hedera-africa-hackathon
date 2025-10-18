import { SpaceKey } from '../schema/base';

/**
 * TrustMesh v2 Settlement Port Interface
 * Chain-agnostic adapter boundary for treasury operations across providers
 */

// Network and token definitions
export type Network = 'hedera' | 'polygon' | 'base';
export type SettlementProvider = 'matterfi' | 'brale' | 'hedera_native';

export interface TokenRef {
  symbol: 'TRST' | string;
  network: Network;
  // Hedera: tokenId "0.0.x"; EVM: contract address "0x..."
  id: string;
  decimals: number; // required for display; amounts use minor units below
}

// Account references with signing hints
export type AccountKind = 'custodial' | 'evm' | 'hedera';
export type SignPolicy = 'custodial' | 'local' | 'session';

export interface AccountRef {
  kind: AccountKind;
  network: Network;
  // Hedera: "0.0.x"; EVM: "0x..."; Custodial: provider-specific account id
  id: string;
  // Optional human alias (MatterFi/KNS/etc.)
  alias?: string;
  signPolicy?: SignPolicy;
  publicKeyType?: 'ed25519' | 'secp256k1'; // optional hint
}

/** Amounts MUST be minor units (integer strings) to avoid precision loss */
export type MinorUnits = string;

// Metadata and audit trail
export interface SettlementMetadata {
  spaceId?: SpaceKey;
  recognitionId?: string;       // TrustMesh event linking
  correlationId?: string;       // caller-supplied correlation
  idempotencyKey?: string;      // required for mint/transfer
  purpose?: 'recognition_reward' | 'manual_transfer' | 'space_funding';
  tags?: Record<string, string>;
  // Audit pointers (adapters may set these on response)
  auditRef?: {
    hcsTopicId?: string;
    hcsMessageId?: string;
    providerAttestationHash?: string;
  };
}

// Operation results
export type TxStatus = 'pending' | 'confirmed' | 'failed';

export interface BaseResult {
  txId: string;                 // port-level tx id (stable across retries)
  providerTxId?: string;        // provider/native id
  networkTxId?: string;         // hash/receipt id on chain if applicable
  status: TxStatus;
  timestamp: string;            // ISO8601
  token: TokenRef;
  metadata?: SettlementMetadata;
}

export interface MintResult extends BaseResult {
  amountMinor: MinorUnits;
  recipient: AccountRef;
}

export interface TransferResult extends BaseResult {
  amountMinor: MinorUnits;
  from: AccountRef;
  to: AccountRef;
}

export interface BalanceInfo {
  account: AccountRef;
  token: TokenRef;
  availableMinor: MinorUnits;
  pendingMinor: MinorUnits;
  // Optional native balance if relevant to fees
  nativeMinor?: MinorUnits;
  lastUpdated: string;          // ISO8601
  provider: SettlementProvider;
}

export interface SpaceBalance {
  spaceId: SpaceKey;
  token: TokenRef;
  totalMinor: MinorUnits;
  availableMinor: MinorUnits;
  pendingMinor: MinorUnits;
  // Useful when a space maps to both custodial + native accounts
  custodialAccount?: AccountRef;
  chainAccount?: AccountRef;
  provider: SettlementProvider;
  lastUpdated: string;
}

/**
 * Settlement Port - Clean interface for treasury operations
 * 
 * This port defines the contract that all settlement adapters must implement.
 * It abstracts away provider-specific details while maintaining type safety.
 */
export interface SettlementPort {
  getProvider(): SettlementProvider;

  /** Mint tokens to a space's treasury (custodial or native based on adapter) */
  mintToSpace(
    spaceId: SpaceKey,
    token: TokenRef,
    amountMinor: MinorUnits,
    metadata: SettlementMetadata
  ): Promise<MintResult>;

  /** Low-level transfer between concrete accounts */
  transferBetweenAccounts(
    token: TokenRef,
    from: AccountRef,
    to: AccountRef,
    amountMinor: MinorUnits,
    metadata: SettlementMetadata
  ): Promise<TransferResult>;

  /** High-level transfer using space resolution via SpaceRegistry */
  transferBetweenSpaces(
    token: TokenRef,
    fromSpaceId: SpaceKey,
    toSpaceId: SpaceKey,
    amountMinor: MinorUnits,
    metadata: SettlementMetadata
  ): Promise<TransferResult>;

  /** Balances */
  getAccountBalance(account: AccountRef, token: TokenRef): Promise<BalanceInfo>;
  getSpaceBalance(spaceId: SpaceKey, token: TokenRef): Promise<SpaceBalance>;

  /** Transaction status */
  getTransactionStatus(
    txId: string
  ): Promise<{
    txId: string;
    status: TxStatus;
    confirmationHash?: string;
    providerTxId?: string;
    networkTxId?: string;
    timestamp: string;
    errorMessage?: string;
  }>;

  /** Validate account readiness for the token/network */
  validateAccount(
    account: AccountRef,
    token: TokenRef
  ): Promise<{
    isValid: boolean;
    // Hedera: token association; EVM: contract code present & allowance (if needed)
    isTokenAssociated: boolean;
    // Whether the account can send/receive this token immediately
    canTransact: boolean;
    errorMessage?: string;
  }>;

  /** History with cursor pagination */
  getTransactionHistory(
    account: AccountRef,
    token: TokenRef,
    options?: { limit?: number; cursor?: string }
  ): Promise<{
    items: Array<{
      txId: string;
      type: 'mint' | 'transfer' | 'burn';
      amountMinor: MinorUnits;
      counterparty?: AccountRef;
      timestamp: string;
      status: Exclude<TxStatus, 'pending'>;
      metadata?: SettlementMetadata;
    }>;
    nextCursor?: string;
  }>;

  /** Health */
  healthCheck(): Promise<{
    isHealthy: boolean;
    provider: SettlementProvider;
    lastChecked: string;
    errorMessage?: string;
    networkStatus?: {
      network: Network;
      blockHeight?: number;
      mirrorLagMs?: number;    // Hedera mirror lag if applicable
    };
  }>;

  /** Optional: subscribe to provider-native events for this account/token */
  // subscribe?(account: AccountRef, token: TokenRef, onEvent: (tx: TransferResult|MintResult) => void): () => void;
}

// Error types
export class SettlementError extends Error {
  constructor(
    message: string,
    public provider: SettlementProvider,
    public operation: string,
    public errorCode?: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'SettlementError';
  }
}

export class InsufficientFundsError extends SettlementError {
  constructor(
    provider: SettlementProvider,
    account: AccountRef,
    requestedMinor: MinorUnits,
    availableMinor: MinorUnits
  ) {
    super(
      `Insufficient funds in ${account.id} (${account.network}): requested ${requestedMinor}, available ${availableMinor}`,
      provider,
      'transfer',
      'INSUFFICIENT_FUNDS'
    );
    this.name = 'InsufficientFundsError';
  }
}

export class InvalidAccountError extends SettlementError {
  constructor(
    provider: SettlementProvider,
    account: AccountRef,
    reason: string
  ) {
    super(
      `Invalid account ${account.id} (${account.network}): ${reason}`,
      provider,
      'validate_account',
      'INVALID_ACCOUNT'
    );
    this.name = 'InvalidAccountError';
  }
}

export class IdempotencyError extends SettlementError {
  constructor(
    provider: SettlementProvider,
    operation: string,
    key: string
  ) {
    super(
      `Duplicate operation detected with idempotency key: ${key}`,
      provider,
      operation,
      'IDEMPOTENCY_VIOLATION'
    );
    this.name = 'IdempotencyError';
  }
}

// Validation helpers
export const validateMinorUnits = (amount: MinorUnits): boolean => {
  return /^\d+$/.test(amount) && BigInt(amount) >= 0n;
};

export const formatDisplayAmount = (minorUnits: MinorUnits, decimals: number): string => {
  if (!validateMinorUnits(minorUnits)) {
    throw new Error(`Invalid minor units: ${minorUnits}`);
  }
  
  const value = BigInt(minorUnits);
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fractional = value % divisor;
  
  if (fractional === 0n) {
    return whole.toString();
  }
  
  const fractionalStr = fractional.toString().padStart(decimals, '0');
  return `${whole.toString()}.${fractionalStr}`.replace(/\.?0+$/, '');
};

export const parseDisplayAmount = (displayAmount: string, decimals: number): MinorUnits => {
  const parts = displayAmount.split('.');
  if (parts.length > 2) {
    throw new Error(`Invalid display amount: ${displayAmount}`);
  }
  
  const whole = parts[0] || '0';
  const fractional = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
  
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(fractional)) {
    throw new Error(`Invalid display amount: ${displayAmount}`);
  }
  
  const minorUnits = BigInt(whole) * BigInt(10 ** decimals) + BigInt(fractional || '0');
  return minorUnits.toString();
};