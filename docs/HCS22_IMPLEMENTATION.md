# HCS-22 Dual-Key Identity Binding Implementation

## Overview

HCS-22 is a dual-key identity binding standard that formalizes the cryptographically verifiable binding between Magic's EVM keys and Hedera accounts. This provides:

- **Trust**: Immutable audit trail of identity bindings on Hedera Consensus Service
- **Auditability**: All binding events are published to HCS for transparent verification
- **Decentralization**: Supports future integrations (e.g., XMTP messaging) by separating identity (EVM key) from trust/action (Hedera account)

## Architecture

### Resolution Strategy (Mirror-First)

1. **Cache** (15min TTL) - Fast in-memory lookups
2. **HCS Reducer** - Warm state from ingested identity events
3. **Mirror Node** - Stateless lookup by EVM address (fastest for existing accounts)
4. **Provision** - Create account via dust transfer if not found

### Event Types

- **`IDENTITY_BIND`** - Published when creating new account binding
- **`IDENTITY_ASSERT`** - Published when confirming existing binding via Mirror
- **`IDENTITY_ROTATE`** - Published when rotating to new Hedera account (requires signature)
- **`IDENTITY_UNBIND`** - Published when removing binding (signature optional if operator-initiated)

### Components

```
lib/server/hcs22/
├── types.ts       # Event type definitions and constructors
├── reducer.ts     # In-memory state management with ordering/idempotency
├── publish.ts     # HCS event publisher (wraps existing submitToTopic)
├── mirror.ts      # Mirror Node EVM address lookups
├── provision.ts   # Account creation via dust transfer to EVM alias
├── resolver.ts    # Multi-tier resolution: cache → reducer → mirror
└── verify.ts      # EVM signature verification (stub for ROTATE/UNBIND)

app/api/identity/resolve/
└── route.ts       # POST/GET endpoints for identity resolution
```

## Configuration

### Environment Variables

```bash
# Enable HCS-22 identity registry
HCS22_ENABLED=true

# HCS topic ID for identity binding events
HCS22_IDENTITY_TOPIC_ID=0.0.YOUR_TOPIC_ID
```

### Creating the Identity Topic

```bash
# Using Hedera SDK (Node.js)
const { TopicCreateTransaction } = require('@hashgraph/sdk');

const tx = await new TopicCreateTransaction()
  .setTopicMemo('HCS-22 Identity Registry - TrustMesh')
  .execute(client);

const receipt = await tx.getReceipt(client);
const topicId = receipt.topicId.toString();

console.log('Identity Topic ID:', topicId);
```

## Rollout Plan

### Phase 1: Reconnaissance (Completed ✅)

- [x] Explore existing Hedera/Magic infrastructure
- [x] Identify URE patterns and `submitToTopic` integration
- [x] Confirm Mirror Node support for EVM address lookups
- [x] Verify no conflicting dependencies

### Phase 2: Core Implementation (Completed ✅)

- [x] Implement event types and constructors
- [x] Create event reducer with ordering/idempotency
- [x] Build publisher wrapping existing `submitToTopic`
- [x] Add Mirror Node lookup helper
- [x] Implement account provisioning via dust transfer
- [x] Create resolver with cache/reducer/mirror fallback
- [x] Add signature verification stub
- [x] Build identity resolve API endpoint

### Phase 3: Integration (Next)

- [ ] Update MagicWalletService to call resolver
- [ ] Add HCS-22 warmup on app startup
- [ ] Add HCS-22 status to health endpoint
- [ ] Test end-to-end login → resolve → provision flow

### Phase 4: Warmup & Subscription

- [ ] Implement startup warmup (last 7 days from Mirror)
- [ ] Add live HCS subscription for real-time events
- [ ] Monitor binding registry growth

### Phase 5: Production Hardening

- [ ] Implement proper EVM signature verification (ethers/viem)
- [ ] Add comprehensive error handling
- [ ] Set up monitoring and alerting
- [ ] Document operator procedures

## Testing Guide

### 1. Create Identity Topic

```bash
# Set up test topic
node scripts/create-identity-topic.js
```

### 2. Enable HCS-22

```bash
# Update .env.local
HCS22_ENABLED=true
HCS22_IDENTITY_TOPIC_ID=0.0.123456
```

### 3. Test Resolution Flow

```bash
# Start dev server
pnpm dev

# Login with Magic
# Check logs for:
# - [HCS22 API] Resolving issuer: did:ethr:0x...
# - [HCS22 Resolver] Mirror hit for did:ethr:0x...: 0.0.123456
# - [HCS22] Published IDENTITY_ASSERT for did:ethr:0x...
```

