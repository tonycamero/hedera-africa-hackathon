# Privacy-Preserving Matchmaking Oracle
## Implementation Plan with Verifiable Compute

> **Goal**: Build TrustMesh's first token-gated oracle service that suggests compatible contacts using EQTY Lab's Verifiable Compute + HCS-10, while maintaining the anti-surveillance architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phase 1: Foundation](#phase-1-foundation)
4. [Phase 2: Oracle Infrastructure](#phase-2-oracle-infrastructure)
5. [Phase 3: Matchmaking Service](#phase-3-matchmaking-service)
6. [Phase 4: Testing & Deployment](#phase-4-testing--deployment)
7. [Privacy Guarantees](#privacy-guarantees)
8. [Future Enhancements](#future-enhancements)

---

## Overview

### What We're Building

**Privacy-Preserving Matchmaking Oracle that:**
- Suggests compatible contacts based on trust patterns + interests
- Uses EQTY Lab's Verifiable Compute (TEE-based)
- Token-gated with TRST (requires 1.0 TRST minimum)
- Explicit opt-in per user (localStorage-based)
- HCS-10 protocol for agent communication
- Cryptographic attestations anchored on HCS
- Zero raw data exposure outside TEE

### User Experience

```
User: "Show me compatible contacts"
  ↓
App checks: Has 1.0 TRST? Opted-in to matchmaking?
  ↓
App encrypts: {interests, circleSize, location} → TEE public key
  ↓
Submit via HCS-10 to oracle topic
  ↓
TEE computes matches across all opted-in users
  ↓
Returns: Top 5 matches + cryptographic attestation
  ↓
App verifies attestation on HCS
  ↓
Display: "3 highly compatible contacts nearby"
```

### Privacy Properties Maintained

| Data | Exposed? | Location |
|------|---------|----------|
| **Raw circle graph** | ❌ Never | User's device only |
| **Message content** | ❌ Never | XMTP E2E encrypted |
| **Read receipts** | ❌ Never | localStorage only |
| **Interests (if opted-in)** | ✅ Encrypted | TEE only |
| **Aggregate stats** | ✅ Encrypted | TEE only |
| **Match results** | ✅ Public | Returned to user |
| **Attestations** | ✅ Public | HCS (verifiable) |

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Browser                          │
├─────────────────────────────────────────────────────────────┤
│  TrustMesh App                                              │
│  ├── Token Gate Check (TRST balance)                        │
│  ├── Opt-In Manager (localStorage)                          │
│  ├── Data Preparation (aggregate + preferences)             │
│  ├── TEE Encryption (public key crypto)                     │
│  └── Attestation Verifier (HCS lookups)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    HCS-10 Message Submission
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 Hedera Consensus Service                     │
├─────────────────────────────────────────────────────────────┤
│  Oracle Service Topic (type 4)                              │
│  ├── Match requests (encrypted)                             │
│  ├── Match responses (with attestations)                    │
│  └── Attestation anchoring (immutable)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Oracle Service Monitors HCS
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Verifiable Compute Oracle                       │
│                  (EQTY Lab + Intel/NVIDIA TEE)              │
├─────────────────────────────────────────────────────────────┤
│  TEE (Trusted Execution Environment)                         │
│  ├── Decrypt user data (inside enclave)                     │
│  ├── Compute similarity scores (private)                    │
│  ├── Generate matches (top-k algorithm)                     │
│  ├── Create attestation (cryptographic proof)               │
│  └── Encrypt results (user's public key)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Submit attestation to HCS
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 Hedera Consensus Service                     │
│              (Attestation Topic - immutable log)             │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Return results + attestation
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     User's Browser                          │
│  ├── Verify attestation (HCS lookup)                        │
│  ├── Decrypt results (user's private key)                   │
│  └── Display matches (with compatibility scores)            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. User Opt-In (One Time)**
```typescript
localStorage: {
  oracle_opt_ins: {
    matchmaking: {
      enabled: true,
      privacyLevel: 'aggregate-only',
      dataShared: ['interests', 'circleSize', 'location'],
      timestamp: 1705334567890
    }
  }
}
```

**2. Match Request (User-Initiated)**
```typescript
// Client prepares encrypted payload
{
  accountId: "0.0.12345",
  interests: ["cannabis", "treasury", "compliance"],
  circleSize: 15,
  location: "Eugene, OR",
  timestamp: 1705334567890
}
↓ Encrypt with TEE public key
↓ Submit via HCS-10 to oracle topic
```

**3. TEE Processing (Private)**
```typescript
// Inside TEE (no external visibility)
for each opted-in user {
  decrypt(userData)
  computeSimilarity(currentUser, otherUser)
  rankByCompatibility()
}
↓ Generate top-k matches
↓ Create cryptographic attestation
↓ Encrypt results with user's public key
```

**4. Attestation Anchoring**
```typescript
// HCS attestation record (public, verifiable)
{
  computation: "matchmaking-v1",
  user: "0.0.12345",
  inputHash: sha256(encryptedRequest),
  outputHash: sha256(encryptedResults),
  teeSignature: sign(tee_private_key, ...),
  timestamp: 1705334567890,
  hcsTimestamp: "0.0.123456@1705334567.890"
}
```

---

## Phase 1: Foundation

**Status**: ✅ Already Complete (from Epic A/B/C)

### What's Already Built

1. **Auth-Scoped Circle API** (CIR-1, CIR-2, CIR-3)
   - HcsCircleState incremental cache
   - O(N) queries per user
   - 250 contact hard cap
   - Magic.link authentication

2. **XMTP Messaging** (XMTP-11, XMTP-12)
   - End-to-end encrypted DMs
   - Deterministic message ordering
   - Local read receipts

3. **Loop Two UI** (LP-1, LP-2, LP-3)
   - Conversation list with unread badges
   - Message previews
   - Optimistic sends with deduplication

4. **Token Infrastructure**
   - TRST minting (27 free, 0.01 per extra)
   - Recognition tokens
   - Trust allocation (25 per slot, 9 slots)

### What We Need to Add

- HCS-10 protocol implementation
- Token-gating logic
- Opt-in management UI
- TEE encryption/decryption
- Attestation verification

---

## Phase 2: Oracle Infrastructure

### Milestone 1: HCS-10 Protocol Implementation

**Deliverable**: HCS-10 client library for TrustMesh

#### Tasks:

**2.1. Create HCS-10 Types**

```typescript
// lib/hcs/hcs10/types.ts

export enum HCS10Operation {
  REGISTER = 0,
  DELETE = 1,
  MIGRATE = 2,
  CONNECTION_REQUEST = 3,
  CONNECTION_CREATED = 4,
  CONNECTION_CLOSED = 5,
  MESSAGE = 6,
  ORACLE_REQUEST = 7,    // NEW
  ORACLE_RESPONSE = 8    // NEW
}

export enum HCS10TopicType {
  REGISTRY = 0,
  INBOUND = 1,
  OUTBOUND = 2,
  CONNECTION = 3,
  ORACLE_SERVICE = 4     // NEW
}

export interface HCS10Message {
  p: 'hcs-10'
  op: keyof typeof HCS10Operation | number
  operator_id: string
  data: string | object
  m?: string  // Optional metadata
}

export interface HCS10OracleRequest extends HCS10Message {
  op: 'oracle_request' | 7
  service: string
  encrypted_payload: string
  user_public_key: string  // For encrypting response
  token_proof?: string     // Proof of TRST balance
}

export interface HCS10OracleResponse extends HCS10Message {
  op: 'oracle_response' | 8
  request_id: string
  encrypted_result: string
  attestation: Attestation
  hcs_timestamp: string
}

export interface Attestation {
  computation: string
  version: string
  input_hash: string
  output_hash: string
  tee_signature: string
  tee_public_key: string
  timestamp: number
  hedera_timestamp?: string
}
```

**2.2. Implement HCS-10 Client**

```typescript
// lib/hcs/hcs10/client.ts

import { TopicMessageSubmitTransaction, TopicId } from '@hashgraph/sdk'
import type { Client } from '@hashgraph/sdk'
import type { HCS10Message, HCS10OracleRequest } from './types'

export class HCS10Client {
  constructor(
    private hederaClient: Client,
    private oracleTopicId: string
  ) {}

  /**
   * Submit oracle request via HCS-10 protocol
   */
  async submitOracleRequest(request: HCS10OracleRequest): Promise<string> {
    const message: HCS10Message = {
      p: 'hcs-10',
      op: 7, // ORACLE_REQUEST
      operator_id: request.operator_id,
      data: {
        service: request.service,
        encrypted_payload: request.encrypted_payload,
        user_public_key: request.user_public_key,
        token_proof: request.token_proof
      }
    }

    // Format transaction memo per HCS-10 spec
    const memo = `hcs-10:op:7:4` // Operation 7 (oracle_request) on topic type 4 (oracle_service)

    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(this.oracleTopicId))
      .setMessage(JSON.stringify(message))
      .setTransactionMemo(memo)

    const response = await transaction.execute(this.hederaClient)
    const receipt = await response.getReceipt(this.hederaClient)
    
    return receipt.topicSequenceNumber.toString()
  }

  /**
   * Listen for oracle responses
   */
  async subscribeToResponses(
    userId: string,
    callback: (response: HCS10OracleResponse) => void
  ): Promise<() => void> {
    // Subscribe to HCS topic
    const subscription = new TopicMessageQuery()
      .setTopicId(TopicId.fromString(this.oracleTopicId))
      .subscribe(this.hederaClient, (message) => {
        try {
          const parsed = JSON.parse(message.contents.toString())
          
          // Filter for oracle responses to this user
          if (parsed.op === 8 && parsed.operator_id === userId) {
            callback(parsed as HCS10OracleResponse)
          }
        } catch (err) {
          console.warn('[HCS10] Failed to parse message:', err)
        }
      })

    // Return unsubscribe function
    return () => subscription.unsubscribe()
  }
}
```

**2.3. Tests for HCS-10 Client**

```typescript
// __tests__/hcs10-client.test.ts

describe('HCS10Client', () => {
  it('formats oracle request correctly', () => {
    const request = {
      operator_id: '[email protected]',
      service: 'matchmaking',
      encrypted_payload: 'base64...',
      user_public_key: 'pubkey...'
    }
    
    const formatted = formatHCS10Message(request)
    
    expect(formatted.p).toBe('hcs-10')
    expect(formatted.op).toBe(7)
    expect(formatted.data.service).toBe('matchmaking')
  })

  it('generates correct transaction memo', () => {
    const memo = generateMemo(7, 4) // oracle_request on oracle_service
    expect(memo).toBe('hcs-10:op:7:4')
  })
})
```

---

### Milestone 2: Token-Gating Logic

**Deliverable**: Token gate middleware for oracle access

#### Tasks:

**2.4. Create Token Gate Service**

```typescript
// lib/oracles/tokenGate.ts

import { AccountBalanceQuery, AccountId } from '@hashgraph/sdk'
import type { Client } from '@hashgraph/sdk'

export interface OracleServiceRequirements {
  service: string
  minTrstBalance: number
  minRecognitions?: number
  requiredTags?: string[]
}

export const ORACLE_REQUIREMENTS: Record<string, OracleServiceRequirements> = {
  matchmaking: {
    service: 'matchmaking',
    minTrstBalance: 1.0,
    minRecognitions: 0
  },
  reputation: {
    service: 'reputation',
    minTrstBalance: 0.5
  },
  analytics: {
    service: 'analytics',
    minTrstBalance: 5.0,
    requiredTags: ['verified']
  }
}

export class TokenGateService {
  constructor(
    private hederaClient: Client,
    private trstTokenId: string
  ) {}

  /**
   * Check if user meets token requirements for oracle service
   */
  async checkAccess(
    accountId: string,
    service: string
  ): Promise<{ hasAccess: boolean; reason?: string }> {
    const requirements = ORACLE_REQUIREMENTS[service]
    
    if (!requirements) {
      return { hasAccess: false, reason: 'Unknown service' }
    }

    // Check TRST balance
    const balance = await this.getTrstBalance(accountId)
    
    if (balance < requirements.minTrstBalance) {
      return {
        hasAccess: false,
        reason: `Insufficient TRST balance. Required: ${requirements.minTrstBalance}, Has: ${balance}`
      }
    }

    // Check recognitions if required
    if (requirements.minRecognitions) {
      const recognitions = await this.getRecognitionCount(accountId)
      if (recognitions < requirements.minRecognitions) {
        return {
          hasAccess: false,
          reason: `Insufficient recognitions. Required: ${requirements.minRecognitions}, Has: ${recognitions}`
        }
      }
    }

    return { hasAccess: true }
  }

  /**
   * Get user's TRST token balance
   */
  private async getTrstBalance(accountId: string): Promise<number> {
    const query = new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId))

    const balance = await query.execute(this.hederaClient)
    const trstBalance = balance.tokens?.get(this.trstTokenId)
    
    return trstBalance ? parseFloat(trstBalance.toString()) : 0
  }

  /**
   * Get user's recognition token count
   */
  private async getRecognitionCount(accountId: string): Promise<number> {
    // Query HCS for RECOGNITION_MINT events for this user
    // Implementation depends on your HCS event structure
    return 0 // Placeholder
  }

  /**
   * Generate token proof for oracle request
   */
  async generateTokenProof(
    accountId: string,
    service: string
  ): Promise<string> {
    const balance = await this.getTrstBalance(accountId)
    const timestamp = Date.now()
    
    // Create verifiable proof (simplified - in production use proper ZK proofs)
    return JSON.stringify({
      accountId,
      service,
      balance,
      timestamp,
      // In production: Add cryptographic signature
    })
  }
}
```

**2.5. Tests for Token Gate**

```typescript
// __tests__/token-gate.test.ts

describe('TokenGateService', () => {
  it('allows access with sufficient TRST', async () => {
    const result = await tokenGate.checkAccess('0.0.12345', 'matchmaking')
    expect(result.hasAccess).toBe(true)
  })

  it('denies access with insufficient TRST', async () => {
    const result = await tokenGate.checkAccess('0.0.99999', 'matchmaking')
    expect(result.hasAccess).toBe(false)
    expect(result.reason).toContain('Insufficient TRST')
  })

  it('generates valid token proof', async () => {
    const proof = await tokenGate.generateTokenProof('0.0.12345', 'matchmaking')
    const parsed = JSON.parse(proof)
    
    expect(parsed.accountId).toBe('0.0.12345')
    expect(parsed.balance).toBeGreaterThanOrEqual(1.0)
  })
})
```

---

### Milestone 3: Opt-In Management

**Deliverable**: UI for oracle service opt-ins + localStorage management

#### Tasks:

**2.6. Create Opt-In Service**

```typescript
// lib/oracles/optIn.ts

const OPT_IN_STORAGE_KEY = 'trustmesh_oracle_opt_ins_v1'

export interface OracleOptIn {
  service: string
  enabled: boolean
  privacyLevel: 'minimal' | 'aggregate' | 'full'
  dataShared: string[]
  timestamp: number
  version: number
}

export interface OptInPreferences {
  [service: string]: OracleOptIn
}

export class OptInService {
  /**
   * Opt-in to oracle service
   */
  optIn(
    service: string,
    privacyLevel: 'minimal' | 'aggregate' | 'full',
    dataShared: string[]
  ): void {
    const optIns = this.loadOptIns()
    
    optIns[service] = {
      service,
      enabled: true,
      privacyLevel,
      dataShared,
      timestamp: Date.now(),
      version: 1
    }
    
    this.saveOptIns(optIns)
    
    console.log(`[OptIn] User opted-in to ${service} with ${privacyLevel} privacy level`)
  }

  /**
   * Opt-out of oracle service
   */
  optOut(service: string): void {
    const optIns = this.loadOptIns()
    
    if (optIns[service]) {
      optIns[service].enabled = false
      this.saveOptIns(optIns)
      console.log(`[OptIn] User opted-out of ${service}`)
    }
  }

  /**
   * Check if user has opted-in to service
   */
  isOptedIn(service: string): boolean {
    const optIns = this.loadOptIns()
    return optIns[service]?.enabled ?? false
  }

  /**
   * Get opt-in details for service
   */
  getOptIn(service: string): OracleOptIn | null {
    const optIns = this.loadOptIns()
    return optIns[service] ?? null
  }

  /**
   * Get all opt-ins
   */
  getAllOptIns(): OptInPreferences {
    return this.loadOptIns()
  }

  /**
   * Load opt-ins from localStorage
   */
  private loadOptIns(): OptInPreferences {
    if (typeof window === 'undefined') return {}
    
    try {
      const raw = window.localStorage.getItem(OPT_IN_STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  /**
   * Save opt-ins to localStorage
   */
  private saveOptIns(optIns: OptInPreferences): void {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.setItem(OPT_IN_STORAGE_KEY, JSON.stringify(optIns))
    } catch (err) {
      console.error('[OptIn] Failed to save opt-ins:', err)
    }
  }
}

export const optInService = new OptInService()
```

**2.7. Create Opt-In UI Component**

```typescript
// components/oracles/OracleOptInModal.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { optInService } from '@/lib/oracles/optIn'

interface OracleOptInModalProps {
  service: string
  onClose: () => void
}

export function OracleOptInModal({ service, onClose }: OracleOptInModalProps) {
  const [privacyLevel, setPrivacyLevel] = useState<'minimal' | 'aggregate' | 'full'>('aggregate')
  const [dataShared, setDataShared] = useState<string[]>(['interests', 'circleSize'])

  const serviceInfo = {
    matchmaking: {
      title: 'Privacy-Preserving Matchmaking',
      description: 'Find compatible contacts based on shared interests and trust patterns',
      requiredTrst: 1.0,
      dataOptions: [
        { key: 'interests', label: 'Interests & Tags', description: 'Your specified interests' },
        { key: 'circleSize', label: 'Circle Size', description: 'Number of contacts (aggregate only)' },
        { key: 'location', label: 'Location', description: 'City/region for local matches' },
        { key: 'trustPatterns', label: 'Trust Patterns', description: 'How you allocate trust (aggregate)' }
      ]
    }
  }

  const info = serviceInfo[service as keyof typeof serviceInfo]

  const handleOptIn = () => {
    optInService.optIn(service, privacyLevel, dataShared)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-panel border-2 border-[#FF6B35]/20 rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-2">{info.title}</h2>
        <p className="text-white/70 mb-4">{info.description}</p>

        {/* Requirements */}
        <div className="mb-6 p-4 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded">
          <p className="text-sm text-white/80">
            <strong>Requires:</strong> {info.requiredTrst} TRST minimum
          </p>
        </div>

        {/* Privacy Level */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Privacy Level</h3>
          
          <div className="space-y-2">
            {(['minimal', 'aggregate', 'full'] as const).map(level => (
              <label
                key={level}
                className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${
                  privacyLevel === level
                    ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <input
                  type="radio"
                  name="privacyLevel"
                  value={level}
                  checked={privacyLevel === level}
                  onChange={() => setPrivacyLevel(level)}
                  className="mr-3"
                />
                <div>
                  <div className="text-white font-medium capitalize">{level}</div>
                  <div className="text-xs text-white/60">
                    {level === 'minimal' && 'Only interests, no circle data'}
                    {level === 'aggregate' && 'Interests + aggregate circle stats (recommended)'}
                    {level === 'full' && 'All available data for best matches'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Data Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Data Shared</h3>
          
          <div className="space-y-2">
            {info.dataOptions.map(option => (
              <label
                key={option.key}
                className="flex items-start p-3 border border-white/20 rounded hover:border-white/40 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={dataShared.includes(option.key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDataShared([...dataShared, option.key])
                    } else {
                      setDataShared(dataShared.filter(k => k !== option.key))
                    }
                  }}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="text-white font-medium">{option.label}</div>
                  <div className="text-xs text-white/60">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Privacy Guarantee */}
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded">
          <p className="text-sm text-white/90">
            🔒 <strong>Privacy Guarantee:</strong> All data is encrypted before leaving your device
            and processed in a hardware-protected TEE. Your raw circle data never leaves your browser.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleOptIn}
            className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
          >
            Opt-In to {service}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 3: Matchmaking Service

### Milestone 4: TEE Encryption/Decryption

**Deliverable**: Client-side encryption for TEE communication

#### Tasks:

**3.1. Create TEE Crypto Service**

```typescript
// lib/oracles/teeCrypto.ts

/**
 * Encrypt data for TEE using public key
 * Uses Web Crypto API for client-side encryption
 */
export async function encryptForTEE(
  data: object,
  teePublicKey: string
): Promise<string> {
  // Convert data to JSON
  const jsonData = JSON.stringify(data)
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(jsonData)

  // Import TEE public key
  const publicKey = await importPublicKey(teePublicKey)

  // Encrypt using RSA-OAEP
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    publicKey,
    dataBuffer
  )

  // Return base64-encoded ciphertext
  return arrayBufferToBase64(encrypted)
}

/**
 * Decrypt TEE response using user's private key
 */
export async function decryptFromTEE(
  encryptedData: string,
  userPrivateKey: CryptoKey
): Promise<object> {
  const dataBuffer = base64ToArrayBuffer(encryptedData)

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP'
    },
    userPrivateKey,
    dataBuffer
  )

  const decoder = new TextDecoder()
  const jsonData = decoder.decode(decrypted)
  
  return JSON.parse(jsonData)
}

/**
 * Generate user keypair for TEE communication
 */
export async function generateUserKeypair(): Promise<{
  publicKey: CryptoKey
  privateKey: CryptoKey
  publicKeyPem: string
}> {
  const keypair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  )

  const publicKeyPem = await exportPublicKey(keypair.publicKey)

  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey,
    publicKeyPem
  }
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  // Remove PEM header/footer and decode base64
  const pemContents = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '')
  
  const binaryDer = base64ToArrayBuffer(pemContents)

  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  )
}

async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('spki', key)
  const exportedAsBase64 = arrayBufferToBase64(exported)
  
  return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`
}
```

---

### Milestone 5: Matchmaking Client

**Deliverable**: Complete matchmaking service client

#### Tasks:

**3.2. Create Matchmaking Service**

```typescript
// lib/oracles/matchmaking.ts

import { HCS10Client } from '@/lib/hcs/hcs10/client'
import { TokenGateService } from '@/lib/oracles/tokenGate'
import { OptInService } from '@/lib/oracles/optIn'
import { encryptForTEE, generateUserKeypair, decryptFromTEE } from '@/lib/oracles/teeCrypto'
import { verifyAttestation } from '@/lib/oracles/attestation'

export interface MatchPreferences {
  interests: string[]
  location?: string
  ageRange?: { min: number; max: number }
  maxDistance?: number  // km
}

export interface MatchResult {
  accountId: string
  handle?: string
  compatibility: number  // 0-1 score
  sharedInterests: string[]
  distance?: number
  reason: string
}

export interface MatchResponse {
  matches: MatchResult[]
  attestation: Attestation
  timestamp: number
}

export class MatchmakingService {
  private readonly TEE_PUBLIC_KEY = process.env.NEXT_PUBLIC_MATCHMAKING_TEE_PUBLIC_KEY!
  private readonly ORACLE_TOPIC_ID = process.env.NEXT_PUBLIC_MATCHMAKING_ORACLE_TOPIC!

  constructor(
    private hcs10Client: HCS10Client,
    private tokenGate: TokenGateService,
    private optIn: OptInService
  ) {}

  /**
   * Request matches from oracle
   */
  async requestMatches(
    accountId: string,
    preferences: MatchPreferences
  ): Promise<MatchResponse> {
    // 1. Check token gate
    const accessCheck = await this.tokenGate.checkAccess(accountId, 'matchmaking')
    if (!accessCheck.hasAccess) {
      throw new Error(`Access denied: ${accessCheck.reason}`)
    }

    // 2. Check opt-in
    const optIn = this.optIn.getOptIn('matchmaking')
    if (!optIn?.enabled) {
      throw new Error('User has not opted-in to matchmaking service')
    }

    // 3. Generate user keypair for response encryption
    const keypair = await generateUserKeypair()

    // 4. Prepare request data based on opt-in preferences
    const requestData = this.prepareRequestData(accountId, preferences, optIn)

    // 5. Encrypt for TEE
    const encryptedPayload = await encryptForTEE(requestData, this.TEE_PUBLIC_KEY)

    // 6. Generate token proof
    const tokenProof = await this.tokenGate.generateTokenProof(accountId, 'matchmaking')

    // 7. Submit HCS-10 oracle request
    const requestId = await this.hcs10Client.submitOracleRequest({
      p: 'hcs-10',
      op: 7,
      operator_id: accountId,
      service: 'matchmaking',
      encrypted_payload: encryptedPayload,
      user_public_key: keypair.publicKeyPem,
      token_proof: tokenProof
    })

    console.log(`[Matchmaking] Request submitted: ${requestId}`)

    // 8. Wait for oracle response
    const response = await this.waitForResponse(requestId, keypair.privateKey)

    // 9. Verify attestation
    const verified = await verifyAttestation(response.attestation)
    if (!verified) {
      throw new Error('Attestation verification failed')
    }

    return response
  }

  /**
   * Prepare request data based on opt-in preferences
   */
  private prepareRequestData(
    accountId: string,
    preferences: MatchPreferences,
    optIn: OracleOptIn
  ): object {
    const data: any = {
      accountId,
      timestamp: Date.now()
    }

    // Add data based on what user opted-in to share
    if (optIn.dataShared.includes('interests')) {
      data.interests = preferences.interests
    }

    if (optIn.dataShared.includes('location') && preferences.location) {
      data.location = preferences.location
    }

    if (optIn.dataShared.includes('circleSize')) {
      // Fetch from existing Circle API (aggregate only)
      // data.circleSize = ...
    }

    if (optIn.dataShared.includes('trustPatterns')) {
      // Aggregate trust allocation stats
      // data.trustPatterns = { avgAllocation: ..., variance: ... }
    }

    return data
  }

  /**
   * Wait for oracle response
   */
  private async waitForResponse(
    requestId: string,
    privateKey: CryptoKey,
    timeout: number = 30000
  ): Promise<MatchResponse> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe()
        reject(new Error('Oracle response timeout'))
      }, timeout)

      const unsubscribe = this.hcs10Client.subscribeToResponses(
        requestId,
        async (response) => {
          clearTimeout(timeoutId)
          unsubscribe()

          try {
            // Decrypt response
            const decrypted = await decryptFromTEE(
              response.encrypted_result,
              privateKey
            )

            resolve(decrypted as MatchResponse)
          } catch (err) {
            reject(err)
          }
        }
      )
    })
  }
}
```

---

### Milestone 6: Attestation Verification

**Deliverable**: Verify TEE attestations on HCS

#### Tasks:

**3.3. Create Attestation Verifier**

```typescript
// lib/oracles/attestation.ts

import { TopicId, TopicMessageQuery } from '@hashgraph/sdk'
import type { Client } from '@hashgraph/sdk'
import type { Attestation } from '@/lib/hcs/hcs10/types'

export class AttestationVerifier {
  private readonly ATTESTATION_TOPIC_ID = process.env.NEXT_PUBLIC_ATTESTATION_TOPIC!

  constructor(private hederaClient: Client) {}

  /**
   * Verify attestation by checking HCS anchor
   */
  async verifyAttestation(attestation: Attestation): Promise<boolean> {
    try {
      // 1. Verify TEE signature
      const signatureValid = await this.verifyTeeSignature(attestation)
      if (!signatureValid) {
        console.error('[Attestation] TEE signature invalid')
        return false
      }

      // 2. Verify HCS anchor exists
      const hcsValid = await this.verifyHcsAnchor(attestation)
      if (!hcsValid) {
        console.error('[Attestation] HCS anchor not found or invalid')
        return false
      }

      // 3. Verify timestamp freshness (within 1 hour)
      const now = Date.now()
      const age = now - attestation.timestamp
      if (age > 3600000) {
        console.error('[Attestation] Attestation too old')
        return false
      }

      return true
    } catch (err) {
      console.error('[Attestation] Verification error:', err)
      return false
    }
  }

  /**
   * Verify TEE signature using public key
   */
  private async verifyTeeSignature(attestation: Attestation): Promise<boolean> {
    // Import TEE public key
    const publicKey = await this.importTeePublicKey(attestation.tee_public_key)

    // Reconstruct signed data
    const signedData = JSON.stringify({
      computation: attestation.computation,
      version: attestation.version,
      input_hash: attestation.input_hash,
      output_hash: attestation.output_hash,
      timestamp: attestation.timestamp
    })

    // Verify signature
    const encoder = new TextEncoder()
    const data = encoder.encode(signedData)
    const signature = this.base64ToArrayBuffer(attestation.tee_signature)

    return await window.crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signature,
      data
    )
  }

  /**
   * Verify attestation was anchored on HCS
   */
  private async verifyHcsAnchor(attestation: Attestation): Promise<boolean> {
    if (!attestation.hedera_timestamp) {
      return false
    }

    // Query HCS topic for attestation record
    return new Promise((resolve) => {
      let found = false

      new TopicMessageQuery()
        .setTopicId(TopicId.fromString(this.ATTESTATION_TOPIC_ID))
        .setStartTime(0)
        .subscribe(this.hederaClient, (message) => {
          try {
            const content = JSON.parse(message.contents.toString())
            
            // Check if this is our attestation
            if (
              content.input_hash === attestation.input_hash &&
              content.output_hash === attestation.output_hash &&
              content.timestamp === attestation.timestamp
            ) {
              found = true
              resolve(true)
            }
          } catch {
            // Ignore parse errors
          }
        })

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!found) {
          resolve(false)
        }
      }, 5000)
    })
  }

  private async importTeePublicKey(pem: string): Promise<CryptoKey> {
    // Similar to importPublicKey from teeCrypto.ts
    // ...
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    // Similar to base64ToArrayBuffer from teeCrypto.ts
    // ...
  }
}

export async function verifyAttestation(attestation: Attestation): Promise<boolean> {
  // Singleton verifier
  const verifier = new AttestationVerifier(hederaClient)
  return await verifier.verifyAttestation(attestation)
}
```

---

## Phase 4: Testing & Deployment

### Milestone 7: Testing

**Deliverable**: Comprehensive test suite for oracle infrastructure

#### Test Coverage:

**4.1. Unit Tests**
- ✅ HCS-10 message formatting
- ✅ Token gate logic
- ✅ Opt-in service (localStorage)
- ✅ TEE encryption/decryption
- ✅ Attestation verification

**4.2. Integration Tests**
- ✅ End-to-end matchmaking request flow
- ✅ Oracle response handling
- ✅ Error scenarios (insufficient TRST, no opt-in, timeout)

**4.3. Privacy Tests**
- ✅ Verify raw circle data never exposed
- ✅ Verify encryption before HCS submission
- ✅ Verify attestations are publicly verifiable

**4.4. Performance Tests**
- ✅ Response time under load
- ✅ TEE throughput
- ✅ HCS query performance

---

### Milestone 8: Deployment

**Deliverable**: Production-ready oracle service

#### Deployment Steps:

**8.1. Infrastructure Setup**
1. Deploy TEE environment (EQTY Lab + Intel/NVIDIA)
2. Configure HCS topics (oracle service + attestation)
3. Set up monitoring + alerting
4. Configure rate limiting

**8.2. Client Deployment**
1. Add environment variables:
   ```env
   NEXT_PUBLIC_MATCHMAKING_TEE_PUBLIC_KEY=...
   NEXT_PUBLIC_MATCHMAKING_ORACLE_TOPIC=0.0.XXXXXX
   NEXT_PUBLIC_ATTESTATION_TOPIC=0.0.YYYYYY
   ```

2. Deploy new components:
   - HCS-10 client
   - Token gate service
   - Opt-in UI
   - Matchmaking service

**8.3. Monitoring**
- Oracle request/response metrics
- Attestation verification success rate
- TEE health checks
- Token gate deny reasons

---

## Privacy Guarantees

### What Oracle Sees (Inside TEE Only)

```typescript
// Decrypted inside TEE enclave
{
  accountId: "0.0.12345",
  interests: ["cannabis", "treasury"],
  circleSize: 15,
  location: "Eugene, OR",
  timestamp: 1705334567890
}
```

### What Oracle NEVER Sees (Outside TEE)

- ❌ Raw circle graph (contacts, relationships)
- ❌ Message content
- ❌ Read receipts
- ❌ Full trust allocation details
- ❌ Unencrypted user data

### What's Publicly Verifiable

```typescript
// HCS attestation record (public)
{
  computation: "matchmaking-v1",
  input_hash: "sha256...",
  output_hash: "sha256...",
  tee_signature: "RSA...",
  timestamp: 1705334567890,
  hcs_timestamp: "0.0.123456@1705334567.890"
}
```

### Privacy Levels Explained

**Minimal**: Interests only, no circle data
- Shared: `interests`
- Not shared: `circleSize`, `location`, `trustPatterns`
- Use case: Maximum privacy, basic matching

**Aggregate** (Recommended): Interests + aggregate stats
- Shared: `interests`, `circleSize` (number only), `location` (city/region)
- Not shared: Individual contacts, trust relationships
- Use case: Balance privacy + match quality

**Full**: All available data
- Shared: `interests`, `circleSize`, `location`, `trustPatterns` (aggregated)
- Not shared: Raw circle graph, messages
- Use case: Best match quality, still privacy-preserving

---

## Future Enhancements

### Additional Oracle Services

**1. Reputation Oracle**
```typescript
// Aggregate reputation score from trust + recognitions
{
  score: 87.5,
  based_on: {
    trustReceived: 125,
    recognitionsReceived: 42,
    circleSize: 15
  },
  attestation: {...}
}
```

**2. Analytics Oracle**
```typescript
// Cohort-level analytics
{
  cohort: "University of Oregon",
  stats: {
    avgCircleSize: 7.2,
    avgTrustAllocated: 112.5,
    mostCommonInterests: ["cannabis", "sustainability"]
  },
  minCohortSize: 10,  // Privacy threshold
  attestation: {...}
}
```

**3. Trust Path Oracle**
```typescript
// Find paths between users (privacy-preserving)
{
  reachable: true,
  pathLength: 3,
  confidence: 0.92,
  // Intermediate nodes NOT revealed
  attestation: {...}
}
```

### Enhanced Privacy Features

**1. Zero-Knowledge Proofs**
- Prove user is in cohort without revealing identity
- Prove TRST balance > threshold without revealing exact amount
- Prove compatibility without revealing interests

**2. Differential Privacy**
- Add noise to aggregate statistics
- Prevent individual inference from cohort data

**3. Homomorphic Encryption**
- Compute on encrypted data without decryption
- Even TEE doesn't see raw data

---

## Success Metrics

### Technical Metrics
- ✅ Attestation verification rate: >99%
- ✅ Response time: <5 seconds (p95)
- ✅ Privacy test pass rate: 100%
- ✅ Token gate false positive rate: <0.1%

### User Metrics
- ✅ Opt-in rate: Track user adoption
- ✅ Match satisfaction: Survey feedback
- ✅ TRST utility: Token usage for oracles
- ✅ Privacy confidence: User trust surveys

### Business Metrics
- ✅ Oracle usage growth: Requests per week
- ✅ TRST token demand: Price/liquidity impact
- ✅ Partner integrations: Other oracle services
- ✅ Network effects: User referrals from matches

---

## Conclusion

This implementation plan delivers:

1. **Privacy-First Oracles** - TEE + HCS + token-gating
2. **User Control** - Explicit opt-ins + privacy levels
3. **Verifiable Compute** - Cryptographic attestations
4. **Token Utility** - TRST token-gating for services
5. **Anti-Surveillance** - Maintains all existing privacy guarantees

**Next Steps:**
1. Review and approve implementation plan
2. Set up EQTY Lab partnership for TEE access
3. Begin Phase 2: Oracle Infrastructure (2-3 weeks)
4. Deploy Phase 3: Matchmaking Service (2-3 weeks)
5. Launch beta with select users (1 week)
6. Full production rollout

**This positions TrustMesh as the first privacy-preserving social network with verifiable compute oracles!** 🚀🔒
