# XMTP Integration Specification
## "The Nervous System of Trust"

**Version**: 1.0  
**Status**: Architectural Design  
**Target**: Q1 2026 Production Release

---

## Executive Summary

This specification defines the integration of XMTP (Extensible Message Transport Protocol) with TrustMesh's Hedera-based trust infrastructure. The result is a unified system where **messaging becomes the interface for trust**, enabling real-time human connection while preserving cryptographic sovereignty and economic memory.

**Core Thesis**: Trust is built through conversation. By binding XMTP's E2EE messaging to Hedera's immutable reputation layer, we create the first protocol where *chat history* and *trust history* evolve together—each enriching the other without compromising privacy.

---

## 1. Architecture Overview

### 1.1 System Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  (Next.js App Router + React Components)                        │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             ▼                                    ▼
┌────────────────────────┐          ┌────────────────────────────┐
│   XMTP Message Layer   │◄────────►│   ContextEngine v2         │
│                        │          │  (Intelligence Hub)         │
│  • E2EE Conversations  │          │  • Message → Trust Events   │
│  • Thread Management   │          │  • Trust → Suggestions      │
│  • Typing Indicators   │          │  • Recognition Prompts      │
│  • Reactions           │          │  • Payment Shortcuts        │
└────────────┬───────────┘          └────────────┬───────────────┘
             │                                    │
             │         ScendIdentity              │
             │      ┌────────────────┐            │
             ├─────►│  EVM Signer    │◄───────────┤
             │      │  (Magic.link)  │            │
             │      └────────────────┘            │
             │      ┌────────────────┐            │
             └─────►│ Hedera Account │◄───────────┘
                    │   (HCS-22)     │
                    └────────┬───────┘
                             │
                             ▼
                ┌────────────────────────┐
                │   SignalsStore v2      │
                │                        │
                │  • MESSAGE events      │
                │  • TRUST events        │
                │  • RECOGNITION events  │
                │  • Unified timeline    │
                └────────┬───────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ XMTP Net.  │  │  Hedera    │  │  Local     │
│ (Waku P2P) │  │  HCS/HTS   │  │  Cache     │
└────────────┘  └────────────┘  └────────────┘
```

### 1.2 Data Flow Patterns

#### Pattern A: Message-First Flow
```
User types message → XMTP encrypt/send → ContextEngine scans 
→ Detects intent (e.g., "thanks for the intro") 
→ Suggests "Send 🙏 Recognition" 
→ User taps → HCS event + TRST transfer 
→ SignalsStore merges message + trust event 
→ UI shows unified timeline
```

#### Pattern B: Trust-First Flow
```
User allocates trust → HCS TRUST_ALLOCATE event 
→ ContextEngine triggers notification 
→ XMTP message sent: "You're now in my Circle of 9" 
→ Recipient sees message + trust badge 
→ Conversation thread spawned automatically
```

#### Pattern C: Hybrid Anchored Flow
```
User sends sensitive message → XMTP E2EE delivery 
→ Optional: User anchors message hash to HCS 
→ Hedera records SHA-256 + timestamp (no content) 
→ Recipient can verify authenticity 
→ Compliance audit trail exists (hash only)
```

---

## 2. Data Models & Types

### 2.1 Core Identity Schema

```typescript
// lib/identity/ScendIdentity.ts

/**
 * Unified identity binding EVM wallet (XMTP signer) with Hedera account
 */
export interface ScendIdentity {
  // Primary keys
  evmAddress: string              // 0x... (Magic wallet, XMTP signer)
  hederaAccountId: string         // 0.0.xxxxx (HCS-22 resolved)
  
  // Identity metadata
  handle: string                  // User-chosen display name
  profileHrl: string              // hcs://11/{profile_topic}/{id}
  
  // XMTP state
  xmtpInstallationId?: string     // XMTP v3 installation ID
  xmtpLastSeen?: number           // Unix timestamp
  
  // Trust context (cached from HCS)
  trustAllocatedOut: number       // 0-9 (Circle of 9 constraint)
  recognitionCount: number        // Total recognitions minted
  
  // Signing capabilities
  canSignXMTP: boolean            // Has XMTP keys provisioned
  canSignHedera: boolean          // Has Hedera operator access
  
