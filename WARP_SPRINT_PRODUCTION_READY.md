# 🚀 Warp Sprint Pack: Production-Ready Infrastructure

**Baseline**: `hackathon-stable-contacts-v1` (commit f5235d7)  
**Goal**: Build bulletproof infrastructure for demo + scale

---

## ✅ **Ticket 1: HBAR Auto-Top-Up Guardrail**

**Priority**: 🔴 Critical (prevents demo failures)

**Objective**: Never fail a tx for lack of gas; auto-top-up before any Hedera submit.

**Files to Create**:
- `lib/hooks/useHbarBalance.ts` (new)
- `lib/services/hbarGuardrail.ts` (new)

**Files to Modify**:
- `app/api/hcs/profile/route.ts`
- `app/api/hcs/mint-recognition/route.ts`
- `app/me/page.tsx` (add UI badge)

**Tasks**:
1. Create `useHbarBalance(accountId)` hook that polls Mirror Node every 15s (with exponential backoff)
2. Add `ensureHbar(accountId, min = 0.01)` helper that:
   - Checks balance via Mirror Node
   - If `< min`, POST `/api/hedera/account/fund`
   - Re-checks balance after 5s; throws if still low
3. Call `ensureHbar` before any HCS submit in API routes
4. Add UI in `/me`:
   - Badge: "Auto-Top-Up: ON" (green) or "Manual" (gray)
   - Button: "Top Up Now" → calls `/api/hedera/account/fund`

**Acceptance Criteria**:
```ts
// Before any tx:
await ensureHbar(accountId, 0.01)
// Automatically tops up if needed

// Hook usage:
const { balance, isLow, topUp } = useHbarBalance(accountId)
if (isLow) toast.warning('⚠️ Low balance - auto top-up enabled')
```

**Edge Cases**:
- Handle Mirror Node API rate limits (429)
- Handle funding endpoint failures gracefully
- Show clear error if funding is unavailable

---

## ✅ **Ticket 2: TRST Micro-Fee Toggle + Insufficient Balance UX**

**Priority**: 🟡 High (monetization + demo value)

**Objective**: Charge $0.01 TRST per action (demo mode), block gracefully if low.

**Files to Use** (already exist):
- `lib/config/pricing.ts`
- `lib/services/trstBalanceService.ts`

**Files to Modify**:
- `app/api/hcs/profile/route.ts`
- `app/api/hcs/mint-recognition/route.ts`

**Files to Create**:
- `components/modals/InsufficientTrstModal.tsx` (new)

**Tasks**:
1. Wire costs from `lib/config/pricing.ts` into:
   - Profile create/update: `PROFILE_OPERATIONS.CREATE`
   - Recognition mint: `RECOGNITION_MINT`
