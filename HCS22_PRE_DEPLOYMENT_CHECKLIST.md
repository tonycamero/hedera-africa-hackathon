# HCS-22 Pre-Deployment Checklist

**Target Version**: `v0.4-hcs22-secure`  
**Date**: 2025-10-29  
**Status**: Ready for production deployment ✅

---

## 🔐 1. Environment Variables

### Required Variables

```bash
# Feature flag (initially false, then gradual rollout)
HCS22_ENABLED=false  # Start here, then enable gradually

# HCS topic for identity bindings
HCS22_IDENTITY_TOPIC_ID=0.0.7157980  # ← Verify this from topic creation script

# Salt for hashing email-based DIDs (MUST BE UNIQUE IN PROD)
HCS22_DID_SALT=<CHANGE_THIS_TO_SECURE_RANDOM_STRING>
```

**Action Items:**
- [ ] Generate secure random salt: `openssl rand -base64 32`
- [ ] Confirm `HCS22_IDENTITY_TOPIC_ID` from creation script output
- [ ] Set `HCS22_ENABLED=false` initially
- [ ] Verify all variables set in production `.env`

---

## 🧪 2. Pre-Deployment Testing

### Test ASSERT Mode (Login)
```bash
# With HCS22_ENABLED=true locally
# Login as test user
# Check console logs for:
# [HCS22 ASSERT] Logging identity assertion for: did:ethr:...
# [HCS22 ASSERT] Response status: 200
# [HCS22 ASSERT] Result: { success: true, mode: 'ASSERT', ... }
```

**Expected Behavior:**
- ✅ Login completes successfully
- ✅ ASSERT published to HCS (check topic on Mirror Node)
- ✅ No PII in published message (use Mirror Node API to verify)

### Test BIND Mode (Accept Stipend)
```bash
# Accept stipend as new user
# Check console logs for:
# [HCS22 BIND] Resolving/provisioning account...
# [ResolveOrProvision] Provisioned new account: did:ethr:... → 0.0.xxxxx
# [HCS22 BIND] Published to HCS topic...
```

**Expected Behavior:**
- ✅ Hedera account created
- ✅ BIND event published with account ID
- ✅ Stipend transfer succeeds
- ✅ No duplicate accounts on re-login

### Verify Mirror Node Messages
```bash
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/${HCS22_IDENTITY_TOPIC_ID}/messages?limit=10&order=desc"
```

**Verify:**
- [ ] Messages contain `identityDid` field (must start with `did:ethr:0x`)
- [ ] NO email addresses visible in any field
- [ ] NO domain names (.com, .org, etc.) visible
- [ ] BIND events include valid `hederaAccountId`

---

## 🚨 3. Production Log Cleanup

### Disable Verbose Console Logs

Update the following files to gate debug logs:

**`lib/util/getCanonicalDid.ts`:**
```typescript
// Change all console.warn to only log in dev
if (process.env.NODE_ENV !== 'production') {
  console.warn('[getCanonicalDid] Email-based DID detected, hashing for privacy');
}
```

**`lib/server/hcs22/resolveOrProvision.ts`:**
```typescript
// Keep important logs, remove verbose ones
if (process.env.NODE_ENV !== 'production') {
  console.log(`[ResolveOrProvision] Starting resolution for ${did}`);
}
```

**`app/api/hcs22/resolve/route.ts`:**
```typescript
// Keep essential logs only
console.log(`[HCS22 ${mode}] Published seq=${result.sequenceNumber}`);
// Remove: individual step logs unless error
```

**Action Items:**
- [ ] Review all console.log statements
- [ ] Gate debug logs with `NODE_ENV` check
- [ ] Keep error logs always on
- [ ] Keep critical success logs (seq number, latency)

---

## 📦 4. Git Tagging

```bash
# Ensure all changes committed
git add -A
git commit -m "feat(hcs22): Complete secure dual-key identity resolution

- PII-safe DID derivation with email hashing
- Server-side account resolution with idempotency locks
- ASSERT/BIND modes for login and first on-chain action
- Magic token authentication on all endpoints
- Feature flag for safe rollout
- Cache → reducer → mirror → provision flow
- Comprehensive test coverage

BREAKING: Clients must send Magic token in Authorization header
SECURITY: All DIDs hashed before HCS publish
"

# Create annotated tag
git tag -a v0.4-hcs22-secure -m "HCS-22 Secure Dual-Key Implementation

Production-ready dual-key identity resolution:
- Zero PII leakage (all DIDs hashed)
- 100% idempotent (same user = same account)
- Non-blocking UX (login never blocks)
- Audit-ready (immutable HCS trail)
- Rollback-safe (instant disable via flag)

See docs/HCS22_SECURE_IMPLEMENTATION.md for details.
"

# Push tag to origin
git push origin v0.4-hcs22-secure
```

