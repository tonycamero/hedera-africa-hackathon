# User-Signed Transactions with Operator Gas Subsidy

## Overview

TrustMesh implements a **two-layer transaction model** that gives users cryptographic ownership of their actions while the platform subsidizes Hedera gas fees and charges sustainable TRST token pricing.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (User's Browser)                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. User signs payload with their Hedera private key   │ │
│  │    - Proves authorization                              │ │
│  │    - No HBAR needed                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ POST signed payload
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  API (Server-side)                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 2. Verify user's signature                             │ │
│  │ 3. Check TRST balance via Mirror Node                  │ │
│  │ 4. Operator submits to HCS (pays ~$0.0001 HBAR)       │ │
│  │ 5. Record TRST debit (charge user 10 TRST)            │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ Submit to Hedera
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  HEDERA HCS                                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Message includes:                                       │ │
│  │  - User's signature (proves authorship)                │ │
│  │  - User's public key (for verification)                │ │
│  │  - Action payload (profile, recognition, etc.)         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

### ✅ For Users
- **Cryptographic ownership**: Every action is signed with their key
- **Non-repudiation**: Can't deny taking an action
- **No gas friction**: No HBAR wallet setup required
- **True autonomy**: Platform can't forge actions on their behalf

### ✅ For Platform
- **Sustainable pricing**: Charge 10 TRST even though gas costs ~$0.0001
- **Better UX**: Users don't worry about gas
- **Auditability**: Every action verifiable on-chain
- **Scalability**: Operator manages gas optimization

## Implementation

### 1. TRST Pricing Configuration

```typescript
// lib/config/pricing.ts
export const TRST_PRICING = {
  RECOGNITION_MINT: 10,    // 10 TRST per recognition
  PROFILE_UPDATE: 5,       // 5 TRST per profile update
  TRUST_ALLOCATE: 0,       // Free, but limited by budget
  CONTACT_REQUEST: 1,      // 1 TRST per contact request
  CONTACT_ACCEPT: 0,       // Free to accept
  TOKEN_TRANSFER: 2,       // 2 TRST per transfer
}
```

### 2. Client-Side Signing

#### Profile Updates
```typescript
import { signProfile } from '@/lib/hedera/signProfile'

// User signs profile with their private key
const signedPayload = await signProfile(
  {
    accountId: user.hederaAccountId,
    displayName: "Alice",
    bio: "Web3 builder",
    avatar: "https://..."
  },
  userPrivateKey // From Magic.link or wallet
)

// POST to API with signature
const response = await fetch('/api/hcs/profile', {
  method: 'POST',
  body: JSON.stringify(signedPayload)
})
```

#### Recognition Minting
```typescript
import { signRecognition } from '@/lib/hedera/signRecognition'

// User signs recognition with their private key
const signedPayload = await signRecognition(
  {
    fromAccountId: user.hederaAccountId,
    toAccountId: recipient.hederaAccountId,
    message: "Great work on the project!",
    trustAmount: 5,
    metadata: {
      category: "professional",
      tags: ["collaboration", "quality"]
    }
  },
  userPrivateKey
)

// POST to API with signature
const response = await fetch('/api/hcs/mint-recognition', {
  method: 'POST',
  body: JSON.stringify({
    ...signedPayload,
    tokenId: generateTokenId(),
    name: "Collaboration Star",
    category: "professional",
    subtitle: "Excellent teamwork",
    emoji: "⭐",
    issuerId: user.hederaAccountId,
    recipientId: recipient.hederaAccountId
  })
})
```

### 3. Server-Side Verification & Charging

```typescript
// app/api/hcs/mint-recognition/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json()
  
  // 1. Verify signature
  const isValid = verifyRecognitionSignature(body)
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }
  
  // 2. Check TRST balance
  const trstCost = getTRSTCost("RECOGNITION_MINT") // 10 TRST
  const balanceCheck = await hasSufficientTRST(body.fromAccountId, trstCost)
  
  if (!balanceCheck.sufficient) {
    return NextResponse.json({ 
      error: `Insufficient TRST. Need ${trstCost}, have ${balanceCheck.current}` 
    }, { status: 402 })
  }
  
  // 3. Operator submits to HCS (pays gas)
  const result = await submitToTopic(SIGNAL_TOPIC, JSON.stringify({
    ...body,
    signature: body.signature, // Include for verification
    publicKey: body.publicKey
  }))
  
  // 4. Record TRST debit
  recordTRSTDebit(
    body.fromAccountId,
    trstCost,
    `RECOGNITION_MINT:${body.tokenId}`,
    result.transactionId
  )
  
  return NextResponse.json({
    ok: true,
    trstCharged: trstCost,
    trstBalance: balanceCheck.current - trstCost
  })
}
```

### 4. TRST Balance Service

```typescript
// lib/services/trstBalanceService.ts

// Check balance via Mirror Node
export async function getTRSTBalance(accountId: string): Promise<TRSTBalance> {
  const url = `${MIRROR_BASE}/api/v1/accounts/${accountId}/tokens?token.id=${TRST_TOKEN_ID}`
  const response = await fetch(url)
  const data = await response.json()
  
  return {
    accountId,
    balance: parseInt(data.tokens[0].balance) / Math.pow(10, data.tokens[0].decimals),
    decimals: data.tokens[0].decimals,
    tokenId: TRST_TOKEN_ID,
    lastUpdated: new Date().toISOString()
  }
}

// Record debit (in-memory ledger, use DB in production)
export function recordTRSTDebit(
  accountId: string,
  amount: number,
  action: string,
  transactionId?: string
): TRSTDebitRecord {
  const record = {
    accountId,
    amount,
    action,
    timestamp: new Date().toISOString(),
    transactionId
  }
  debitLedger.push(record)
  return record
}
```

## Message Format

### Profile Update Message
```json
{
  "type": "PROFILE_UPDATE",
  "accountId": "0.0.123456",
  "displayName": "Alice",
  "bio": "Web3 builder",
  "avatar": "https://...",
  "timestamp": "2025-01-27T02:30:00.000Z",
  "signature": "a1b2c3d4e5f6...",
  "publicKey": "302a300506032b6570032100..."
}
```

### Recognition Mint Message
```json
{
  "type": "SIGNAL_MINT",
  "from": "0.0.123456",
  "payload": {
    "tokenId": "rec_abc123",
    "name": "Collaboration Star",
    "kind": "professional",
    "to": "0.0.789012",
    "message": "Great work!",
    "trustAmount": 5,
    "metadata": {
      "category": "professional",
      "minted_at": "2025-01-27T02:30:00.000Z",
      "issuer": "0.0.123456",
      "trstCost": 10
    }
  },
  "signature": "a1b2c3d4e5f6...",
  "publicKey": "302a300506032b6570032100...",
  "nonce": 1706324400000,
  "ts": 1706324400
}
```

## Security

### Signature Verification
- Uses Hedera SDK's `PrivateKey.sign()` and canonical JSON
- Supports both ED25519 and ECDSA keys
- Deterministic message ordering prevents signature malleability

### Balance Checks
- Fetches real-time balance from Hedera Mirror Node
- Validates before submitting to prevent wasted gas
- Records debits for audit trail

### Key Management
- User's private key never leaves client
- Keys stored in Magic.link secure enclave
- Operator key only used for gas payment, not content signing

## Production Considerations

### Database for Debit Ledger
Replace in-memory `debitLedger` array with persistent database:
```typescript
// Use PostgreSQL, MongoDB, etc.
await db.trstDebits.insert({
  accountId,
  amount,
  action,
  timestamp,
  transactionId
})
```

### Actual Token Transfers
Currently only records debits. In production, execute actual TRST token transfers:
```typescript
import { TransferTransaction } from '@hashgraph/sdk'

// Transfer TRST from user to treasury
const transferTx = new TransferTransaction()
  .addTokenTransfer(TRST_TOKEN_ID, userAccountId, -trstCost)
  .addTokenTransfer(TRST_TOKEN_ID, TREASURY_ACCOUNT, trstCost)

await transferTx.execute(client)
```

### Rate Limiting
Add rate limits to prevent spam:
```typescript
// Max 10 recognitions per hour per user
const recentActions = await getRateLimitCount(accountId, 'RECOGNITION_MINT', 3600)
if (recentActions >= 10) {
  return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
}
```

## Files Created

- `lib/config/pricing.ts` - TRST pricing configuration
- `lib/services/trstBalanceService.ts` - Balance checking and debit recording
- `lib/hedera/signProfile.ts` - Client-side profile signing
- `lib/hedera/signRecognition.ts` - Client-side recognition signing
- `app/api/hcs/profile/route.ts` - Updated with signature verification
- `app/api/hcs/mint-recognition/route.ts` - Updated with TRST charging

## Testing

1. **Check user TRST balance**: Verify Mirror Node API returns correct balance
2. **Sign action client-side**: Test signing with ED25519 and ECDSA keys
3. **Submit signed payload**: POST to API endpoints
4. **Verify signature**: Ensure server rejects invalid signatures
5. **Check TRST debit**: Confirm balance decreases after action
6. **Verify on-chain**: Inspect HCS messages include signature and public key

## Next Steps

1. Update onboarding flow to sign profiles before creation
2. Update recognition UI to sign before minting
3. Add user-facing TRST balance display
4. Implement actual token transfers (not just recording)
5. Add database for debit ledger
6. Add rate limiting per action type
