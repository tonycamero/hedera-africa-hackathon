# 🚀 TrustMesh Sprint Execution Plan
**Date:** November 11, 2025  
**Sprint Focus:** Privacy-First Circle API + XMTP v0.1 Lock + Loop Two Foundation  
**Repo:** `TrustMesh_hackathon`  
**Owner:** Tony Camero / Scend Technologies

---

## 📋 Sprint Overview

**Mission:** Transform TrustMesh from "it works" to "it's philosophically aligned + production-ready" by eliminating surveillable patterns, stabilizing XMTP messaging, and laying Loop Two (Messages + Payments) foundation.

**Sprint Duration:** 5-7 days  
**Priority:** Privacy hardening > Stability > New features

---

## 🎯 Epic Breakdown

| Epic | Tickets | Priority | Est. Days |
|------|---------|----------|-----------|
| **A: Circle API Privacy** | CIR-1, CIR-2, CIR-3 | 🔴 Critical | 2-3 |
| **B: XMTP v0.1 Lock** | XMTP-11, XMTP-12 | 🔴 Critical | 1-2 |
| **C: Loop Two UI** | LP-1, LP-2, LP-3 | 🟡 High | 2-3 |
| **D: Inner Circle** | IC-1 | 🟢 Nice-to-have | 0.5-1 |

---

## 🧵 Epic A — Circle API Privacy & Graph Scoping

**Philosophy Alignment:** "Trust is local, earned, contextual. We reject surveillance capitalism."  
**Problem:** Current `/circle` API loads entire HCS graph per request → surveillable anti-pattern.  
**Solution:** Incremental cache + auth-scoped queries.

---

### **CIR-1 — Implement `HcsCircleState` Incremental Cache**

**Type:** Feature / Infrastructure  
**Priority:** 🔴 Critical  
**Estimated Time:** 1 day

#### **Goal**
Stop rebuilding entire HCS graph on every `/circle` call by introducing incremental state that ingestion updates.

#### **Current State**
- `ARCHITECTURE.md` describes ingestion: REST backfill + WS stream → normalizers → stores
- SignalsStore is canonical event log (contacts, trust, recognition)
- Legacy `/circle` behavior: fetches all events and rebuilds graph each call

#### **Implementation Plan**

**1. Create `HcsCircleState` module**
```typescript
// lib/stores/HcsCircleState.ts

export interface CircleNode {
  accountId: string
  handle: string
  profileHrl: string
  bondedAt: number
  metadata?: Record<string, any>
}

export interface CircleEdge {
  from: string
  to: string
  type: 'CONTACT_ACCEPT' | 'CONTACT_REVOKE' | 'TRUST_GIVEN'
  strength?: number
  createdAt: number
  revokedAt?: number
}

export interface CircleGraph {
  nodes: Map<string, CircleNode>
  edges: Map<string, CircleEdge[]> // keyed by accountId
  lastUpdated: number
}

class HcsCircleStateManager {
  private graph: CircleGraph = {
    nodes: new Map(),
    edges: new Map(),
    lastUpdated: Date.now()
  }

  // Called by ingestion pipeline
  addContactEvent(event: ContactEvent) {
    // Normalize and add to graph
  }

  addTrustEvent(event: TrustEvent) {
    // Update edge strengths
  }

  // Query methods
  getCircleFor(accountId: string): CircleSubgraph {
    // Returns only first-degree connections
  }

  getContactsFor(accountId: string): CircleNode[] {
    // Returns direct contacts only
  }
}

export const circleState = new HcsCircleStateManager()
```

**2. Wire into ingestion pipeline**
```typescript
// lib/ingestion/orchestrator.ts (or equivalent)

import { circleState } from '@/lib/stores/HcsCircleState'

function onContactEvent(event: HcsEvent) {
  // Existing SignalsStore write
  signalsStore.add(event)
  
  // NEW: Update circle state
  if (event.type === 'CONTACT_ACCEPT' || event.type === 'CONTACT_REVOKE') {
    circleState.addContactEvent(event)
  }
}
```

