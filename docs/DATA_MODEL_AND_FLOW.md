# TrustMesh Data Model & Flow Documentation

## Overview
TrustMesh uses a **dual-path data architecture**:
1. **Client-Side Ingestion** → Live WebSocket + REST backfill → SignalsStore (in-memory + localStorage)
2. **Server-Side Direct Query** → REST mirror API → On-demand aggregation

## Core Data Entities

### 1. SignalEvent (Canonical Event Structure)
```typescript
interface SignalEvent {
  id?: string                    // Unique identifier
  type: string                   // Event type (see Event Types below)
  actor: string                  // Who performed the action (peerId)
  target?: string                // Optional counterparty (peerId)
  ts: number                     // Epoch milliseconds
  topicId: string                // HCS topic ID (0.0.XXXXXX)
  metadata?: Record<string, any> // Raw payload/extra fields
  source: 'hcs' | 'hcs-cached'   // Provenance (live vs backfilled)
}
```

### 2. BondedContact
```typescript
interface BondedContact {
  peerId: string      // User ID (e.g., "tm-alex-chen")
  handle?: string     // Display name
  bondedAt: number    // When bond was created (epoch ms)
  trustLevel?: number // Optional trust weight
}
```

### 3. TrustStats
```typescript
interface TrustStats {
  allocatedOut: number  // Trust tokens I've given
  cap: number           // My total trust capacity (default: 9)
  receivedIn: number    // Trust tokens I've received
  pendingOut: number    // Pending trust allocations
}
```

## HCS Event Types & Lifecycle

### Contact Events (TOPIC_CONTACT)
```
1. CONTACT_REQUEST
   - actor: requester
   - target: recipient
   - Sent when user wants to connect

2. CONTACT_ACCEPT / CONTACT_ACCEPTED / CONTACT_BONDED
   - actor: acceptor
   - target: original requester
   - Creates bidirectional bond
   - BOTH users now see each other in contacts
```

### Trust Events (TOPIC_TRUST)
```
3. TRUST_ALLOCATE
   - actor: trust giver
   - target: trust receiver
   - metadata.weight: number (default 1)
   - Allocates trust tokens (scarce resource, max 9)

4. TRUST_REVOKE
   - actor: trust revoker
   - target: previous recipient
   - Removes trust allocation

5. TRUST_ACCEPT / TRUST_DECLINE
   - Future states for trust confirmation flow
```

### Recognition Events (TOPIC_SIGNAL / TOPIC_RECOGNITION)
```
6. RECOGNITION_MINT
   - actor: token issuer
   - target: token recipient
   - metadata: { category, name, tokenId }
   - Creates NFT-style recognition badge
```

### Profile Events (TOPIC_PROFILE)
```
7. PROFILE_UPDATE
   - actor: profile owner
   - metadata: { displayName, bio, avatar, etc. }
```

## Data Flow Paths

### Path A: Client-Side Ingestion (Real-Time UI)
```
┌─────────────────────────────────────────────────────────────┐
│  1. App Startup (app/layout.tsx)                            │
│     └─> BootHCSClient component                            │
│         └─> bootIngestionOnce()                            │
│                                                             │
│  2. Ingestion Start (lib/ingest/ingestor.ts)              │
│     ├─> backfillAllTopics()                               │
│     │   ├─> Fetch last 200 msgs per topic via REST       │
│     │   └─> Normalize & add to SignalsStore              │
│     │                                                       │
│     └─> startStreamingAllTopics()                         │
│         ├─> WebSocket connect per topic                   │
│         ├─> On new message → normalize → store            │
│         └─> Fallback polling if WS drops                  │
│                                                             │
│  3. SignalsStore (lib/stores/signalsStore.ts)             │
│     ├─> In-memory array (max 200 events, LRU)            │
│     ├─> Persisted to localStorage                         │
│     ├─> React hook: useSignals(selector)                  │
│     └─> Queries: getByType, getByActor, getScoped        │
│                                                             │
│  4. UI Pages Subscribe                                     │
│     ├─> Contacts: useHcsEvents('contact', 'trust')       │
│     ├─> Signals: useHcsEvents('trust', 'recognition')    │
│     └─> useHcsEvents → polls /api/hcs/events every 2.5s  │
└─────────────────────────────────────────────────────────────┘
```

