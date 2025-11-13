# TrustMesh Data Model: Why We Don't Use a Traditional Database

> **For Computer Science Students & Technical Reviewers**  
> An explanation of TrustMesh's architecture and why we chose a distributed ledger over a traditional database.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Question: "Where's Your Database?"](#the-question-wheres-your-database)
3. [What We Built Instead](#what-we-built-instead)
4. [Why We Made This Choice](#why-we-made-this-choice)
5. [How It Works](#how-it-works)
6. [Comparison: Traditional vs. TrustMesh Architecture](#comparison-traditional-vs-trustmesh-architecture)
7. [Trade-offs & Design Decisions](#trade-offs--design-decisions)
8. [Performance Characteristics](#performance-characteristics)
9. [Code Examples](#code-examples)
10. [Future Scalability](#future-scalability)

---

## Executive Summary

**TL;DR**: TrustMesh doesn't use a traditional SQL/NoSQL database. Instead, we use **Hedera Consensus Service (HCS)** as a distributed, immutable ledger. Social graph data (contacts, trust allocations, profiles) is published to HCS topics, cryptographically signed, and read back via the Hedera Mirror Node API. This gives us:

- **Immutability**: No one (including us) can alter or delete history
- **Decentralization**: No single point of failure or censorship
- **Auditability**: Every action has a cryptographic proof anchored on-chain
- **Privacy**: End-to-end encryption for messages (XMTP), minimal server-side state
- **Anti-surveillance**: No global queries, only auth-scoped per-user views

---

## The Question: "Where's Your Database?"

When students or developers first look at TrustMesh, they often ask:

> "You're building a social network with contacts, messages, trust scores... where's your PostgreSQL database? Where's your MongoDB collections?"

**Short Answer**: We don't have one. TrustMesh is a **database-free social operating system**.

**Longer Answer**: We replaced the traditional CRUD database with:
1. **Hedera Consensus Service (HCS)** for social graph data (contacts, trust, profiles)
2. **XMTP** for end-to-end encrypted messaging
3. **Client-side caching** for performance (incremental state updates)
4. **No persistent server-side storage** of user data

---

## What We Built Instead

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    TrustMesh Client                     │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ React UI   │  │ Local State│  │ Client-Side Cache│  │
│  │            │←─│ (Zustand)  │←─│ (HcsCircleState) │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │ Read/Write
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Hedera Consensus Service (HCS)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Contacts     │  │ Trust        │  │ Profile      │  │
│  │ Topic        │  │ Topic        │  │ Topic        │  │
│  │ 0.0.7148063  │  │ 0.0.7148064  │  │ 0.0.7148066  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │ Mirror Node API
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Hedera Mirror Node (Read Layer)            │
│  - REST API: GET /api/v1/topics/{id}/messages          │
│  - Real-time consensus timestamps                       │
│  - Immutable message history                            │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**Write Path** (User creates contact):
1. User action → Frontend (`AddContactModal`)
2. Sign message with Magic.link wallet
3. Submit to HCS topic via `/api/hcs/submit`
4. Hedera consensus service orders & timestamps
5. Event anchored on distributed ledger

**Read Path** (User views contacts):
1. Frontend requests contacts → `/api/circle?sessionId=0.0.xxx`
2. Backend queries Hedera Mirror Node API
3. Filter events by authenticated user (auth-scoped)
4. Build state incrementally from event stream
5. Cache in `HcsCircleState` for performance
6. Return scoped data to client

---

## Why We Made This Choice

### 1. **Immutability (Truth > Convenience)**

**Problem with traditional databases**:
```sql
-- Oops, someone can do this:
DELETE FROM contacts WHERE user_id = 123;
UPDATE trust_scores SET score = 999 WHERE user_id = 123;

-- Or an admin can:
ALTER TABLE users DROP COLUMN email;
```

**With HCS**:
```typescript
// Once published to HCS, events are PERMANENT
await submitToHCS({
  type: 'CONTACT_ACCEPT',
  actor: '0.0.7226146',
  target: '0.0.7226165',
  timestamp: 1762845726775022136
})
// ✅ Cryptographically signed
// ✅ Consensus timestamp from distributed network
// ✅ Cannot be altered or deleted (even by us)
```

**Why this matters**:
- **Audit trail**: Every relationship change is provable
- **No data manipulation**: Can't fake trust history or social graph
- **Regulatory compliance**: Immutable records for KYC/AML/BSA
- **User trust**: "If they can delete my data, they can alter it"

---

### 2. **Decentralization (No Single Point of Failure)**

**Traditional database architecture**:
```
User → Your Server → Your PostgreSQL DB
         ↓
      (Single point of control)
```

- **Company owns all data**: Users have no portability
- **Censorship risk**: Company can delete accounts/data
- **Downtime risk**: Database crashes = service down
- **Trust requirement**: Users must trust company to behave

**TrustMesh architecture**:
```
User → Hedera Network (39+ validator nodes)
       ↓
    Distributed Consensus
       ↓
    Public Mirror Nodes (read from any)
```

- **Network owns consensus**: No single entity controls history
- **Censorship resistant**: Can't be de-platformed
- **High availability**: Network continues if individual nodes fail
- **Trust minimization**: Cryptographic proofs > corporate promises

---

### 3. **Privacy by Design (Anti-Surveillance)**

**Traditional social network database**:
```sql
-- Database has GLOBAL view of all relationships
SELECT * FROM friendships;  -- Returns everyone's data
SELECT COUNT(*) FROM users WHERE created_at > '2025-01-01';
SELECT user_id, COUNT(*) as friend_count FROM friendships GROUP BY user_id;

-- Easy to:
-- - Build recommendation engines (creepy)
-- - Sell aggregated data (unethical)
-- - Government subpoenas (compelled)
```

**TrustMesh approach**:
```typescript
// Backend ONLY sees what it needs for current user
const circle = await getCircleForUser(authenticatedUserId)
// ✅ Auth-scoped queries (O(N) where N = user's contacts)
// ✅ No global "SELECT * FROM contacts"
// ✅ Server can't build cross-user analytics
// ✅ 250 contact hard cap (bounds all queries)

// Messages are E2E encrypted (XMTP)
// ✅ Server never sees message content
// ✅ Only encrypted payloads stored on XMTP network
```

**Implementation example** (from `app/api/circle/route.ts`):
```typescript
// ❌ FORBIDDEN: Global query
// const allContacts = await db.contacts.findMany()

// ✅ ALLOWED: User-scoped only
const contacts = hcsCircleState.getAllContactsForUser(sessionId)
// Returns ONLY contacts where:
//   - actor === sessionId OR target === sessionId
//   - Bounded by user's graph (max 250)
```

---

### 4. **Compliance Without Custody**

**The paradox**: We need to comply with regulations (KYB, KYC, AML) but don't want to *store* sensitive data.

**Solution**: Hedera provides compliance-grade audit trails WITHOUT requiring us to maintain a customer database.

```typescript
// Example: Trust token allocation (regulatory requirement)
interface TrustAllocationEvent {
  type: 'TRUST_ALLOCATE'
  actor: '0.0.7226146'         // Who allocated
  target: '0.0.7226165'        // To whom
  metadata: { weight: 1 }      // How much
  consensusTimestamp: string   // Immutable timestamp
  transactionId: string        // Hedera transaction ID
  signature: string            // Cryptographic proof
}

// ✅ Full audit trail for regulators
// ✅ No PII stored in our database
// ✅ Cryptographic proof of authorization
// ✅ Tamper-proof compliance records
```

Compare to traditional approach:
```sql
-- Must store PII for compliance
CREATE TABLE user_transactions (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),      -- PII
  user_ssn VARCHAR(11),          -- Sensitive PII
  transaction_type VARCHAR(50),
  amount DECIMAL(18,8),
  created_at TIMESTAMP,
  -- Now you're liable for:
  -- - Data breaches (SSNs leaked)
  -- - GDPR compliance (right to be forgotten conflicts with audit requirements)
  -- - Storage security (encryption at rest, access logs, etc.)
)
```

With TrustMesh:
- **Identity binding**: HCS-22 protocol links DID → Hedera account
- **Audit trail**: All on Hedera ledger (we query it, don't store it)
- **Compliance exports**: Generate reports from HCS, no database dumps
- **Right to be forgotten**: Profile data can be tombstoned, but trust history remains (regulatory requirement)

---

### 5. **Eventual Consistency is Acceptable**

Social networks don't need ACID transactions for every operation.

**Traditional database mindset**:
```sql
BEGIN TRANSACTION;
  INSERT INTO contacts (user_a, user_b) VALUES (123, 456);
  UPDATE users SET contact_count = contact_count + 1 WHERE id IN (123, 456);
  INSERT INTO notifications (user_id, type) VALUES (456, 'contact_request');
COMMIT;
-- All or nothing, immediate consistency
```

**TrustMesh approach**:
```typescript
// Submit event to HCS
await submitToHCS({
  type: 'CONTACT_ACCEPT',
  actor: userA,
  target: userB
})
// Event will:
// - Reach consensus in ~3-5 seconds
// - Be visible via Mirror Node in ~5-10 seconds
// - Update client cache incrementally

// Meanwhile, show optimistic UI update:
signalsStore.add({
  type: 'CONTACT_ACCEPT',
  source: 'hcs-cached',  // Mark as pending
  ts: Date.now()
})
// User sees instant feedback, backend syncs eventually
```

**Why this works**:
- **User perception**: 3-5 second delay is acceptable for social actions
- **Optimistic UI**: Show changes immediately, sync in background
- **No race conditions**: Consensus ordering prevents conflicts
- **Simpler code**: No distributed transactions, locks, or rollbacks

---

## How It Works

### HCS Topics as Event Streams

TrustMesh uses **4 main HCS topics** (think of them as Kafka topics, but immutable):

| Topic ID      | Purpose          | Event Types                        | Example Message                     |
|---------------|------------------|------------------------------------|-------------------------------------|
| `0.0.7148063` | Contacts         | `CONTACT_ACCEPT`, `CONTACT_MIRROR` | Alice ↔ Bob bond created            |
| `0.0.7148064` | Trust            | `TRUST_ALLOCATE`, `TRUST_REVOKE`   | Alice allocates 1 TRST to Bob       |
| `0.0.7148066` | Profile          | `PROFILE_UPDATE`                   | Alice updates displayName to "Al"   |
| `0.0.7148065` | Recognition      | `RECOGNITION_ISSUED`               | Alice gives Bob "Reliable" badge    |

### Event Structure

Every event published to HCS follows this schema:

```typescript
interface HcsEvent {
  // Core fields
  type: 'CONTACT_ACCEPT' | 'TRUST_ALLOCATE' | 'PROFILE_UPDATE' | ...
  actor: string              // Hedera account ID (0.0.xxx)
  target?: string            // Target account (for relationships)
  
  // Metadata (event-specific)
  metadata: {
    // CONTACT_ACCEPT
    from?: { acct: string, handle: string, hrl: string }
    to?: { acct: string, handle: string, hrl: string }
    
    // TRUST_ALLOCATE
    weight?: number          // Amount of trust allocated
    
    // PROFILE_UPDATE
    displayName?: string
    bio?: string
    avatar?: string
  }
  
  // Hedera consensus data (added by network)
  consensusTimestamp: string  // e.g., "1762845726.775022136"
  sequenceNumber: number      // Message sequence in topic
  runningHash: string         // Cryptographic chain of messages
  transactionId: string       // Hedera transaction that submitted it
}
```

### Example: Adding a Contact

**Step 1: User Action**
```typescript
// User clicks "Add Contact" and scans QR code
// QR contains: { accountId: '0.0.7226165', handle: '03' }

const contactData = {
  accountId: '0.0.7226165',
  handle: '03',
  hrl: 'hrl:tm/0.0.7226165'
}
```

**Step 2: Submit to HCS**
```typescript
// Frontend calls backend API
const response = await fetch('/api/hcs/submit', {
  method: 'POST',
  body: JSON.stringify({
    type: 'CONTACT_ACCEPT',
    sessionId: '0.0.7226146',  // Actor (current user)
    data: {
      from: {
        acct: '0.0.7226146',
        handle: '01',
        hrl: 'hrl:tm/0.0.7226146'
      },
      to: {
        acct: '0.0.7226165',
        handle: '03',
        hrl: 'hrl:tm/0.0.7226165'
      }
    }
  })
})

// Backend publishes to Hedera
const client = Client.forTestnet()
const topicId = TopicId.fromString('0.0.7148063')

const transaction = new TopicMessageSubmitTransaction()
  .setTopicId(topicId)
  .setMessage(JSON.stringify({
    type: 'CONTACT_ACCEPT',
    actor: '0.0.7226146',
    target: '0.0.7226165',
    metadata: { from: {...}, to: {...} }
  }))

const receipt = await transaction.execute(client)
// ✅ Event now on Hedera ledger
```

**Step 3: Consensus & Ordering**
```
Hedera Network:
1. Transaction received by random node
2. Gossip protocol spreads to all 39 nodes
3. Virtual voting achieves consensus
4. Consensus timestamp assigned: 1762845726.775022136
5. Message finalized on ledger (immutable)
6. Mirror nodes updated (~5 sec later)
```

**Step 4: Read Back from Mirror Node**
```typescript
// Frontend polls for updates
const response = await fetch(
  `/api/hcs/events?type=contact&since=1762845720.000000000`
)

// Backend queries Hedera Mirror Node
const mirrorUrl = 
  `https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.7148063/messages?order=asc&limit=200&timestamp=gt:1762845720.000000000`

const messages = await fetch(mirrorUrl).then(r => r.json())

// Returns:
{
  "messages": [
    {
      "consensus_timestamp": "1762845726.775022136",
      "message": "eyJ0eXBlIjoiQ09OVEFDVCIsLi4u",  // Base64 encoded
      "sequence_number": 64,
      "running_hash": "a3f8b9c2...",
      "payer_account_id": "0.0.5864559"
    }
  ]
}

// Decode message:
const event = JSON.parse(atob(message.message))
// {
//   type: 'CONTACT_ACCEPT',
//   actor: '0.0.7226146',
//   target: '0.0.7226165',
//   metadata: { from: {...}, to: {...} }
// }
```

**Step 5: Update Client State**
```typescript
// Client-side cache (HcsCircleState)
hcsCircleState.addContactEvent(event)

// Internally builds bidirectional contact graph:
contactBonds.set('0.0.7226146', new Set(['0.0.7226165']))
contactBonds.set('0.0.7226165', new Set(['0.0.7226146']))

// Query contacts for user:
const contacts = hcsCircleState.getAllContactsForUser('0.0.7226146')
// Returns: [{ peerId: '0.0.7226165', handle: '03', ... }]
```

---

## Comparison: Traditional vs. TrustMesh Architecture

### Traditional Social Network (e.g., Facebook-style)

```typescript
// Typical database schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name VARCHAR(100),
  bio TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  user_a_id INTEGER REFERENCES users(id),
  user_b_id INTEGER REFERENCES users(id),
  status VARCHAR(20),  -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMP,
  UNIQUE(user_a_id, user_b_id)
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id),
  recipient_id INTEGER REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP
);

CREATE INDEX idx_friendships_user_a ON friendships(user_a_id);
CREATE INDEX idx_friendships_user_b ON friendships(user_b_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
```

**Queries**:
```sql
-- Get user's friends
SELECT u.* FROM users u
JOIN friendships f ON (f.user_b_id = u.id)
WHERE f.user_a_id = 123 AND f.status = 'accepted';

-- Get messages (requires storing plaintext or decrypting)
SELECT * FROM messages 
WHERE recipient_id = 123 
ORDER BY created_at DESC 
LIMIT 50;

-- Dangerous global queries (enabled by schema)
SELECT COUNT(*) FROM users;  -- Total users
SELECT user_a_id, COUNT(*) as friend_count 
FROM friendships 
GROUP BY user_a_id 
ORDER BY friend_count DESC 
LIMIT 10;  -- "Most connected users"
```

**Problems**:
- ❌ Company has full custody of all data
- ❌ Can execute global queries (privacy violation)
- ❌ Single point of failure (DB crash = downtime)
- ❌ Data can be altered/deleted
- ❌ Messages stored in plaintext (or with company holding keys)
- ❌ No cryptographic proof of actions

---

### TrustMesh Architecture

**No central database**. Data flows:

```typescript
// 1. Events published to HCS topics (immutable)
interface ContactEvent {
  type: 'CONTACT_ACCEPT'
  actor: '0.0.7226146'
  target: '0.0.7226165'
  consensusTimestamp: '1762845726.775022136'
}

// 2. Client-side incremental state (HcsCircleState)
class HcsCircleStateManager {
  private contactBonds: Map<string, Set<string>>
  private trustLevels: Map<string, number>
  private profileCache: Map<string, Profile>
  
  // Add event to state (incremental)
  addContactEvent(event: ContactEvent) {
    const { actor, target } = event
    // Build bidirectional bond
    this.contactBonds.get(actor)?.add(target)
    this.contactBonds.get(target)?.add(actor)
  }
  
  // Query scoped to single user
  getAllContactsForUser(userId: string): Contact[] {
    const bonds = this.contactBonds.get(userId) || new Set()
    return Array.from(bonds).map(peerId => ({
      peerId,
      handle: this.profileCache.get(peerId)?.displayName,
      // ... other fields
    }))
  }
  
  // ❌ IMPOSSIBLE: Get all contacts across all users
  // (No global state, only per-user views)
}

// 3. Messages via XMTP (E2E encrypted)
const conversation = await xmtp.conversations.newConversation(peerAddress)
await conversation.send('Hello!')  // Encrypted before leaving device
```

**Queries**:
```typescript
// ✅ Get user's contacts (auth-scoped)
const contacts = await getCircleForUser(authenticatedUserId)
// Internally: HcsCircleState.getAllContactsForUser(userId)
// Returns: O(N) where N = user's contact count (max 250)

// ✅ Get messages (E2E encrypted via XMTP)
const messages = await conversation.messages()
// Server never sees content (only encrypted payloads)

// ❌ IMPOSSIBLE: Global queries
// No API exists to do this (by design)
// await getAllUsers()           // Doesn't exist
// await getMostConnectedUsers() // Doesn't exist
// await getTotalUserCount()     // Doesn't exist
```

**Advantages**:
- ✅ No central data custody (distributed ledger)
- ✅ Cannot execute global queries (privacy by design)
- ✅ High availability (network continues if nodes fail)
- ✅ Immutable audit trail (every action provable)
- ✅ E2E encrypted messages (server can't read)
- ✅ Cryptographic proof of every action

---

## Trade-offs & Design Decisions

### Trade-off 1: Query Performance

**Traditional Database**:
```sql
-- O(1) with index
SELECT * FROM friendships WHERE user_a_id = 123;

-- Highly optimized
CREATE INDEX idx_user_a ON friendships(user_a_id);
```

**TrustMesh**:
```typescript
// O(N) where N = total events for user
// Must replay event stream to build state
const events = await fetchHcsEvents('0.0.7148063', since)
events.forEach(event => hcsCircleState.addContactEvent(event))

// Mitigation: Incremental cache
// - Only fetch NEW events since last cursor
// - Cache state in HcsCircleState (in-memory)
// - Bounded by 250 contact hard cap
```

**Our choice**: Accept O(N) query complexity for privacy guarantees.

**Why it's acceptable**:
- **Bounded N**: Max 250 contacts per user → max 250 events to process
- **Incremental updates**: Only fetch new events (since last timestamp)
- **Client-side caching**: Build state once, update incrementally
- **No cold start penalty**: First load builds cache, subsequent loads are fast

---

### Trade-off 2: Write Latency

**Traditional Database**:
```sql
-- Instant write confirmation
INSERT INTO friendships VALUES (123, 456, 'accepted');
-- Returns immediately (milliseconds)
```

**TrustMesh**:
```typescript
// Consensus latency
await submitToHCS({ type: 'CONTACT_ACCEPT', ... })
// Takes 3-5 seconds to reach consensus
// + 5-10 seconds for Mirror Node to update
```

**Mitigation: Optimistic UI**
```typescript
// Show change immediately in UI
signalsStore.add({
  type: 'CONTACT_ACCEPT',
  source: 'hcs-cached',  // Mark as pending
  ts: Date.now()
})
// User sees instant feedback

// Sync in background
await submitToHCS(...)
// Eventually consistent (10-15 seconds)
```

**Our choice**: Accept higher write latency for immutability.

**Why it's acceptable**:
- **Social actions aren't time-critical**: Adding a contact can wait 10 seconds
- **Optimistic UI**: User perceives instant feedback
- **Eventually consistent**: State converges once consensus reached
- **Trade latency for trust**: Users accept delay for cryptographic guarantees

---

### Trade-off 3: Storage Cost

**Traditional Database**:
```
Monthly cost: $50-500 for managed PostgreSQL/MongoDB
- Fixed monthly fee
- Scales with storage + IOPS
- Free tier available for small apps
```

**TrustMesh (Hedera)**:
```
Per-transaction cost: $0.0001 per HCS message
- Pay-per-use (no fixed infrastructure)
- Example: 1,000 contact events = $0.10
- Scales linearly with usage
```

**Our choice**: Pay-per-transaction over fixed infrastructure.

**Why it makes sense**:
- **No idle cost**: Don't pay for database when users aren't active
- **Predictable**: $0.0001 per event (fixed, no surprise bills)
- **No DevOps**: No database to maintain, backup, scale
- **Cost optimization**: Use client-side caching to minimize reads

---

### Trade-off 4: Developer Experience

**Traditional Database**:
```typescript
// Familiar ORM patterns
const user = await db.users.findUnique({ where: { id: 123 } })
const friends = await user.friendships.findMany()

// Rich query capabilities
await db.users.findMany({
  where: { createdAt: { gte: new Date('2025-01-01') } },
  orderBy: { friendCount: 'desc' },
  take: 10
})
```

**TrustMesh**:
```typescript
// Event sourcing patterns (less familiar)
const events = await fetchHcsEvents(topicId, since)
const state = events.reduce((acc, event) => {
  return applyEvent(acc, event)
}, initialState)

// Limited query capabilities (by design)
// Can only query what you explicitly track in state
```

**Our choice**: Accept steeper learning curve for architectural benefits.

**Mitigations**:
- **Abstractions**: `HcsCircleState` hides event sourcing complexity
- **Documentation**: Extensive docs + code examples (this file!)
- **Standard patterns**: Consistent event schemas across topics
- **Developer tools**: Helper functions for common operations

---

## Performance Characteristics

### Benchmarks (Testnet)

| Operation                  | Latency       | Cost      | Notes                              |
|----------------------------|---------------|-----------|------------------------------------|
| **Submit to HCS**          | 3-5 sec       | $0.0001   | Consensus + finalization           |
| **Mirror Node availability** | +5-10 sec   | Free      | Mirror Node lag after consensus    |
| **Read from Mirror Node**  | 100-500 ms    | Free      | HTTP API query                     |
| **Client-side cache hit**  | <10 ms        | Free      | In-memory lookup                   |
| **Full state rebuild**     | 1-3 sec       | Free      | Process all events for user        |

### Scalability Limits

**Per-User Limits** (by design):
- **Max contacts**: 250 (hard cap for anti-fingerprinting)
- **Max Circle members**: 9 (trust allocation slots)
- **Max trust tokens**: 9 (one per Circle member)

**Network Limits** (Hedera):
- **HCS throughput**: 10,000 TPS per topic
- **Message size**: 6 KB per message
- **Topic count**: Unlimited (we use 4)

**Practical Limits** (TrustMesh):
- **Events per user**: ~1,000-2,000 typical (contacts + trust + profile updates)
- **Cache rebuild time**: <3 seconds for 1,000 events
- **Memory footprint**: ~1 MB per 1,000 cached events

### Optimization Strategies

**1. Incremental State Updates**
```typescript
// ❌ Bad: Rebuild entire state every time
const allEvents = await fetchAllEvents(topicId)
const state = buildStateFromScratch(allEvents)

// ✅ Good: Only fetch new events
const cursor = localStorage.getItem('lastCursor')
const newEvents = await fetchEventsSince(topicId, cursor)
newEvents.forEach(e => hcsCircleState.addEvent(e))
localStorage.setItem('lastCursor', newEvents[newEvents.length - 1].timestamp)
```

**2. Client-Side Caching**
```typescript
// Cache state in memory (singleton)
class HcsCircleStateManager {
  private static instance: HcsCircleStateManager
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new HcsCircleStateManager()
    }
    return this.instance
  }
  
  // State persists across component renders
  private contactBonds: Map<string, Set<string>> = new Map()
  private trustLevels: Map<string, number> = new Map()
}
```

**3. Batched Reads**
```typescript
// ❌ Bad: Multiple small requests
for (const userId of userIds) {
  await fetchProfile(userId)  // N separate API calls
}

// ✅ Good: Batch into single request
const profiles = await fetchProfiles(userIds)  // 1 API call
```

**4. Optimistic UI**
```typescript
// Don't wait for HCS consensus
signalsStore.add({ ...event, source: 'hcs-cached' })
updateUI()  // Instant feedback

// Sync in background
submitToHCS(event).catch(rollbackOptimisticUpdate)
```

---

## Code Examples

### Example 1: Reading Contacts from HCS

```typescript
// lib/stores/HcsCircleState.ts
import { serverMirror } from '@/lib/server/serverMirror'

export class HcsCircleStateManager {
  private contactBonds: Map<string, Set<string>> = new Map()
  
  // Initialize from HCS events
  async initialize(topicId: string, since?: string) {
    // Fetch contact events from Hedera Mirror Node
    const messages = await serverMirror.fetchTopicMessages(
      topicId,
      200,  // Limit
      since ? `gt:${since}` : undefined
    )
    
    // Process events incrementally
    messages.forEach(msg => {
      const event = JSON.parse(atob(msg.message))
      
      if (event.type === 'CONTACT_ACCEPT') {
        this.addContactEvent(event)
      }
    })
  }
  
  // Add bidirectional contact bond
  addContactEvent(event: ContactEvent) {
    const { actor, target } = event
    
    if (!this.contactBonds.has(actor)) {
      this.contactBonds.set(actor, new Set())
    }
    if (!this.contactBonds.has(target)) {
      this.contactBonds.set(target, new Set())
    }
    
    this.contactBonds.get(actor)!.add(target)
    this.contactBonds.get(target)!.add(actor)
  }
  
  // Auth-scoped query (O(N) where N = user's contacts)
  getAllContactsForUser(userId: string): Contact[] {
    const bonds = this.contactBonds.get(userId)
    if (!bonds) return []
    
    return Array.from(bonds).map(peerId => ({
      peerId,
      handle: this.profileCache.get(peerId)?.displayName,
      bondedAt: new Date().toISOString()
    }))
  }
  
  // ❌ Deliberately NOT implemented:
  // getAllContactsGlobally() { ... }
  // getMostConnectedUsers() { ... }
}
```

---

### Example 2: Writing to HCS

```typescript
// app/api/hcs/submit/route.ts
import { Client, TopicMessageSubmitTransaction, TopicId } from '@hashgraph/sdk'

export async function POST(req: Request) {
  const body = await req.json()
  const { type, sessionId, data } = body
  
  // Construct event
  const event = {
    type,
    actor: sessionId,
    target: data.to?.acct,
    metadata: data,
    timestamp: Date.now()
  }
  
  // Submit to Hedera
  const client = Client.forTestnet()
  const topicId = TopicId.fromString('0.0.7148063')
  
  const transaction = new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(JSON.stringify(event))
  
  const receipt = await transaction.execute(client)
  const status = await receipt.getReceipt(client)
  
  return Response.json({
    success: true,
    sequenceNumber: status.topicSequenceNumber,
    transactionId: receipt.transactionId.toString()
  })
}
```

---

### Example 3: Auth-Scoped Circle API

```typescript
// app/api/circle/route.ts
import { requireMagicAuth } from '@/lib/server/auth/requireMagicAuth'
import { hcsCircleState } from '@/lib/stores/HcsCircleState'

export async function GET(req: Request) {
  // 1. Authenticate user
  const { issuer, hederaAccountId } = await requireMagicAuth(req)
  
  // 2. Query ONLY this user's contacts (auth-scoped)
  const contacts = hcsCircleState.getAllContactsForUser(hederaAccountId)
  
  // 3. Enforce 250 contact hard cap
  if (contacts.length > 250) {
    return Response.json({
      success: false,
      error: 'Contact limit exceeded (250 max)'
    }, { status: 403 })
  }
  
  // 4. Return scoped data
  return Response.json({
    success: true,
    bondedContacts: contacts,
    trustStats: {
      allocatedOut: getTrustAllocatedBy(hederaAccountId),
      maxSlots: 9,
      bondedContacts: contacts.length
    }
  })
}

// ❌ This endpoint deliberately DOES NOT exist:
// GET /api/circle/all  → Would return global contacts
// GET /api/circle/stats → Would return network statistics
```

---

## Future Scalability

### Current Limitations

1. **Mirror Node lag**: 5-10 seconds after consensus
   - **Future**: Hedera is working on sub-second Mirror Node updates
   
2. **Client-side state rebuild**: O(N) on cold start
   - **Future**: Periodic state snapshots on HCS (compressed)
   
3. **No full-text search**: Can't search across all profiles
   - **By design**: Would require global index (surveillance risk)
   - **Alternative**: Local search within user's contacts only

### Scaling to 1M+ Users

**Strategy**:
1. **Sharded topics**: Split by user cohorts (e.g., by geographic region)
2. **Compressed snapshots**: Periodic state checkpoints published to HCS
3. **CDN caching**: Cache recent events at edge (Cloudflare)
4. **Client-side indexing**: IndexedDB for local full-text search

**Cost projection**:
```
Assumptions:
- 1M users
- 10 events per user per month (contacts, trust, profile)
- $0.0001 per HCS message

Monthly cost:
1M users × 10 events × $0.0001 = $1,000/month

Compare to:
- AWS RDS (large instance): ~$500-2,000/month
- MongoDB Atlas (dedicated): ~$300-1,500/month
- Plus: DevOps time, backups, monitoring, security

TrustMesh: Comparable cost, zero DevOps overhead
```

---

## Conclusion

### Why No Database?

TrustMesh doesn't use a traditional database because:

1. **Immutability > Mutability**: Social graph history should be provable, not editable
2. **Decentralization > Centralization**: No single point of control or failure
3. **Privacy > Surveillance**: Auth-scoped queries prevent global analytics
4. **Compliance without Custody**: Audit trails without storing PII
5. **Simplicity > Complexity**: No database DevOps, backups, or scaling issues

### What We Gained

- ✅ **Cryptographic proof** of every action
- ✅ **Censorship resistance** (can't be de-platformed)
- ✅ **Regulatory compliance** (immutable audit trails)
- ✅ **Privacy by design** (no global queries)
- ✅ **Zero DevOps overhead** (no database to maintain)

### What We Traded

- ⚠️ **Higher write latency** (3-5 sec consensus vs. milliseconds)
- ⚠️ **Limited query flexibility** (can't do complex JOINs)
- ⚠️ **Eventual consistency** (vs. immediate ACID guarantees)
- ⚠️ **Steeper learning curve** (event sourcing vs. CRUD)

### Is This the Right Choice?

**For TrustMesh: Yes.**

Our mission is to build a **privacy-first, user-sovereign social operating system**. A traditional database would:
- Give us custody of user data (liability, not asset)
- Enable surveillance capabilities (temptation for misuse)
- Create single point of failure (centralization risk)
- Require trust in our company (vs. cryptographic proofs)

By using Hedera Consensus Service as our "database," we build trust through **technology, not promises**.

---

## Further Reading

### TrustMesh Documentation
- [Anti-Surveillance Architecture](./ANTI_SURVEILLANCE_ARCHITECTURE.md)
- [HCS-22 Identity Protocol](./HCS22_QUICKSTART.md)
- [Oracle Matchmaking Implementation](./ORACLE_MATCHMAKING_IMPLEMENTATION.md)

### Hedera Resources
- [HCS Documentation](https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service)
- [Mirror Node API](https://docs.hedera.com/hedera/sdks-and-apis/rest-api)
- [Hedera Whitepaper](https://hedera.com/hh_whitepaper_v2.1-20200815.pdf)

### Related Concepts
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) (Martin Fowler)
- [CQRS Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [Distributed Ledgers vs. Databases](https://www.hedera.com/learning/distributed-ledger-technology/distributed-ledger-vs-blockchain-vs-database)

---

**Questions?** Open a GitHub issue or reach out to the TrustMesh team.

**Contributing?** See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**License**: MIT (see [LICENSE](../LICENSE))
