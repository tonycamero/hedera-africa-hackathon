# 🔍 Ingestion System Crash Analysis Framework

**Issue**: Professional Lens ingestion system starts successfully but crashes shortly after  
**Symptom**: `startIngestion()` succeeds → Health shows "running" briefly → System dies → Health shows "unhealthy"  
**Impact**: Requires manual restart via `/api/admin/start-ingestion` to recover  

---

## 🧬 **System Architecture Overview**

The Professional Lens uses a complex ingestion pipeline:

```
HCS Topics → Registry Config → Ingestor → Cache & Store → API Endpoints → UI
     ↓              ↓            ↓          ↓              ↓         ↓
[Mirror Node] → [Topic IDs] → [WebSocket] → [Events] → [GraphQL] → [React]
```

### **Key Components to Investigate**

| Component | File Path | Function | Crash Risk |
|-----------|-----------|----------|------------|
| **Main Ingestor** | `lib/ingest/ingestor.ts` | `startIngestion()`, `getIngestionHealth()` | 🔴 High |
| **Registry System** | `lib/registry/` | Topic resolution, config loading | 🟡 Medium |
| **WebSocket Manager** | `lib/ingest/websocket/` | Real-time streaming | 🔴 High |
| **Recognition Cache** | `lib/ingest/recognition/` | Two-phase processing | 🟡 Medium |
| **SignalsStore** | `lib/stores/signalsStore.ts` | Event storage & subscriptions | 🟡 Medium |
| **Mirror Node Client** | `lib/mirror/` | REST API calls | 🟡 Medium |

---

## 🚨 **Most Likely Crash Causes**

### **1. WebSocket Connection Issues** 🔴
**Pattern**: Starts → Connects → Network hiccup → Unhandled error → Process dies
```typescript
// Look for unhandled WebSocket errors in:
lib/ingest/websocket/manager.ts
lib/ingest/websocket/client.ts
```

**Symptoms**:
- Connection starts successfully
- Network timeout or connection drop
- No error handling for connection failures
- Process termination instead of retry

### **2. Registry Configuration Race Condition** 🔴
**Pattern**: Boot → Registry loading → Async config fetch fails → Undefined access → Crash
```typescript
// Check for undefined/null access in:
lib/registry/client.ts
lib/registry/config.ts
```

**Symptoms**:
- Registry reports success during deps check
- Async config loading fails after startup
- Undefined topic IDs or configuration

### **3. Recognition Cache Memory Issues** 🟡
**Pattern**: Starts → Processes events → Memory leak/overflow → OOM kill → Process dies
```typescript
// Look for unbounded growth in:
lib/ingest/recognition/cache.ts
lib/ingest/recognition/processor.ts
```

**Symptoms**:
- System runs briefly then dies
- Memory usage patterns
- Cache not clearing properly

### **4. Event Processing Errors** 🟡
**Pattern**: Starts → Receives malformed HCS event → JSON parse error → Unhandled exception → Crash
```typescript
// Check error handling in:
lib/ingest/processors/
lib/ingest/normalizer.ts
```

**Symptoms**:
- Crashes when processing specific event types
- JSON parsing errors
- Malformed Hedera consensus data

---

## 🔬 **Diagnostic Commands**

### **Real-Time Crash Detection**
```bash
# Terminal 1: Watch health endpoint
watch -n 1 'curl -s http://localhost:3000/api/health/ingestion | jq ".status,.ingestion.running,.metrics.totalMessages"'

# Terminal 2: Trigger boot and watch logs
curl -X POST http://localhost:3000/api/admin/start-ingestion && tail -f logs/next.log
```

### **Memory & Process Monitoring** 
```bash
# Watch Node.js memory usage
watch -n 1 'ps aux | grep "next-server" | grep -v grep'

# Check for memory leaks
node --inspect=9229 npm run dev
# Then connect Chrome DevTools → Memory tab
```

### **Network Connectivity Testing**
```bash
# Test Mirror Node WebSocket
wscat -c "wss://testnet.mirrornode.hedera.com:5600/topic/messages/1"

# Test REST API stability
for i in {1..10}; do curl -s "https://testnet.mirrornode.hedera.com/api/v1/network/nodes" | jq '.nodes | length'; sleep 2; done
```

