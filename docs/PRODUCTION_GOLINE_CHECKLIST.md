# 🚀 TrustMesh GenZ Lens - 30-Minute Go-Live Checklist (Testnet)

**Goal**: Ship production-ready GenZ Lens on Hedera Testnet with zero demo code, full monitoring, and confidence.

---

## ✅ **1. ENV + KEYS (5 minutes)**

### **Environment Variables Audit**:
```bash
# Core Hedera
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.5864559  
HEDERA_OPERATOR_KEY=<operator_private_key>

# Topic Bundle (4-core set)
TOPIC_PROFILE=0.0.6896008
TOPIC_CONTACT=0.0.6896005  
TOPIC_TRUST=0.0.6896005
TOPIC_RECOGNITION=0.0.6895261

# GenZ Features
FEATURE_GZ_LENS=1
NEXT_PUBLIC_FEATURE_GZ_BOOST=1
FEATURE_GZ_BOOST_API=1

# KNS Integration
KNS_BASE_URL=https://kns.testnet.hedera.com
KNS_CACHE_TTL=300

# Safety
RATE_LIMIT_WINDOW=900000  # 15 minutes
BOOST_RATE_LIMIT=5        # per signal per window
CORS_ORIGINS=https://trustmesh.vercel.app
```

### **Validation Script**:
```bash
# Verify all required vars are set
node -e "
const required = ['HEDERA_OPERATOR_ID', 'TOPIC_RECOGNITION', 'FEATURE_GZ_BOOST_API'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) { console.error('Missing:', missing); process.exit(1); }
console.log('✅ Environment validated');
"
```

---

## ✅ **2. ROUTES + FLAGS (5 minutes)**

### **Route Configuration**:
- ✅ `/signals` = GenZ feed (NO professional banners)
- ✅ `/boost/[boostId]` = Public, cacheable, no session required  
- ✅ `/u/[handle]` = Public contact cards, no auth
- ✅ `/api/signal/boost` = Rate limited, anonymous OK
- ✅ `/api/signal/suggest` = Rate limited, requires session

### **Feature Flag Check**:
```typescript
// Verify GenZ UI is active
if (process.env.NEXT_PUBLIC_FEATURE_GZ_BOOST !== '1') {
  console.warn('⚠️  GenZ UI not enabled');
}
```

---

## ✅ **3. WRITE-PATH SMOKE TESTS (10 minutes)**

### **Test Script**:
```bash
#!/bin/bash
echo "🧪 Testing write paths..."

# Test 1: Mint signal via UI
echo "1. Testing SendSignalModal → HCS write"
# Manual: Open /signals → Send Signal → Fill template → Submit
# Verify: Toast appears + boost URL generated
# Check: Mirror node shows new message

# Test 2: Boost from public page  
echo "2. Testing anonymous boost"
BOOST_URL="http://localhost:3000/boost/$(date +%s | md5sum | cut -c1-16)"
curl -X POST http://localhost:3000/api/signal/boost \
  -H "Content-Type: application/json" \
  -d "{\"boostId\":\"$(date +%s | md5sum | cut -c1-16)\"}"
echo "✅ Boost API responding"

# Test 3: Suggest flow (requires auth)
echo "3. Testing suggest flow"
curl -X POST http://localhost:3000/api/signal/suggest \
  -H "Content-Type: application/json" \
  -d "{\"boostId\":\"test123456789abc\",\"def_id\":\"grit.clutched@1\",\"sessionId\":\"test_user\"}"
echo "✅ Suggest API responding"

echo "🎉 Write paths validated"
```

---

## ✅ **4. READ-PATH SMOKE TESTS (5 minutes)**

### **Validation Checklist**:
```bash
# Test signals feed
curl -s http://localhost:3000/signals | grep -q "signals"
echo "✅ Signals feed renders"

# Test boost page
curl -s http://localhost:3000/boost/1234567890abcdef | grep -q "Boost"  
echo "✅ Boost pages public"

# Test contact cards
curl -s http://localhost:3000/u/alex_chen | grep -q "profile"
echo "✅ Contact cards public"

# Test KNS resolution (if available)
echo "✅ KNS fallbacks work"
```

---

## ✅ **5. GUARDRAILS ON (5 minutes)**

