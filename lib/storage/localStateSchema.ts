/**
 * TrustMesh Local State Manifest v1
 * 
 * Constitutional document defining what may be stored on-device, how, and for how long.
 * 
 * Principles:
 * - Truth source: HCS (immutable ledger)
 * - Working memory: In-memory state (ephemeral)
 * - Persistence: Encrypted device storage (owner-scoped, TTL'd)
 * - Zero custody: No server-side persistence of user data
 * 
 * Every state category must declare:
 * - Type schema
 * - TTL (time-to-live)
 * - Encryption requirement
 * - Owner scoping
 * - Refresh strategy
 */

// ========== OWNER SCOPE ==========

export interface OwnerScope {
  hederaAccountId: string;
  xmtpInboxId?: string;
  magicIssuer?: string;
}

// ========== TTL TYPES ==========

export type TTL = 
  | 'until_logout'     // Cleared on logout/identity change
  | '24h'              // 24 hours
  | '30d'              // 30 days
  | '90d'              // 90 days (for key rotation)
  | '14d'              // 14 days
  | 'indefinite';      // Never auto-expires (e.g., preferences)

export const TTL_DURATIONS: Record<TTL, number | null> = {
  'until_logout': null,           // Special: cleared on logout
  '24h': 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '14d': 14 * 24 * 60 * 60 * 1000,
  'indefinite': null,             // Never expires
};

// ========== MESSAGING LAYER ==========

export interface ReadReceipts {
  // conversationId → lastReadTimestamp
  receipts: Record<string, number>;
}

export interface ConversationIndexEntry {
  conversationId: string;
  dmTopic: string;
  peerInboxId: string;
  peerEvmAddress?: string;
  peerHederaAccountId?: string;
  lastMessagePreview?: string;
  lastMessageAt?: number;
  unreadCount?: number;
}

export interface ConversationIndex {
  conversations: ConversationIndexEntry[];
  lastSynced: number;
}

export interface ThreadFlags {
  // conversationId → flags
  flags: Record<string, {
    muted: boolean;
    pinned: boolean;
    sensitive: boolean;
    hiddenFromList: boolean;
  }>;
}

// ========== CONTACTS / CIRCLE LAYER ==========

export interface ContactSnapshot {
  peerId: string;
  handle?: string;
  displayName?: string;
  evmAddress?: string;
  hederaAccountId?: string;
  bondedAt?: string;
  hasXMTP?: boolean;
}

export interface ContactsSnapshot {
  contacts: ContactSnapshot[];
  lastSynced: number;
  lastEventTimestamp?: string;  // HCS consensus timestamp
}

export interface CircleSummary {
  circleSize: number;
  totalTrustAllocated: number;
  recognitionsReceived: number;
  lastUpdated: number;
}

// ========== ECONOMIC LAYER ==========

export interface TrstBalanceSnapshot {
  balance: number;
  tokenId: string;
  lastFetched: number;
  // WARNING: Display only - never trust for business logic
}

export interface TransactionLight {
  txId: string;
  direction: 'sent' | 'received';
  amount: number;
  asset: 'TRST' | 'TRST-USD';
  timestamp: number;
  peerAccountId?: string;
  peerHandle?: string;
  memo?: string;
}

export interface TxIndexLight {
  transactions: TransactionLight[];
  lastSynced: number;
}

// ========== ORACLE / AI LAYER ==========

export interface OracleOptIn {
  service: 'matchmaking' | 'reputation' | 'analytics';
  enabled: boolean;
  privacyLevel: 'minimal' | 'aggregate' | 'full';
  dataShared: string[];  // ['interests', 'circleSize', 'location']
  timestamp: number;
}

export interface OracleOptIns {
  optIns: OracleOptIn[];
}

export interface TeeKeypair {
  publicKey: string;      // PEM format
  privateKey: string;     // PEM format (encrypted at rest)
  createdAt: number;
  expiresAt: number;      // For rotation
}

