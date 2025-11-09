# XMTP Phase 1 - T10 Integration Test Plan

**Status:** Ready for Execution  
**Branch:** `feature/xmtp-nervous-system`  
**Target:** `xmtp-sidecar-v0.1` tag  
**Date:** 2025-11-09

---

## 🎯 Purpose

Validate end-to-end XMTP messaging functionality with two Magic users communicating via the TrustMesh Messages tab. Confirm fail-soft behavior across all edge cases.

---

## 📋 Prerequisites

### 1. Environment Setup

**File:** `.env.local`

```bash
NEXT_PUBLIC_XMTP_ENABLED=true  # Enable XMTP sidecar
NEXT_PUBLIC_XMTP_ENV=dev       # Use XMTP dev network
NEXT_PUBLIC_HEDERA_NETWORK=testnet
```

**Important:** Setting `NEXT_PUBLIC_XMTP_ENABLED=false` should keep the Messages tab visible but degrade gracefully to Invite-only / non-XMTP flows. All contacts will show "Invite" buttons instead of "Message" buttons.

### 2. Two Magic Users Required

- **User A**: Primary test user
- **User B**: Secondary test user (separate browser/profile)

Both must have:
- Valid Magic.link authentication
- Provisioned Hedera accounts (via HCS-22)
- EVM addresses resolved

### 3. Contact Bond Precondition

**Before testing Messages:**

1. Log in as User A
2. Navigate to **Contacts** or **Circle** tab
3. Add/bond with User B (via QR code or existing flow)
4. Verify bond: `/api/circle?sessionId=<UserA_Hedera>` should return User B in `bondedContacts`

**Critical:** Messages tab only shows HCS-bonded contacts. No bond = no conversation.

---

## 🧪 Test Scenarios

### Scenario 1: Contact List Display

**User:** A  
**Path:** `/messages`

**Expected:**
- ✅ Messages tab appears in bottom navigation (4th position)
- ✅ ConversationList loads without errors
- ✅ User B appears in contact list
- ✅ If User B has XMTP: Green dot + "XMTP enabled" badge + "Message" button
- ✅ If User B lacks XMTP: "Invite" button only
- ✅ No crash when loading contacts

**Fail Cases:**
- ❌ No bonded contacts → "No contacts yet" empty state
- ❌ All "Invite" buttons → Check EVM resolution / `canMessage()` logic

---

### Scenario 2: Open Thread View

**User:** A  
**Path:** `/messages` → Click "Message" on User B

**Expected:**
- ✅ Transitions from list view to full-screen thread
- ✅ Header shows:
  - Back arrow (left)
  - User B avatar
  - User B display name
  - User B Hedera account ID
- ✅ If no prior conversation: "No messages yet / Start the conversation below"
- ✅ MessageComposer visible at bottom

**Fail Cases:**
- ❌ Loading spinner hangs → Check XMTP client initialization
- ❌ Error state → Check `contact.evmAddress` validity

---

### Scenario 3: Send Message (A → B)

**User:** A  
**Path:** Thread with User B

**Steps:**
1. Type: `"Hey, this is A. Testing XMTP!"`
2. Press **Enter** (or click Send button)

**Expected:**
- ✅ Message appears on **right side** (orange bubble)
- ✅ Timestamp shows current time in 12-hour format
- ✅ Composer clears after send
- ✅ No duplicate messages
- ✅ Send button shows spinner while sending

**Fail Cases:**
- ❌ Message doesn't send → Check console for XMTP errors
- ❌ Message duplicates → Stream dedupe logic issue

---

### Scenario 4: Receive Message (B receives from A)

**User:** B  
**Path:** `/messages`

**Steps:**
1. Log in as User B (separate browser/incognito)
2. Navigate to Messages tab
3. Open thread with User A (or wait for notification)

**Expected:**
- ✅ User A's message appears on **left side** (panel bg bubble)
- ✅ Message content matches: `"Hey, this is A. Testing XMTP!"`
- ✅ Timestamp is accurate
- ✅ No need to refresh page (real-time stream)

**Fail Cases:**
- ❌ Message doesn't appear → Check both users on same XMTP env (dev/prod)
- ❌ Message delayed >10s → XMTP network latency issue

---

### Scenario 5: Bi-Directional Real-Time

**Users:** A and B simultaneously

**Steps:**
1. Keep A's thread open
2. User B types: `"Got it! This is B replying."`
3. User B presses Enter
4. Watch User A's screen (no refresh)

**Expected:**
- ✅ User A sees B's reply appear on **left side** immediately
- ✅ User B sees their own message on **right side**
- ✅ No duplicates on either side
- ✅ Message order preserved (A's first, then B's)

**Fail Cases:**
- ❌ Message doesn't appear on A's screen → Stream not working
- ❌ Duplicates → Check `streamMessages()` dedupe logic

---

### Scenario 6: Back Navigation

**User:** A  
**Path:** Thread with User B

**Steps:**
1. Click **back arrow** in thread header
2. Observe UI transition

**Expected:**
- ✅ Returns to ConversationList (contact list view)
- ✅ User B still visible in list
- ✅ No memory leaks (check console warnings)
- ✅ Stream cleanup executed (see `[MessageThread] Stream cleanup` log)

**Fail Cases:**
- ❌ React warnings about "setState on unmounted component"
- ❌ Back button doesn't work → Check `onBack` prop wiring

