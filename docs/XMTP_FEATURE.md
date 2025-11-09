# XMTP Messaging Feature (Phase 1)

**Status:** ✅ Production Ready (Pending QA)  
**Branch:** `feature/xmtp-nervous-system`  
**Tag:** `xmtp-sidecar-v0.1` (planned)

---

## 🎯 Overview

TrustMesh now includes **end-to-end encrypted messaging** via XMTP (Extensible Message Transport Protocol), integrated as a sidecar to the existing HCS-based trust network.

**Key principle:** Only HCS-bonded contacts appear in your Messages inbox. XMTP is the transport layer; HCS defines who you trust.

---

## ✨ Features

### 1. Trust-Gated Messaging
- **Only bonded contacts** show up in Messages tab
- Contact bonding happens via Circle/Contacts (HCS)
- No spam or random DMs

### 2. Dual-Key Identity
- **Magic.link EVM wallet** for XMTP signing
- **Hedera account** for HCS trust relationships
- Unified via HCS-22 identity binding

### 3. Real-Time Conversations
- Send/receive messages with E2EE (XMTP network)
- Real-time streaming (no refresh needed)
- Message history persists across sessions
- Optimistic updates for instant UX

### 4. XMTP Reachability
- Contact list shows which bonded contacts have XMTP
- "Message" button for reachable contacts
- "Invite" button for contacts without XMTP
- Cached reachability checks (5min TTL, LRU 100)

### 5. Fail-Soft Design
- Feature flag controlled (`NEXT_PUBLIC_XMTP_ENABLED`)
- Graceful degradation when disabled
- No crashes on errors
- Partial failures don't break entire system

---

## 🔧 Environment Setup

### Required Variables

Add to `.env.local`:

```bash
# XMTP Configuration
NEXT_PUBLIC_XMTP_ENABLED=true  # Enable XMTP messaging
NEXT_PUBLIC_XMTP_ENV=dev       # dev | production | local

# Existing Configuration (already present)
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_...
```

### Optional Variables

```bash
# XMTP App Version (default: trustmesh/xmtp-sidecar-v0.1)
NEXT_PUBLIC_XMTP_APP_VERSION=trustmesh/xmtp-sidecar-v0.1
```

---

## 🚀 User Flow

### 1. Prerequisites
- User logged in via Magic.link
- Hedera account provisioned (HCS-22)
- At least one bonded contact in Circle

### 2. Navigate to Messages
1. Click **Messages** tab (bottom navigation)
2. See list of bonded contacts
3. Contacts with XMTP show green dot + "Message" button
4. Contacts without XMTP show "Invite" button

### 3. Start Conversation
1. Click **Message** button on any XMTP-enabled contact
2. Thread view opens with message history (if any)
3. Type message in composer at bottom
4. Press **Enter** to send (or click Send button)

### 4. Real-Time Messaging
- Messages appear instantly (no refresh)
- Sent messages: orange bubble on right
- Received messages: panel bubble on left
- Timestamps in 12-hour format

### 5. Back Navigation
- Click **back arrow** in thread header
- Returns to contact list
- Stream cleanup automatic (no memory leaks)

---

## 🏗️ Architecture

### Sidecar Pattern

```
┌─────────────────────────────────────────────┐
│           TrustMesh Core (HCS)              │
│  - Contact bonding (CONTACT_ACCEPT)         │
│  - Trust allocation (TRUST_ALLOCATE)        │
│  - Recognition (RECOGNITION_MINT)           │
└─────────────────────────────────────────────┘
                    ↓
            Contact bonds define
            who can message
                    ↓
┌─────────────────────────────────────────────┐
│        XMTP Sidecar (Messaging)             │
│  - E2E encrypted transport                  │
│  - Real-time streaming                      │
│  - Message history                          │
└─────────────────────────────────────────────┘
```

### Components

**Identity Layer:**
- `ScendIdentity` - Unified type (EVM + Hedera)
- `resolveScendIdentity()` - Magic + HCS-22 resolution
- `IdentityProvider` - Global React context

**XMTP Client:**
- `lib/xmtp/client.ts` - XMTP client singleton
- `lib/xmtp/hooks/useXmtpClient.ts` - React hook wrapper
- Magic.link signer adapter for XMTP

**Contact Resolution:**
- `lib/services/contactsForMessaging.ts` - HCS bonds → XMTP reachability
- EVM resolution via Mirror Node API
- Cached `canMessage()` checks

**UI Components:**
- `ConversationList` - Contact list with XMTP badges
- `MessageThread` - Thread view with history
- `MessageComposer` - Auto-resizing textarea + send button

---

## 📊 Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| Time to first message | <10s | Optimistic updates |
| Message delivery | <3s | XMTP network latency |
| Contact list load | <2s | Cached EVM resolution |
| Thread switch | <1s | Client-side routing |
| Memory leaks | 0 | Proper stream cleanup |

---

## 🔒 Security & Privacy

### End-to-End Encryption
- All messages encrypted via XMTP protocol
- Keys managed by XMTP SDK
- No plaintext storage on servers

### Access Control
- Only HCS-bonded contacts can message
- No random DMs or spam
- Revoke contact bond → removes from Messages

### Data Sovereignty
- Message history stored on XMTP network
- Users control their own keys (Magic wallet)
- No centralized message database

---

## 🧪 Testing

**Manual QA:** See `docs/XMTP_T10_TEST_PLAN.md`

**Unit Tests:**
- `__tests__/lib/services/contactsForMessaging.test.ts` (2 passing)

**Integration Tests:**
- Two-user message exchange
- Feature flag degradation
- Error handling scenarios

---

## 🐛 Troubleshooting

### "No XMTP client" Error
- Check `.env.local` has `NEXT_PUBLIC_XMTP_ENABLED=true`
- Verify Magic login successful
- Check browser console for initialization errors

### "Contact not showing Message button"
- Verify contact bonded via Circle/Contacts
- Check EVM address resolved (Mirror Node)
- Test `canMessage()` cache (5min TTL)

### "Messages not delivering"
- Confirm both users on same XMTP env (dev/production)
- Check network connectivity
- Verify conversation created successfully

### "Stream not working"
- Check async iterator implementation
- Verify cleanup on unmount
- Test in different browsers (Chrome, Firefox)

---

## 🚀 Phase 2 Roadmap

**Loop Two Enhancements:**
- TRST payment cards in threads (contextual payments)
- Inner Circle badges (💎 diamond for trusted contacts)
- Recognition signals linked to conversations
- Group conversations
- Message search/filtering
- Typing indicators
- Read receipts
- Push notifications

---

## 📚 Related Documentation

- **Test Plan:** `docs/XMTP_T10_TEST_PLAN.md`
- **Test Results:** `docs/XMTP_T10_RESULTS.md` (TBD)
- **Loop Two Spec:** `docs/loop_two_messaging_payments.md`
- **Inner Circle:** `docs/inner_circle_meta_system.md`
- **XMTP Integration:** `docs/XMTP_INTEGRATION_SPEC.md`

---

## 📝 Quick Start

```bash
# 1. Enable XMTP
echo "NEXT_PUBLIC_XMTP_ENABLED=true" >> .env.local

# 2. Install dependencies
pnpm install

# 3. Build
pnpm build

# 4. Run dev server
pnpm dev

# 5. Log in with Magic.link
# 6. Bond with another user in Circle/Contacts
# 7. Navigate to Messages tab
# 8. Start messaging!
```

---

**Last Updated:** 2025-11-09  
**Maintained By:** Tony Camero  
**Contact:** GitHub Issues on `hedera-africa-hackathon` repo
