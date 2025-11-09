/**
 * Contact Resolution Module - TrustMesh v2
 * 
 * Dual-rail identity resolution with MatterFi-first and KNS fallback
 * Designed for cannabis treasury compliance with RBAC integration
 */

export type VerifiedLevel = 'unverified' | 'provider_verified' | 'cryptographic_proof';

// Dual-rail account references (custodial + native)
export interface AccountRef {
  kind: 'custodial' | 'hedera' | 'evm';
  network: 'hedera' | 'polygon' | 'base';
  id: string;               // "0.0.x", "0x...", or provider account id
  alias?: string;           // display name/handle hint
}

// Enhanced contact resolution result
export interface ContactResolution {
  primary: AccountRef;      // best-fit account for operations
  accounts: AccountRef[];   // all known accounts for this contact
  source: 'matterfi' | 'kns' | 'hedera' | 'custodial';
  displayName?: string;
  verified: boolean;
  verifiedLevel: VerifiedLevel;
  confidence: number;       // 0..1 confidence score
  metadata?: {
    hederaAccountId?: string;
    custodialAccountId?: string;
    walletAddress?: string;
    knsHandle?: string;
    matterfiUserId?: string;
    avatarUrl?: string;
    email?: string;
    signatureProof?: string; // cryptographic proof of control
    kycStatus?: 'pending' | 'verified' | 'expired' | 'failed';
    kybStatus?: 'pending' | 'verified' | 'expired' | 'failed'; // for businesses
    facilityLicense?: string; // cannabis facility license number
  };
}

// Contact resolution error types
export class ContactResolutionError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'NETWORK_ERROR' | 'INVALID_HANDLE' | 'PROVIDER_ERROR' | 'TIMEOUT',
    public provider?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ContactResolutionError';
  }
}

// Input classification and normalization
const RE_HEDERA = /^0\.0\.\d+$/;
const RE_EVM = /^0x[a-fA-F0-9]{40}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_KNS = /\.hbar$/i;

type IdentifierKind = 'hedera' | 'evm' | 'email' | 'kns' | 'handle';

interface ClassifiedIdentifier {
  kind: IdentifierKind;
  value: string;
}

function normalize(id: string): string {
  return id.trim().toLowerCase();
}

function classifyIdentifier(identifier: string): ClassifiedIdentifier {
  const v = identifier.trim();
  
  if (RE_HEDERA.test(v)) return { kind: 'hedera', value: v };
  if (RE_EVM.test(v)) return { kind: 'evm', value: v.toLowerCase() };
  if (RE_EMAIL.test(v)) return { kind: 'email', value: v.toLowerCase() };
  if (RE_KNS.test(v)) return { kind: 'kns', value: v.toLowerCase() };
  
  return { 
    kind: 'handle', 
    value: normalize(v.startsWith('@') ? v.slice(1) : v) 
  };
}

// Cache with TTL and jitter
const POS_TTL = 5 * 60_000; // 5 minutes for successful resolutions
const NEG_TTL = 60_000;     // 1 minute for failures
const jitter = (ms: number) => ms + Math.floor(Math.random() * (ms * 0.15));

interface CacheEntry {
  result: ContactResolution | null;
  expiresAt: number;
}

