# User-Signed TRST Payments

## Overview

Users now sign their own TRST payment transactions when minting recognitions. This ensures:
- ✅ **User autonomy**: Users control their own funds
- ✅ **Real balance updates**: TRST actually transfers on-chain
- ✅ **User pays HBAR fees**: Network fees deducted from user's HBAR balance
- ✅ **Transparent**: User sees exactly what they're signing

## Flow

### 1. Client initiates payment

```typescript
import { payWithTrst } from '@/lib/hedera/signTrstTransfer'

const result = await payWithTrst({
  accountId: '0.0.123456',
  amount: 0.01, // 0.01 TRST
  purpose: 'RECOGNITION_MINT',
  metadata: { tokenId: 'rec_abc123' }
})

if (result.success) {
  console.log('Payment successful:', result.transactionId)
  console.log('New balance:', result.newBalance)
} else {
  console.error('Payment failed:', result.error)
}
```

### 2. Three-step process

#### Step 1: Prepare unsigned transaction (server)
**POST /api/trst/prepare-payment**

Server:
- Authenticates user via Magic token
- Verifies sufficient TRST balance
- Builds unsigned `TransferTransaction`
- Returns transaction bytes

#### Step 2: Sign transaction (client)
Client:
- Receives unsigned transaction bytes
- Calls `magic.hedera.signTransaction()`
- User sees Magic popup to approve
- Returns signed transaction bytes

#### Step 3: Submit signed transaction (server)
**POST /api/trst/submit-payment**

Server:
- Receives user-signed transaction
- Executes on Hedera network
- Returns transaction ID and new balance

## Integration with Recognition Mints

**POST-PAID FLOW**: User pays TRST AFTER mint succeeds (better UX)

```typescript
// 1. Mint recognition (sign recognition data + pay HBAR fee)
const recognition = await signRecognition({
  fromAccountId: userAccount,
  toAccountId: '0.0.789',
  message: 'Great work!',
  // ... other fields
})

// 2. Submit to HCS (user pays HBAR network fee)
const mintResult = await fetch('/api/hcs/mint-recognition', {
  method: 'POST',
  body: JSON.stringify(recognition)
})

const mintData = await mintResult.json()

if (!mintData.ok) {
  toast.error('Mint failed: ' + mintData.error)
  return
}

// 3. SUCCESS! Now pay TRST fee (post-paid)
if (mintData.paymentRequired) {
  toast.info('Mint successful! Completing TRST payment...')
  
  const payment = await payWithTrst({
    accountId: userAccount,
    amount: mintData.trstCost, // e.g., 0.01 TRST
    purpose: 'RECOGNITION_MINT',
    metadata: { 
      mintTxId: mintData.mintTransactionId,
      tokenId: mintData.tokenId 
    }
  })

  if (!payment.success) {
    // Mint succeeded but payment failed - notify user
    toast.error('Payment failed: ' + payment.error)
    toast.warning('Recognition was minted but payment incomplete. Please pay manually.')
    return
  }
  
  toast.success('Recognition minted and paid!')
}
```

## Balance Updates

**Step 1: Mint recognition**
- **User's HBAR balance**: Decreases by HCS submit fee (~0.001 HBAR)
- **Recognition**: Minted to HCS topic

**Step 2: Pay TRST (post-paid)**
- **User's TRST balance**: Decreases by 0.01 TRST
- **User's HBAR balance**: Decreases by another ~0.001 HBAR (transfer fee)
- **Treasury TRST balance**: Increases by 0.01 TRST

**Total cost per recognition**:
- ~0.002 HBAR (two transactions)
- 0.01 TRST (paid to treasury)

Balances are read directly from Hedera mirror node, reflecting real on-chain state.

## Security

- ✅ **User must authenticate** with Magic token
- ✅ **Account ID verified** against authenticated identity (HCS-22)
- ✅ **Balance checked** before preparing transaction
- ✅ **User signs** with their private key (Magic enclave)
- ✅ **Server validates** signed transaction before execution

## Cost Structure

For a recognition mint:
- **TRST cost**: 0.01 TRST (configurable in pricing.ts)
- **HBAR fee**: ~0.001 HBAR for TransferTransaction
- **Total cost**: User pays both from their account

## Migration from In-Memory Debits

**Old flow** (DEMO MODE):
```typescript
// ❌ Only recorded in memory, no actual transfer
recordTRSTDebit(accountId, amount, 'RECOGNITION_MINT')
```

**New flow** (PRODUCTION):
```typescript
// ✅ User signs real transaction, TRST actually moves
await payWithTrst({ accountId, amount, purpose })
```

The `getAdjustedTRSTBalance()` function is now deprecated since balances are accurate on-chain.
