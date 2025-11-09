# HCS-22 Test Scripts

This directory contains test scripts for validating the HCS-22 Dual-Key Identity Binding implementation.

## Prerequisites

- `.env.local` configured with Hedera credentials:
  ```bash
  HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT
  HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY
  HEDERA_NETWORK=testnet
  ```

## Scripts

### 1. `create-identity-topic.js`

Creates a new HCS topic for identity binding events.

**Usage:**
```bash
node scripts/create-identity-topic.js
```

**Output:**
- Topic ID (add to `.env.local` as `HCS22_IDENTITY_TOPIC_ID`)

**Run once** during initial setup.

---

### 2. `test-hcs22-publish.js`

Publishes a test IDENTITY_BIND event to verify HCS publishing and reducer functionality.

**Usage:**
```bash
node scripts/test-hcs22-publish.js
```

**Prerequisites:**
- `HCS22_IDENTITY_TOPIC_ID` set in `.env.local`
- Server running (to see reducer process the event)

**Validates:**
- HCS topic is writable
- Event format is correct
- Reducer processes events
- Health stats update

---

### 3. `test-provision.js`

Tests the full account provisioning flow: dust transfer → auto-creation → BIND event.

**Usage:**
```bash
node scripts/test-provision.js <evmAddress> <issuer>
```

**Example:**
```bash
node scripts/test-provision.js \
  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5 \
  did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5
```

**Prerequisites:**
- `HCS22_IDENTITY_TOPIC_ID` set in `.env.local`
- `HCS22_ENABLED=true`
- Sufficient HBAR for dust transfer (1 tinybar)

**Validates:**
- Dust transfer to EVM alias
- Account auto-creation
- Mirror Node confirmation
- BIND event publishing
- Resolution API returns new account

**Note:** Costs 1 tinybar per run.

---

## Testing Workflow

### Complete Test Sequence

```bash
# 1. Create topic (once)
node scripts/create-identity-topic.js
# → Copy topic ID to .env.local

# 2. Enable HCS-22
echo "HCS22_ENABLED=true" >> .env.local
echo "HCS22_IDENTITY_TOPIC_ID=0.0.XXXXXX" >> .env.local

# 3. Start server
pnpm dev

# 4. Test event publishing (in another terminal)
node scripts/test-hcs22-publish.js
# → Check server logs for [HCS22] Reduced IDENTITY_BIND

# 5. Check health endpoint
curl http://localhost:3000/api/health | jq '.hcs22'
# → Verify bindings.total incremented

# 6. Test resolution API
curl -X POST http://localhost:3000/api/identity/resolve \
  -H "Content-Type: application/json" \
  -d '{"issuer":"did:ethr:0x742d35cc6634c0532925a3b844bc9e7595f0beb5"}'
# → Should return {"accountId": "0.0.999999"}

# 7. Test provision (optional - costs 1 tinybar)
node scripts/test-provision.js 0xNEW_ADDRESS did:ethr:0xNEW_ADDRESS
# → Check Mirror Node for new account
```

---

## Troubleshooting

### "Missing HEDERA_OPERATOR_ID"
- Check `.env.local` has all Hedera credentials
- Run from project root directory

### "Missing HCS22_IDENTITY_TOPIC_ID"
- Run `create-identity-topic.js` first
- Add topic ID to `.env.local`

### "Topic not found"
- Verify topic ID in `.env.local` matches created topic
- Check network (testnet vs mainnet)

### "Provision timeout"
- Mirror Node lag - wait 5-10 seconds and retry
- Check HBAR balance for dust transfer

### "Reducer not processing events"
- Verify server is running
- Check `HCS22_ENABLED=true` in `.env.local`
- Restart server to trigger warmup

---

## Monitoring

After running tests, monitor:

1. **Server logs** for `[HCS22]` prefixed messages
2. **Health endpoint**: `curl http://localhost:3000/api/health | jq '.hcs22'`
3. **HCS topic on Mirror Node**:
   ```bash
   curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.TOPIC_ID/messages?limit=10"
   ```
4. **Decode HCS messages**:
   ```bash
   curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.TOPIC_ID/messages/1" \
     | jq '.message' -r \
     | base64 -d \
     | jq
   ```

---

## Next Steps

After successful testing:

1. Fill out `docs/HCS22_VERIFICATION_REPORT.md`
2. Review `docs/PHASE3_EXECUTION_SUMMARY.md`
3. Execute Phase 4 tickets in `tickets/` directory

---

## Support

- **Full Documentation**: `docs/HCS22_IMPLEMENTATION.md`
- **Quick Start**: `docs/HCS22_QUICKSTART.md`
- **Troubleshooting**: See docs for detailed guide

**Guiding Principle**: *"Measure twice, publish once."*
