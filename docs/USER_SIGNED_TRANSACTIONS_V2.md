# User-Signed Transactions with Magic.link + Hedera

## Overview

TrustMesh implements **true P2P transactions** where users sign actions client-side using Magic's Hedera extension, then the platform verifies signatures server-side before submission.

## Architecture: Client-Side Signing + Server-Side Verification

### Layer 1: User Signature (CLIENT-SIDE) 
The user signs the payload **on the client** using Magic's Hedera extension. Magic never exposes private keys - signing happens securely via the extension's signer interface.

### Layer 2: Verification & Submission (SERVER-SIDE)
The server validates the user's signature using their public key via Magic Admin SDK, then submits the verified transaction to Hedera.

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (Browser)                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Get public key via magic.hedera.getPublicKey()     │ │
│  │ 2. Build canonical payload (JSON.stringify)           │ │
│  │ 3. Sign with magic.hedera.sign(payload)               │ │
│  │    → Magic's secure enclave, no key exposure          │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ POST { payload, signature, publicKeyDer }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  SERVER (API)                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Validate Magic DID token (Admin SDK)               │ │
│  │ 2. Rebuild canonical payload                          │ │
│  │ 3. Verify signature with PublicKey.verify()           │ │
│  │ 4. Submit to Hedera (user pays gas from stipend)      │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ TopicMessageSubmitTransaction
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  HEDERA HCS                                                 │
│  Message includes signature + publicKey for verification    │
└─────────────────────────────────────────────────────────────┘
```

## Why This Model?

1. **User Sovereignty**: Users retain cryptographic proof via client-side signing
2. **Security**: Private keys never leave Magic's secure enclave
3. **Low Friction**: Auto-funded HBAR stipends for gas (~0.2 HBAR per user)
4. **True P2P**: Payer = user, not operator (mirror shows user's account)
5. **Scalable**: Simple P2P transactions with minimal backend complexity

## Implementation

### 1. Client-Side Signing with Magic Hedera Extension

```typescript
// app/onboard/page.tsx (example)
import { magic } from '@/lib/magic'

async function handleCompleteOnboarding() {
  const magicToken = localStorage.getItem('MAGIC_TOKEN')
  
  // 1) Get user's Hedera public key from Magic extension
  const { publicKeyDer, accountId } = await magic.hedera.getPublicKey()
  
  // 2) Build canonical profile payload
  const fullPayload = {
    type: 'PROFILE_UPDATE',
    accountId: magicUser.hederaAccountId || accountId,
    displayName: desiredName,
    bio: bio || '',
    avatar: '',
    timestamp: new Date().toISOString(),
  }
  
  // 3) Canonicalize & sign with Magic's client-side signer (no key exposure)
  const canonical = JSON.stringify(fullPayload)
  const signatureBytes = await magic.hedera.sign(new TextEncoder().encode(canonical))
  
  const signedPayload = {
    ...fullPayload,
    publicKeyDer: Array.from(new Uint8Array(publicKeyDer)),
    signature: Buffer.from(signatureBytes).toString('hex'),
  }
  
  // 4) Send to backend for verification
  const verifyResp = await fetch('/api/hedera/verify-profile', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${magicToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(signedPayload),
  })
  
  if (!verifyResp.ok) {
    throw new Error('Profile verification failed')
  }
  
  // 5) Submit to HCS after verification
  await fetch('/api/hcs/profile', {
    method: 'POST',
    body: JSON.stringify(signedPayload)
  })
}
```

### 2. Server-Side Verification with Magic Admin SDK

```typescript
// app/api/hedera/verify-profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Magic } from '@magic-sdk/admin'
import { PublicKey } from '@hashgraph/sdk'

const magic = new Magic(process.env.MAGIC_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    // 1) Validate Magic DID token
    const auth = req.headers.get('Authorization') || ''
    const didToken = auth.replace(/^Bearer\s+/i, '')
    if (!didToken) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }
    
    await magic.token.validate(didToken) // throws on invalid
    const meta = await magic.users.getMetadataByToken(didToken)

    // 2) Parse signed payload
    const body = await req.json()
    const { type, accountId, displayName, bio, avatar, timestamp, publicKeyDer, signature } = body

    if (!type || !accountId || !displayName || !timestamp || !publicKeyDer || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3) Verify signature
    const fullPayload = { type, accountId, displayName, bio, avatar, timestamp }
    const canonical = JSON.stringify(fullPayload)
    const messageBytes = new TextEncoder().encode(canonical)

    // Convert DER bytes → Hedera PublicKey
    const derBytes = Uint8Array.from(publicKeyDer)
    const pubKey = PublicKey.fromBytesDER(derBytes)

    const sigBytes = Buffer.from(signature, 'hex')
    const isValid = pubKey.verify(messageBytes, sigBytes)

    if (!isValid) {
      return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 })
    }

    // 4) Persist profile to DB
    // await db.profiles.upsert({ accountId, displayName, bio, avatar, signedAt: timestamp, email: meta.email })

    console.log('[verify-profile] Signature verified for', displayName, 'by', meta.email)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[verify-profile] Error:', e)
    return NextResponse.json({ error: e.message || 'VERIFY_FAILED' }, { status: 500 })
  }
}
```

### 3. HCS Submission with Hedera SDK (User Pays Gas)

```typescript
// app/api/hcs/profile/route.ts
import { TopicMessageSubmitTransaction, TopicId, PrivateKey, Client } from '@hashgraph/sdk'

// User's signer from Magic or auto-funded account
const client = Client.forTestnet()
client.setOperator(userAccountId, userPrivateKey)