### Path B: Server-Side Direct Query (Circle API)
```
┌─────────────────────────────────────────────────────────────┐
│  1. Circle Page Load                                        │
│     └─> fetch('/api/circle?sessionId=tm-alex-chen')        │
│                                                             │
│  2. API Handler (app/api/circle/route.ts)                  │
│     ├─> listSince(TOPIC_TRUST, undefined, 200)            │
│     ├─> listSince(TOPIC_CONTACT, undefined, 200)          │
│     └─> Aggregate raw messages from mirror node           │
│                                                             │
│  3. Data Aggregation (lib/services/HCSDataUtils.ts)        │
│     ├─> getBondedContactsFromHCS(events, sessionId)       │
│     │   ├─> Find CONTACT_ACCEPT events                    │
│     │   ├─> Filter pairs including sessionId              │
│     │   └─> Return BondedContact[]                        │
│     │                                                       │
│     ├─> getTrustStatsFromHCS(events, sessionId)           │
│     │   ├─> Filter TRUST_ALLOCATE where actor=sessionId   │
│     │   ├─> Sum trust weights                             │
│     │   └─> Return { allocatedOut, cap: 9, receivedIn }   │
│     │                                                       │
│     └─> getTrustLevelsPerContact(events, sessionId)       │
│         └─> Map<peerId, {allocatedTo, receivedFrom}>      │
│                                                             │
│  4. Response JSON                                           │
│     {                                                       │
│       success: true,                                        │
│       bondedContacts: BondedContact[],                     │
│       trustStats: { allocatedOut, maxSlots, bondedContacts},│
│       trustLevels: Record<peerId, {allocatedTo, receivedFrom}>│
│     }                                                       │
└─────────────────────────────────────────────────────────────┘
```

## Data Relationships & Rules

### Contact Bond Rules
- **Bidirectional**: CONTACT_ACCEPT creates bond for BOTH users
- **Key Pattern**: Sorted pair `[alice, bob].sort().join('|')`
- **Exclusion**: User never appears in own contacts list

### Trust Allocation Rules
- **Scarcity**: Max 9 trust tokens per user (`cap = 9`)
- **Tracking**: Each allocation has weight (default: 1)
- **Direction**: Trust is **given** from actor to target
- **Circle Membership**: Contact is in "Circle" if `allocatedTo > 0`

### Trust + Contact Relationship
```
State 1: No Relationship
  - alice and bob are strangers

State 2: Contact Request Sent
  - CONTACT_REQUEST(alice → bob)
  - bob sees pending request

State 3: Bonded Contact
  - CONTACT_ACCEPT(bob → alice)
  - BOTH users now have each other in contacts
  - Can NOW allocate trust

State 4: Trust Allocated → Circle Member
  - TRUST_ALLOCATE(alice → bob, weight=1)
  - bob appears in alice's "Circle of Trust"
  - bob's circle slot is "lit up" in LED visualization
```

## HCS Topics Configuration

```env
TOPIC_CONTACT=0.0.6896006      # Contact requests & bonds
TOPIC_TRUST=0.0.6896005        # Trust allocations
TOPIC_RECOGNITION=0.0.6895261  # Recognition NFTs
TOPIC_PROFILE=0.0.6896008      # Profile updates
```

## Current Data Flow Issues

### ✅ Working
- HCS topics have live data on testnet
- Mirror node API returns messages correctly
- Client-side ingestion system is wired up
- Server-side `/api/circle` endpoint exists

### ⚠️ Issue
- **Server API returns 0 events** even though mirror has data
- Root cause: Likely caching or topic ID mismatch
- Fix needed: Debug `listSince()` in serverMirror.ts

## Next Steps for Data Flow

1. **Debug server mirror fetching**
   - Add logging to `listSince()` to see actual fetch URLs
   - Check if topic IDs match between .env and API

2. **Verify client ingestion status**
   - Run: `node scripts/check-ingestion.js`
   - Check if SignalsStore is populated

3. **Test end-to-end flow**
   - Load Circle page → should show bonded contacts
   - Load Contacts page → should show all bonds
   - Load Signals page → should show activity feed

4. **Data consistency**
   - Ensure both paths (client + server) see same events
   - Consider unified caching strategy

## Debug Commands

```bash
# Check ingestion status
node scripts/check-ingestion.js

# Manual trigger ingestion
curl -X POST http://localhost:3002/api/debug/trigger-ingestion

# Check mirror node directly
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.6896005/messages?limit=5"

# Browser console debug
window.signalsStore.getSummary()
window.trustmeshIngest.stats()
window.trustmeshBoot.status()
```

## Architecture Decision: Why Two Paths?

**Client-Side Ingestion** (Real-time, reactive UI)
- ✅ WebSocket live updates
- ✅ React hooks for subscriptions
- ✅ Optimized for UI responsiveness
- ❌ Limited to 200 events (LRU cache)
- ❌ Browser-only (no SSR)

**Server-Side Direct Query** (Complete data, SEO-friendly)
- ✅ Full event history (200+ messages)
- ✅ Works in SSR/SSG contexts
- ✅ No client-side cache limits
- ❌ Higher latency (REST fetch each request)
- ❌ No live updates without polling

**Ideal**: Both paths should converge to same data, validated by integration tests.
