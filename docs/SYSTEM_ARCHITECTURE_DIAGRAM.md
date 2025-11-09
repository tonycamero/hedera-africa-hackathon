# TrustMesh System Architecture: Ingestor → Registry → Store

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HEDERA TESTNET                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ TOPIC_CONTACT    │  │ TOPIC_TRUST      │  │ TOPIC_RECOGNITION│          │
│  │ 0.0.6896006      │  │ 0.0.6896005      │  │ 0.0.6895261      │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                      │                     │
│           └─────────────────────┴──────────────────────┘                     │
│                                  │                                           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   │
                ┌──────────────────┴───────────────────┐
                │                                      │
                │  Mirror Node APIs                    │
                │  - REST: /api/v1/topics/X/messages   │
                │  - WebSocket: Live streaming         │
                └──────────────────┬───────────────────┘
                                   │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                   │
                    ┌──────────────┴──────────────┐
                    │     REGISTRY                │
                    │  (lib/registry/)            │
                    │                             │
                    │  • serverRegistry.ts        │
                    │    - loadRegistryFromEnv()  │
                    │    - Topics mapping         │
                    │    - Mirror URLs            │
                    │                             │
                    │  • BootRegistryClient.tsx   │
                    │    - Client-side init       │
                    │                             │
                    │  Config Source: .env.local  │
                    │  ├─ TOPIC_CONTACT          │
                    │  ├─ TOPIC_TRUST            │
                    │  ├─ TOPIC_RECOGNITION      │
                    │  └─ MIRROR_NODE_URL         │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
            ┌───────▼─────────┐          ┌───────▼─────────┐
            │  CLIENT PATH    │          │  SERVER PATH    │
            │  (Browser)      │          │  (API Routes)   │
            └─────────────────┘          └─────────────────┘
                    │                             │
                    │                             │
┌───────────────────▼──────────────┐  ┌──────────▼───────────────────┐
│  INGESTOR                        │  │  DIRECT MIRROR QUERY        │
│  (lib/ingest/ingestor.ts)        │  │  (lib/mirror/serverMirror.ts)│
│                                  │  │                             │
│  1. startIngestion()             │  │  1. listSince(topicId)      │
│     ├─ backfillAllTopics()       │  │     ├─ fetch() mirror REST  │
│     │  └─ REST: last 200 msgs    │  │     ├─ pagination (10 hops) │
│     │                             │  │     └─ 3s cache             │
│     └─ startStreamingAllTopics() │  │                             │
│        ├─ WebSocket per topic    │  │  2. decodeBase64Json()      │
│        └─ Fallback polling       │  │     └─ Buffer decode        │
│                                  │  │                             │
│  2. handleMessage()              │  │  Used by:                   │
│     ├─ normalizeHcsMessage()     │  │  • /api/circle              │
│     └─ signalsStore.add()        │  │  • /api/hcs/events          │
│                                  │  │                             │
│  Status: Check via               │  │  Status: Check via          │
│  /api/health/ingestion           │  │  curl mirror directly       │
└───────────────────┬──────────────┘  └──────────┬──────────────────┘
                    │                             │
                    │                             │
                    ▼                             ▼
         ┌──────────────────────┐      ┌────────────────────┐
         │  SIGNALSSTORE        │      │  API RESPONSE      │
         │  (lib/stores/)       │      │  (JSON)            │
         │                      │      │                    │
         │  • In-memory array   │      │  Direct to FE      │
         │  • Max 200 events    │      │  No store layer    │
         │  • LRU eviction      │      └────────────────────┘
         │  • localStorage      │
         │  • React hooks       │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  REACT HOOKS         │
         │                      │
         │  • useHcsEvents()    │
         │    - Polls API       │
         │    - 2.5s interval   │
         │                      │
         │  • useSignals()      │
         │    - Subscribe store │
         │    - React sync      │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  DATA UTILS          │
         │  (HCSDataUtils.ts)   │
         │                      │
         │  Aggregation:        │
         │  • getBondedContacts │
         │  • getTrustStats     │
         │  • getTrustLevels    │
         │                      │
         │  Caching: 10s TTL    │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  UI PAGES            │
         │                      │
         │  • /contacts         │
         │  • /circle           │
         │  • /signals          │
         └──────────────────────┘
```

## Component Roles

### 1. **REGISTRY** (Configuration Layer)
**Files**: `lib/registry/serverRegistry.ts`, `lib/registry/BootRegistryClient.tsx`

**Purpose**: Single source of truth for system configuration

**Responsibilities**:
- Load topic IDs from environment variables
- Provide mirror node URLs
- Validate configuration schema
- Expose config to both client and server

**Initialization**:
```typescript
// Server-side (automatic)
const registry = loadRegistryFromEnv()

// Client-side (via layout.tsx)
<BootRegistryClient />
```

**Status**: ✅ Working - Topics configured in .env.local

---

### 2. **INGESTOR** (Client-Side Live Feed)
**Files**: `lib/ingest/ingestor.ts`, `lib/boot/bootIngestion.ts`

**Purpose**: Maintain live, in-memory event cache for reactive UI

**Lifecycle**:
```typescript
// 1. App startup (layout.tsx)
<BootHCSClient />
  └─> bootIngestionOnce()
      └─> startIngestion()

