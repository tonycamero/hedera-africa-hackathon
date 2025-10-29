# Lens Economy - End-to-End Test Script

## Prerequisites
1. Copy `.env.local.template` to `.env.local` and configure:
   - `TRST_FEE_SINK_ACCOUNT_ID=0.0.YOUR_FEE_SINK_ACCOUNT`
   - `NEXT_PUBLIC_TOPIC_RECOGNITION_BASE=0.0.5438869`
   - All other required Hedera/Magic credentials

2. Start dev server:
   ```bash
   pnpm dev
   ```

## Test Flow

### 1. New User Onboarding
**Goal:** Verify stipend acceptance and first lens initialization

**Steps:**
1. Navigate to `/` (login page)
2. Enter email and authenticate with Magic
3. After redirect to `/onboard`:
   - Verify stipend card shows:
     - 1.00 HBAR (for network fees)
     - 1.35 TRST (recognition credits)
   - Click "Accept Stipend"
   - Wait for success toast: "Stipend accepted - You received 1 HBAR + 1.35 TRST"

**Expected Result:**
- Stipend card disappears
- ChooseFirstLens card appears

**Check Logs:**
```
[Onboarding] Stipend transferred: { ... }
```

---

### 2. Choose First Lens (Free)
**Goal:** Verify free first lens initialization

**Steps:**
1. In the ChooseFirstLens card:
   - Three lens options shown: Base, GenZ, African
   - Select "GenZ" (or any lens to test)
   - Click "Continue"
   - Wait for lens to be saved

**Expected Result:**
- ChooseFirstLens card disappears
- "Create Your Profile" card appears
- Shows "Initial lens: GenZ 🔥" under logged-in email

**Check Logs:**
```
[init-first] Initialized genz lens for <accountId>
```

**API Test (optional):**
```bash
# Get fresh Magic token from browser console:
# await magic.user.getIdToken()

curl -X POST http://localhost:3000/api/lens/init-first \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"lens":"genz"}' | jq

# Expected response:
# { "ok": true, "active": "genz", "owned": ["genz"] }
```

---

### 3. Create Profile
**Goal:** Verify profile creation completes successfully

**Steps:**
1. In "Create Your Profile" card:
   - Enter display name (min 2 chars)
   - Optionally enter bio
   - Click "Create Profile"
   - Wait for success toast: "Profile created"

**Expected Result:**
- Redirect to `/contacts` or `/circle`
- Profile published to HCS

**Check Logs:**
```
[Onboarding] Profile signed: <signature>...
[Onboarding] Profile created: { ... }
```

---

### 4. Header Lens Switcher
**Goal:** Verify lens switcher shows owned lens and locked lenses

**Steps:**
1. Look for lens switcher button in header (should show "🔥 GenZ")
2. Click the lens switcher button
3. Dropdown menu appears showing:
   - ✅ **GenZ** (active, checkmark)
   - 🔒 **Base** (locked, "1 TRST")
   - 🔒 **African** (locked, "1 TRST")

**Expected Result:**
- Active lens highlighted with checkmark
- Unowned lenses show lock icon and price

**API Test:**
```bash
curl -X GET http://localhost:3000/api/profile/get-lens \
  -H "Authorization: Bearer <TOKEN>" | jq

# Expected response:
# { "owned": ["genz"], "active": "genz" }
```

---

### 5. Unlock Additional Lens
**Goal:** Verify TRST payment and lens unlock flow

**Steps:**
1. Click on "🌍 African" in the dropdown
2. LensUnlockModal appears showing:
   - Lens details (emoji, label, description)
   - Cost: 1.0 TRST
   - "Unlock Lens" button
3. Click "Unlock Lens"
4. Wait for unlock to complete

**Expected Result:**
- Success toast (or modal close)
- Page reloads automatically
- Header switcher now shows "🌍 African" as active
- Dropdown shows African with checkmark, no lock icon

**Check Logs:**
```
[unlock-lens] Unlocking african for <accountId>
[SettlementPort] Spending 1.000000 TRST: wallet=<accountId>, feeSink=<FEE_SINK>, amount=1.000000
[HCS21] Published LENS_UNLOCKED event to topic <TOPIC>
```

**Verify State:**
```bash
curl -X GET http://localhost:3000/api/profile/get-lens \
  -H "Authorization: Bearer <TOKEN>" | jq

# Expected response:
# { "owned": ["genz", "african"], "active": "african" }
```

---

### 6. Switch Between Owned Lenses
**Goal:** Verify switching without unlock prompt

**Steps:**
1. Click header lens switcher
2. Click on "🔥 GenZ" (already owned)
3. No modal appears
4. Page reloads
5. Header shows "🔥 GenZ" as active

**Expected Result:**
- Instant switch (no payment prompt)
- Page reload applies new lens theme

**Check Logs:**
```
[set-lens] Switched to genz for <accountId>
[HCS21] Published LENS_SWITCHED event to topic <TOPIC>
```

---

### 7. Persistence Check
**Goal:** Verify lens state persists across sessions

**Steps:**
1. Note current active lens
2. Refresh page (F5)
3. Check header lens switcher

**Expected Result:**
- Active lens remains the same after refresh
- Owned lenses list unchanged

**Alternative:** Close browser tab, reopen app, verify state

---

### 8. Balance Verification (Future)
**Goal:** Verify TRST balance reflects lens unlock costs

**Current State:** Balance display not yet implemented (Step 10)

**Future Test:**
- Initial stipend: 1.35 TRST
- After unlocking one additional lens: 0.35 TRST remaining
- After unlocking second additional lens: -0.65 TRST (should be blocked)

---

## Troubleshooting

### "Unauthorized" errors
- Verify Magic token is fresh (tokens expire quickly)
- Check browser console for auth errors
- Re-login if needed

### Lens state not persisting
- Check that `profileStore` is working (in-memory for now)
- Verify API responses include `owned` and `active` arrays
- Check browser console for fetch errors

### Unlock modal doesn't appear
- Check that `LensUnlockModal` component exists at `components/lens/LensUnlockModal.tsx`
- Verify lens prices in `lib/lens/lensConfig.ts`
- Check browser console for component errors

### Theme not changing after lens switch
- Verify page reload happens after lens switch
- Check that `LensProvider` is mounted in app layout
- Inspect `<html>` element for theme class

---

## Success Criteria

✅ **Phase 1 Complete** when:
1. User can accept stipend with TRST grant
2. User can choose first lens for free
3. User can create profile
4. Header switcher shows active/owned lenses correctly
5. User can unlock additional lens for 1 TRST
6. User can switch between owned lenses
7. Lens state persists across refresh
8. All HCS events logged correctly (check console)

---

## Next Steps (After Phase 1)

**Step 8:** Recognition signal display with active lens filtering
**Step 9:** Recognition creation with lens-aware vocabulary
**Step 10:** TRST balance display and top-up flows

See main docs for full roadmap.
