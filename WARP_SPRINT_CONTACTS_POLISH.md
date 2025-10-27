# 🚀 Warp Sprint Pack: Contact Flow Polish

**Baseline**: `hackathon-stable-contacts-v1` (commit f5235d7)  
**Goal**: Polish contact bonding UX and add safety features for demo

---

## ✅ **Ticket 1: Visual Bonded Status Indicator**

**File**: `app/(tabs)/contacts/page.tsx`

**Objective**: Show visual indicator for bonded vs pending contacts

**Tasks**:
- Add badge to contact list items showing "Bonded" (green) vs "Pending" (amber)
- Only show "Send Signal" button for bonded contacts (`isBonded === true`)
- Add tooltip: "Bond with this contact to send signals"
- Test: Create contact → should show "Pending" → Accept → should show "Bonded"

**Acceptance**:
```tsx
{contact.isBonded ? (
  <Badge className="bg-emerald-500/20 text-emerald-500">Bonded</Badge>
) : (
  <Badge className="bg-amber-500/20 text-amber-500">Pending</Badge>
)}
```

---

## ✅ **Ticket 2: Auto Balance Refresh with Low-Balance Warning**

**File**: `components/PersonalMetrics.tsx` or create `components/BalanceMonitor.tsx`

**Objective**: Auto-refresh HBAR balance and warn when low

**Tasks**:
- Add interval check every 30s for current account balance
- If balance < 0.5 HBAR, show toast warning: "⚠️ Low balance - top up soon"
- If balance < 0.1 HBAR, show error toast: "❌ Critical - transactions may fail"
- Add "Top Up" button that calls `/api/hedera/account/fund`

**Acceptance**:
```ts
useEffect(() => {
  const interval = setInterval(async () => {
    const balance = await checkBalance()
    if (balance < 0.5) toast.warning('Low balance')
  }, 30000)
  return () => clearInterval(interval)
}, [])
```

---

## ✅ **Ticket 3: Recognition Mint Counter UI**

**File**: `app/(tabs)/signals/page.tsx` or create `components/MintProgressCard.tsx`

**Objective**: Show remaining mint allowance with animated progress

**Tasks**:
- Query user's remaining mint count from signals/recognition data
- Display: "🔥 27 Signals Remaining" with progress bar
- Animate bar fill from 0 to current count on mount
- Add tooltip: "Reset daily / Unlock more with TRST"
- Disable "Send Signal" button when count = 0

**Acceptance**:
```tsx
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Recognition Signals</span>
    <span className="font-bold">{remainingMints} / 30</span>
  </div>
  <Progress value={(remainingMints / 30) * 100} />
</div>
```

---

## ✅ **Ticket 4: Contact Request History View**

**File**: Create `components/ContactRequestHistory.tsx`

**Objective**: Show all pending outbound contact requests

**Tasks**:
- Filter signals for `CONTACT_REQUEST` where `actor === sessionId` and no corresponding `CONTACT_ACCEPT`
- Display list with: handle, time sent, "Cancel Request" button
- Cancel = delete optimistic signal from store (no HCS action needed)
- Show empty state: "No pending requests"

**Acceptance**:
```tsx
const pendingRequests = signalsStore.getAll().filter(s => 
  s.type === 'CONTACT_REQUEST' && 
  s.actor === sessionId &&
  !hasCorrespondingAccept(s)
)
```

---

## 🎯 **Execution Notes**

1. Run **1 ticket/day** with Warp
2. Keep prompts scoped to exact file + function
3. Test each ticket independently before moving on
4. All changes should be backwards compatible with `hackathon-stable-contacts-v1`

---

## 📊 **Success Metrics**

- ✅ Users can distinguish bonded vs pending contacts visually
- ✅ Balance warnings prevent transaction failures during demo
- ✅ Mint counter creates urgency/gamification for signal usage
- ✅ Users can manage their outbound contact requests

---

## 🔄 **Rollback Plan**

If anything breaks:
```bash
git checkout hackathon-stable-contacts-v1
```

All work is additive, so you can cherry-pick individual tickets if needed.