2. Before action: `const canAfford = await hasSufficientTRST(accountId, cost)`
3. On success: `await recordTRSTDebit(accountId, cost, action, txId)`
4. On insufficient balance:
   - Show modal: "You're low on TRST" with options:
     - "Earn TRST" (stub/placeholder)
     - "Later" (dismisses, prevents action)
   - Keep UX state intact (don't lose form data)

**Acceptance Criteria**:
```ts
// API route pattern:
const cost = TRST_PRICING.RECOGNITION_MINT
const canAfford = await hasSufficientTRST(accountId, cost)
if (!canAfford) {
  return NextResponse.json({ error: 'insufficient_trst' }, { status: 402 })
}

// ... perform action ...

await recordTRSTDebit(accountId, cost, 'RECOGNITION_MINT', txId)
```

**UI Flow**:
- Each priced action shows cost upfront: "This will cost 0.01 TRST"
- Success shows remaining balance: "27 TRST remaining"
- Modal is friendly, not punitive

---

## ✅ **Ticket 3: Mint Counter UX (🎟️ "You have 27 mints left")**

**Priority**: 🟡 High (engagement + gamification)

**Objective**: Visible, live counter that drives engagement and TRST awareness.

**Files to Create**:
- `components/MintCounter.tsx` (new)
- `lib/hooks/useRemainingMints.ts` (new)

**Files to Modify**:
- `app/(tabs)/contacts/page.tsx` (header)
- `app/me/page.tsx` (expanded view)

**Tasks**:
1. Create hook `useRemainingMints()`:
   - Queries TRST balance
   - Calculates: `floor(balance / TRST_PRICING.RECOGNITION_MINT)`
   - Returns: `{ remainingMints, totalMints, percentage }`
2. Create `MintCounter.tsx` with two variants:
   - **Compact**: Pill for page headers
   - **Expanded**: Card with progress bar + CTA
3. Update counter on:
   - Page mount (fetch from balance service)
   - After each mint (optimistic decrement, reconcile on next fetch)
4. Add visual states:
   - Green (> 10 mints)
   - Amber (5-10 mints)
   - Red (< 5 mints)

**Acceptance Criteria**:
```tsx
// Compact variant (contacts page header):
<MintCounter variant="compact" />
// Shows: "🔥 27 left"

// Expanded variant (me page):
<MintCounter variant="expanded" />
// Shows: progress bar, "Buy/Earn more TRST" button
```

**Polish**:
- Animate number changes (count-up effect)
- Animate progress bar fill
- Add tooltip explaining mint economy

---

## ✅ **Ticket 4: Telemetry + HashScan Deep Links**

**Priority**: 🟢 Medium (demo value + debugging)

**Objective**: Trace every on-chain action and make it 1-click verifiable.

**Files to Create**:
- `lib/telemetry/txLog.ts` (new - client + server)
- `lib/telemetry/types.ts` (new)
- `components/ActivityPane.tsx` (new)

**Files to Modify**:
- `app/api/hcs/profile/route.ts`
- `app/api/hcs/mint-recognition/route.ts`
- `app/api/hedera/token/associate/submit/route.ts`
- `app/me/page.tsx` (add activity pane)

**Files to Use** (already exist):
- `lib/util/hashscan.ts`

**Tasks**:
1. Create `logTx(event: TxLogEvent)`:
   - Client: writes to `localStorage` (last 100)
   - Server: logs to console with structured format
   - Fields: `action, accountId, txId, topicId?, tokenId?, status, timestamp`
2. In all API routes that submit to Hedera:
   - Capture `transactionId` from receipt
   - Call `logTx` server-side
   - Return `txId` in API response
3. Client-side: on success toast, add HashScan link:
   ```tsx
   toast.success('Profile updated!', {
     action: {
       label: 'View on HashScan',
       onClick: () => window.open(getHashScanTxUrl(txId))
     }
   })
   ```
4. Create Activity pane for `/me`:
   - Shows last 10 transactions
   - Columns: Action, Status, Time, Link
   - Auto-refreshes when new tx logged

**Acceptance Criteria**:
```ts
// Server-side logging:
logTx({
  action: 'PROFILE_UPDATE',
  accountId: '0.0.12345',
  txId: '0.0.12345@1234567890.123456789',
  topicId: '0.0.6896008',
  status: 'SUCCESS'
})

// Client receives:
{ success: true, txId: '0.0.12345@...', profileHrl: 'hcs://...' }

// Toast shows HashScan link
```

**Debug Benefits**:
- Instant verification of tx status
- Easy sharing of proof with stakeholders
- Pattern detection for failed txs

---

## ✅ **Ticket 5: Visual Bonded Status Indicator**

**Priority**: 🟢 Medium (UX clarity)

**Objective**: Show visual indicator for bonded vs pending contacts

**Files to Modify**:
- `app/(tabs)/contacts/page.tsx`

**Tasks**:
- Add badge to contact list items showing "Bonded" (emerald) vs "Pending" (amber)
- Only show "Send Signal" button for bonded contacts (`isBonded === true`)
- Add tooltip: "Accept their request to bond and send signals"
- Test flow: Request → Pending → Accept → Bonded

**Acceptance Criteria**:
```tsx
{contact.isBonded ? (
  <>
    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
      ✓ Bonded
    </Badge>
    <Button onClick={() => openSignalModal(contact)}>
      Send Signal
    </Button>
  </>
) : (
  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
    ⏳ Pending
  </Badge>
)}
```

---

## ✅ **Ticket 6: Contact Request History View**

**Priority**: 🔵 Low (nice-to-have)

**Objective**: Show all pending outbound contact requests for self-service management

**Files to Create**:
- `components/ContactRequestHistory.tsx` (new)

**Files to Modify**:
- `app/(tabs)/contacts/page.tsx` (add collapsible section)

**Tasks**:
- Filter signals for `CONTACT_REQUEST` where `actor === sessionId` with no corresponding `CONTACT_ACCEPT`
- Display list with: handle, time sent, status
- "Cancel Request" button → removes optimistic signal from store (no HCS action)
- Show empty state: "No pending requests"

**Acceptance Criteria**:
```tsx
const pendingRequests = signalsStore.getAll().filter(s => 
  s.type === 'CONTACT_REQUEST' && 
  s.actor === sessionId &&
  s.source === 'hcs-cached' &&
  !hasCorrespondingAccept(s)
)
```

---

## 🎯 **Execution Strategy**

### Phase 1 (Critical - Do First):
1. **Ticket 1** (HBAR Guardrail) - 2-3 hrs
2. **Ticket 4** (Telemetry) - 2-3 hrs

### Phase 2 (High Value):
3. **Ticket 2** (TRST Fees) - 3-4 hrs
4. **Ticket 3** (Mint Counter) - 2-3 hrs

### Phase 3 (Polish):
5. **Ticket 5** (Bonded Badge) - 1-2 hrs
6. **Ticket 6** (Request History) - 2-3 hrs

**Total Effort**: ~15-20 hours (3-4 dev days)

---

## 📊 **Success Metrics**

- ✅ **Zero tx failures** from insufficient HBAR during demo
- ✅ **All tx verifiable** via HashScan links
- ✅ **TRST economy visible** (mint counter shows scarcity)
- ✅ **Users understand** bonded vs pending status
- ✅ **Graceful degradation** when balances are low

---

## 🔄 **Rollback Plan**

If anything breaks:
```bash
git checkout hackathon-stable-contacts-v1
# Cherry-pick working tickets:
git cherry-pick <commit-hash>
```

All tickets are independent and can be deployed/rolled back individually.

---

## 🧰 **Developer Notes**

- **Testing**: Each ticket should include console logging for debugging
- **Error Handling**: Always show user-friendly errors, log technical details
- **Performance**: Use React Query for balance/counter hooks (built-in caching)
- **Mobile**: All new UI should be mobile-responsive
- **Accessibility**: Badges/counters need proper ARIA labels

---

## 🚀 **Post-Sprint: Nice-to-Have**

After completing all tickets:
- Network health check endpoint (`/api/health/hedera`)
- TRST purchase/earn flow (real integration)
- Advanced activity filters (by action type, date range)
- Export activity log to CSV
- Notification preferences for low balances