  // Privacy settings
  privacyLevel: 'open' | 'contacts-only' | 'circle-only'
  anchoringEnabled: boolean       // Auto-anchor message hashes to HCS
  
  // Sync state
  lastSyncedAt: number            // Last SignalsStore sync
  hcs22Binding: HCS22Binding      // Proof of EVM ↔ Hedera link
}

export interface HCS22Binding {
  topicId: string                 // HCS-22 identity topic
  consensusTimestamp: string      // When binding was published
  signature: string               // ED25519 signature proving control
  verified: boolean               // Has Mirror Node confirmed?
}
```

### 2.2 Extended SignalEvent Schema

```typescript
// lib/stores/signalsStore.ts (v2 extension)

export interface SignalEvent {
  id: string
  type: SignalEventType           // Extended with MESSAGE types
  actor: string                   // Hedera account ID
  target?: string                 // Optional counterparty
  ts: number                      // Epoch millis
  topicId: string                 // HCS topic (or 'xmtp' for off-chain)
  metadata: SignalMetadata        // Type-specific payload
  source: 'hcs' | 'hcs-cached' | 'xmtp' | 'xmtp-cached'
  
  // NEW: XMTP integration fields
  xmtpConversationId?: string     // XMTP thread ID
  xmtpMessageId?: string          // XMTP message ID
  contextTags?: ContextTag[]      // ContextEngine annotations
  anchorHash?: string             // SHA-256 if anchored to HCS
  anchorTopicId?: string          // HCS topic with anchor event
}

export type SignalEventType = 
  // Existing types
  | 'CONTACT_REQUEST'
  | 'CONTACT_ACCEPT'
  | 'TRUST_ALLOCATE'
  | 'RECOGNITION_MINT'
  | 'PROFILE_UPDATE'
  // NEW: Messaging types
  | 'MESSAGE_SENT'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_REACTION'
  | 'THREAD_CREATED'
  | 'THREAD_RESOLVED'
  // NEW: Hybrid types (message + trust action)
  | 'MESSAGE_WITH_TRUST'
  | 'MESSAGE_WITH_RECOGNITION'
  | 'MESSAGE_ANCHORED'          // Hash published to HCS

export interface MessageMetadata {
  content?: string                // Encrypted in 'xmtp' source
  contentPreview?: string         // First 100 chars for UI
  conversationId: string          // XMTP thread
  replyTo?: string                // Parent message ID
  mentions?: string[]             // @handle references
  attachments?: MessageAttachment[]
  reactions?: MessageReaction[]
}

export interface ContextTag {
  type: 'intent' | 'entity' | 'action' | 'sentiment'
  value: string
  confidence: number              // 0.0-1.0
  suggestedAction?: string        // e.g., "MINT_RECOGNITION:gratitude"
}
```

### 2.3 Conversation Schema

```typescript
// lib/xmtp/types.ts

export interface ConversationThread {
  id: string                      // XMTP conversation ID
  participants: string[]          // Hedera account IDs (resolved via ScendIdentity)
  evmParticipants: string[]       // EVM addresses (XMTP native)
  
  // Metadata
  createdAt: number
  lastMessageAt: number
  messageCount: number
  unreadCount: number
  
  // Trust context (enrichment from HCS)
  trustLevel?: number             // If participant in Circle of 9
  recognitionsSent?: number       // Count between these users
  isBonded: boolean               // CONTACT_ACCEPT exists in HCS
  
  // Thread state
  isPinned: boolean
  isMuted: boolean
  isArchived: boolean
  