// Timeout wrapper
async function withTimeout<T>(promise: Promise<T>, ms = 2_000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  
  try {
    return await promise;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ContactResolutionError('Request timeout', 'TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Provider interfaces
interface ContactProvider {
  resolveHandle(handle: string): Promise<ContactResolution | null>;
  resolveAccountId(accountId: string): Promise<ContactResolution | null>;
}

// Enhanced MatterFi provider with cannabis-specific data
class MatterFiContactProvider implements ContactProvider {
  private mockContacts = new Map<string, ContactResolution>();

  constructor() {
    this.seedCannabisData();
  }

  private seedCannabisData() {
    const cannabisUsers: ContactResolution[] = [
      {
        primary: { kind: 'custodial', network: 'hedera', id: 'acct_gv_owner', alias: 'Green Valley Owner' },
        accounts: [
          { kind: 'custodial', network: 'hedera', id: 'acct_gv_owner', alias: 'Green Valley Owner' },
          { kind: 'hedera', network: 'hedera', id: '0.0.12345', alias: 'Green Valley Owner' },
        ],
        source: 'matterfi',
        displayName: 'Green Valley Dispensary - Owner',
        verified: true,
        verifiedLevel: 'provider_verified',
        confidence: 0.95,
        metadata: {
          matterfiUserId: 'usr_gv_owner',
          hederaAccountId: '0.0.12345',
          custodialAccountId: 'acct_gv_owner',
          email: 'owner@greenvalley.com',
          avatarUrl: 'https://avatar.matterfi.com/gv_owner.png',
          kycStatus: 'verified',
          kybStatus: 'verified',
          facilityLicense: 'CA-C11-0000123-LIC'
        }
      },
      {
        primary: { kind: 'custodial', network: 'hedera', id: 'acct_gv_finance', alias: 'Finance Manager' },
        accounts: [
          { kind: 'custodial', network: 'hedera', id: 'acct_gv_finance', alias: 'Finance Manager' },
          { kind: 'hedera', network: 'hedera', id: '0.0.12346', alias: 'Finance Manager' },
        ],
        source: 'matterfi',
        displayName: 'Green Valley - Finance Manager',
        verified: true,
        verifiedLevel: 'provider_verified',
        confidence: 0.90,
        metadata: {
          matterfiUserId: 'usr_gv_finance',
          hederaAccountId: '0.0.12346',
          custodialAccountId: 'acct_gv_finance',
          email: 'finance@greenvalley.com',
          kycStatus: 'verified'
        }
      },
      {
        primary: { kind: 'custodial', network: 'hedera', id: 'acct_gv_clerk', alias: 'Dispensary Clerk' },
        accounts: [
          { kind: 'custodial', network: 'hedera', id: 'acct_gv_clerk', alias: 'Dispensary Clerk' },
        ],
        source: 'matterfi',
        displayName: 'Green Valley - Clerk',
        verified: false,
        verifiedLevel: 'unverified',
        confidence: 0.60,
        metadata: {
          matterfiUserId: 'usr_gv_clerk',
          custodialAccountId: 'acct_gv_clerk',
          email: 'clerk@greenvalley.com',
          kycStatus: 'pending'
        }
      }
    ];

    // Index by various identifiers
    cannabisUsers.forEach(user => {
      const email = user.metadata?.email;
      if (email) {
        const handle = email.split('@')[0];
        this.mockContacts.set(email, user);
        this.mockContacts.set(handle, user);
        this.mockContacts.set(`@${handle}`, user);
      }
      
      // Index by all account IDs
      user.accounts.forEach(account => {
        this.mockContacts.set(account.id, user);
      });
      
      // Index by display name normalized
      if (user.displayName) {
        const normalized = user.displayName.toLowerCase().replace(/\s+/g, '_');
        this.mockContacts.set(normalized, user);
      }
    });
  }

  async resolveHandle(handle: string): Promise<ContactResolution | null> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    const normalizedHandle = handle.toLowerCase().replace(/^@/, '');
    return this.mockContacts.get(normalizedHandle) || 
           this.mockContacts.get(`@${normalizedHandle}`) || 
           this.mockContacts.get(handle.toLowerCase()) || 
           null;
  }

  async resolveAccountId(accountId: string): Promise<ContactResolution | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return this.mockContacts.get(accountId) || null;
  }
}

// KNS provider for external/auditor contacts
class KNSContactProvider implements ContactProvider {
  private knsContacts = new Map<string, ContactResolution>();

  constructor() {
    this.seedKNSData();
  }

  private seedKNSData() {
    const knsUsers: ContactResolution[] = [
      {
        primary: { kind: 'hedera', network: 'hedera', id: '0.0.98765', alias: 'External Auditor' },
        accounts: [
          { kind: 'hedera', network: 'hedera', id: '0.0.98765', alias: 'External Auditor' },
        ],
        source: 'kns',
        displayName: 'CannaBiz Auditor',
        verified: true,
        verifiedLevel: 'cryptographic_proof',
        confidence: 0.99,
        metadata: {
          hederaAccountId: '0.0.98765',
          knsHandle: 'auditor.hbar',
          signatureProof: 'proof_abc123...',
          kybStatus: 'verified'
        }
      },
      {
        primary: { kind: 'hedera', network: 'hedera', id: '0.0.98766', alias: 'Compliance Officer' },
        accounts: [
          { kind: 'hedera', network: 'hedera', id: '0.0.98766', alias: 'Compliance Officer' },
        ],
        source: 'kns',
        displayName: 'State Compliance Officer',
        verified: true,
        verifiedLevel: 'cryptographic_proof',
        confidence: 0.99,
        metadata: {
          hederaAccountId: '0.0.98766',
          knsHandle: 'compliance.hbar',
          signatureProof: 'proof_def456...'
        }
      }
    ];

    knsUsers.forEach(user => {
      if (user.metadata?.knsHandle) {
        this.knsContacts.set(user.metadata.knsHandle, user);
      }
      user.accounts.forEach(account => {
        this.knsContacts.set(account.id, user);
      });
    });
  }

  async resolveHandle(handle: string): Promise<ContactResolution | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return this.knsContacts.get(handle.toLowerCase()) || null;
  }

  async resolveAccountId(accountId: string): Promise<ContactResolution | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.knsContacts.get(accountId) || null;
  }
}