**Action Items:**
- [ ] Commit all HCS-22 changes
- [ ] Create annotated tag
- [ ] Push tag to remote
- [ ] Create GitHub release (optional)

---

## 🚀 5. Deployment Strategy

### Phase 1: Deploy with Feature Disabled (Day 1)
```bash
HCS22_ENABLED=false
```

**Verify:**
- [ ] All login flows work unchanged
- [ ] No HCS publishes occur
- [ ] 204 responses on resolve endpoint
- [ ] Zero errors in logs

### Phase 2: Enable for 10% (Day 2-3)
```bash
# Add user sampling logic or use feature flag service
# For now, set globally:
HCS22_ENABLED=true
```

**Monitor:**
- [ ] Login success rate (should be unchanged)
- [ ] HCS publish success rate (target >99%)
- [ ] Latency p95 (target <2s for BIND, <500ms for ASSERT)
- [ ] Error rate (target <0.1%)
- [ ] Mirror Node message count

**Metrics to Track:**
```typescript
// Add to monitoring dashboard
{
  hcs22_asserts_total: 42,
  hcs22_binds_total: 15,
  hcs22_provision_success: 14,
  hcs22_provision_failed: 1,
  hcs22_cache_hits: 28,
  hcs22_locks_acquired: 15,
  hcs22_pii_blocked: 0  // MUST stay at 0
}
```

### Phase 3: Gradually Increase (Day 4-7)
- Day 4: 25%
- Day 5: 50%
- Day 6: 75%
- Day 7: 100%

**Rollback Trigger:**
- Login success rate drops >1%
- HCS publish error rate >5%
- Any PII detected in messages
- Duplicate account creation detected

### Instant Rollback
```bash
# Set immediately if issues arise
HCS22_ENABLED=false
```

**Verify Rollback:**
- [ ] Login flows work immediately
- [ ] No further HCS publishes
- [ ] Existing bindings still cached
- [ ] Zero user impact

---

## 🔍 6. Post-Deployment Verification

### Day 1 Checks (Feature Disabled)
```bash
# Health endpoint should show disabled
curl https://app.trustmesh.xyz/api/hcs22/health

# Expected:
{
  "success": true,
  "metrics": {
    "enabled": false,
    ...
  }
}
```

### Day 2-7 Checks (Feature Enabled)
```bash
# Check health metrics
curl https://app.trustmesh.xyz/api/hcs22/health

# Query recent HCS messages
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/${HCS22_IDENTITY_TOPIC_ID}/messages?limit=100&order=desc" | jq '.messages[] | select(.message | @base64d | contains("@"))'
# ↑ Should return ZERO results (no emails)

# Test idempotency
# Login twice from different browsers as same user
# Verify same hederaAccountId returned
```

### Continuous Monitoring
- [ ] Set up alerts for HCS publish failures
- [ ] Monitor cache hit rate (should increase over time)
- [ ] Track unique DIDs vs total accounts (should be 1:1)
- [ ] Watch for lock timeouts (should be rare)

---

## ✅ Final Sign-Off

**Before enabling in production:**

- [ ] All environment variables set correctly
- [ ] HCS22_DID_SALT is unique and secure
- [ ] HCS22_IDENTITY_TOPIC_ID verified from creation script
- [ ] Test ASSERT mode works (login completes)
- [ ] Test BIND mode works (account created)
- [ ] Verified NO PII in Mirror Node messages
- [ ] Production logs cleaned (debug gates added)
- [ ] Git tagged as `v0.4-hcs22-secure`
- [ ] Monitoring dashboards configured
- [ ] Rollback procedure documented and tested
- [ ] Team notified of rollout schedule

**Deployment approval:** ___________________________  
**Date:** _____________________

---

## 📞 Support Contacts

**In case of issues:**
- Rollback immediately: Set `HCS22_ENABLED=false`
- Check health endpoint: `/api/hcs22/health`
- Review logs for: `[HCS22`, `[Auth]`, `[ResolveOrProvision]`
- Mirror Node API: https://testnet.mirrornode.hedera.com

**Documentation:**
- Implementation: `docs/HCS22_SECURE_IMPLEMENTATION.md`
- Tests: `__tests__/hcs22-secure.test.ts`
- Architecture: `docs/HCS22_DUAL_KEY_IMPLEMENTATION.md`

---

**Status**: Ready for v0.4-hcs22-secure deployment ✅
