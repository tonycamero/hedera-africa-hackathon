// HCS-22 Dual-Key Identity Binding Type Definitions
// Formalizes cryptographically verifiable binding between Magic EVM keys and Hedera accounts

export type Hcs22Type = 'IDENTITY_BIND' | 'IDENTITY_ASSERT' | 'IDENTITY_ROTATE' | 'IDENTITY_UNBIND';

export interface Hcs22Envelope {
  t: Hcs22Type;
  v: 1;
  sub: string;  // did:ethr:0x... (Magic issuer)
  iat: string;  // ISO timestamp
  chain: 'testnet' | 'mainnet';
  sig?: string | null;  // optional EVM signature
  payload: Record<string, any>;
}

// Helper functions
export const nowIso = () => new Date().toISOString();

/**
 * Create IDENTITY_BIND event - published when creating new account binding
 */
export function bindEvent(args: {
  issuer: string;
  hederaId: string;
  evmAddress: string;
  createTxId?: string;
  emailHash?: string;
}): Hcs22Envelope {
  return {
    t: 'IDENTITY_BIND',
    v: 1,
    sub: args.issuer.toLowerCase(),
    iat: nowIso(),
    chain: (process.env.HEDERA_NETWORK ?? 'testnet') as 'testnet' | 'mainnet',
    payload: {
      evm_address: args.evmAddress.toLowerCase(),
      hedera_account_id: args.hederaId,
      create_tx_id: args.createTxId ?? null,
      email_hash: args.emailHash ?? null,
      bind_method: 'auto-create',
    },
  };
}

/**
 * Create IDENTITY_ASSERT event - published when confirming existing binding via Mirror
 */
export function assertEvent(issuer: string, hederaId: string, reason = 'mirror-backfill'): Hcs22Envelope {
  return {
    t: 'IDENTITY_ASSERT',
    v: 1,
    sub: issuer.toLowerCase(),
    iat: nowIso(),
    chain: (process.env.HEDERA_NETWORK ?? 'testnet') as 'testnet' | 'mainnet',
    payload: { hedera_account_id: hederaId, reason },
  };
}

/**
 * Create IDENTITY_ROTATE event - published when rotating to new Hedera account
 * REQUIRES valid EVM signature
 */
export function rotateEvent(args: {
  issuer: string;
  fromHederaId: string;
  toHederaId: string;
  sig: string;  // required EVM sig
  reason?: string;
}): Hcs22Envelope {
  return {
    t: 'IDENTITY_ROTATE',
    v: 1,
    sub: args.issuer.toLowerCase(),
    iat: nowIso(),
    chain: (process.env.HEDERA_NETWORK ?? 'testnet') as 'testnet' | 'mainnet',
    sig: args.sig,
    payload: {
      from_hedera_id: args.fromHederaId,
      to_hedera_id: args.toHederaId,
      reason: args.reason ?? 'key-rotation',
    },
  };
}

/**
 * Create IDENTITY_UNBIND event - published when removing binding
 * Signature optional if operator-initiated
 */
export function unbindEvent(args: {
  issuer: string;
  hederaId: string;
  sig?: string;  // optional if operator
  reason?: string;
}): Hcs22Envelope {
  return {
    t: 'IDENTITY_UNBIND',
    v: 1,
    sub: args.issuer.toLowerCase(),
    iat: nowIso(),
    chain: (process.env.HEDERA_NETWORK ?? 'testnet') as 'testnet' | 'mainnet',
    sig: args.sig ?? null,
    payload: {
      hedera_account_id: args.hederaId,
      reason: args.reason ?? 'unbind',
    },
  };
}
