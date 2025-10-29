# Phase 4 T1: Staging QA Checklist
## Non-Blocking Magic Login Resolution

**Ticket**: T1_magic_nonblocking_resolve  
**Environment**: Staging  
**Date**: _____________  
**Tester**: _____________

---

## Prerequisites

- [ ] Staging environment configured:
  ```bash
  HCS22_ENABLED=true
  HCS22_IDENTITY_TOPIC_ID=0.0.XXXXXX
  HCS22_ASSERT_SAMPLING=1.0  # 100% for staging
  HCS22_LOG_LEVEL=info
  ```

- [ ] HCS-22 topic created and confirmed writable
- [ ] Baseline health metrics captured (see below)

---

## Test 1: 3-Account Login Test

**Objective**: Verify ASSERT events published for 3 distinct accounts

### Setup
- [ ] Clear localStorage for clean test
- [ ] Prepare 3 test email addresses

### Execution

**Account 1:**
```bash
# Login via app
Email: test1@example.com

# Check browser console for:
[HCS22] Identity resolved: {...}
[HCS22] Mapped did:ethr:0x... → 0.0.XXXXXX

# Verify no login delay (< 50ms overhead)
```

**Account 2:**
```bash
Email: test2@example.com
# Repeat checks
```

**Account 3:**
```bash
Email: test3@example.com
# Repeat checks
```

### Verification

- [ ] **3 ASSERT events on HCS topic**
  ```bash
  curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.TOPIC_ID/messages?limit=10"
  ```
  Expected: 3 messages with `"t":"IDENTITY_ASSERT"`

- [ ] **Health endpoint shows increments**
  ```bash
  curl http://localhost:3000/api/health | jq '.hcs22'
  ```
  Expected: 
  - `bindings.total` increased by 3
  - `resolver.total` increased by 3
  - `resolver.valid` shows active cache entries

- [ ] **Browser console logs present**
  - `[HCS22] Identity resolved` for each login
  - No errors in console

- [ ] **Login timing unchanged**
  - Time from OTP submit to dashboard: ______ms
  - Overhead from HCS-22: < 50ms ✓ / ✗

---

## Test 2: Resolution Latency

**Objective**: Verify p95 resolve ≤ 100ms for cache hits

### Method

```bash
# After 3 logins, re-login with same accounts
# Check server logs for [HCS22 Resolver] timing

# Parse logs for "Cache hit" and "Mirror hit" timings
grep "\[HCS22 Resolver\]" server.log | tail -20
```

### Metrics

| Attempt | Type | Latency (ms) | Notes |
|---------|------|--------------|-------|
| 1       | Mirror | _______ | First resolution |
| 2       | Cache  | _______ | Should be < 10ms |
| 3       | Cache  | _______ | Should be < 10ms |

**Pass Criteria:**
- [ ] Cache hits < 10ms (p95)
- [ ] Mirror lookups < 100ms (p95)
- [ ] No timeouts or errors

---

## Test 3: Sampling Validation

**Objective**: Verify sampling rate is respected

### Execution

```bash
# Set sampling to 0.5 (50%)
HCS22_ASSERT_SAMPLING=0.5

# Login 10 times with different accounts
# Count ASSERT events on HCS topic
```

**Expected**: ~5 ASSERT events (within statistical variance)

- [ ] Sampling rate matches config (±20% tolerance)
- [ ] Logs show "Skipped ASSERT (sampling: 0.5)" messages

---

## Test 4: Error Handling

**Objective**: Verify non-blocking behavior on failures

### Scenarios

**Scenario A: HCS topic unavailable**
```bash
# Temporarily set invalid topic ID
HCS22_IDENTITY_TOPIC_ID=0.0.999999999

# Login
# Expected: Warning in console, but login succeeds
```
- [ ] Login completes successfully
- [ ] Console shows: `[HCS22] Resolution failed (non-blocking)`

**Scenario B: Mirror Node lag**
```bash
# Simulate slow Mirror (if possible, or just observe)
# Login during heavy network load
```
- [ ] Login not blocked by Mirror lookup
- [ ] Resolution happens asynchronously

---

## Test 5: Health Metrics Validation

**Objective**: Confirm metrics update correctly

### Before Tests
```bash
curl http://localhost:3000/api/health | jq '.hcs22' > health_before.json
```

```json
{
  "bindings": { "total": 0, "active": 0, "inactive": 0 },
  "resolver": { "total": 0, "valid": 0, "expired": 0 }
}
```

### After Tests
```bash
curl http://localhost:3000/api/health | jq '.hcs22' > health_after.json
diff health_before.json health_after.json
```

**Expected Changes:**
- [ ] `bindings.total` += number of unique accounts resolved
- [ ] `resolver.total` += number of resolve calls
- [ ] `resolver.valid` shows cached entries

---

## Rollback Procedure

### Instant Rollback (if issues found)

```bash
# 1. Disable HCS-22
echo "HCS22_ENABLED=false" >> .env.local

# 2. Restart server
pm2 restart trustmesh  # or: pnpm dev

# 3. Verify disabled
curl http://localhost:3000/api/health | jq '.hcs22.enabled'
# Expected: false
```

**Validation after rollback:**
- [ ] Logins work normally
- [ ] No HCS-22 logs appearing
- [ ] Health endpoint shows `enabled: false`

### Code Rollback (if needed)

```bash
# Revert MagicWalletService.ts changes
git checkout HEAD~1 lib/services/MagicWalletService.ts

# Rebuild
pnpm build

# Restart
pm2 restart trustmesh
```

---

## Success Criteria

**All must pass to proceed to production:**

- [ ] ✅ 3+ accounts tested, all ASSERT events published
- [ ] ✅ Health metrics increment correctly
- [ ] ✅ Login latency unchanged (< 50ms overhead)
- [ ] ✅ p95 cache hit < 10ms
- [ ] ✅ p95 Mirror lookup < 100ms
- [ ] ✅ Sampling rate respected
- [ ] ✅ Error handling non-blocking
- [ ] ✅ Rollback procedure validated

---

## Promotion to Production

**After 24h clean run in staging:**

```bash
# Production config (25% sampling)
HCS22_ENABLED=true
HCS22_IDENTITY_TOPIC_ID=0.0.PROD_TOPIC
HCS22_ASSERT_SAMPLING=0.25  # 25% day 1
HCS22_LOG_LEVEL=info

# Deploy to production
# Monitor for 48 hours before increasing sampling
```

**Alert Thresholds for Production:**
- Resolve error rate > 1% for 30 min → page on-call
- p95 resolve > 400ms for 60 min → investigate
- HCS submit failures > 0.5% over 100 events → check topic

---

**Tested By**: _____________  
**Date**: _____________  
**Result**: ✅ PASS / ❌ FAIL / ⏸️ PARTIAL  
**Notes**: _____________
