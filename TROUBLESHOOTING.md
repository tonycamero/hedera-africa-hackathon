# TrustMesh Troubleshooting Guide (Task 6)
## Common Issues & Solutions for Hackathon Demo

> **Quick Reference**: Most demo issues stem from HCS mirror lag, nonce conflicts, or signature validation. This guide provides immediate solutions.

---

## 🚨 Critical Issues (Demo Stoppers)

### Issue 1: HCS Submission Failing
**Symptoms:**
- 500 errors on `/api/hcs/submit`
- "Failed to submit to topic" messages
- Network tab shows failed POST requests

**Immediate Fix:**
```bash
# Check Hedera testnet status
curl https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.2

# Verify environment variables
echo $HEDERA_OPERATOR_ID
echo $HEDERA_OPERATOR_KEY
```

**Root Causes:**
1. **Invalid Operator Account**: Check `.env.local`
2. **Network Connectivity**: Testnet might be down
3. **Rate Limiting**: Too many rapid submissions

**Solutions:**
```bash
# Fix 1: Refresh environment
pnpm run dev:restart

# Fix 2: Check account balance
curl "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.YOUR_ACCOUNT_ID"

# Fix 3: Add delays between submissions
# In scripts, ensure 2-second delays between HCS calls
```

---

### Issue 2: Mirror Node Lag
**Symptoms:**
- Recent HCS messages not appearing
- Contact/trust data seems outdated
- Consensus timestamps are behind

**Expected Behavior:** Mirror nodes can lag 2-10 seconds behind consensus

**Demo Strategy:**
```bash
# Option 1: Pre-warm the cache
curl http://localhost:3000/api/hcs/sync

# Option 2: Use local state for demo
# Show network request, explain mirror lag is normal
```

**Explanation for Judges:**
*"Mirror nodes provide eventual consistency. The transaction was accepted by consensus immediately, but mirror node indexing takes a few seconds. This is normal blockchain behavior."*

---

### Issue 3: Nonce Mismatch Errors
**Symptoms:**
- "Nonce validation failed" errors
- Duplicate message rejections
- State seems inconsistent

**Quick Fix:**
```bash
# Reset nonce counter
curl -X POST http://localhost:3000/api/debug/reset-nonce

# Or restart the development server
pnpm run dev:restart
```

**Prevention:**
- Ensure only one demo instance running
- Don't rapid-fire HCS submissions
- Use unique nonces per session

---

## ⚠️ Common Issues (Demo Hiccups)

### Issue 4: Authentication Problems
**Symptoms:**
- Can't login as demo users
- Session expires during demo
- User context lost

**Demo Credentials:**
```
Primary: alex@trustmesh.network / demo123
Backup: sarah@trustmesh.network / demo123
Admin: admin@trustmesh.network / admin123
```

**Quick Reset:**
```bash
# Clear sessions and restart
rm -rf .next/cache
pnpm run dev:restart
```

---

### Issue 5: Empty Feeds/Lists
**Symptoms:**
- No contacts showing
- Trust allocations missing
- Recognition feed empty

**Check Data Population:**
```bash
# Verify seed data
pnpm run seed:check

# Re-run seeding if needed
pnpm run seed:hcs

# Check database state
curl http://localhost:3000/api/debug/state
```

**Common Causes:**
1. Seed scripts failed silently
2. Database reset during development
3. HCS topics not properly initialized

---

### Issue 6: Signature Validation Failures
**Symptoms:**
- "Invalid signature" errors
- Messages rejected by HCS
- Authentication failures

**Debug Steps:**
```bash
# Check current operator configuration
curl http://localhost:3000/api/debug/operator

# Validate signature format
curl http://localhost:3000/api/debug/signature-test

# Reset operator client
curl -X POST http://localhost:3000/api/debug/reset-client
```

---

## 🔧 Debugging Tools

### Real-time HCS Monitor
```bash
# Watch HCS submissions live
curl http://localhost:3000/api/debug/hcs-monitor

# Stream recent activity
curl http://localhost:3000/api/hcs/stream
```