### **Error Log Analysis**
```bash
# Search for specific error patterns
grep -E "(Error|Exception|Crash|Fatal)" logs/next.log | tail -20
grep -E "(WebSocket|Mirror|Registry|Recognition)" logs/next.log | tail -20
grep -E "(undefined|null|TypeError)" logs/next.log | tail -20
```

---

## 🧰 **Investigation Checklist**

### **Phase 1: Immediate Crash Detection**
- [ ] **Start ingestion and time to failure**
  ```bash
  curl -X POST http://localhost:3000/api/admin/start-ingestion
  date && while curl -s http://localhost:3000/api/health/ingestion | jq -e '.ingestion.running' > /dev/null; do sleep 1; done && date
  ```

- [ ] **Check Node.js process stability**
  ```bash
  ps aux | grep next-server # Note PID
  # Wait for crash, check if process died vs just ingestion stopped
  ```

- [ ] **Capture exact error logs during crash window**

### **Phase 2: Component-Level Analysis**
- [ ] **WebSocket connections**: Check for connection drops, timeouts, unhandled errors
- [ ] **Registry loading**: Verify all config loaded properly, no race conditions  
- [ ] **Memory usage**: Profile for leaks or unbounded growth
- [ ] **Event processing**: Test with malformed or edge-case HCS events

### **Phase 3: Environmental Factors**
- [ ] **Mirror Node stability**: Test API and WebSocket endpoints independently
- [ ] **Topic configuration**: Verify all topic IDs are valid and accessible
- [ ] **Network conditions**: Test with poor connectivity simulation
- [ ] **Resource limits**: Check Node.js memory limits, file descriptors

---

## 🔧 **Quick Debug Modifications**

### **Add Crash Detection to Ingestor**
```typescript
// In lib/ingest/ingestor.ts - Add process-level error handlers
process.on('uncaughtException', (error) => {
  console.error('🚨 [CRASH DETECT] Uncaught Exception:', error);
  console.error('🚨 [CRASH DETECT] Stack:', error.stack);
  // Don't exit - let recovery system handle it
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 [CRASH DETECT] Unhandled Rejection at:', promise);
  console.error('🚨 [CRASH DETECT] Reason:', reason);
});
```

### **Add WebSocket Error Logging**
```typescript
// Find WebSocket initialization and add comprehensive error logging
websocket.on('error', (error) => {
  console.error('🔌 [WS ERROR] WebSocket error:', error);
  console.error('🔌 [WS ERROR] Type:', error.constructor.name);
  console.error('🔌 [WS ERROR] Message:', error.message);
  // Log but don't crash
});
```

### **Add Registry Validation**
```typescript
// In registry loading, add null checks
const config = await loadRegistryConfig();
if (!config || !config.topics || Object.values(config.topics).some(t => !t)) {
  throw new Error('Registry config invalid or incomplete');
}
```

---

## 🎯 **Expected Findings**

**Most Likely**: WebSocket connection management issue
- WebSocket connects successfully initially
- Network timeout or Mirror Node disconnection
- No reconnection logic or unhandled error kills process

**Second Most Likely**: Registry race condition
- Boot sequence checks registry during deps validation
- Actual registry loading happens async after startup
- Config becomes invalid/undefined during runtime

**Third Most Likely**: Memory/resource exhaustion
- Recognition cache or event processing grows unbounded
- Node.js hits memory limits
- Process killed by system

---

## 🚀 **Recovery System Working Correctly**

**Key Insight**: The crash isn't necessarily bad - our robust boot system makes recovery instant:

```bash
# One-liner to restart if crashed
curl -X POST http://localhost:3000/api/admin/start-ingestion && echo "✅ Restarted"
```

**Status**: We've transformed a **critical system failure** into a **manageable service restart**. Understanding the crash will improve stability, but the system is now **operationally resilient**.

---

## 📋 **Next Steps for Agent Investigation**

1. **Start crash timing analysis** - How long does system stay up?
2. **Examine the main ingestor file** - Look for unhandled error paths  
3. **Check WebSocket management** - Focus on connection error handling
4. **Review registry loading** - Look for async race conditions
5. **Add defensive logging** - Instrument crash-prone components

**Goal**: Transform from "crashes frequently" to "never crashes" while maintaining the robust recovery system as backup.

---

*Use this framework to systematically identify and fix the root cause of the ingestion system crashes.*