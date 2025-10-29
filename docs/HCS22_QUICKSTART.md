# HCS-22 Quick Start Guide

## 🚀 5-Minute Setup

### 1. Create Identity Topic

Create a new HCS topic for identity binding events:

```bash
# Using Hedera JavaScript SDK
node -e "
const { Client, TopicCreateTransaction, AccountId, PrivateKey } = require('@hashgraph/sdk');

(async () => {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_OPERATOR_ID),
    PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY)
  );

  const tx = await new TopicCreateTransaction()
    .setTopicMemo('HCS-22 Identity Registry - TrustMesh')
    .execute(client);

  const receipt = await tx.getReceipt(client);
  console.log('Identity Topic ID:', receipt.topicId.toString());
})();
"
```

### 2. Enable HCS-22

Update `.env.local`:

```bash
HCS22_ENABLED=true
HCS22_IDENTITY_TOPIC_ID=0.0.YOUR_TOPIC_ID
```

### 3. Add Startup Hook

Create `instrumentation.ts` in project root (Next.js 13+):

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initHcs22 } = await import('./lib/server/hcs22/init');
    await initHcs22();
  }
}
```

Or add to your custom server initialization.

### 4. Test Health Endpoint

```bash
pnpm dev

# In another terminal
curl http://localhost:3000/api/health | jq '.hcs22'
```

Expected response:
```json
{
  "enabled": true,
  "topic": "0.0.123456",
  "bindings": { "total": 0, "active": 0, "inactive": 0 },
  "resolver": { "total": 0, "valid": 0, "expired": 0 }
}
```

### 5. Test Resolution

Get a Magic DID token from your app's login flow, then:

```bash
curl -X POST http://localhost:3000/api/identity/resolve \
  -H "Authorization: Bearer YOUR_MAGIC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"issuer":"did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"}'
```

## 🔧 Integration Examples

### Integrate with Magic Login (Non-Blocking)

```typescript
// lib/services/MagicWalletService.ts

export async function loginWithMagicEmail(email: string): Promise<MagicHederaUser> {
  const magic = getMagicInstance();
  
  // Existing Magic login logic...
  const didToken = await magic.auth.loginWithEmailOTP({ email });
  const metadata = await magic.user.getMetadata();
  const issuer = metadata.issuer || '';
  const evmAddress = metadata.publicAddress || '';
  
  // Get token for API auth
  const token = await magic.user.getIdToken();
  
  // NON-BLOCKING HCS-22 resolution (fire-and-forget)
  if (issuer && evmAddress) {
    fetch('/api/identity/resolve', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ issuer })
    }).catch(err => console.warn('[HCS22] Resolve failed:', err));
  }
  
  // Continue with existing logic...
  // Check localStorage, create account if needed, etc.
}
```

### Integrate with On-Chain Actions

```typescript
// app/api/recognition/mint/route.ts

import { resolveHederaAccountId } from '@/lib/server/hcs22/resolver';
import { provisionAndBind } from '@/lib/server/hcs22/provision';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { issuer, evmAddress, email } = await req.json();
  
  // Resolve account (fast - checks cache/reducer/mirror)
  let accountId = await resolveHederaAccountId(issuer);
  
  // Provision if needed (only on first on-chain action)
  if (!accountId) {
    console.log('[Mint] No account found, provisioning...');
    const result = await provisionAndBind({
      evmAddress,
      issuer,
      emailHash: crypto.createHash('sha256').update(email).digest('hex')
    });
    accountId = result.accountId;
    console.log('[Mint] Provisioned account:', accountId);
  }
  
  // Proceed with minting using accountId
  // ...
}
```

## 📊 Monitoring

### Check Binding Registry

```bash
curl http://localhost:3000/api/health | jq '.hcs22.bindings'
```

### Check Resolver Cache

```bash
curl http://localhost:3000/api/health | jq '.hcs22.resolver'
```

### View HCS Events

```bash
# Query Mirror Node for topic messages
TOPIC_ID=0.0.YOUR_TOPIC_ID
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/${TOPIC_ID}/messages?limit=10" | jq '.messages[] | {seq: .sequence_number, timestamp: .consensus_timestamp, message: .message}'

# Decode a message
echo "BASE64_MESSAGE" | base64 -d | jq
```

## 🧪 Testing Scenarios

### Scenario 1: New User (No Account)

1. User logs in with Magic (never used app before)
2. HCS-22 resolver checks: Cache → Reducer → Mirror (all return null)
3. User triggers on-chain action (e.g., mint)
4. App calls `provisionAndBind()`
5. Account created via dust transfer
6. BIND event published to HCS
7. Future logins resolve instantly via Mirror

### Scenario 2: Returning User

1. User logs in with Magic (existing account)
2. HCS-22 resolver checks Mirror Node → account found
3. ASSERT event published (non-blocking audit trail)
4. Account ID cached for 15 minutes
5. Future logins in same session resolve from cache

### Scenario 3: Cleared localStorage

**Old Pattern (Pre-HCS-22):**
- Email lookup fails (localStorage cleared)
- New account created (duplicate)

**New Pattern (HCS-22):**
- Issuer DID + EVM address lookup succeeds via Mirror
- Existing account returned (no duplicate)

## 🎯 Rollout Strategy

### Stage 1: Read-Only (Current)
- HCS-22 enabled but not integrated with login
- Test resolution endpoint manually
- Monitor health metrics

### Stage 2: Non-Blocking Resolution
- Add non-blocking resolve call to Magic login
- ASSERT events populate HCS audit trail
- No behavior changes (still using localStorage)

### Stage 3: Provision on Demand
- Integrate with first on-chain action (mint/payment)
- Provision only when needed
- BIND events track new accounts

### Stage 4: Primary Identity
- Use HCS-22 as source of truth for account lookup
- Deprecate localStorage-based account tracking
- Full audit trail on HCS

### Stage 5: Advanced Features
- Implement ROTATE/UNBIND with signature verification
- Enable account recovery flows
- XMTP integration

## ⚠️ Troubleshooting

### "HCS-22 is disabled"
Check `.env.local`: `HCS22_ENABLED=true`

### "Topic ID not set"
Check `.env.local`: `HCS22_IDENTITY_TOPIC_ID=0.0.123456`

### "No messages in warmup"
Topic might be new - publish a test BIND event or wait for first real event

### "Mirror lookup failing"
Account might not exist yet - this is expected, provision will create it

### "Rate limit exceeded"
Wait 60 seconds or increase `RATE_LIMIT_MAX_REQUESTS` in resolve route

## 📚 Additional Resources

- [Full Implementation Docs](./HCS22_IMPLEMENTATION.md)
- [Implementation Summary](./HCS22_IMPLEMENTATION_SUMMARY.md)
- [Hedera HCS Docs](https://docs.hedera.com/guides/core-concepts/consensus-service)
- [Magic Hedera Extension](https://magic.link/docs/blockchains/hedera)

## 🎉 You're Ready!

HCS-22 is now set up and ready for integration. Start with read-only testing, then gradually integrate into your login and on-chain flows.

Need help? Check the logs for `[HCS22]` prefixed messages.