  // Context hints
  dominantIntent?: string         // "gratitude" | "collaboration" | "support"
  suggestedActions: string[]      // ["MINT_RECOGNITION", "ALLOCATE_TRUST"]
}
```

---

## 3. Integration Points

### 3.1 File Structure (New/Modified)

```
lib/
├── xmtp/
│   ├── client.ts                    # XMTP client singleton (NEW)
│   ├── conversation.service.ts      # Thread management (NEW)
│   ├── message.service.ts           # Send/receive/react (NEW)
│   ├── sync.service.ts              # XMTP → SignalsStore bridge (NEW)
│   ├── types.ts                     # XMTP-specific types (NEW)
│   └── hooks/
│       ├── useConversations.ts      # React hook (NEW)
│       ├── useMessages.ts           # React hook (NEW)
│       └── useXMTPStatus.ts         # Connection state (NEW)
│
├── identity/
│   ├── ScendIdentity.ts             # Unified identity (NEW)
│   ├── resolver.service.ts          # EVM ↔ Hedera lookup (NEW)
│   └── identity.cache.ts            # Multi-layer cache (NEW)
│
├── context-engine/
│   ├── ContextEngine.ts             # MODIFIED: Add message handlers
│   ├── messageAnalyzer.ts           # NLP intent detection (NEW)
│   ├── suggestionEngine.ts          # Action recommendations (NEW)
│   └── registerHandlers.ts          # MODIFIED: Wire XMTP handlers
│
├── stores/
│   ├── signalsStore.ts              # MODIFIED: Add MESSAGE event types
│   └── conversationStore.ts         # NEW: XMTP-specific state
│
├── hedera/
│   └── anchorService.ts             # NEW: Publish message hashes to HCS
│
app/
├── (tabs)/
│   ├── messages/
│   │   ├── page.tsx                 # NEW: Conversation list
│   │   └── [conversationId]/
│   │       └── page.tsx             # NEW: Thread view
│   │
│   └── layout.tsx                   # MODIFIED: Add message badge
│
components/
├── messages/
│   ├── ConversationList.tsx         # NEW
│   ├── MessageThread.tsx            # NEW
│   ├── MessageComposer.tsx          # NEW
│   ├── MessageBubble.tsx            # NEW
│   ├── TrustBadge.tsx               # NEW: Show trust level in chat
│   ├── ContextSuggestions.tsx       # NEW: Action chips
│   └── AnchorStatus.tsx             # NEW: HCS anchor indicator
│
api/
├── xmtp/
│   ├── init/route.ts                # NEW: Provision XMTP keys
│   ├── conversations/route.ts       # NEW: List threads
│   └── send/route.ts                # NEW: Send message
│
└── identity/
    └── resolve/route.ts             # NEW: EVM ↔ Hedera lookup
```

### 3.2 Critical Hooks

#### Hook 1: SignalsStore Integration
```typescript
// lib/xmtp/sync.service.ts

export class XMTPSyncService {
  /**
   * Subscribe to XMTP stream and inject MESSAGE events into SignalsStore
   */
  async startSync(identity: ScendIdentity) {
    const xmtpClient = await getXMTPClient(identity.evmAddress)
    
    for await (const message of await xmtpClient.conversations.streamAllMessages()) {
      // Resolve sender EVM → Hedera
      const senderHedera = await identityResolver.evmToHedera(message.senderAddress)
      
      // Create SignalEvent
      const event: SignalEvent = {
        id: `msg_${message.id}`,
        type: 'MESSAGE_RECEIVED',
        actor: senderHedera,
        target: identity.hederaAccountId,
        ts: message.sent.getTime(),
        topicId: 'xmtp',
        source: 'xmtp',
        xmtpConversationId: message.conversationId,
        xmtpMessageId: message.id,
        metadata: {
          content: message.content,
          contentPreview: message.content.slice(0, 100),
          conversationId: message.conversationId
        }
      }
      
      // Inject into SignalsStore
      signalsStore.add(event)
      
      // Trigger ContextEngine analysis
      await contextEngine.analyzeMessage(event)
    }
  }
}
```

#### Hook 2: ContextEngine Integration
```typescript
// lib/context-engine/registerHandlers.ts (MODIFIED)