// Provider ordering and circuit breaker
type ProviderOrder = Array<'matterfi' | 'kns'>;

// Main contact resolver with enhanced features
export class ContactResolver {
  private matterFiProvider: ContactProvider;
  private knsProvider: ContactProvider;
  private cache = new Map<string, CacheEntry>();
  private order: ProviderOrder;
  
  // Circuit breaker for MatterFi
  private mfFailures = 0;
  private mfOpenUntil = 0;

  constructor(
    matterFiProvider?: ContactProvider,
    knsProvider?: ContactProvider,
    order: ProviderOrder = ['matterfi', 'kns']
  ) {
    this.matterFiProvider = matterFiProvider || new MatterFiContactProvider();
    this.knsProvider = knsProvider || new KNSContactProvider();
    this.order = order;
  }

  /**
   * Resolve contact with dual-rail support and circuit breaker
   */
  async resolveContact(identifier: string): Promise<ContactResolution> {
    if (!identifier?.trim()) {
      throw new ContactResolutionError('Invalid identifier provided', 'INVALID_HANDLE');
    }

    const { kind, value } = classifyIdentifier(identifier);
    const cacheKey = `${kind}:${value}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached !== undefined) {
      if (cached === null) {
        throw new ContactResolutionError(
          `Contact not found: ${identifier}`,
          'NOT_FOUND'
        );
      }
      return cached;
    }

    let result: ContactResolution | null = null;

    try {
      // Try providers in order with circuit breaker
      if (this.order[0] === 'matterfi' && this.matterfiAvailable()) {
        result = await this.tryMatterFi(kind, value);
      }
      
      // Fallback to KNS if MatterFi failed or unavailable
      if (!result) {
        result = await this.tryKNS(kind, value);
      }

    } catch (error) {
      if (error instanceof ContactResolutionError) {
        throw error;
      }
      throw new ContactResolutionError(
        `Resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        undefined,
        error
      );
    }

    // Cache result (including null for not found)
    this.setCachedResult(cacheKey, result);

    if (!result) {
      throw new ContactResolutionError(
        `Contact not found in any provider: ${identifier}`,
        'NOT_FOUND'
      );
    }

    // Enhance result with computed fields
    result.verifiedLevel = this.levelFromSource(result);
    if (!result.accounts?.length) {
      result.accounts = [result.primary];
    }

    return result;
  }

  /**
   * Batch resolution with controlled concurrency
   */
  async resolveContacts(identifiers: string[]): Promise<(ContactResolution | null)[]> {
    if (!identifiers.length) return [];

    const limit = 5;
    const results: (ContactResolution | null)[] = new Array(identifiers.length).fill(null);
    let index = 0;

    const processNext = async (): Promise<void> => {
      const currentIndex = index++;
      if (currentIndex >= identifiers.length) return;

      try {
        results[currentIndex] = await this.resolveContact(identifiers[currentIndex]);
      } catch (error) {
        console.warn(`Failed to resolve contact ${identifiers[currentIndex]}:`, error);
        results[currentIndex] = null;
      }

      await processNext();
    };

    await Promise.all(
      Array.from(
        { length: Math.min(limit, identifiers.length) }, 
        () => processNext()
      )
    );

    return results;
  }

  /**
   * Contact existence check with privacy protection
   */
  async contactExists(identifier: string, strict = false): Promise<boolean> {
    try {
      await this.resolveContact(identifier);
      return true;
    } catch (error) {
      if (strict && error instanceof ContactResolutionError) {
        return error.code !== 'NETWORK_ERROR';
      }
      return false;
    }
  }

  /**
   * Clear resolution cache
   */
  clearCache(): void {
    this.cache.clear();
    this.mfFailures = 0;
    this.mfOpenUntil = 0;
  }

  // Private methods
  private matterfiAvailable(): boolean {
    return Date.now() >= this.mfOpenUntil;
  }

  private recordMfFailure(): void {
    this.mfFailures++;
    if (this.mfFailures >= 3) {
      this.mfOpenUntil = Date.now() + 30_000; // 30s circuit breaker
      this.mfFailures = 0;
    }
  }

  private async tryMatterFi(kind: IdentifierKind, value: string): Promise<ContactResolution | null> {
    try {
      const isHandleType = kind === 'handle' || kind === 'email';
      const result = await withTimeout(
        isHandleType 
          ? this.matterFiProvider.resolveHandle(value)
          : this.matterFiProvider.resolveAccountId(value),
        2000
      );
      return result;
    } catch (error) {
      this.recordMfFailure();
      return null;
    }
  }

  private async tryKNS(kind: IdentifierKind, value: string): Promise<ContactResolution | null> {
    try {
      if (kind === 'kns') {
        return await withTimeout(this.knsProvider.resolveHandle(value), 2000);
      }
      if (kind === 'hedera') {
        return await withTimeout(this.knsProvider.resolveAccountId(value), 2000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private getCachedResult(key: string): ContactResolution | null | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.result;
  }

  private setCachedResult(key: string, result: ContactResolution | null): void {
    const ttl = result ? POS_TTL : NEG_TTL;
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + jitter(ttl)
    });
  }

  private levelFromSource(result: ContactResolution): VerifiedLevel {
    if (result.metadata?.signatureProof) return 'cryptographic_proof';
    if (result.source === 'matterfi' && result.verified) return 'provider_verified';
    return 'unverified';
  }
}