export interface OracleResult {
  service: string;
  matches?: any[];        // Service-specific result
  scores?: Record<string, number>;
  attestation?: string;   // TEE cryptographic attestation
  timestamp: number;
  expiresAt: number;
}

export interface LastOracleResult {
  results: Record<string, OracleResult>;  // service → result
}

// ========== PREFERENCES / UI LAYER ==========

export interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultTab: 'circle' | 'contacts' | 'messages' | 'payments';
  hideZeroBalances: boolean;
  lastActiveContact?: string;
  lastActiveConversation?: string;
  onboardingCompleted: boolean;
  tutorialsSeen: string[];
}

export interface FeatureFlagsLocal {
  // Local feature flags (no telemetry)
  flags: Record<string, boolean>;
}

// ========== UNIFIED SCHEMA ==========

export interface LocalStateSchema {
  // Messaging Layer
  readReceipts: {
    data: ReadReceipts;
    ttl: 'until_logout';
    encrypted: true;
    scoped: true;
    category: 'messaging';
  };
  
  conversationIndex: {
    data: ConversationIndex;
    ttl: '30d';
    encrypted: true;
    scoped: true;
    category: 'messaging';
  };
  
  threadFlags: {
    data: ThreadFlags;
    ttl: 'until_logout';
    encrypted: true;
    scoped: true;
    category: 'messaging';
  };
  
  // Contacts / Circle Layer
  contactsSnapshot: {
    data: ContactsSnapshot;
    ttl: '30d';
    encrypted: true;
    scoped: true;
    category: 'contacts';
    refreshable: true;
  };
  
  circleSummary: {
    data: CircleSummary;
    ttl: '30d';
    encrypted: true;
    scoped: true;
    category: 'contacts';
  };
  
  // Economic Layer
  trstBalanceSnapshot: {
    data: TrstBalanceSnapshot;
    ttl: '24h';
    encrypted: true;
    scoped: true;
    category: 'economic';
    displayOnly: true;  // WARNING: Never trust for business logic
  };
  
  txIndexLight: {
    data: TxIndexLight;
    ttl: '14d';
    encrypted: true;
    scoped: true;
    category: 'economic';
  };
  
  // Oracle / AI Layer
  oracleOptIns: {
    data: OracleOptIns;
    ttl: 'until_logout';
    encrypted: true;
    scoped: true;
    category: 'oracle';
  };
  
  teeKeypair: {
    data: TeeKeypair;
    ttl: '90d';
    encrypted: true;
    scoped: true;
    category: 'oracle';
    rotatable: true;
  };
  
  lastOracleResult: {
    data: LastOracleResult;
    ttl: '24h';
    encrypted: true;
    scoped: true;
    category: 'oracle';
  };
  
  // Preferences / UI
  uiPreferences: {
    data: UIPreferences;
    ttl: 'indefinite';
    encrypted: false;  // Optional - can be unencrypted for simplicity
    scoped: true;
    category: 'preferences';
  };
  
  featureFlagsLocal: {
    data: FeatureFlagsLocal;
    ttl: 'indefinite';
    encrypted: false;
    scoped: true;
    category: 'preferences';
  };
}

// ========== TYPE UTILITIES ==========

export type StateKey = keyof LocalStateSchema;
export type LocalStateKey = StateKey; // Alias for backwards compat

export type StateData<K extends StateKey> = LocalStateSchema[K]['data'];

export type StateTTL<K extends StateKey> = LocalStateSchema[K]['ttl'];

export type StateCategory = LocalStateSchema[StateKey]['category'];

// Type for manifest entry metadata
export type LocalStateEntryMeta<K extends StateKey> = {
  key: K;
  ttl: StateTTL<K>;
  encrypted: LocalStateSchema[K]['encrypted'];
  scoped: LocalStateSchema[K]['scoped'];
  category: StateCategory;
};