export function registerXMTPHandlers(engine: ContextEngine) {
  // Handler: Detect gratitude → Suggest recognition
  engine.onMessage('gratitude-detection', async (event: SignalEvent) => {
    if (event.type !== 'MESSAGE_RECEIVED') return
    
    const content = event.metadata?.content?.toLowerCase() || ''
    const gratitudePatterns = ['thanks', 'thank you', 'grateful', 'appreciate', '🙏']
    
    if (gratitudePatterns.some(p => content.includes(p))) {
      // Tag message
      event.contextTags = [{
        type: 'intent',
        value: 'gratitude',
        confidence: 0.85,
        suggestedAction: 'MINT_RECOGNITION:gratitude'
      }]
      
      // Show suggestion in UI
      await suggestionEngine.push({
        conversationId: event.xmtpConversationId,
        action: 'MINT_RECOGNITION',
        params: { 
          recipient: event.actor, 
          type: 'gratitude' 
        },
        displayText: 'Send 🙏 Gratitude Recognition',
        expiresAt: Date.now() + 300000 // 5 min
      })
    }
  })
  
  // Handler: Trust allocation → Auto-message
  engine.onEvent('trust-allocated', async (event: SignalEvent) => {
    if (event.type !== 'TRUST_ALLOCATE') return
    
    const xmtpService = await getMessageService()
    await xmtpService.sendAutoMessage(
      event.target!, // Recipient
      `🔥 You're now in my Circle of 9! This means I trust you with reputation and value.`,
      { autoGenerated: true, linkedEventId: event.id }
    )
  })
}
```

#### Hook 3: Identity Resolution Cache
```typescript
// lib/identity/resolver.service.ts

export class IdentityResolver {
  private cache = new Map<string, ScendIdentity>()
  private readonly CACHE_TTL = 300000 // 5 minutes
  
  /**
   * Resolve EVM address → Hedera account via HCS-22
   */
  async evmToHedera(evmAddress: string): Promise<string> {
    // Check cache
    const cached = this.cache.get(evmAddress)
    if (cached && Date.now() - cached.lastSyncedAt < this.CACHE_TTL) {
      return cached.hederaAccountId
    }
    
    // Query HCS-22 identity topic
    const response = await fetch(`/api/identity/resolve?evm=${evmAddress}`)
    const data = await response.json()
    
    if (data.hederaAccountId) {
      // Cache full identity
      this.cache.set(evmAddress, {
        evmAddress,
        hederaAccountId: data.hederaAccountId,
        handle: data.handle,
        // ... rest of ScendIdentity fields
      })
      return data.hederaAccountId
    }
    
    throw new Error(`No Hedera binding found for ${evmAddress}`)
  }
  
  /**
   * Reverse lookup: Hedera → EVM (for initiating XMTP chats)
   */
  async hederaToEVM(hederaAccountId: string): Promise<string> {
    // Query HCS-22 mirror node messages
    const url = `${MIRROR_REST}/topics/${HCS22_TOPIC_ID}/messages`
    const response = await fetch(url)
    const messages = await response.json()
    
    // Find binding message for this Hedera account
    for (const msg of messages.messages) {
      const payload = JSON.parse(atob(msg.message))
      if (payload.hederaAccountId === hederaAccountId) {
        return payload.evmAddress
      }
    }
    
    throw new Error(`No EVM binding found for ${hederaAccountId}`)
  }
}
```

---

## 4. Phased Roadmap

### Phase 1: Sidecar Messaging (Weeks 1-4)
**Goal**: XMTP runs independently; users can message contacts without touching HCS.

#### Deliverables
- [ ] XMTP client initialization with Magic.link signer
- [ ] Conversation list UI (`/messages`)
- [ ] Thread view UI with send/receive
- [ ] Identity resolver service (EVM ↔ Hedera)
- [ ] Basic SignalsStore integration (MESSAGE events stored locally)

#### Success Metrics
- **t₁ < 10s**: Time from login to first message sent
- **100%**: Message delivery rate between TrustMesh users
- **0**: Errors in EVM ↔ Hedera resolution

#### Technical Notes
```typescript
// Phase 1: No HCS writes, XMTP is separate layer
const message = await xmtpClient.conversations.newConversation(recipientEVM).send("Hello")

// Store in SignalsStore for unified timeline (but don't publish to HCS)
signalsStore.add({
  type: 'MESSAGE_SENT',
  source: 'xmtp',
  topicId: 'xmtp', // Not a real HCS topic
  // ...
})
```

---

### Phase 2: Context Threads (Weeks 5-8)
**Goal**: ContextEngine bridges messages ↔ trust events. Conversations trigger HCS actions.

#### Deliverables
- [ ] ContextEngine message analysis (NLP intent detection)
- [ ] Suggestion chips in message UI ("Send Recognition", "Allocate Trust")
- [ ] Auto-messaging on HCS events (trust allocated → notification message)
- [ ] Trust badge overlays in conversation list
- [ ] Unified timeline view (messages + trust events interleaved)

#### Success Metrics
- **t₂ > 15%**: Thread-to-action rate (messages that produce HCS events)
- **v₁ > 2.5**: Viral coefficient (avg new contacts per recognition via messaging)
- **85%**: User satisfaction with context suggestions (survey)

#### Implementation Example
```typescript
// Phase 2: ContextEngine detects intent and suggests action