---

### Scenario 7: Feature Flag Off

**Setup:** `.env.local`

```bash
NEXT_PUBLIC_XMTP_ENABLED=false
```

**User:** A  
**Path:** `/messages`

**Expected:**
- ✅ Messages tab still visible
- ✅ Page shows "Messaging unavailable" state (yellow card)
- ✅ No XMTP client initialization attempted
- ✅ No JavaScript errors in console
- ✅ Contact list shows all "Invite" buttons (hasXMTP=false for all)

**Acceptance:** App degrades gracefully, no crashes.

---

### Scenario 8: Not Authenticated

**Setup:** Log out or use fresh browser session

**Path:** `/messages`

**Expected:**
- ✅ Shows "Sign in required" state
- ✅ No attempt to load contacts
- ✅ No XMTP initialization
- ✅ CTA to go to Onboarding/Login

**Acceptance:** No crashes, fail-soft behavior.

---

### Scenario 9: EVM Resolution Failure

**Setup:** Simulate by breaking Mirror Node env or contact with no EVM address

**User:** A  
**Path:** `/messages`

**Expected:**
- ✅ Contact list still loads
- ✅ Affected contacts show:
  - `evmAddress: ''`
  - `hasXMTP: false`
  - "Invite" button only
- ✅ No thrown errors
- ✅ Other contacts (with valid EVM) still work

**Acceptance:** Partial failure doesn't break entire list.

---

### Scenario 10: Message Persistence

**User:** A

**Steps:**
1. Send message to User B: `"Message 1"`
2. Close browser tab
3. Reopen `/messages`
4. Navigate to thread with User B

**Expected:**
- ✅ "Message 1" appears in history
- ✅ XMTP SDK loads messages from conversation history
- ✅ No messages lost

**Acceptance:** Messages persist across sessions (XMTP network storage).

---

## 🔬 Edge Cases & Error Handling

### Edge Case 1: Long Messages

**Test:** Send 500+ character message

**Expected:**
- ✅ Textarea auto-resizes (up to 120px max)
- ✅ Message bubble wraps text (max-w-[75%])
- ✅ No UI overflow

### Edge Case 2: Rapid Fire Messages

**Test:** Send 5 messages in <2 seconds

**Expected:**
- ✅ All messages appear in order
- ✅ No duplicates
- ✅ Optimistic updates work
- ✅ Stream handles burst

### Edge Case 3: Network Interruption

**Test:** Disable network mid-conversation, then re-enable

**Expected:**
- ✅ Send fails gracefully (message stays in composer)
- ✅ On reconnect, messages sync
- ✅ No data loss

---

## 📊 Performance Checks

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time to first message | <10s | Open thread → send → receive |
| Message delivery latency | <3s | A sends → B receives |
| Contact list load | <2s | Navigate to `/messages` |
| Thread switch | <1s | List → thread transition |
| Stream cleanup | 0 warnings | Check console on back navigation |

---

## ✅ Acceptance Criteria

**Phase 1 Complete When:**

- [ ] Two Magic users can send/receive messages via XMTP
- [ ] Contact list shows correct XMTP reachability status
- [ ] Real-time streaming works (no refresh needed)
- [ ] Back navigation works without memory leaks
- [ ] Feature flag off → graceful degradation
- [ ] No crashes in any tested scenario
- [ ] All 10 test scenarios pass
- [ ] Build passes: `pnpm build`
- [ ] No TypeScript errors
- [ ] No React warnings in console

---

## 🏷️ Final Steps

Once all tests pass:

1. **Tag the branch:**
   ```bash
   git tag -a xmtp-sidecar-v0.1 -m "Phase 1: XMTP Sidecar Messaging - Production Ready"
   git push origin xmtp-sidecar-v0.1
   ```

2. **Document results:**
   - Create `docs/XMTP_T10_RESULTS.md`
   - Include screenshots of successful message exchange
   - Log any issues discovered + fixes applied

3. **Update README:**
   - Add "XMTP Messaging (Phase 1)" to features list
   - Document environment variables needed
   - Link to this test plan

4. **Prepare for merge:**
   - Rebase on latest `main`
   - Squash commits if needed
   - Update PR description with test results

---

## 🚀 Next Phase Preview

**Phase 2 Enhancements (Post-T10):**
- TRST payment cards in threads (Loop Two)
- Inner Circle badges (💎 diamond indicator)
- Group conversations
- Message search/filtering
- Typing indicators
- Read receipts
- Push notifications

---

## 📝 Notes for QA Engineer

**Common Issues:**

1. **"No XMTP client"**
   - Check `.env.local` has `NEXT_PUBLIC_XMTP_ENABLED=true`
   - Verify Magic login successful
   - Check browser console for initialization errors

2. **"Contact not showing Message button"**
   - Verify contact has bonded via HCS
   - Check EVM address resolution (Mirror Node)
   - Test `canMessage()` cache (5min TTL)

3. **"Messages not delivering"**
   - Confirm both users on same XMTP env (dev/production)
   - Check network connectivity
   - Verify conversation created successfully

4. **"Stream not working"**
   - Check async iterator implementation
   - Verify cleanup on unmount
   - Test in different browsers (Chrome, Firefox)

---

**Last Updated:** 2025-11-09  
**Maintained By:** Tony Camero  
**Contact:** GitHub Issues on `hedera-africa-hackathon` repo