// Manifest object for runtime access
export const LOCAL_STATE_MANIFEST: {
  [K in StateKey]: LocalStateEntryMeta<K>
} = {
  readReceipts: {
    key: 'readReceipts',
    ttl: 'until_logout',
    encrypted: true,
    scoped: true,
    category: 'messaging',
  },
  conversationIndex: {
    key: 'conversationIndex',
    ttl: '30d',
    encrypted: true,
    scoped: true,
    category: 'messaging',
  },
  threadFlags: {
    key: 'threadFlags',
    ttl: 'until_logout',
    encrypted: true,
    scoped: true,
    category: 'messaging',
  },
  contactsSnapshot: {
    key: 'contactsSnapshot',
    ttl: '30d',
    encrypted: true,
    scoped: true,
    category: 'contacts',
  },
  circleSummary: {
    key: 'circleSummary',
    ttl: '30d',
    encrypted: true,
    scoped: true,
    category: 'contacts',
  },
  trstBalanceSnapshot: {
    key: 'trstBalanceSnapshot',
    ttl: '24h',
    encrypted: true,
    scoped: true,
    category: 'economic',
  },
  txIndexLight: {
    key: 'txIndexLight',
    ttl: '14d',
    encrypted: true,
    scoped: true,
    category: 'economic',
  },
  oracleOptIns: {
    key: 'oracleOptIns',
    ttl: 'until_logout',
    encrypted: true,
    scoped: true,
    category: 'oracle',
  },
  teeKeypair: {
    key: 'teeKeypair',
    ttl: '90d',
    encrypted: true,
    scoped: true,
    category: 'oracle',
  },
  lastOracleResult: {
    key: 'lastOracleResult',
    ttl: '24h',
    encrypted: true,
    scoped: true,
    category: 'oracle',
  },
  uiPreferences: {
    key: 'uiPreferences',
    ttl: 'indefinite',
    encrypted: false,
    scoped: true,
    category: 'preferences',
  },
  featureFlagsLocal: {
    key: 'featureFlagsLocal',
    ttl: 'indefinite',
    encrypted: false,
    scoped: true,
    category: 'preferences',
  },
} as const;

// ========== METADATA WRAPPER ==========

export interface StoredState<K extends StateKey> {
  key: K;
  owner: OwnerScope;
  data: StateData<K>;
  version: number;
  createdAt: number;
  expiresAt: number | null;  // null = no expiry
  category: StateCategory;
}

// ========== VALIDATION ==========

export function isExpired<K extends StateKey>(stored: StoredState<K>): boolean {
  if (stored.expiresAt === null) return false;
  return Date.now() > stored.expiresAt;
}

export function calculateExpiryTime<K extends StateKey>(key: K): number | null {
  const manifest = LOCAL_STATE_MANIFEST[key];
  const duration = TTL_DURATIONS[manifest.ttl];
  
  if (duration === null) return null;  // No expiry
  
  return Date.now() + duration;
}

export function ownerMatches(stored: OwnerScope, current: OwnerScope): boolean {
  return stored.hederaAccountId === current.hederaAccountId;
}

// ========== STORAGE VERSION ==========

export const STORAGE_VERSION = 1;

export interface StorageMetadata {
  version: number;
  lastMigration?: number;
}

// ========== CONSTANTS ==========

export const STORAGE_KEY_PREFIX = 'trustmesh_v1';

export const CATEGORIES: StateCategory[] = [
  'messaging',
  'contacts',
  'economic',
  'oracle',
  'preferences',
];

// ========== EXPLICIT EXCLUSIONS (DOCUMENTATION) ==========

/**
 * FORBIDDEN DATA (never store):
 * 
 * 1. Global user directories / search indexes
 *    - Enables graph mining
 * 
 * 2. Full circle event logs (all users)
 *    - Cross-user data leak risk
 * 
 * 3. Raw oracle input payloads (interests + circle)
 *    - Could reveal behavioral profiles
 * 
 * 4. Server analytics / telemetry
 *    - Outside anti-surveillance model
 * 
 * 5. Decrypted XMTP message content
 *    - XMTP SDK handles secure caching itself
 * 
 * 6. Any "shadow copy" of server-side ephemeral data
 *    - Respect server's intent to forget
 */