// 1. User types message
const message = await xmtpClient.send("Thanks for the intro!")

// 2. ContextEngine analyzes
const analysis = await messageAnalyzer.analyze(message.content)
// → { intent: 'gratitude', confidence: 0.92, entities: ['intro'] }

// 3. Show suggestion chip
<ContextSuggestions
  actions={[{
    type: 'MINT_RECOGNITION',
    icon: '🙏',
    label: 'Send Gratitude Recognition',
    cost: '0.01 TRST',
    onConfirm: () => mintRecognition('gratitude', recipientHedera)
  }]}
/>

// 4. User taps → HCS event published
await hcsRecognitionService.mint({
  recipient: recipientHedera,
  type: 'gratitude',
  note: 'For the intro (via message thread)'
})

// 5. SignalsStore merges both events
signalsStore.add({ type: 'MESSAGE_WITH_RECOGNITION', ... })
```

---

### Phase 3: Anchored Messaging (Weeks 9-12)
**Goal**: Optional HCS anchoring for verifiable authenticity + compliance visibility.

#### Deliverables
- [ ] Anchor service: Publish SHA-256(message) to HCS
- [ ] UI toggle: "Anchor this message" checkbox
- [ ] Verification UI: "✓ Verified on Hedera" badge
- [ ] Compliance export: CSV of anchored message hashes
- [ ] Privacy audit: Confirm no plaintext leaks to HCS

#### Success Metrics
- **p₁ = 100%**: Privacy audit score (zero plaintext on HCS)
- **u₁ > 60%**: 7-day retention for active messagers
- **50%**: Users who anchor at least 1 message in first week

#### Anchor Flow
```typescript
// Phase 3: User opts to anchor sensitive message

// 1. Send via XMTP (E2EE, off-chain)
const message = await xmtpClient.send("Confirming contract terms...")

// 2. Compute hash
const messageHash = sha256(message.id + message.content + message.sent)

// 3. Publish hash to HCS (no content!)
await anchorService.publishAnchor({
  messageId: message.id,
  conversationId: message.conversationId,
  hash: messageHash,
  timestamp: message.sent.getTime(),
  participants: [senderHedera, recipientHedera] // Account IDs only
})

// 4. Recipient verifies
const isVerified = await anchorService.verifyMessage(message)
// → Queries HCS for matching hash, confirms timestamp

// 5. UI shows badge
<MessageBubble>
  {message.content}
  <AnchorStatus verified={true} consensusTimestamp="1234567890.123456789" />
</MessageBubble>
```

---

### Phase 4: Advanced Intelligence (Weeks 13-16)
**Goal**: Context-aware threading, sentiment tracking, zk-proofed reputation hints.

#### Deliverables
- [ ] Thread clustering by intent (auto-organize convos)
- [ ] Sentiment tracking over time (relationship health score)
- [ ] Recognition leaderboards visible in DMs
- [ ] Cross-chain XMTP v3 support (Ethereum, Polygon)
- [ ] zk-SNARK proofs: "I have >5 recognitions" without revealing which ones

#### Future Extensions
- **TRST Staking**: Lock TRST to unlock premium features (reactions, file attachments)
- **MatterFi Integration**: Send TRST via message ("Here's 5 TRST for coffee ☕")
- **Brale Settlement**: Cash-to-TRST mint triggered via message command
- **Cross-Chain Relays**: Bridge trust signals to Ethereum L2s

---

## 5. Risks & Mitigations

### Risk 1: Signer Key Mismatch
**Problem**: User has Magic wallet (EVM) but HCS-22 binding is stale/missing.

**Mitigation**:
- At login, check `hcs22Binding.verified` field
- If false, force re-binding flow: sign message with both keys → publish to HCS-22 topic
- Show UI banner: "Complete identity verification to enable messaging"

```typescript
// Defensive check before enabling XMTP
if (!identity.hcs22Binding.verified) {
  throw new Error('HCS-22 binding not verified. Re-run binding flow.')
}
```

### Risk 2: Message Storm (DoS)
**Problem**: Attacker sends 1000 messages/sec → SignalsStore overflow.

**Mitigation**:
- Rate limit: Max 100 MESSAGE events per conversation per minute
- Reject messages from non-bonded contacts (require CONTACT_ACCEPT first)
- Use XMTP's built-in anti-spam (sender allowlist)

```typescript
// Rate limiter
const messageCount = signalsStore.getAll()
  .filter(e => e.xmtpConversationId === convId && e.ts > Date.now() - 60000)
  .length

