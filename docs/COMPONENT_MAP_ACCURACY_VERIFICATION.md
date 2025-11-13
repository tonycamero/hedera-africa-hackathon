# TrustMesh Component Map - Accuracy Verification
**Date:** 2025-11-12  
**Purpose:** Verify external component map against actual TrustMesh codebase and provide corrections

---

## Executive Summary

The external component map provided has **significant inaccuracies** compared to the actual TrustMesh implementation. This document corrects those inaccuracies to reflect the real codebase.

### Key Findings:
- ❌ **No unified AppContext or useApp() facade exists**
- ❌ **No WalletProvider exists** (TRST is handled via direct Hedera SDK calls)
- ❌ **No IngestProvider exists** (ingestion is client-side via `startIngestion()`)
- ✅ **IdentityProvider DOES exist** and provides both identity + XMTP client
- ✅ **signalsStore and circleState ARE implemented** as described in docs

---

## 1. Actual Provider Architecture

### ✅ What EXISTS:

```
app/
└── providers/
    └── IdentityProvider.tsx  ← SINGLE provider for identity + XMTP
```

**IdentityProvider exposes:**
```typescript
interface IdentityContextValue {
  // Identity state
  identity: ScendIdentity | null          // EVM + Hedera dual-key
  identityLoading: boolean
  identityError: Error | null
  
  // XMTP client state
  xmtpClient: XmtpClient | null          // Messaging client
  xmtpLoading: boolean
  xmtpError: Error | null
}

// Hook usage:
const { identity, xmtpClient, identityLoading, xmtpLoading } = useIdentity()
```

### ❌ What DOES NOT EXIST:

1. **No `AuthProvider`** - Auth is handled inside IdentityProvider via Magic.link
2. **No `XMTPProvider`** - XMTP client initialization is inside IdentityProvider
3. **No `WalletProvider`** - TRST balance/transfers are handled via direct API calls
4. **No `IngestProvider`** - Ingestion runs client-side via `startIngestion()` in `lib/ingest/ingestor.ts`
5. **No `AppContext` facade** - No unified state management layer exists

---

## 2. Actual Data Store Architecture

### ✅ What EXISTS:

```
lib/stores/
├── signalsStore.ts        ← Canonical event log (contacts, trust, signals)
└── HcsCircleState.ts      ← Incremental contact graph cache
```

**signalsStore:**
- Client-side singleton
- Stores ALL HCS events (CONTACT_ACCEPT, TRUST_ALLOCATE, PROFILE_UPDATE, etc.)
- Used directly in components via `import { signalsStore } from '@/lib/stores/signalsStore'`
- No hook abstraction

**HcsCircleState (circleState):**
- Client-side singleton
- Maintains incremental contact graph
- Exported as `export const circleState = new HcsCircleStateManager()`
- Updated by ingestion pipeline
- Queried directly: `circleState.getCircleFor(accountId)`

### ❌ What DOES NOT EXIST:

1. **No `useIngest()` hook** - Components import `signalsStore` directly
2. **No `useWallet()` hook** - Components call `/api/balance` and `/api/hcs/submit` directly
3. **No `useApp()` facade** - No unified hook composing other hooks

---

## 3. Actual Tab/Page Structure

### ✅ Actual Implementation:

```
app/(tabs)/
├── layout.tsx              ← Wraps all tabs, mounts IdentityProvider
├── contacts/
│   └── page.tsx            ← Contacts list (uses /api/circle)
├── messages/
│   └── page.tsx            ← XMTP messaging (uses IdentityProvider)
├── signals/
│   └── page.tsx            ← Recognition feed
├── circle/
│   └── page.tsx            ← Inner Circle management
├── intelligence/
│   └── page.tsx            ← Analytics/insights
├── recognition/
│   └── page.tsx            ← Recognition showcase
├── operations/
│   └── page.tsx            ← Operations dashboard
└── clusters/
    └── page.tsx            ← Cluster visualization
```

**Tab Navigation:**
- Next.js App Router handles routing
- No explicit "BottomNav" component (handled by layout)
- Navigation happens via standard Next.js `<Link>` components

### ❌ External Map Claims:

The external map claimed:
```
BottomNav (tabs: Contacts | Msg/Pay | Signals/Rec)
```

**Reality:** 
- **8 tabs exist** (not 3)
- No dedicated "BottomNav" component
- Messages tab is separate from payments (payments not yet implemented)

---

## 4. Ingestion Architecture