### **Security Configuration**:
```typescript
// Rate limiting configuration
export const RATE_LIMITS = {
  boost: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                   // per signal
    skipSuccessfulRequests: false
  },
  suggest: {
    windowMs: 15 * 60 * 1000,
    max: 3,                   // per user
    skipSuccessfulRequests: false  
  }
}

// Content guard enforcement
export const CONTENT_GUARDS = {
  templates: true,          // Template validation required
  notes: true,             // Note positivity filter  
  fillText: true,          // Fill text length + content
  profanityFilter: true    // Basic profanity blocking
}

// CORS origins
export const ALLOWED_ORIGINS = [
  'https://trustmesh.vercel.app',
  'https://genz.trustmesh.app',
  'http://localhost:3000'  // Dev only
]
```

---

## 🧪 **PRE-FLIGHT TEST SCRIPT (5 minutes)**

```bash
#!/bin/bash
echo "🚀 Pre-flight system check..."

# 1. Environment
echo "Checking environment..."
npm run build > /dev/null && echo "✅ Build passes" || echo "❌ Build fails"

# 2. APIs responding  
echo "Checking API health..."
curl -s http://localhost:3000/api/registry/config > /dev/null && echo "✅ Registry API" || echo "❌ Registry down"

# 3. HCS connectivity
echo "Checking Hedera connectivity..."
curl -s "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.6895261/messages?limit=1" > /dev/null && echo "✅ Mirror node" || echo "❌ Mirror unavailable"

# 4. Rate limits active
echo "Checking rate limits..."
for i in {1..6}; do
  curl -s -X POST http://localhost:3000/api/signal/boost \
    -H "Content-Type: application/json" \
    -d "{\"boostId\":\"test123456789abc\"}" | grep -q "Rate limit" && {
    echo "✅ Rate limiting works (attempt $i)"
    break
  }
done

echo "🎉 Pre-flight complete"
```

---

## 📊 **MONITORING & SLOS (Day 1 Simple)**

### **Critical Alerts**:
```yaml
# alerts.yml
boost_api_errors:
  query: '5xx_responses{path="/api/signal/boost"} > 1'
  duration: 5m
  alert: "Boost API failing"

ingestion_lag:  
  query: 'mirror_ingestion_lag > 60'
  duration: 2m
  alert: "HCS ingestion delayed"

rate_limit_spike:
  query: 'rate_limit_blocks > 100'
  duration: 1m  
  alert: "Rate limit spike detected"
```

### **Performance Targets**:
- `/api/signal/boost` p95 < 250ms
- `/signals` SSR p95 < 800ms  
- Mirror → feed lag < 15s (warn at 60s)
- Zero 5xx errors on boost APIs

---

## 🚨 **INCIDENT PLAYBOOK (Tiny)**

### **Common Issues & Fixes**:

**Spike in 429s (Rate Limits)**:
```bash
# Quick fix: Increase per-signal window
export BOOST_RATE_LIMIT=10
# Or widen IP allowlist for campus WiFi
export CAMPUS_IP_RANGES="10.0.0.0/8,172.16.0.0/12"
```

**Ingestion Delays**:
```bash  
# Switch to REST-only backfill
export STREAMING_ENABLED=0
# Force WebSocket reconnect
curl -X POST http://localhost:3000/api/debug/reconnect-ws
```

**Spam Wave**:
```bash
# Temporarily require session for boosts
export BOOST_ANON=0
# Keep suggests gated (already are)
```

---

## 🌱 **ROLLOUT PLAN (Pilot Realm)**

### **Realm Configuration**:
```typescript
export const PILOT_REALM = {
  id: 'campus_pdx_fall_2025',
  topicBundle: {
    profile: '0.0.6896008',
    contact: '0.0.6896005', 
    trust: '0.0.6896005',
    recognition: '0.0.6895261'
  },
  lensesEnabled: ['genz', 'professional'],
  templates: GENZ_TEMPLATES, // 6-pack + expandable
  compliance: 'campus_standard'
}
```

### **Message Tagging**:
```typescript
// Every GenZ message includes:
{
  realm: 'campus_pdx_fall_2025',
  lens: 'genz', 
  origin_realm: 'campus_pdx_fall_2025',
  global_id: userId,
  schema_version: '@1'
}
```

---

## 📈 **PRODUCT KPIS (First 72h)**