if (messageCount > 100) {
  throw new Error('Rate limit exceeded')
}
```

### Risk 3: Cache Coherence
**Problem**: Identity resolver cache stale → wrong Hedera account resolved.

**Mitigation**:
- Short TTL (5 min) with exponential backoff on errors
- Cache invalidation webhook from HCS-22 topic stream
- Fallback to direct Mirror Node query if cache miss

```typescript
// Cache with TTL + invalidation
class CachedIdentityResolver {
  async evmToHedera(evm: string): Promise<string> {
    const cached = this.cache.get(evm)
    if (cached && this.isFresh(cached)) return cached.hedera
    
    // Fallback: query Mirror Node
    const fresh = await this.queryMirrorNode(evm)
    this.cache.set(evm, { hedera: fresh, ts: Date.now() })
    return fresh
  }
}
```

### Risk 4: Privacy Leak via Anchors
**Problem**: Message hashes combined with metadata leak patterns.

**Mitigation**:
- **Never** publish message content to HCS (only SHA-256)
- Salt hashes with random nonce (stored only in XMTP metadata)
- Anchor schema: `{ hash, timestamp }` — no participants, no metadata

```typescript
// Safe anchor: zero PII
const anchor = {
  hash: sha256(message.id + nonce), // Nonce makes hash unlinkable
  timestamp: message.sent.getTime()
  // NO: conversationId, participants, content preview
}
```

### Risk 5: Cross-Chain Identity Fragmentation
**Problem**: User has Ethereum address on Polygon, different on Hedera.

**Mitigation**:
- XMTP v3 multi-chain support: one identity → many chains
- HCS-22 extended schema: store multiple EVM bindings
- UI: "Link additional wallets" flow

---

## 6. UX & Engagement Layer

### 6.1 Incentive Mechanics

#### Mechanic 1: "First Message Bonus"
- **Trigger**: User sends first XMTP message to a bonded contact
- **Reward**: 0.1 TRST airdrop (covers 10 recognition mints)
- **Goal**: Reduce friction, encourage early adoption

#### Mechanic 2: "Context Master Badge"
- **Trigger**: User converts 10 messages → on-chain actions (recognition/trust)
- **Reward**: Unlock "Context Master" NFT badge (visible in profile)
- **Goal**: Gamify ContextEngine usage

#### Mechanic 3: "Trust Thread Streaks"
- **Trigger**: Exchange messages with Circle of 9 member for 7 consecutive days
- **Reward**: Relationship health score increases, unlock joint recognition
- **Goal**: Retention, deepen high-trust relationships

### 6.2 Gamified Loops

```typescript
// Example: Streak tracking

interface TrustThread {
  conversationId: string
  participants: [string, string] // Hedera account IDs
  currentStreak: number          // Consecutive days with messages
  longestStreak: number
  lastMessageDate: string        // ISO date
}

// Reward function
function checkStreakReward(thread: TrustThread) {
  if (thread.currentStreak === 7) {
    // Unlock "Week of Trust" badge
    mintBadge(thread.participants, 'week-of-trust')
  }
  if (thread.currentStreak === 30) {
    // Unlock joint recognition slot (both users can co-sign recognitions)
    unlockJointRecognition(thread.participants)
  }
}
```

### 6.3 UI Patterns

#### Pattern 1: Trust Badge in Chat
```tsx
// components/messages/MessageBubble.tsx