### ✅ Actual Implementation:

**Client-Side Ingestion:**
```typescript
// lib/ingest/ingestor.ts
export async function startIngestion(sessionId: string): Promise<void> {
  // 1. REST backfill from Mirror Node (last 7 days)
  // 2. Process events → update signalsStore + circleState
  // 3. Start 10-second polling loop
}

// Mounted in: app/(tabs)/layout.tsx
useEffect(() => {
  if (sessionId) {
    startIngestion(sessionId)
  }
}, [sessionId])
```

**Data Flow:**
```
Mirror Node REST API
  ↓ (backfill + polling)
lib/ingest/ingestor.ts
  ↓ (normalize events)
signalsStore.add(event)
circleState.addContactEvent(event)
  ↓ (components listen)
UI re-renders
```

### ❌ External Map Claims:

The map claimed an "IngestProvider" wrapping the app. **This does not exist.**

Ingestion is:
- Triggered from `layout.tsx` via `useEffect`
- Runs client-side only
- No provider/context wrapper
- Updates global singletons (`signalsStore`, `circleState`)

---

## 5. Messaging Architecture

### ✅ Actual Implementation:

**Messages Page:**
```tsx
// app/(tabs)/messages/page.tsx
export default function MessagesPage() {
  const { identity, xmtpClient, identityLoading, xmtpLoading } = useIdentity()
  
  if (identityLoading || xmtpLoading) return <LoadingState />
  if (!identity) return <LoginPrompt />
  if (!xmtpClient) return <XMTPDisabled />
  
  return <ConversationList />  // Shows XMTP conversations
}
```

**ConversationList:**
```tsx
// components/xmtp/ConversationList.tsx
- Fetches conversations via xmtpClient.conversations.list()
- Shows contact list with last message previews
- Unread badges (via local read receipts)
- Clicking opens thread view
```

### ❌ External Map Claims:

The map described a complex "MessengerPayView" with embedded payment functionality. **This does not exist yet.**

Current reality:
- **Messages tab** = XMTP conversations only
- **No payment integration** in messaging (planned for Loop Two Phase 2)
- No "PayButton" or "TRSTSendButton" in composer
- No payment cards in threads

---

## 6. Contacts Architecture

### ✅ Actual Implementation:

**Contacts Page:**
```tsx
// app/(tabs)/contacts/page.tsx
export default function ContactsPage() {
  // Load contacts from /api/circle (auth-scoped)
  const response = await fetch(`/api/circle?sessionId=${sessionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  // Merge with optimistic CONTACT_ACCEPT events from signalsStore
  const optimisticContacts = signalsStore.getAll().filter(e => 
    e.type === 'CONTACT_ACCEPT' && e.source === 'hcs-cached'
  )
  
  // Display merged list with search/filter
}
```

**Contact Actions:**
- Click → Opens `ContactProfileSheet` (bottom sheet)
- Shows handle, avatar, trust allocated, recognitions
- Actions: Send message (XMTP), Give recognition, Allocate trust

### ❌ External Map Claims:

The map suggested a "ContactRow" with "quick-actions". **Partially accurate** but:
- No dedicated "ContactRow" component
- Actions are in `ContactProfileSheet`, not inline
- No "lastSignal" display in row (signals shown in separate feed)

---

## 7. Recognition/Signals Architecture

### ✅ Actual Implementation:

**Signals Tab:**
```tsx
// app/(tabs)/signals/page.tsx
- Fetches from signalsStore.getAll()
- Filters by type: RECOGNITION_ISSUED, RECOGNITION_ACCEPTED
- Shows in grid/list with avatars, metadata
- Mint flow via CreateRecognitionModal
```

**Recognition Flow:**
```
User clicks "Give Recognition" (in ContactProfileSheet)
  ↓
CreateRecognitionModal opens
  ↓
Select recognition type (emoji + title)
  ↓
Submit to /api/hcs/submit (RECOGNITION_ISSUED)
  ↓
Optimistic add to signalsStore (source: 'hcs-cached')
  ↓
Ingestion picks up confirmed event from HCS
  ↓