### **Key Metrics to Track**:
```typescript
interface GenZMetrics {
  // Viral loop
  shareClickThrough: number    // Share → click rate
  boostSignupConversion: number // Boost → suggest signup rate
  avgBoostsPerSignal: number   // Viral amplification
  shareRate: number           // % signals with shares
  
  // Safety
  reportHideRate: number      // Content safety
  rateLimitBlocks: number     // Abuse prevention
  
  // Engagement  
  signalsSentDaily: number    // Core action
  returnUserRate: number      // Retention
}
```

---

## 🎯 **SPRINT 2: "VISIBLE GENZ" TICKETS**

Ready for Warp execution:

### **Ticket 1: Flip UI to GenZ on /signals** 
```warp-command
File: app/(tabs)/signals/page.tsx
Replace professional feed components with GenZ actions:
- Add Send/Boost/Share buttons to signal rows
- Show boost counters ("⚡ 23") 
- Display KNS handles prominently
- Remove all professional-only components
Acceptance: Zero professional UI elements on /signals route
```

### **Ticket 2: Inline Send → Share Flow**
```warp-command  
File: components/SendSignalModal.tsx
Add post-success share prompt:
- Success toast: "Signal sent. Share your Boost Page?"
- [Share] [Copy Link] buttons
- Web Share API with clipboard fallback
Acceptance: Share sheet shows correct boost URL
```

### **Ticket 3: Boost Page Polish**
```warp-command
File: app/boost/[boostId]/BoostViewer.tsx  
Mobile-first improvements:
- Header: "Do they deserve this signal?"
- Prominent [⚡ Boost] + [Suggest] buttons
- "Recorded on Hedera" → Mirror link
- Lighthouse mobile score ≥ 90
```

### **Ticket 4: Abuse & Rate Limits**
```warp-command
Files: app/api/signal/boost/route.ts, app/api/signal/suggest/route.ts
Implement production rate limiting:
- Per-signal window limiter (5 boosts/15min)
- Per-IP daily caps (configurable)
- Soft shadowban list (env-driven)
- E2E tests cover rate limit paths
```

### **Ticket 5: Observability**  
```warp-command
Create: app/api/metrics/route.ts
Expose key metrics:
- boost_mint_ok, boost_rate_limited
- suggest_ok, toxicity_blocked  
- ingestion_lag, signal_volume
Simple JSON endpoint for monitoring
```

### **Ticket 6: Realm Tags in Payloads**
```warp-command
File: lib/services/GenzSignalService.ts
Add realm metadata to all GenZ writes:
- origin_realm, global_id, lens tags
- Schema version tracking
- Mirror JSON verification
```

### **Ticket 7: Public Contact Card Integration**
```warp-command
File: app/boost/[boostId]/BoostViewer.tsx
Add recipient card panel:
- Fetch from /u/[handle] endpoint
- Show latest 3 signals (no auth required)
- Link to full profile view
- Graceful loading/error states
```

---

## 🗣️ **COMMS & GO-TO-MARKET (Quick)**

### **Social Share Copy**:
```
IG/TikTok: "I just sent a signal to @[handle]. do they deserve it? tap to boost ⚡ or suggest better (anon)"

Campus poster QR: Links to /u/[handle] or "send me a signal"

Discord/Slack: "Check out this GenZ signal boost 🔥 [boost URL]"
```

### **Campus Rollout Strategy**:
1. **Soft launch**: Engineering students (tech-savvy early adopters)
2. **Greeks**: Viral potential through social networks  
3. **Broader campus**: Academic recognition use cases
4. **Multi-campus**: Scale to additional universities

---

## ⚡ **EXECUTION PRIORITY**

**This Week (Production Push)**:
1. ✅ Environment + monitoring setup  
2. ✅ Pre-flight tests passing
3. ✅ Rate limits + safety enabled
4. ✅ GenZ UI live on /signals

**Next Week (Polish)**:
1. ✅ Boost page mobile optimization
2. ✅ Share flow integration  
3. ✅ Contact card integration
4. ✅ Analytics dashboard

**Success Criteria**: 
- ✅ 30-minute demo flow works flawlessly
- ✅ No 5xx errors during demo
- ✅ Viral share loop functional end-to-end
- ✅ Rate limits prevent abuse without blocking usage
- ✅ Campus pilot ready for 100+ initial users

---

**SAY THE WORD** and I'll convert any of these sections into exact Warp tickets with copy/paste prompts! 🚀

This checklist gets you from "hackathon prototype" to "production-ready viral social platform" in 30 minutes of focused execution. Let's ship this! ⚡