<div className="message-bubble">
  <div className="message-header">
    <Avatar src={sender.avatar} />
    <span>{sender.handle}</span>
    {sender.trustLevel > 0 && (
      <TrustBadge level={sender.trustLevel} />
    )}
  </div>
  <div className="message-content">{content}</div>
  {contextTags.length > 0 && (
    <ContextSuggestions tags={contextTags} />
  )}
</div>

// TrustBadge component
function TrustBadge({ level }: { level: number }) {
  return (
    <Badge variant="trust" className="ml-2">
      🔥 Circle of {level}
    </Badge>
  )
}
```

#### Pattern 2: QR Thread Spawning
```tsx
// Quick onboarding: Scan QR → instant XMTP thread

<QRCodeGenerator
  data={{
    type: 'xmtp-thread',
    evmAddress: currentUser.evmAddress,
    hederaAccount: currentUser.hederaAccountId,
    nonce: generateNonce() // Prevent replay attacks
  }}
/>

// Scanner side
async function handleQRScan(data: QRData) {
  // 1. Resolve EVM → Hedera
  const recipientHedera = await resolver.evmToHedera(data.evmAddress)
  
  // 2. Create CONTACT_ACCEPT event (auto-bond)
  await contactService.acceptContact(recipientHedera)
  
  // 3. Start XMTP conversation
  const convo = await xmtpClient.conversations.newConversation(data.evmAddress)
  await convo.send("Hey! Just scanned your QR code 👋")
  
  // 4. Navigate to thread
  router.push(`/messages/${convo.id}`)
}
```

---

## 7. Open Questions & Future Research

### Q1: MatterFi Send-to-Name Integration
**Question**: Can XMTP messages trigger MatterFi TRST transfers via natural language?

**Proposed Solution**:
```typescript
// User types: "Here's 5 TRST for the coffee ☕"
// ContextEngine detects payment intent

const analysis = messageAnalyzer.analyze(message.content)
// → { intent: 'payment', amount: 5, token: 'TRST' }

if (analysis.intent === 'payment') {
  // Show confirmation modal
  <PaymentConfirmation
    recipient={conversation.recipientHedera}
    amount={analysis.amount}
    token="TRST"
    via="MatterFi Send-to-Name"
    onConfirm={() => {
      // Execute MatterFi transfer
      await matterFiService.sendToName(
        conversation.recipientHandle,
        analysis.amount
      )
      
      // Send XMTP receipt message
      await conversation.send(`✅ Sent ${analysis.amount} TRST via MatterFi`)
    }}
  />
}
```

### Q2: Brale Settlement via Message
**Question**: Can cash deposits (Brinks recycler) trigger messages?

**Flow**:
```
1. Cash deposited at ATM → Brinks API webhook
2. Brale mints TRST → HCS event
3. ContextEngine detects TRST_MINT for user
4. Auto-send XMTP message: "✅ 500 TRST minted from your $500 deposit"
5. User can reply to ask for receipt/details
```

### Q3: Cross-Chain Trust Portability
**Question**: If user has trust on Hedera, can they prove it on Ethereum L2 via XMTP?

**Proposed**: zk-SNARK circuit
- **Public inputs**: Hedera topic ID, user account ID
- **Private inputs**: List of TRUST_ALLOCATE events
- **Output**: Proof of "I have ≥5 trust allocations" without revealing who/when

Use case: Ethereum DAO checks proof before allowing proposal → trustless reputation portability.

### Q4: XMTP v3 Group Chats + Trust Circles
**Question**: Can Circle of 9 members have a group chat?

**Design**:
```typescript
// Auto-create group thread when user hits 9 trust allocations
if (trustStats.allocatedOut === 9) {
  const circleMembers = getCircleOf9Members()
  const groupConvo = await xmtpClient.conversations.newGroupConversation(
    circleMembers.map(m => m.evmAddress),
    { title: "My Circle of 9", description: "Trusted inner circle" }
  )
  
  // Send announcement
  await groupConvo.send("🎉 Circle complete! Let's build together.")
}
```

---

## 8. Metrics Dashboard

### Real-Time Monitoring

```typescript
// /api/metrics/xmtp