### 4. Verify Events on HCS

```bash
# Query Mirror Node for topic messages
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/${HCS22_IDENTITY_TOPIC_ID}/messages"

# Decode base64 messages to see BIND/ASSERT events
```

### 5. Test Account Provisioning

```bash
# Clear localStorage to force new account creation
# Login with Magic
# Check logs for:
# - [HCS22 Provision] Creating account for EVM 0x... via dust transfer
# - [HCS22 Provision] Account confirmed: 0.0.123456
# - [HCS22] Publishing BIND event for did:ethr:0x... → 0.0.123456
```

### 6. Check Health Status

```bash
curl http://localhost:3000/api/health

# Response should include:
{
  "status": "ok",
  "hcs22": {
    "enabled": true,
    "bindings": { "total": 5, "active": 5, "inactive": 0 },
    "topic": "0.0.123456"
  }
}
```

## API Reference

### POST /api/identity/resolve

Resolve Hedera Account ID from Magic issuer (DID).

**Request:**
```json
{
  "issuer": "did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
}
```

**Response (found):**
```json
{
  "success": true,
  "accountId": "0.0.123456",
  "source": "hcs22_resolver"
}
```

**Response (not found):**
```json
{
  "success": true,
  "accountId": null,
  "source": "hcs22_resolver",
  "message": "Account not found. Provision required."
}
```

### GET /api/identity/resolve?issuer=did:ethr:0x...

Public verification endpoint (no auth required).

## Operational Notes

### Monitoring

- Track binding registry size via health endpoint
- Monitor HCS publish success rate
- Alert on Mirror Node lookup failures
- Watch for rate limit triggers

### Rate Limiting

- 20 requests per minute per issuer
- Prevents abuse of resolution endpoint
- Configurable via `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`

### Cache Management

- Resolver cache: 15 minute TTL
- In-memory Map (no external dependencies)
- Auto-expires stale entries
- Manual clear: `clearResolverCache()`

### Security Considerations

- ROTATE/UNBIND events require EVM signatures
- Signature verification stub rejects all (safe default)
- Implement proper verification before enabling ROTATE/UNBIND
- Rate limiting prevents enumeration attacks

## Future Enhancements

### 1. EVM Signature Verification

```typescript
// TODO: Implement using ethers.js or viem
import { verifyMessage } from 'ethers';

export function verifyEthSig(message: string, signature: string): string | null {
  const recoveredAddress = verifyMessage(message, signature);
  return recoveredAddress.toLowerCase();
}
```

### 2. Database Persistence

Replace in-memory Maps with database:
- Bindings table: `(issuer, hedera_account_id, evm_address, active, last_event_type, last_event_timestamp)`
- Rate limits table: `(issuer, request_count, window_start)`
- Unique constraint on `(issuer)`

### 3. XMTP Integration

Use HCS-22 bindings for XMTP messaging:
- Resolve Hedera account → EVM address → XMTP inbox
- Publish XMTP conversation events to HCS
- Enable decentralized messaging with Hedera identity

### 4. Multi-Network Support

Extend to mainnet and other networks:
- Separate topics per network
- Network-specific resolver caches
- Cross-network binding assertions

## Troubleshooting

### Issue: Bindings not persisting across restarts

**Cause:** In-memory Map cleared on restart

**Solution:** Implement warmup from HCS on startup (Phase 4)

### Issue: Mirror lookup failing

**Cause:** Account not yet visible on Mirror (consensus lag)

**Solution:** Provision.ts already polls Mirror for up to 5 seconds

### Issue: Rate limit false positives

**Cause:** Shared issuer across multiple sessions

**Solution:** Adjust `RATE_LIMIT_MAX_REQUESTS` or implement per-session limits

### Issue: BIND events not visible on HCS

**Cause:** `HCS22_ENABLED=false` or `HCS22_IDENTITY_TOPIC_ID` not set

**Solution:** Check environment variables and restart server

## References

- [Hedera Consensus Service (HCS) Docs](https://docs.hedera.com/guides/core-concepts/consensus-service)
- [Magic.link Hedera Extension](https://magic.link/docs/blockchains/hedera)
- [Hedera Mirror Node API](https://docs.hedera.com/guides/mirrornet/hedera-mirror-node)
- [EVM Account Auto-Creation](https://docs.hedera.com/guides/core-concepts/accounts#evm-address-alias)