**3. Add tests**
```typescript
// __tests__/HcsCircleState.test.ts

describe('HcsCircleState', () => {
  it('builds correct neighbor set from events', () => {
    const events = [
      { type: 'CONTACT_ACCEPT', actor: '0.0.111', target: '0.0.222' },
      { type: 'CONTACT_ACCEPT', actor: '0.0.111', target: '0.0.333' }
    ]
    
    events.forEach(e => circleState.addContactEvent(e))
    
    const circle = circleState.getCircleFor('0.0.111')
    expect(circle.contacts).toHaveLength(2)
    expect(circle.contacts.map(c => c.accountId)).toContain('0.0.222')
  })
  
  it('handles revocations correctly', () => {
    circleState.addContactEvent({ type: 'CONTACT_ACCEPT', actor: '0.0.111', target: '0.0.222' })
    circleState.addContactEvent({ type: 'CONTACT_REVOKE', actor: '0.0.111', target: '0.0.222' })
    
    const circle = circleState.getCircleFor('0.0.111')
    expect(circle.contacts).toHaveLength(0)
  })
})
```

#### **Files to Create/Modify**
- `lib/stores/HcsCircleState.ts` (new)
- `lib/ingestion/orchestrator.ts` (modify - add circle state updates)
- `__tests__/HcsCircleState.test.ts` (new)

#### **Acceptance Criteria**
- [ ] `HcsCircleState` module exists and exports query methods
- [ ] Given sequence of contact events, `getCircleFor(accountId)` returns expected neighbors
- [ ] Ingestion writes to both SignalsStore AND HcsCircleState
- [ ] Tests pass for add/revoke/query flows
- [ ] No performance regression in ingestion pipeline

---

### **CIR-2 — Refactor `/api/circle` to Use Scoped Graph**

**Type:** Feature / Privacy  
**Priority:** 🔴 Critical  
**Estimated Time:** 1-2 days

#### **Goal**
Make `/circle` return ONLY data relevant to authenticated user using cached graph. Remove surveillant "pull all events" behavior.

#### **Current State**
- `/api/circle` exists (location TBD - check `app/api/circle/` or `pages/api/circle.ts`)
- Currently rebuilds entire graph from HCS events per request
- No auth-scoped filtering

#### **Implementation Plan**

**1. Locate and audit current `/api/circle`**
```bash
# Find the endpoint
find /home/tonycamero/code/TrustMesh_hackathon -name "*circle*" -type f | grep -E "(api|route)"
```

**2. Add authentication + HCS-22 resolution**
```typescript
// app/api/circle/route.ts (or pages/api/circle.ts)

import { requireMagicAuth } from '@/lib/server/auth/requireMagicAuth'
import { resolveOrProvision } from '@/lib/server/hcs22/resolveOrProvision'
import { circleState } from '@/lib/stores/HcsCircleState'

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const auth = await requireMagicAuth(req)
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Resolve Hedera account via HCS-22
  const { hederaAccountId } = await resolveOrProvision(auth.issuer)
  
  if (!hederaAccountId) {
    return NextResponse.json({ error: 'No Hedera account' }, { status: 400 })
  }
  
  // 3. Query scoped graph (NO GLOBAL SCAN)
  const circle = circleState.getCircleFor(hederaAccountId)
  
  // 4. Return minimal data
  return NextResponse.json({
    accountId: hederaAccountId,
    contacts: circle.contacts.map(c => ({
      accountId: c.accountId,
      handle: c.handle,
      bondedAt: c.bondedAt
      // NO GLOBAL METADATA, NO UNRELATED NODES
    })),
    stats: {
      contactCount: circle.contacts.length,
      innerCircleCount: circle.innerCircle?.length || 0
    }
  })
}
```

**3. Remove any legacy global fetch code**
```typescript
// OLD CODE TO DELETE:
// const allEvents = await fetchAllHcsEvents() ❌
// const graph = buildGraphFromAllEvents(allEvents) ❌
```

**4. Add cold-state handling**
```typescript
if (!circleState.isReady()) {
  return NextResponse.json({
    status: 'warming',
    message: 'Circle state initializing, try again in a moment'
  }, { status: 202 })
}
```

#### **Files to Modify**
- `app/api/circle/route.ts` (or `pages/api/circle.ts`)
- Any utility functions that do global HCS scans