### State Inspection
```bash
# Full application state dump
curl http://localhost:3000/api/debug/full-state

# User-specific state
curl http://localhost:3000/api/debug/user-state?email=alex@trustmesh.network

# Trust network topology
curl http://localhost:3000/api/debug/trust-graph
```

### Performance Metrics
```bash
# HCS response times
curl http://localhost:3000/api/debug/performance

# Database query times
curl http://localhost:3000/api/debug/db-performance

# Mirror node sync status
curl http://localhost:3000/api/debug/mirror-status
```

---

## 🚀 Pre-Demo Checklist

### 5 Minutes Before Demo
```bash
# 1. Verify all services
curl http://localhost:3000/api/health

# 2. Check HCS connectivity
curl http://localhost:3000/api/hcs/health

# 3. Validate demo data
pnpm run demo:verify

# 4. Test core flow
curl -X POST http://localhost:3000/api/demo/smoke-test

# 5. Clear any stale state
curl -X POST http://localhost:3000/api/debug/clean-cache
```

### Demo Environment Setup
```bash
# Terminal 1: Main application
pnpm run dev

# Terminal 2: HCS monitor (optional)
watch -n 2 'curl -s http://localhost:3000/api/hcs/recent | jq .'

# Terminal 3: Debug console (optional)
curl http://localhost:3000/api/debug/console
```

---

## 🎯 Demo Recovery Strategies

### Strategy 1: Local Fallback
If HCS is completely down:
```bash
# Switch to local demo mode
export DEMO_MODE=local
pnpm run dev:restart
```

### Strategy 2: Pre-recorded Data
Show cached HCS responses:
```bash
# Display cached consensus timestamps
curl http://localhost:3000/api/demo/cached-hcs

# Show pre-recorded network activity
curl http://localhost:3000/api/demo/recorded-transactions
```

### Strategy 3: Code Walkthrough
Focus on the implementation:
- Open `app/api/hcs/submit/route.ts`
- Show `lib/hedera/serverClient.ts`
- Explain the architecture instead of live demo

---

## 📊 Expected Performance Metrics

### Normal Operation
- **HCS Submission**: 1-3 seconds
- **Mirror Node Sync**: 3-10 seconds  
- **UI Response**: <500ms
- **Trust Calculation**: <100ms

### Warning Thresholds
- **HCS Submission**: >5 seconds (investigate)
- **Mirror Sync**: >30 seconds (switch to cached data)
- **UI Response**: >2 seconds (restart dev server)

### Error Thresholds
- **HCS Failure Rate**: >10% (use fallback mode)
- **Authentication Failures**: >2 consecutive (reset session)
- **Memory Usage**: >1GB (restart application)

---

## 🔍 Advanced Debugging

### HCS Topic Investigation
```bash
# Check topic message counts
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.YOUR_TOPIC_ID/messages"

# Validate topic permissions
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.YOUR_TOPIC_ID"

# Recent consensus timestamps
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.YOUR_TOPIC_ID/messages?limit=10"
```

### Network Analysis
```bash
# Trace HCS submission path
curl -v http://localhost:3000/api/hcs/submit

# Monitor WebSocket connections
curl http://localhost:3000/api/debug/websockets

# Check proxy/firewall issues
curl -I https://testnet.mirrornode.hedera.com
```

### Database Consistency
```bash
# Compare local state vs HCS
curl http://localhost:3000/api/debug/consistency-check

# Rebuild state from HCS
curl -X POST http://localhost:3000/api/debug/rebuild-from-hcs

# Validate trust calculations
curl http://localhost:3000/api/debug/trust-validation
```

---

## 🎪 Demo Day Emergency Contacts

### Technical Issues
- **Primary**: Check console logs first
- **Secondary**: Review network tab in browser
- **Tertiary**: Restart development server

### Hedera Network Issues  
- **Status Page**: https://status.hedera.com
- **Testnet Explorer**: https://hashscan.io/testnet
- **Mirror Node API**: https://testnet.mirrornode.hedera.com

### Last Resort
If everything fails, have these ready:
1. Screenshots of working demo
2. Code walkthrough slides  
3. Architecture diagrams
4. Pre-recorded demo video

---

*Remember: The goal is to show real HCS integration. Even if some features are laggy, emphasize that we're using actual blockchain consensus, not a simulation.*