export async function GET() {
  const metrics = {
    // Performance
    t1_first_message_avg: await getAvgTimeToFirstMessage(), // Target: <10s
    t2_thread_to_action_rate: await getThreadToActionRate(), // Target: >15%
    
    // Engagement
    v1_viral_coefficient: await getViralCoefficient(), // Target: >2.5
    u1_retention_7d: await get7DayRetention(), // Target: >60%
    
    // Privacy
    p1_privacy_score: 100, // Manual audit (no plaintext leaks)
    
    // System health
    xmtp_connected_users: xmtpClient.getActiveUserCount(),
    messages_per_hour: await getMessageRate(),
    anchor_rate: await getAnchorRate(), // % messages anchored
    
    // Trust integration
    messages_with_trust_events: await getTrustEventRate(),
    recognition_mints_via_message: await getRecognitionMintRate()
  }
  
  return Response.json(metrics)
}
```

---

## 9. Implementation Checklist

### Pre-Phase 1 Setup
- [ ] Install XMTP SDK: `pnpm add @xmtp/xmtp-js`
- [ ] Create `lib/xmtp/` directory structure
- [ ] Set up XMTP environment vars:
  - `NEXT_PUBLIC_XMTP_ENV=production` (or `dev` for testing)
- [ ] Initialize ScendIdentity types
- [ ] Create identity resolver service skeleton

### Phase 1 (Weeks 1-4)
- [ ] Implement XMTP client singleton with Magic.link signer
- [ ] Build conversation list UI component
- [ ] Build message thread UI component
- [ ] Integrate with SignalsStore (MESSAGE events)
- [ ] Add identity resolver cache
- [ ] Write unit tests for EVM ↔ Hedera resolution
- [ ] Deploy to staging, test with 2 users

### Phase 2 (Weeks 5-8)
- [ ] Implement ContextEngine message analyzer
- [ ] Add NLP intent detection (regex/ML patterns)
- [ ] Build suggestion chip UI components
- [ ] Wire auto-messaging on HCS events
- [ ] Add trust badge overlays in UI
- [ ] Build unified timeline view (messages + trust events)
- [ ] A/B test suggestion copy, measure t₂ metric

### Phase 3 (Weeks 9-12)
- [ ] Implement anchor service (SHA-256 publish to HCS)
- [ ] Add "Anchor this message" UI toggle
- [ ] Build verification badge component
- [ ] Create compliance export API endpoint
- [ ] Conduct privacy audit (external review)
- [ ] Document anchor schema in API docs

### Phase 4 (Weeks 13-16)
- [ ] Research XMTP v3 multi-chain support
- [ ] Design zk-SNARK circuit for trust proofs
- [ ] Prototype cross-chain identity binding
- [ ] Build thread clustering algorithm
- [ ] Implement sentiment tracking
- [ ] Integration testing with MatterFi/Brale APIs

---

## 10. Conclusion

This specification defines a **protocol-grade messaging layer** that transforms TrustMesh from a reputation system into a **living nervous system for decentralized trust**.

### Key Innovations

1. **Dual-Layer Identity**: ScendIdentity unifies EVM (XMTP) + Hedera (HCS-22) with verifiable cryptographic binding.

2. **Context-Aware Messaging**: ContextEngine bridges human conversation and on-chain actions, making trust-building feel natural.

3. **Privacy-First Anchoring**: Optional HCS hashing provides verifiable authenticity without compromising E2EE.

4. **Gamified Trust**: Streaks, badges, and viral mechanics incentivize relationship deepening.

5. **Cross-Protocol Bridge**: XMTP → Hedera integration sets precedent for trust portability across chains.

### Strategic Positioning

- **For THA/xAI Investors**: "The ChatGPT of trust — where every conversation builds cryptographic reputation."
- **For Users**: "Message your friends, earn trust, unlock value — all without thinking about blockchain."
- **For Developers**: "Composable trust primitives with XMTP interoperability — build the next Farcaster, but ownerless."

### Next Steps

1. **Engineering Sprint Planning**: Break Phase 1 into 2-week sprints with Warp ticket system.
2. **Security Audit Procurement**: Engage Trail of Bits for XMTP integration review.
3. **Partnership Development**: Coordinate with XMTP Labs on joint case study.
4. **User Research**: 10 in-depth interviews with target users (GenZ, cannabis operators, DAOs).

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-09  
**Contributors**: Architecture Team, Product, Security  
**Review Status**: ✅ Ready for Engineering Kickoff