#### **Acceptance Criteria**
- [ ] `/api/circle` never iterates over entire HCS history per request
- [ ] Query cost scales with ~N (user's contacts), not global events
- [ ] Response includes ONLY calling user + first-degree relationships
- [ ] Manual test: User A cannot infer User C's existence if no connection
- [ ] Authentication required (401 if missing token)
- [ ] Logs show per-request node count is bounded (e.g., <250)

---

### **CIR-3 — Circle API Observability & Safeguards**

**Type:** Hardening / Infrastructure  
**Priority:** 🟡 High  
**Estimated Time:** 0.5 day

#### **Goal**
Ensure new `/circle` behavior is measurable, safe, and doesn't regress to global scraping.

#### **Implementation Plan**

**1. Add structured logging**
```typescript
// lib/util/logger.ts (or create)

export function logCircleQuery(params: {
  accountId: string
  nodeCount: number
  authLatency: number
  queryLatency: number
}) {
  console.log('[CIRCLE_QUERY]', JSON.stringify({
    ...params,
    timestamp: new Date().toISOString()
  }))
}
```

**2. Add metrics to endpoint**
```typescript
export async function GET(req: NextRequest) {
  const startAuth = Date.now()
  const auth = await requireMagicAuth(req)
  const authLatency = Date.now() - startAuth
  
  const startQuery = Date.now()
  const circle = circleState.getCircleFor(hederaAccountId)
  const queryLatency = Date.now() - startQuery
  
  logCircleQuery({
    accountId: hederaAccountId,
    nodeCount: circle.contacts.length,
    authLatency,
    queryLatency
  })
  
  // Return response...
}
```

**3. Add hard cap on results**
```typescript
const MAX_CONTACTS_RETURNED = 250

if (circle.contacts.length > MAX_CONTACTS_RETURNED) {
  console.warn('[CIRCLE_QUERY] Contact count exceeds cap', {
    accountId: hederaAccountId,
    actual: circle.contacts.length,
    cap: MAX_CONTACTS_RETURNED
  })
  
  circle.contacts = circle.contacts.slice(0, MAX_CONTACTS_RETURNED)
}
```

**4. Add test for cap enforcement**
```typescript
it('enforces MAX_CONTACTS_RETURNED cap', async () => {
  // Seed 300 contacts for test user
  const response = await GET(mockRequest)
  const data = await response.json()
  
  expect(data.contacts.length).toBeLessThanOrEqual(250)
})
```

#### **Files to Create/Modify**
- `lib/util/logger.ts` (new or modify)
- `app/api/circle/route.ts` (add logging + caps)
- `__tests__/api/circle.test.ts` (new)

#### **Acceptance Criteria**
- [ ] Logs show per-request node count and latency
- [ ] Hard cap (250) enforced with test coverage
- [ ] No code path exists that scans total event history on `/circle` requests
- [ ] Warning logged if cap is hit (signals potential abuse/misconfiguration)

---

## 📡 Epic B — XMTP Sidecar v0.1: T10 Execution & Stabilization

**Context:** XMTP V3 migration complete (`@xmtp/browser-sdk` v5), but T10 test plan not yet executed.  
**Goal:** Lock XMTP Phase 1 as production-ready via formal QA + bug fixes.

---

### **XMTP-11 — Execute `XMTP_T10` Test Plan & Document Results**

**Type:** QA / Validation  
**Priority:** 🔴 Critical  
**Estimated Time:** 1 day

#### **Goal**
Move XMTP sidecar from "spec + code" to "verified v0.1" by running full T10 test plan.

#### **Test Plan Reference**
`docs/XMTP_T10_TEST_PLAN.md` (already exists in repo)

#### **Execution Steps**

**1. Setup two Magic users**
```bash
# Terminal 1: User A (primary browser)
NEXT_PUBLIC_XMTP_ENABLED=true pnpm dev

# Terminal 2: User B (incognito/different profile)
# Use separate Magic account
```

**2. Execute all 10 scenarios**

| Scenario | Description | Expected Outcome |
|----------|-------------|------------------|
| 1 | Contact List Display | User B appears with XMTP badge or "Invite" |
| 2 | Open Thread View | Full-screen thread loads, composer visible |
| 3 | Send Message (A→B) | Message on right (orange bubble), timestamp |
| 4 | Receive Message (B receives from A) | Message on left (panel bg), real-time |
| 5 | Bi-Directional Real-Time | Both see each other's messages immediately |
| 6 | Back Navigation | Returns to list, no memory leaks |
| 7 | Feature Flag Off | "Messaging unavailable" state, no crashes |
| 8 | Not Authenticated | "Sign in required" state |
| 9 | EVM Resolution Failure | Partial failure doesn't break list |
| 10 | Message Persistence | Messages persist across sessions |

**3. Document results**
```markdown
# XMTP T10 Test Results
**Date:** 2025-11-11  
**Tester:** Tony Camero  
**Branch:** feature/xmtp-nervous-system

## Test Execution Summary

| Scenario | Status | Notes | Screenshots |
|----------|--------|-------|-------------|
| 1. Contact List | ✅ Pass | User B shown with green XMTP badge | [screenshot] |
| 2. Thread View | ✅ Pass | Loaded in <1s | [screenshot] |
| 3. Send A→B | ✅ Pass | Message appeared instantly | [screenshot] |
| 4. Receive B | ✅ Pass | Real-time delivery | [screenshot] |
| 5. Bi-Directional | ✅ Pass | Both sides updated | [screenshot] |
| 6. Back Nav | ⚠️ Warn | React warning about setState on unmount | [console log] |
| 7. Flag Off | ✅ Pass | Graceful degradation | [screenshot] |
| 8. Unauth | ✅ Pass | Login prompt shown | [screenshot] |
| 9. EVM Failure | ✅ Pass | Other contacts still work | [screenshot] |
| 10. Persistence | ✅ Pass | Messages loaded on refresh | [screenshot] |

## Issues Found

### Issue 1: Memory Leak Warning on Back Navigation
**Severity:** Medium  
**Description:** Console shows "Can't perform a React state update on an unmounted component"  
**Root Cause:** `streamMessages()` cleanup not properly awaited  
**Fix:** Added proper cleanup in useEffect return  
**Commit:** abc123def

## Performance Metrics

- Time to first message: 8.2s ✅ (target <10s)
- Message delivery latency: 2.1s ✅ (target <3s)
- Contact list load: 1.8s ✅ (target <2s)
- Thread switch: 0.9s ✅ (target <1s)

## Acceptance: PASS ✅

All critical scenarios pass. One warning addressed. Ready for v0.1 tag.
```

#### **Files to Create**
- `docs/XMTP_T10_RESULTS.md` (new)
- Screenshots in `docs/screenshots/xmtp-t10/` (new directory)

#### **Acceptance Criteria**
- [ ] All 10 scenarios in T10 plan have explicit pass/fail notes
- [ ] `XMTP_T10_RESULTS.md` exists with screenshots
- [ ] At least one screenshot shows A↔B conversation
- [ ] Any bugs found are documented with severity + fix status

---

### **XMTP-12 — Fix XMTP Edge Bugs & Add Smoke Tests**

**Type:** Bugfix / Testing  
**Priority:** 🔴 Critical  
**Estimated Time:** 0.5-1 day

#### **Goal**
Address bugs found in XMTP-11 and add minimal automated test coverage.

#### **Bug Fixes (based on common issues)**

**1. Stream cleanup on unmount**
```typescript
// components/messages/MessageThread.tsx

useEffect(() => {
  let mounted = true
  let stream: AsyncIterable<any> | null = null
  
  async function startStream() {
    stream = conversation.streamMessages()
    for await (const msg of stream) {
      if (!mounted) break
      setMessages(prev => [...prev, msg])
    }
  }
  
  startStream()
  
  return () => {
    mounted = false
    if (stream) {
      stream.return?.() // Proper cleanup
    }
    console.log('[MessageThread] Stream cleanup complete')
  }
}, [conversation])
```

**2. Sent/received detection**
```typescript
// components/messages/MessageBubble.tsx

import { useIdentity } from '@/app/providers/IdentityProvider'

export function MessageBubble({ message }: { message: any }) {
  const { identity } = useIdentity()
  const isSent = message.senderAddress.toLowerCase() === identity?.evmAddress.toLowerCase()
  
  // Rest of component...
}
```

**3. Feature flag check**
```typescript
// lib/xmtp/client.ts

export async function getXmtpClient(evmAddress: string) {
  if (!XMTP_ENABLED) {
    console.warn('[XMTP] Feature disabled, skipping client init')
    return null // Don't throw, just return null
  }
  // Rest of initialization...
}
```

#### **Smoke Tests**

```typescript
// __tests__/xmtp-smoke.test.ts

import { getXmtpClient } from '@/lib/xmtp/client'
import { XMTP_ENABLED } from '@/lib/config/xmtp'

describe('XMTP Smoke Tests', () => {
  it('respects XMTP_ENABLED flag', async () => {
    process.env.NEXT_PUBLIC_XMTP_ENABLED = 'false'
    const client = await getXmtpClient('0x1234')
    expect(client).toBeNull()
  })
  
  it('does not throw when disabled', async () => {
    process.env.NEXT_PUBLIC_XMTP_ENABLED = 'false'
    await expect(getXmtpClient('0x1234')).resolves.not.toThrow()
  })
  
  it('IdentityProvider handles missing identity', () => {
    const { result } = renderHook(() => useIdentity(), {
      wrapper: IdentityProvider
    })
    expect(result.current.identity).toBeNull()
    expect(result.current.loading).toBe(true)
  })
})
```

#### **Files to Modify**
- `components/messages/MessageThread.tsx` (fix cleanup)
- `components/messages/MessageBubble.tsx` (fix sent detection)
- `lib/xmtp/client.ts` (ensure flag check doesn't throw)
- `__tests__/xmtp-smoke.test.ts` (new)

#### **Acceptance Criteria**
- [ ] All bugs found in XMTP-11 are fixed or explicitly deferred
- [ ] Test suite fails if XMTP initializes when flag is false
- [ ] Test validates "Messaging Disabled" UI renders correctly
- [ ] `pnpm build` passes with no errors
- [ ] `pnpm test` passes with new smoke tests

---

## 💸 Epic C — Loop Two: Messages + Payments (UI Skeleton)

**Context:** Loop Two spec exists (`loop_two_messaging_payments.md`) but not implemented.  
**Goal:** Build UI skeleton ready for TRST payment integration (actual payment logic = Phase 2).

---

### **LP-1 — Finalize `/messages` Layout for "Messages & Payments"**

**Type:** Feature / UI  
**Priority:** 🟡 High  
**Estimated Time:** 0.5 day

#### **Goal**
Align Messages tab with Loop Two spec (Messages + Payments branding).

#### **Implementation**

```typescript
// app/(tabs)/messages/page.tsx

export default function MessagesPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Messages & Payments</h1>
        <p className="text-muted-foreground">
          Converse privately and settle TRST in context
        </p>
      </div>
      
      {/* Search bar */}
      <div className="mb-4">
        <Input 
          placeholder="Search conversations or start new thread..."
          className="w-full"
        />
      </div>
      
      {/* Thread list area */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          Recent Threads
        </h2>
        <ConversationList />
      </div>
    </div>
  )
}
```

#### **Files to Modify**
- `app/(tabs)/messages/page.tsx`

#### **Acceptance Criteria**
- [ ] Header reads "Messages & Payments"
- [ ] Subtext: "Converse privately and settle TRST in context"
- [ ] Clear visual distinction from Contacts tab
- [ ] Search bar placeholder present (non-functional OK for now)

---

### **LP-2 — Conversation List Component Ready for Payments**

**Type:** Feature / UI  
**Priority:** 🟡 High  
**Estimated Time:** 0.5 day

#### **Goal**
Enhance ConversationList to show payment indicators (even if mock data).

#### **Implementation**

```typescript
// components/messages/ConversationList.tsx

interface ConversationListItem {
  contact: MessagingContact
  lastMessage?: {
    type: 'text' | 'payment'
    preview: string
    timestamp: number
  }
  unreadCount?: number
  balance?: number // Net TRST balance in this thread
}

export function ConversationList() {
  const { xmtpClient } = useIdentity()
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  
  // Load conversations...
  
  return (
    <div className="space-y-2">
      {conversations.map(conv => (
        <div 
          key={conv.contact.hederaAccountId}
          className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{conv.contact.handle}</p>
                {conv.unreadCount && (
                  <Badge variant="default">{conv.unreadCount}</Badge>
                )}
              </div>
              
              {/* Last message preview */}
              {conv.lastMessage && (
                <p className="text-sm text-muted-foreground truncate">
                  {conv.lastMessage.type === 'payment' ? '💸 ' : ''}
                  {conv.lastMessage.preview}
                </p>
              )}
              
              {/* Balance indicator */}
              {conv.balance && conv.balance !== 0 && (
                <p className={cn(
                  "text-xs font-mono mt-1",
                  conv.balance > 0 ? "text-green-600" : "text-orange-600"
                )}>
                  {conv.balance > 0 ? '+' : ''}{conv.balance} TRST
                </p>
              )}
            </div>
            
            <Button size="sm" variant="ghost">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### **Files to Modify**
- `components/messages/ConversationList.tsx`

#### **Acceptance Criteria**
- [ ] List shows participant name + last message preview
- [ ] Payment messages show 💸 emoji
- [ ] Balance indicator shows net TRST (green if positive, orange if negative)
- [ ] Empty state renders cleanly

---

### **LP-3 — Thread View & Composer Prepped for TRST Cards**

**Type:** Feature / UI  
**Priority:** 🟡 High  
**Estimated Time:** 1 day

#### **Goal**
Enable thread UI to render payment cards without rework when TRST logic arrives.

#### **Implementation**

**1. Message type discriminator**
```typescript
// types/message.ts

export type MessageContent = 
  | { type: 'text'; content: string }
  | { type: 'payment'; amount: number; txHash: string; status: 'sent' | 'pending' }

export interface Message {
  id: string
  content: MessageContent
  senderAddress: string
  timestamp: number
}
```

**2. Payment card component**
```typescript
// components/messages/PaymentCard.tsx

export function PaymentCard({ payment }: { payment: PaymentMessage }) {
  return (
    <div className="border rounded-lg p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold">{payment.amount} TRST</span>
        <Badge variant={payment.status === 'sent' ? 'default' : 'secondary'}>
          {payment.status}
        </Badge>
      </div>
      
      {payment.txHash && (
        <a 
          href={`https://hashscan.io/testnet/transaction/${payment.txHash}`}
          target="_blank"
          className="text-xs text-muted-foreground hover:underline"
        >
          View hash →
        </a>
      )}
    </div>
  )
}
```

**3. Updated MessageBubble**
```typescript
// components/messages/MessageBubble.tsx

export function MessageBubble({ message }: { message: Message }) {
  const { identity } = useIdentity()
  const isSent = message.senderAddress.toLowerCase() === identity?.evmAddress.toLowerCase()
  
  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div className={cn(
        "max-w-[75%] p-3 rounded-lg",
        isSent ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {message.content.type === 'text' ? (
          <p>{message.content.content}</p>
        ) : (
          <PaymentCard payment={message.content} />
        )}
        
        <p className="text-xs opacity-70 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
```

**4. Composer with Pay button**
```typescript
// components/messages/MessageComposer.tsx

export function MessageComposer({ conversation }: { conversation: any }) {
  const [message, setMessage] = useState('')
  const [showPayModal, setShowPayModal] = useState(false)
  
  return (
    <div className="flex gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
      />
      
      <div className="flex flex-col gap-1">
        <Button onClick={handleSend} disabled={!message.trim()}>
          <Send className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowPayModal(true)}
          title="Send TRST"
        >
          <Coins className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Payment modal (non-functional for now) */}
      {showPayModal && (
        <Dialog open onOpenChange={setShowPayModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send TRST</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Payment functionality coming in Phase 2
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
```

#### **Files to Create/Modify**
- `types/message.ts` (new)
- `components/messages/PaymentCard.tsx` (new)
- `components/messages/MessageBubble.tsx` (modify)
- `components/messages/MessageComposer.tsx` (modify)

#### **Acceptance Criteria**
- [ ] Message rendering handles `type: 'payment'` and shows PaymentCard
- [ ] Text messages still work as before
- [ ] Composer shows Coins button (clicking opens modal with "Coming soon")
- [ ] No crashes when payment message rendered
- [ ] Payment card layout looks good on mobile

---

## 💎 Epic D — Inner Circle Surfacing (Stretch Goal)

**Context:** Inner Circle meta-system defined (`inner_circle_meta_system.md`) but not visible in UI.  
**Goal:** Quick win - show 💎 badge for Inner Circle contacts.

---

### **IC-1 — Add Inner Circle Badge in Contacts & Messages**

**Type:** Feature / UX  
**Priority:** 🟢 Nice-to-have  
**Estimated Time:** 0.5 day

#### **Goal**
Make Inner Circle visible via minimal UX hook (💎 badge).

#### **Implementation**

**1. Add isInnerCircle flag to contact model**
```typescript
// lib/types/contact.ts (or wherever MessagingContact lives)

export interface MessagingContact {
  hederaAccountId: string
  evmAddress?: string
  handle: string
  canMessage: boolean
  bondedAt: number
  isInnerCircle?: boolean // NEW
}
```

**2. Mock Inner Circle detection (until HCS-10 wired)**
```typescript
// lib/services/innerCircle.ts (new)

const MOCK_INNER_CIRCLE_IDS = new Set([
  '0.0.7158088', // Example IDs for testing
  '0.0.7158099'
])

export function isInnerCircle(accountId: string): boolean {
  // TODO: Replace with HCS-10 query once available
  return MOCK_INNER_CIRCLE_IDS.has(accountId)
}
```

**3. Add badge to ConversationList**
```typescript
// components/messages/ConversationList.tsx

import { isInnerCircle } from '@/lib/services/innerCircle'

// Inside map:
<div className="flex items-center gap-2">
  <p className="font-semibold">{conv.contact.handle}</p>
  {isInnerCircle(conv.contact.hederaAccountId) && (
    <span title="Inner Circle" className="text-sm">💎</span>
  )}
</div>
```

**4. Add badge to thread header**
```typescript
// components/messages/MessageThread.tsx

<div className="flex items-center gap-2 border-b p-4">
  <Button variant="ghost" size="icon" onClick={onBack}>
    <ArrowLeft className="w-5 h-5" />
  </Button>
  
  <div className="flex-1">
    <div className="flex items-center gap-2">
      <h2 className="font-semibold">{contact.handle}</h2>
      {isInnerCircle(contact.hederaAccountId) && (
        <span title="Inner Circle" className="text-sm">💎</span>
      )}
    </div>
    <p className="text-xs text-muted-foreground">{contact.hederaAccountId}</p>
  </div>
</div>
```

#### **Files to Create/Modify**
- `lib/services/innerCircle.ts` (new - mock service)
- `lib/types/contact.ts` (add isInnerCircle field)
- `components/messages/ConversationList.tsx` (add badge)
- `components/messages/MessageThread.tsx` (add badge to header)

#### **Acceptance Criteria**
- [ ] 💎 appears next to Inner Circle contacts in conversation list
- [ ] 💎 appears in thread header when chatting with Inner Circle member
- [ ] No 💎 for non-Inner Circle contacts
- [ ] Badge doesn't break mobile layout
- [ ] Hover shows "Inner Circle" tooltip

---

## 📊 Sprint Success Metrics

### **Must Have (v0.1)**
- [ ] `/api/circle` no longer scans entire HCS history
- [ ] Query cost scales with user's contacts, not global events
- [ ] XMTP T10 test plan executed with results documented
- [ ] All critical XMTP bugs fixed
- [ ] Messages tab rebranded "Messages & Payments"
- [ ] Payment card UI ready (even if non-functional)

### **Nice to Have**
- [ ] Inner Circle badges visible in UI
- [ ] Performance metrics logged for Circle API
- [ ] Automated smoke tests for XMTP

### **Quality Gates**
- [ ] `pnpm build` passes with no errors
- [ ] `pnpm test` passes with all new tests
- [ ] No React warnings in browser console
- [ ] No TypeScript errors
- [ ] Manual QA on mobile (responsive layouts)

---

## 🎬 Execution Order (Recommended)

**Day 1-2: Privacy First (Epic A)**
1. CIR-1: Implement HcsCircleState (1 day)
2. CIR-2: Refactor /api/circle (1 day)
3. CIR-3: Add observability (0.5 day)

**Day 3: XMTP Lock (Epic B)**
4. XMTP-11: Run T10 tests (0.5 day)
5. XMTP-12: Fix bugs + add tests (0.5 day)

**Day 4-5: Loop Two Foundation (Epic C)**
6. LP-1: Messages & Payments layout (0.5 day)
7. LP-2: ConversationList enhancements (0.5 day)
8. LP-3: Payment cards in thread (1 day)

**Day 6: Inner Circle (Epic D) - Optional**
9. IC-1: Add 💎 badges (0.5 day)

---

## 🔧 Development Setup

### **Environment Variables Required**
```bash
# .env.local
NEXT_PUBLIC_XMTP_ENABLED=true
NEXT_PUBLIC_XMTP_ENV=dev
NEXT_PUBLIC_HEDERA_NETWORK=testnet
HCS22_ENABLED=true
HCS22_IDENTITY_TOPIC_ID=0.0.7157980
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_...
```

### **Install Dependencies**
```bash
cd /home/tonycamero/code/TrustMesh_hackathon
pnpm install
```

### **Run Dev Server**
```bash
pnpm dev
```

### **Run Tests**
```bash
pnpm test
```

---

## 📝 Commit & Branch Strategy

### **Branch Structure**
```
main (protected)
├── feature/circle-api-privacy     (Epic A)
├── feature/xmtp-v0.1-lock         (Epic B)
├── feature/loop-two-ui-skeleton   (Epic C)
└── feature/inner-circle-badges    (Epic D)
```

### **Commit Message Format**
```
[EPIC-TICKET] Short description

- Detail 1
- Detail 2

Refs: docs/SPRINT_EXECUTION_PLAN.md
```

**Examples:**
```
[CIR-1] Implement HcsCircleState incremental cache

- Add HcsCircleStateManager class
- Wire into ingestion orchestrator
- Add unit tests for add/revoke/query

Refs: docs/SPRINT_EXECUTION_PLAN.md

[XMTP-11] Execute T10 test plan

- All 10 scenarios tested with 2 Magic users
- Documented results in XMTP_T10_RESULTS.md
- Screenshots captured for A↔B conversation

Refs: docs/XMTP_T10_TEST_PLAN.md
```

### **Tags**
```bash
# After Epic A complete
git tag -a circle-api-v1.0 -m "Circle API: Privacy-hardened, auth-scoped queries"

# After Epic B complete
git tag -a xmtp-sidecar-v0.1 -m "XMTP Phase 1: T10 validated, production-ready"

# After Epic C complete
git tag -a loop-two-ui-v0.1 -m "Loop Two: Messages + Payments UI foundation"
```

---

## 🚨 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| HcsCircleState breaks existing ingestion | Medium | High | Add feature flag `CIRCLE_STATE_ENABLED`, parallel run |
| XMTP T10 reveals blocking bugs | Medium | High | Budget extra 0.5 day for fixes |
| /api/circle used in multiple places | Low | Medium | Audit all API calls before refactor |
| Performance regression in graph queries | Low | Medium | Add benchmarks in CIR-3 |

---

## 📚 Reference Documentation

- **Architecture**: `docs/ARCHITECTURE.md`
- **XMTP Migration**: `docs/XMTP_V3_MIGRATION_SUMMARY.md`
- **XMTP Tests**: `docs/XMTP_T10_TEST_PLAN.md`
- **Loop Two Spec**: `docs/loop_two_messaging_payments.md`
- **Inner Circle Spec**: `docs/inner_circle_meta_system.md`
- **HCS-22 Security**: `docs/HCS22_SECURE_IMPLEMENTATION.md`
- **Core Philosophy**: `docs/CORE_PHILOSOPHY.md`

---

## ✅ Definition of Done (Sprint Complete)

**Epic A: Circle API Privacy**
- [ ] No code path scans entire HCS history
- [ ] Auth-scoped queries working
- [ ] Metrics logged
- [ ] Tests passing

**Epic B: XMTP v0.1 Lock**
- [ ] T10 results documented
- [ ] All bugs fixed or deferred
- [ ] Smoke tests added
- [ ] Tag `xmtp-sidecar-v0.1` created

**Epic C: Loop Two UI**
- [ ] "Messages & Payments" branding live
- [ ] Payment cards render in threads
- [ ] Composer has Pay button (modal placeholder)
- [ ] ConversationList shows balance indicators

**Epic D: Inner Circle (Stretch)**
- [ ] 💎 badges visible in UI
- [ ] No layout breaks on mobile

**Overall:**
- [ ] All builds pass
- [ ] All tests pass
- [ ] No console errors/warnings
- [ ] Manual QA complete
- [ ] Documentation updated

---

**Status:** 🚀 Ready for Execution  
**Owner:** Tony Camero / Scend Technologies  
**Agent:** Warp.dev  
**Start Date:** November 11, 2025  
**Target Completion:** November 18, 2025 (7 days)