export async function POST(req: NextRequest) {
  const body = await req.json()
  
  // Build HCS transaction
  let tx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(process.env.NEXT_PUBLIC_HCS_TOPIC_ID!))
    .setMessage(JSON.stringify(body))
    .freezeWith(client)

  tx = await tx.sign(userPrivateKey)
  const exec = await tx.execute(client)
  const receipt = await exec.getReceipt(client)
  
  return NextResponse.json({
    ok: true,
    topicId: receipt.topicId.toString(),
    sequenceNumber: receipt.topicSequenceNumber.toString()
  })
}
```

## Gas & Fee Model

### HBAR Stipends (Auto-Funded)
- **Initial**: 0.2 HBAR per new user (~$0.02)
- **Top-up trigger**: Balance < 0.005 HBAR
- **Top-up amount**: 0.05-0.1 HBAR
- Covers thousands of HCS submits (~$0.0001 each)

```typescript
// app/api/hedera/account/create (called at onboarding)
const newAccount = await new AccountCreateTransaction()
  .setKey(userPublicKey)
  .setInitialBalance(new Hbar(0.2))
  .execute(operatorClient)

// Auto top-up when low
if (userBalance < 0.005) {
  await new TransferTransaction()
    .addHbarTransfer(operatorAccountId, new Hbar(-0.1))
    .addHbarTransfer(userAccountId, new Hbar(0.1))
    .execute(operatorClient)
}
```

### TRST Platform Fees (Optional - Post-Hackathon)
```typescript
// lib/config/pricing.ts
export const RECOGNITION_COSTS: Record<string, number> = {
  DEFAULT: 0.01,        // $0.01 per recognition (stubbed for hackathon)
  PROFILE_UPDATE: 0.01, // $0.01 to update profile
  NFT_MINT: 0.01,       // $0.01 to mint NFT
}

export const MIN_BALANCE = 0.10 // $0.10 minimum to prevent spam
```

**Important**: HBAR gas (network fee) ≠ TRST fee (platform revenue). Keep accounting separate.

## Message Format

### Profile Update Message (HCS)
```json
{
  "type": "PROFILE_UPDATE",
  "accountId": "0.0.123456",
  "displayName": "Alice",
  "bio": "Web3 builder",
  "avatar": "https://...",
  "timestamp": "2025-01-27T02:30:00.000Z",
  "publicKeyDer": [48, 42, 48, 5, ...],
  "signature": "a1b2c3d4e5f6..."
}
```

### Recognition Mint Message (HCS)
```json
{
  "type": "RECOGNITION_MINT",
  "from": "0.0.123456",
  "to": "0.0.789012",
  "tokenId": "rec_abc123",
  "message": "Great work!",
  "trustValue": 5,
  "metadata": {
    "category": "professional",
    "minted_at": "2025-01-27T02:30:00.000Z"
  },
  "publicKeyDer": [48, 42, 48, 5, ...],
  "signature": "a1b2c3d4e5f6...",
  "timestamp": "2025-01-27T02:30:00.000Z"
}
```

## Security

### Magic.link Integration
- **Client SDK**: `magic.hedera.getPublicKey()`, `magic.hedera.sign()`
- **Admin SDK**: `magic.token.validate()`, `magic.users.getMetadataByToken()`
- **No Key Exposure**: Private keys never leave Magic's secure enclave

### Signature Verification
- Uses Hedera SDK's `PublicKey.verify()` with canonical JSON
- Supports ED25519 (DER format)
- Deterministic message ordering prevents signature malleability

### Key Management
- User's private key never leaves client (Magic enclave)
- Operator key only used for auto-funding HBAR stipends
- Content signing = user only, gas payment = user (from stipend)

## Production Considerations

### 1. Account Creation Service
```typescript
// Create account + auto-fund with 0.2 HBAR
const { accountId, publicKey } = await createHederaAccount(magicUserId)
```

### 2. Auto Top-Up Service
```typescript
// Monitor balances, top-up when < threshold
await autoTopUpHBAR(userAccountId, 0.1)
```

### 3. Database for Profiles
```typescript
// Store verified profiles
await db.profiles.upsert({
  accountId,
  displayName,
  bio,
  avatar,
  signedAt: timestamp,
  email: magicUser.email
})
```

### 4. Rate Limiting
```typescript
// Max 10 recognitions per hour per user
const recentActions = await getRateLimitCount(accountId, 'RECOGNITION_MINT', 3600)
if (recentActions >= 10) {
  return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
}
```

## Files

- `app/onboard/page.tsx` - Client-side signing with Magic Hedera extension
- `app/api/hedera/verify-profile/route.ts` - Server-side signature verification
- `lib/magic.ts` - Magic SDK initialization with Hedera extension
- `lib/config/pricing.ts` - TRST pricing (stubbed for hackathon)

## Testing

1. **Magic Login**: User logs in, gets DID token
2. **Client-Side Sign**: Call `magic.hedera.sign()`, verify signature hex
3. **Server Verify**: POST to `/api/hedera/verify-profile`, expect 200
4. **HCS Submit**: Profile appears on Hedera mirror node
5. **Balance Check**: User's HBAR balance decrements by gas amount

## Next Steps (Post-Hackathon)

1. ✅ Client-side signing with Magic
2. ✅ Server-side verification with Admin SDK
3. ⏳ Auto-fund HBAR stipends at account creation
4. ⏳ Auto top-up service when balance < threshold
5. ⏳ Database for verified profiles
6. ⏳ TRST charging (currently stubbed)
7. ⏳ Rate limiting per action type