// 2. Backfill historical data
backfillAllTopics()
  ├─ foreach topic in registry
  ├─ fetch last 200 messages via REST
  ├─ normalize & decode
  └─ add to SignalsStore

// 3. Start streaming
startStreamingAllTopics()
  ├─ open WebSocket per topic
  ├─ on message → normalize → store
  └─ fallback to REST polling if WS fails
```

**Current Status**: 
- ⚠️ Starting but failing to process messages (100 failed per topic)
- WebSocket connections active (4 connections)
- SignalsStore remains empty (0 events)

**Debug**:
```bash
# Check status
curl http://localhost:3000/api/health/ingestion | jq .

# Restart ingestion
curl -X POST http://localhost:3000/api/debug/trigger-ingestion
```

---

### 3. **SIGNALSSTORE** (In-Memory Event Cache)
**Files**: `lib/stores/signalsStore.ts`

**Purpose**: Fast, reactive event storage for UI

**Architecture**:
- In-memory array (max 200 events)
- LRU eviction when full
- Persisted to localStorage
- React subscription via `useSyncExternalStore`

**API**:
```typescript
// Add events
signalsStore.add(event)
signalsStore.addMany(events)

// Query
signalsStore.getAll()
signalsStore.getByType('CONTACT_ACCEPT')
signalsStore.getByActor(sessionId)

// React hook
const contacts = useSignals(store => 
  store.getByType('CONTACT_ACCEPT')
)
```

**Current Status**: 
- ⚠️ Empty (0 events)
- Ingestor failing to populate it

---

### 4. **SERVER MIRROR** (Direct Query Layer)
**Files**: `lib/mirror/serverMirror.ts`

**Purpose**: On-demand HCS data fetching for server-side APIs

**Used By**:
- `/api/circle` - Circle page data
- `/api/hcs/events` - Polled by useHcsEvents hook

**Features**:
- Direct fetch from mirror node
- Pagination support (10 hops max)
- 3-second cache
- Base64 message decoding

**Current Status**: 
- ✅ Fetching successfully (100+ messages per topic)
- ⚠️ But aggregation returns 0 events

**Debug Added**:
```typescript
console.log('[serverMirror] Fetching from:', url)
console.log('[serverMirror] Hop X: status 200')
console.log('[serverMirror] Received X messages')
```

---

### 5. **DATA UTILS** (Aggregation Layer)
**Files**: `lib/services/HCSDataUtils.ts`

**Purpose**: Transform raw HCS events into domain objects

**Functions**:
```typescript
// Extract bonded contacts from events
getBondedContactsFromHCS(events, sessionId)
  → BondedContact[]

// Calculate trust allocation stats
getTrustStatsFromHCS(events, sessionId)
  → { allocatedOut, cap, receivedIn }

// Per-contact trust levels
getTrustLevelsPerContact(events, sessionId)
  → Map<peerId, { allocatedTo, receivedFrom }>
```

**Current Status**:
- ✅ Logic is sound
- ⚠️ Getting 0 events as input
- Has 10s caching layer

---

## Current Problem Analysis

### Issue
**Server APIs return 0 events even though mirror node has data**

### Evidence
1. ✅ Mirror node has data (confirmed via curl)
2. ✅ serverMirror fetches 249 messages (100 + 50 + 99)
3. ❌ Circle API logs "Loaded 0 events from HCS"
4. ❌ Ingestion shows 400 failures (100 per topic × 4 topics)

### Root Cause
**Line 49-50 in `/app/api/circle/route.ts`** was passing `e.json` instead of full event object `e` to `toLegacyEventArray()`.

**FIXED** in recent edit, but needs verification.

### Testing Steps

1. **Reload `/contacts` page** - Check browser console:
   ```
   [ContactsPage] Loaded X contacts from HCS
   ```

2. **Check server logs** when loading `/contacts`:
   ```
   [API /circle] Loaded X events from HCS
   [API /circle] Event types: [...]
   ```

3. **Verify ingestion**:
   ```bash
   BASE_URL=http://localhost:3000 node scripts/check-ingestion.js
   ```

4. **Browser console debug**:
   ```javascript
   window.signalsStore.getSummary()
   // Should show: { total: X, countsByType: {...} }
   ```

---

## Expected Flow (When Working)

### Contacts Page Load
```
1. User loads /contacts
2. useHcsEvents('contact') starts polling
3. → fetch('/api/hcs/events?type=contact')
4. → serverMirror.listSince(TOPIC_CONTACT)
5. → Mirror returns 50 messages
6. → decodeBase64Json(message)
7. → toLegacyEventArray(items)
8. → normalize types to uppercase
9. → getBondedContactsFromHCS(events, 'tm-alex-chen')
10. → Filter CONTACT_ACCEPT events
11. → Return BondedContact[]
12. → setState in React
13. → UI shows contacts list ✅
```

### Current Broken Flow
```
1-8. ✅ Same (working)
9. ⚠️ Input events = [] (empty)
10-13. Returns 0 contacts
```

---

## Next Action

**Check the server console logs** when you load `/contacts` to see:
- How many events are being loaded
- What types they are
- If the recent fix worked

Then we'll know if the issue is in:
- A) Event decoding (serverMirror)
- B) Event normalization (toLegacyEventArray)  
- C) Event aggregation (HCSDataUtils)
