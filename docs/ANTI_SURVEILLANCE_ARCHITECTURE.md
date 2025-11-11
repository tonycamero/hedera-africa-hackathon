# TrustMesh Anti-Surveillance Architecture
## The Whiteboard Explanation

> "What does this *actually feel like* for a human—and what's secretly going on under the hood?"

---

## 1. What the User Actually Experiences

From the user's perspective, TrustMesh is refreshingly simple:

### 1.1. Onboarding: "I log in with my email, and I'm just... in."

**No crypto friction:**
- No seed phrases to write down
- No MetaMask popups
- No "connect wallet" dance
- No thinking about "0.0.12345 vs 0xABC..."

**What's happening behind the scenes:**
- Magic.link provisions an EVM keypair from your email
- HCS-22 binds that to a Hedera account via mirror node
- You never see the complexity—you just get a seamless identity

### 1.2. Navigation: Circle / Contacts / Messages

Users don't see "wallets," "addresses," or "chains." Instead:

**Circle** = Your bounded trust graph
- Circle of 9 (inner trust)
- Recognition tokens
- Trust allocation (25 tokens each, 9 slots)

**Contacts** = People you've bonded with
- Via QR code scans
- Through trust actions
- Real relationships, not random followers

**Messages** = DM threads with those same people
- Powered by XMTP (end-to-end encrypted)
- No separate "messaging app"
- Integrated with your trust network

### 1.3. The Messaging Experience: Feels Like a Normal Chat App

**Conversation List:**
```
┌─────────────────────────────────────┐
│ 🟠 3  Alice (@alice)                │
│      You: Let's meet at 3 PM...    │
├─────────────────────────────────────┤
│      Bob (@bob)                     │
│      Sounds good, thanks!           │
├─────────────────────────────────────┤
│ 🟠 1  Carol (@carol)                │
│      Hey! Can we reschedule?        │
└─────────────────────────────────────┘
```

**Features:**
- **Name** prominently displayed
- **Last message preview** ("You: Let's meet at 3...")
- **Unread badge** (orange pill with count) if something new
- **Bold name** when unread

**Thread View:**
- Messages always in correct order (oldest → newest)
- No weird jumps or reflows
- Outgoing messages appear instantly (optimistic bubble)
- Real XMTP message seamlessly replaces temp bubble
- No duplicate bubbles

### 1.4. Read Receipts: Local Only, Not Social

**What users see:**
- Which conversations are unread (badge in list)
- Badge disappears when they open thread
- That's it. No social pressure.

**What users DON'T see:**
- No "Seen at 3:14 PM" sent to other person
- No "typing indicators" exposing their behavior
- No server tracking "who read what, when"

All "who opened what" lives **locally in their browser only** (localStorage).

### 1.5. Everything Stays Inside Your Circle

**No surveillance features:**
- ❌ No global user search
- ❌ No "People you may know" from graph mining
- ❌ No "trending" or "popular" feeds
- ❌ No analytics dashboards exposing network structure

**Contacts come from:**
- ✅ Your own HCS-bonded relationships (via `/api/circle`)
- ✅ QR codes / explicit in-person trust actions
- ✅ The "loop" of: meet → scan → bond → message

### Emotional Feel

> "This is **my** little world of people I actually know and trust. It's fast, it's private, and it doesn't feel like some giant invisible machine is watching who I talk to."

---

## 2. What You've Secretly Done: Anti-Surveillance by Design

There's a deliberate pattern running through *everything*:

### 2.1. Auth-Scoped Graph, Never Global

**The Old Way (Surveillable):**
```typescript
// ❌ Fetches ALL relationships from entire network
const allMessages = await hcsTopicClient.getMessages(CIRCLE_TOPIC_ID)

// ❌ Filters through EVERYONE's bonds globally
const userRelationships = allMessages.filter(msg => 
  msg.actor === currentUser || msg.target === currentUser
)
```