// Global resolver instance
let globalResolver: ContactResolver | null = null;

export function getContactResolver(): ContactResolver {
  if (!globalResolver) {
    globalResolver = new ContactResolver();
  }
  return globalResolver;
}

// Convenience functions
export async function resolveContact(identifier: string): Promise<ContactResolution> {
  return getContactResolver().resolveContact(identifier);
}

export async function resolveContacts(identifiers: string[]): Promise<(ContactResolution | null)[]> {
  return getContactResolver().resolveContacts(identifiers);
}

export async function contactExists(identifier: string, strict = false): Promise<boolean> {
  return getContactResolver().contactExists(identifier, strict);
}

// Utility functions
export function toAccountRefs(contact: ContactResolution): AccountRef[] {
  return [...contact.accounts];
}

export function getDisplayName(contact: ContactResolution): string {
  return contact.displayName
    || contact.metadata?.knsHandle
    || contact.metadata?.email?.split('@')[0]
    || contact.primary.id;
}

export function getPrimaryAccountId(contact: ContactResolution): string {
  return contact.primary.id;
}

// Type guards
export function isMatterFiContact(contact: ContactResolution): boolean {
  return contact.source === 'matterfi';
}

export function isKNSContact(contact: ContactResolution): boolean {
  return contact.source === 'kns';
}

export function isVerifiedContact(contact: ContactResolution): boolean {
  return contact.verified === true;
}

export function hasKYCVerification(contact: ContactResolution): boolean {
  return contact.metadata?.kycStatus === 'verified';
}

export function hasKYBVerification(contact: ContactResolution): boolean {
  return contact.metadata?.kybStatus === 'verified';
}

export function isCannabisLicensed(contact: ContactResolution): boolean {
  return Boolean(contact.metadata?.facilityLicense);
}

// Settlement adapter bridge
export function getSettlementAccount(contact: ContactResolution, preferCustodial = true): AccountRef {
  if (preferCustodial) {
    const custodial = contact.accounts.find(a => a.kind === 'custodial');
    if (custodial) return custodial;
  }
  
  return contact.primary;
}