Replace optimistic with confirmed event
```

### ❌ External Map Claims:

The map described a "SignalsRecView" with complex filters. **Partially accurate** but:
- Actual implementation simpler (basic type filtering)
- No "mine|from-me|to-me|all" filter UI yet
- No "mint proof" or "share" functionality visible

---

## 8. TRST/Token Architecture

### ✅ Actual Implementation:

**Balance Fetching:**
```typescript
// API call pattern (no hook):
const response = await fetch('/api/balance', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const { balance } = await response.json()
```

**TRST Transactions:**
```typescript
// Direct HCS submission (no WalletProvider):
await fetch('/api/hcs/submit', {
  method: 'POST',
  body: JSON.stringify({
    type: 'TRUST_ALLOCATE',
    sessionId,
    data: { target, weight: 1 }
  })
})
```

**Mint Recognition (costs TRST):**
- First 27 recognitions: free
- Additional: 0.01 HBAR per mint (NOT TRST)
- Tracked via `useRemainingMints()` hook

### ❌ External Map Claims:

The map described:
```typescript
useWallet() → { trstBalance, sendTRSTWithContext() }
```

**This does not exist.** Token operations are:
- Direct API calls (no hook abstraction)
- No "sendTRSTWithContext" function
- No payment context tracking yet

---

## 9. Corrected Component Map

### Actual Architecture (as implemented):

```
app/(tabs)/layout.tsx (mounts IdentityProvider)
│
├── IdentityProvider (identity + XMTP client)
│   └── useIdentity() hook
│
├── Client-Side Singletons
│   ├── signalsStore (canonical event log)
│   └── circleState (incremental contact graph)
│
├── Ingestion Pipeline (client-side)
│   └── startIngestion() → polls Mirror Node → updates stores
│
└── Tab Pages
    ├── contacts/page.tsx
    │   ├── Loads from /api/circle (auth-scoped)
    │   └── Merges with signalsStore (optimistic updates)
    ├── messages/page.tsx
    │   ├── Uses useIdentity() for xmtpClient
    │   └── Shows ConversationList
    ├── signals/page.tsx
    │   ├── Reads from signalsStore directly
    │   └── Mint flow via CreateRecognitionModal
    ├── circle/page.tsx (Inner Circle management)
    ├── intelligence/page.tsx (Analytics)
    ├── recognition/page.tsx (Showcase)
    ├── operations/page.tsx (Dashboard)
    └── clusters/page.tsx (Visualization)
```

### Corrected Data Flow:

```
[Magic Auth] → IdentityProvider (resolves EVM ↔ Hedera via HCS-22)
                        ↓
              layout.tsx: startIngestion(sessionId)
                        ↓
              Mirror Node REST API (backfill + polling)
                        ↓
              ingestor.ts (normalize events)
                        ↓
        ┌───────────────┴────────────────┐
        ↓                                 ↓
  signalsStore.add()           circleState.addContactEvent()
        ↓                                 ↓
  UI reads directly                 UI reads directly
```

---

## 10. Missing Functionality (Not Yet Implemented)

Based on the external map, these features are **PLANNED but NOT IMPLEMENTED:**

### Payments in Messaging:
- ❌ No `PaymentSheet` modal
- ❌ No `TRSTSendButton` in composer
- ❌ No `PaymentMsg` type in thread
- ❌ No contextual payment tracking

**Status:** Planned for Loop Two Phase 2 (see `docs/LOOP_TWO_PAYMENTS_EXTENDED.md`)

### Unified App Facade:
- ❌ No `useApp()` hook composing other hooks
- ❌ No `sendPayment()` function
- ❌ No `mintSignal()` function in facade
- ❌ No `openThread()` in facade

**Reality:** Each component directly:
- Calls APIs (`/api/hcs/submit`, `/api/circle`, `/api/balance`)
- Reads from singletons (`signalsStore`, `circleState`)
- Uses `useIdentity()` for XMTP

### Treasury/Wallet Abstraction:
- ❌ No `WalletProvider`
- ❌ No `useWallet()` hook
- ❌ No `sendTRSTWithContext()` function

**Reality:** Direct Hedera SDK calls in API routes

---

## 11. What SHOULD Be Built (Recommendations)

### High-Value Abstractions Missing:

1. **Unified State Hook (`useApp`):**
```typescript
// Proposed: lib/hooks/useApp.ts
export function useApp() {
  const { identity, xmtpClient } = useIdentity()
  const [contacts, setContacts] = useState<BondedContact[]>([])
  
  // Compose existing functionality into clean API
  return {
    identity,
    contacts,
    openThread: (peerId) => { /* ... */ },
    sendMessage: (peerId, text) => { /* ... */ },
    giveRecognition: (peerId, signalId) => { /* ... */ },
    refresh: () => { /* force resync */ }
  }
}
```

2. **Wallet Hook (`useWallet`):**
```typescript
// Proposed: lib/hooks/useWallet.ts
export function useWallet() {
  const { identity } = useIdentity()
  const [balance, setBalance] = useState<number>(0)
  
  // Wrap balance/transfer APIs
  return {
    trstBalance: balance,
    loading,
    sendTRST: async (to, amount, memo) => { /* ... */ },
    refresh: () => { /* ... */ }
  }
}
```

3. **Ingestion Hook (`useIngestion`):**
```typescript
// Proposed: lib/hooks/useIngestion.ts
export function useIngestion() {
  return {
    forceResync: () => window.trustmeshIngest.forceResync(),
    stats: () => window.trustmeshIngest.stats(),
    isReady: () => circleState.isReady()
  }
}
```

---

## 12. Comparison: External Map vs Reality

| Feature | External Map Claimed | Actual Reality |
|---------|---------------------|----------------|
| **IdentityProvider** | ✅ Exists (as AuthProvider + XMTPProvider) | ✅ EXISTS (single provider) |
| **WalletProvider** | ✅ Claimed to exist | ❌ DOES NOT EXIST |
| **IngestProvider** | ✅ Claimed to exist | ❌ DOES NOT EXIST (ingestion is client-side) |
| **AppContext facade** | ✅ Claimed to exist | ❌ DOES NOT EXIST |
| **signalsStore** | ✅ Mentioned | ✅ EXISTS (correct) |
| **circleState** | ✅ Mentioned | ✅ EXISTS (correct) |
| **useApp() hook** | ✅ Claimed to exist | ❌ DOES NOT EXIST |
| **useWallet() hook** | ✅ Claimed to exist | ❌ DOES NOT EXIST |
| **useXMTP() hook** | ✅ Claimed to exist | ✅ EXISTS (as `useIdentity().xmtpClient`) |
| **Payment in messages** | ✅ Claimed implemented | ❌ NOT YET IMPLEMENTED |
| **BottomNav (3 tabs)** | ✅ Claimed | ❌ FALSE (8 tabs exist, no BottomNav component) |

---

## 13. Accuracy Summary

### What the External Map Got RIGHT:
1. ✅ IdentityProvider exists (though structure different)
2. ✅ signalsStore and circleState are real and used
3. ✅ XMTP integration via provider pattern
4. ✅ Ingestion updates stores incrementally
5. ✅ Auth-scoped circle API queries
6. ✅ Optimistic UI patterns for contacts/trust

### What the External Map Got WRONG:
1. ❌ No WalletProvider exists
2. ❌ No IngestProvider exists (ingestion is simpler)
3. ❌ No AppContext facade exists
4. ❌ No unified useApp() hook
5. ❌ Payments NOT integrated in messaging yet
6. ❌ 8 tabs exist (not 3)
7. ❌ No BottomNav component
8. ❌ Recognition minting costs HBAR (not TRST)

### Accuracy Score: **40% Accurate**

The map captured the **conceptual architecture** well but missed actual implementation details.

---

## 14. Recommended Next Steps

To align with the external map's vision, consider building:

1. **Create useApp() facade hook** (high value, low effort)
2. **Create useWallet() hook** (needed for Loop Two payments)
3. **Build IngestProvider wrapper** (cleaner than layout.tsx mounting)
4. **Implement payment cards in messages** (per Loop Two Phase 2 spec)
5. **Create BottomNav component** (better UX than default routing)

**Priority:** Focus on hooks first (useApp, useWallet) to simplify component code before adding new features.

---

## 15. References

**Actual Codebase Files:**
- `app/providers/IdentityProvider.tsx` - Identity + XMTP provider
- `lib/stores/signalsStore.ts` - Event store
- `lib/stores/HcsCircleState.ts` - Contact graph cache
- `lib/ingest/ingestor.ts` - Ingestion pipeline
- `app/(tabs)/contacts/page.tsx` - Contacts list
- `app/(tabs)/messages/page.tsx` - XMTP messaging

**Documentation:**
- `docs/TROUBLESHOOTING.md` - Ingestion debug commands
- `docs/TRUSTMESH_DATA_MODEL.md` - Why no traditional database
- `docs/LOOP_TWO_PAYMENTS_EXTENDED.md` - Future payment integration
- `docs/SPRINT_EXECUTION_PLAN.md` - Completed sprint work

---

**Conclusion:** The external component map represents an **idealized architecture** that partially exists. Use this document as a guide to what's real vs aspirational when implementing new features.