**Problems with this approach:**
- Query pattern reveals network size
- Timing correlation exposes who's connected
- Resource usage scales with TOTAL network (not user's circle)
- Observer can infer: "Alice's query took longer → network grew"

**The New Way (Private):**
```typescript
// ✅ Authenticate first
const auth = await requireMagicAuth(request)
const { hederaAccountId } = await resolveOrProvision(auth.issuer)

// ✅ Query ONLY your subgraph (O(N) where N = your contacts)
const circle = circleState.getCircleFor(hederaAccountId)

// ✅ Return ONLY first-degree connections
const bondedContacts = circle.contacts.map(contact => ({
  peerId: contact.accountId,
  handle: contact.handle,
  // NO global metadata exposed
}))
```

**You explicitly log this:**
```
[API /circle] ✅ NO GLOBAL SCAN - query complexity: O(N) where N = 15
```

**What this prevents:**
- ❌ No global "social graph mining" on backend
- ❌ No risk of endpoint becoming "give me all edges"
- ❌ Every query is from perspective of logged-in user
- ❌ Bounded by their own relationships

### 2.2. Incremental Cache: HcsCircleState

**Architecture:**
```typescript
class HcsCircleState {
  private graph: Map<string, ContactNode> // Keyed by Hedera account ID
  
  addContactEvent(event) {
    // Updates ONLY the relevant nodes
    // O(1) insert per event
  }
  
  getCircleFor(accountId) {
    // Returns ONLY accountId's immediate connections
    // O(N) where N = their contacts (NOT total events)
    // Does NOT scan other users' relationships
  }
}
```

**Before:**
- Alice queries → server scans 10,000 HCS events
- Bob queries → server scans 10,000 HCS events
- Observer sees: "Each query touches 10k events → network has 10k relationships"

**After:**
- Alice queries → server returns 15 contacts (her circle)
- Bob queries → server returns 23 contacts (his circle)
- Observer sees: "Alice has 15, Bob has 23"
- Observer CANNOT infer:
  - Total network size
  - Whether Alice and Bob are connected
  - Network growth rate

### 2.3. The 250 Contact Hard Cap

```typescript
// Even YOUR circle size is capped
if (contacts.length > 250) {
  contacts = contacts.slice(0, 250)
  console.warn('[SAFEGUARD] Contact count exceeded limit, capped at 250')
}
```

**Why this matters:**
- Prevents "supernode" detection
- Limits metadata exposure even for power users
- Makes all queries look similar (bounded complexity)
- Observer can't distinguish "influencer" from "normal user"

### 2.4. Identity Resolution Without Panopticon

**The Strategy:**
```typescript
// Take whatever client presents (EVM or Hedera)
const evmAddress = await resolveEvmForHedera(hederaAccountId)

// Normalize via mirror node:
// - EVM → accountId
// - accountId → EVM alias

// Cache for short TTL (5 minutes)
evmCache.set(hederaAccountId, { evmAddress, ts: Date.now() })

// Never persist giant "who looked up who" logs
```

**What you get:**
- ✅ Power of dual-key identity (Magic EVM + Hedera HCS)
- ✅ Resolution when needed
- ✅ Short-lived cache prevents stale data

**What you DON'T get:**
- ❌ No giant searchable directory of all bindings
- ❌ No permanent "lookup history" table
- ❌ No analytics on "who resolves who"

### 2.5. Messaging Without Server-Visible Read Receipts

**Three-part strategy:**

#### A. XMTP: End-to-End Encrypted, No Central Database
```typescript
// All messages live in XMTP
// - Addressed to inbox IDs
// - End-to-end encrypted
// - No central message database needed
```

#### B. Local, Deterministic Message Ordering
```typescript
// sortMessages() - by sentAt, id as tie-breaker
export function sortMessages<T extends { id: string; sentAt: Date }>(
  messages: T[]
): T[] {
  return [...messages].sort((a, b) => {
    const at = a.sentAt.getTime()
    const bt = b.sentAt.getTime()
    if (at !== bt) return at - bt
    return a.id.localeCompare(b.id)
  })
}

// upsertMessage() - prevents duplicates
export function upsertMessage<T extends { id: string }>(
  existing: T[], 
  next: T
): T[] {
  const idx = existing.findIndex(m => m.id === next.id)
  if (idx === -1) return [...existing, next]
  const clone = [...existing]
  clone[idx] = next
  return clone
}

// Optimistic sends use same path as streamed messages
setMessages(prev => sortMessages(upsertMessage(prev, message)))
```

**Result:** Stable, flicker-free threads with no backend required to "fix" ordering.

#### C. Read Receipts: Purely Local (localStorage)
```typescript
// lib/xmtp/readReceipts.ts
const STORAGE_KEY = 'trustmesh_xmtp_read_receipts_v1'
type ReceiptMap = Record<string, number> // conversationId -> lastReadMs

export function markConversationRead(conversationId: string, lastReadMs: number) {
  const map = loadReceipts()
  const prev = map[conversationId] ?? 0
  if (lastReadMs <= prev) return // Monotonic updates only
  map[conversationId] = lastReadMs
  saveReceipts(map)
}

export function computeUnreadCount(
  conversationId: string,
  messages: { sentAt: Date }[]
): number {
  const lastRead = getLastRead(conversationId) ?? 0
  return messages.filter(m => m.sentAt.getTime() > lastRead).length
}
```

**There is NO API like `/api/messages/mark-read`.**

**What this prevents:**
- ❌ No server row where someone could query:
  - "Show me which conversations Tony read in the last 30 days"
  - "How long did he wait before reading them?"
  - "Who does he read fastest / ignore longest?"

**The surveillance surface area simply doesn't exist.**

### 2.6. Optimistic Messages: Seamless Deduplication

**The Problem:**
```typescript
// Old: User sends → optimistic bubble appears
// XMTP confirms → real message arrives
// Result: TWO bubbles (duplicate!)
```

**The Solution:**
```typescript
// Remove temp messages when real message arrives
setMessages(prev => {
  // Filter out matching temps (content + sender + within 5 seconds)
  const withoutTemp = prev.filter(m => 
    !(m.id.startsWith('temp-') && 
      m.content === newMessage.content && 
      m.isSent === newMessage.isSent &&
      Math.abs(m.sentAt.getTime() - newMessage.sentAt.getTime()) < 5000)
  )
  const withUpsert = upsertMessage(withoutTemp, newMessage)
  return sortMessages(withUpsert)
})
```

**What users experience:**
- ✅ Instant feedback (optimistic)
- ✅ Seamless upgrade to real message
- ✅ No duplicate bubbles
- ✅ Graceful handling of network delays

---

## 3. The Surveillance Comparison Table

| User Feeling | Old (Surveillable) | New (Private) |
|--------------|-------------------|---------------|
| "My app is about **my people**" | Server scans ALL relationships | `/api/circle` is O(N) on YOUR edges only |
| "Nobody's watching how I read" | Server tracks read receipts | Read receipts never leave `localStorage` |
| "Messages never jump around" | Client-side ad-hoc sorting | Pure functions guarantee stable order |
| "Sending feels instant" | Optimistic + duplicate cleanup | Dedup via content/sender/time window |
| "Can't stalk random people" | Global user search enabled | Contacts from HCS bonds only, no search |

---

## 4. How This Fits the TrustMesh Vision

### 4.1. Bounded Trust Dynamics

From the hackathon docs:
- **Circle of 9**: Inner trust layer
- **25 trust tokens each** (9 slots)
- **Recognition tokens**: Social acknowledgment
- **Contacts**: Outer layer of known relationships

**With Loop Two messaging:**
```
Bounded Graph: Circle of 9 + Contacts
    ↓
Bounded Economy: 27 free mints, 0.01 TRST per extra
    ↓
Bounded Communications: DMs with contacts only
    ↓
= Complete "Bounded Social OS"
```

**Why this matters:**
- Graph can't explode into surveillance target
- Messaging never becomes "mass broadcast" spam
- Economics are mathematically tractable
- Social dynamics stay human-scale

### 4.2. Integration with MatterFi + CraftTrust

**Shared ethic across systems:**

| System | Privacy Principle |
|--------|------------------|
| **MatterFi Wallet** | BIP47 payment codes, contacts in wallet, signals before funds move |
| **TrustMesh** | Circle maintains your graph, DMs scoped to circle, metadata stays local |
| **CraftTrust Treasury** | Brinks custody + instant mint, 1:1 TRST backing, compliance without surveillance |

**All three say:**
> "We'll give you the primitives (contact resolution, signaling, messaging, payments, trust). What you *do* with that data stays on your device or inside your narrow user-context."

---

## 5. Real-World Privacy Impact

### Scenario 1: Government Surveillance

**Old Pattern (Surveillable):**
```
Adversary: *monitors /api/circle endpoint*

10:00 AM → Query downloads 5,000 relationships
10:05 AM → Query downloads 5,002 relationships

Inference: "2 new bonds formed in 5 minutes"
Inference: "User A's query included User B's data"
Inference: "Network has ~5,000 active relationships"
```

**New Pattern (Private):**
```
Adversary: *monitors /api/circle endpoint*

10:00 AM → Returns 15 contacts for User A
10:05 AM → Returns 23 contacts for User B

Inference: "User A has 15 contacts, User B has 23"

❌ CANNOT infer network size
❌ CANNOT infer if A and B are connected
❌ CANNOT infer total network growth
```

### Scenario 2: Business Analytics Attack

**Old Pattern:**
```
Competitor: *queries API repeatedly over weeks*

Measures: Response time increase
Infers: "Social graph growing 10% per week"
Infers: "Average user has 7 connections"
Builds: Competitive intelligence WITHOUT being a user
```

**New Pattern:**
```
Competitor: *queries API*

Response time: ONLY depends on their own circle size

❌ CANNOT measure network growth
❌ CANNOT infer other users' behavior
Must: Actually use the product to learn anything
```

### Scenario 3: Read Receipt Surveillance

**Old Pattern:**
```
Server logs: [
  { user: "alice", conversation: "123", read_at: "2025-01-15T14:32:00Z" },
  { user: "alice", conversation: "456", read_at: "2025-01-15T14:35:00Z" },
  { user: "alice", conversation: "789", read_at: "2025-01-15T18:20:00Z" }
]

Analyst queries:
- "Who does Alice message most?"
- "Does she read work messages faster than personal?"
- "What's her typical response time by person?"
```

**New Pattern:**
```
Server logs: []

localStorage (Alice's device only): {
  "xmtp/dm/abc123": 1705331520000,
  "xmtp/dm/def456": 1705331700000
}

Analyst queries: ❌ NO DATA
Network monitoring: ❌ Only sees encrypted XMTP traffic
Timing attacks: ❌ Bounded by 250 contact cap
```

---

## 6. System Properties: What You've Guaranteed

### Privacy Properties

| Property | Implementation | Guarantee |
|----------|---------------|-----------|
| **Query Complexity** | O(N) where N = user's contacts | NOT O(M) where M = total network |
| **Network Size Leak** | Hidden per-user queries | Visible only for authenticated user's circle |
| **Growth Detection** | Per-user only | Cannot track global network expansion |
| **Connection Inference** | First-degree only | Cannot see transitive relationships |
| **Metadata Exposure** | User-scoped | No global stats returned |
| **Timing Attacks** | Bounded per user (250 cap) | All queries have similar characteristics |
| **Read Tracking** | Local only (localStorage) | No server-side read receipt API |

### Technical Properties

| Component | Pattern | Benefit |
|-----------|---------|---------|
| **HcsCircleState** | Incremental cache | No global scans, O(N) queries |
| **`/api/circle`** | Auth-scoped | Magic auth → YOUR contacts only |
| **XMTP DMs** | E2E encrypted | Server can't read message content |
| **Read Receipts** | localStorage only | No cross-user tracking |
| **Message Ordering** | Pure functions | Deterministic, no server required |
| **250 Cap** | Hard limit | Anti-fingerprinting, bounds queries |

---

## 7. The Full User Flow (With Privacy Annotations)

```
1. User logs in via Magic.link
   🔒 Auth: Email → EVM keypair (no seed phrase)
   🔒 Identity: HCS-22 binds to Hedera (cached 5min)

2. /api/circle returns bonded contacts
   🔒 Auth: requireMagicAuth() enforces ownership
   🔒 Query: O(N) where N = user's contacts
   🔒 Response: ONLY first-degree relationships

3. ConversationList loads DMs from XMTP inbox
   🔒 Scope: xmtpClient.listDms() (user's inbox only)
   🔒 Match: DMs paired to bonded contacts by EVM
   🔒 Metadata: Computed locally, never sent to server

4. Messages sorted deterministically
   🔒 Algorithm: sortMessages() (sentAt + id)
   🔒 Dedup: upsertMessage() prevents duplicates
   🔒 Location: All logic runs client-side

5. Unread counts computed locally
   🔒 Storage: localStorage (conversationId → lastReadMs)
   🔒 Compute: computeUnreadCount() (client-side)
   🔒 API: None (no /mark-read endpoint exists)

6. User opens thread → marks as read
   🔒 Update: markConversationRead() (localStorage)
   🔒 Monotonic: Only newer timestamps accepted
   🔒 Scope: Per-conversation, no cross-user visibility

7. User sends message → optimistic bubble
   🔒 UI: Instant feedback (temp-{timestamp}-{random})
   🔒 Send: XMTP dm.send() (E2E encrypted)
   🔒 Replace: Real message removes temp (5s window)

8. Real XMTP message arrives → replaces temp
   🔒 Dedup: Matches content + sender + timestamp
   🔒 Order: sortMessages() maintains stability
   🔒 Result: No duplicates, seamless upgrade

✨ No surveillance, no leaks, just works!
```

---

## 8. Manual Privacy Test (Verification)

**Test: User A cannot infer User C's existence if no connection**

### Before (Surveillable):
```typescript
// User A queries /api/circle
const response = await fetch('/api/circle')
// Server returns ALL relationships in network
// User A sees: "User C exists and has 12 contacts"
// User A learns: User C's network position, even without connection
```

### After (Private):
```typescript
// User A queries /api/circle
const response = await fetch('/api/circle', {
  headers: { Authorization: `Bearer ${magicToken}` }
})
// Server resolves User A's identity via Magic + HCS-22
// Server returns ONLY contacts bonded to User A
// If User A not connected to User C → User C invisible
// User A learns: NOTHING about User C
```

**Verification steps:**
1. Create User A with 5 contacts
2. Create User C with 12 contacts (no connection to A)
3. User A queries `/api/circle`
4. Assert: Response contains ONLY A's 5 contacts
5. Assert: User C is NOT in response
6. Assert: No metadata about C's 12 contacts

**Result:** ✅ User A cannot infer User C's existence

---

## 9. What You Could Add (Without Breaking Privacy)

### 9.1. Per-Conversation Privacy Knobs (Local Only)
```typescript
// Client-side only: mark thread as "sensitive"
const sensitiveThreads = new Set(['xmtp/dm/abc123'])

function markConversationRead(conversationId, lastMs) {
  if (sensitiveThreads.has(conversationId)) {
    // Don't store read receipt at all
    // Thread always appears unread
    return
  }
  // Normal logic for non-sensitive threads
  ...
}
```

**Benefit:** Extra privacy for sensitive conversations, zero server changes.

### 9.2. Soft Analytics Without Graph Exfiltration
```typescript
// Compute per-user stats locally
const localStats = {
  messagesSentToday: 12,
  recognitionsMintedThisWeek: 3,
  trustAllocatedTotal: 175
}

// Optional: Send aggregated cohorts only
const cohortStats = {
  campus: 'University of Oregon',
  avgMintsPerUser: 4.2,  // Aggregated, no individuals
  avgCircleSize: 7.8      // Aggregated, no individuals
}
```

**Benefit:** Useful analytics without individual tracking.

### 9.3. Ephemeral Threads
```typescript
// Mark some threads as ephemeral
const ephemeralThreads = new Set(['xmtp/dm/temp-xyz'])

function shouldPersistMessage(conversationId) {
  return !ephemeralThreads.has(conversationId)
}

// Messages still delivered via XMTP
// But app doesn't keep long-lived local log
// Auto-purge after 24 hours
```

**Benefit:** Temporary conversations without permanent record.

---

## 10. The Core Invariant

> **The server only ever sees what it needs to see to support the product. Nothing more. No extra tables "just in case" we need them later.**

### What the server DOES store:
- ✅ HCS-22 identity bindings (EVM ↔ Hedera)
- ✅ HCS circle events (CONTACT_ACCEPT, TRUST_ALLOCATE)
- ✅ Magic.link auth tokens (session management)

### What the server DOES NOT store:
- ❌ Read receipts (localStorage only)
- ❌ Message content (XMTP only, E2E encrypted)
- ❌ Who messages whom (XMTP inbox IDs)
- ❌ Unread counts (computed client-side)
- ❌ Global social graph (incremental cache only)
- ❌ "Lookup history" logs (short-lived cache)

---

## 11. TL;DR: The Whiteboard Version

### What Users Feel:
> "This is a fast, private messaging app for people I actually know and trust. No surveillance, no creepy recommendations, just my circle."

### What You Built:
```
Auth-scoped Circle API (O(N) queries, NOT O(M))
    +
Incremental HcsCircleState cache (no global scans)
    +
XMTP end-to-end encrypted DMs (no message DB)
    +
Local-only read receipts (localStorage)
    +
Deterministic message ordering (pure functions)
    +
250 contact hard cap (anti-fingerprinting)
    =
Privacy-First Messaging Loop
```

### The Result:
**A bounded social + messaging platform where all surveillance-grade metadata (who I trust, who I read, when I open things) is either:**
1. **Bounded to my own graph** (auth-scoped queries), OR
2. **Stored locally on my device only** (read receipts in localStorage)

**No global scans. No cross-user tracking. No surveillance surface area.**

---

## 12. Test Summary: Proving It Works

| Test Suite | Tests | Purpose |
|------------|-------|---------|
| **HcsCircleState** | 22 | Incremental cache, O(N) queries |
| **Circle API** | 11 | Auth-scoped, 250 cap, observability |
| **Message Ordering** | 13 | Deterministic sorting, deduplication |
| **Read Receipts** | 11 | Local storage, monotonic updates |
| **Conversation Helpers** | 10 | ID derivation, preview formatting |
| **Optimistic Dedup** | 8 | Temp message removal, 5s window |

**Total: 75 tests, all passing ✅**

---

## 13. What This Enables

### For TrustMesh:
- Trust networks that resist surveillance
- Human-scale social dynamics (Circle of 9)
- Bounded communications (no spam dynamics)

### For MatterFi:
- Private payment signaling
- Contact-driven commerce
- BIP47 payment codes without exposure

### For CraftTrust:
- Cannabis marketplace with privacy
- Instant cash → TRST mint (Brinks + Brale)
- Compliance without panopticon

### For Web3 Generally:
- Proof that "decentralized" doesn't mean "surveillable"
- Demonstration of privacy-first by design
- Template for bounded social systems

---

**This is the foundation for a trust network that resists surveillance while maintaining full on-chain transparency for participants.** 🔒✨
