# XMTP Phase 1: Sidecar Messaging
## Implementation Checklist (Weeks 1-4)

**Branch**: `feature/xmtp-nervous-system`  
**Goal**: XMTP runs independently; users can message contacts without touching HCS.  
**Target**: Week 4 Demo - First message sent in <10 seconds

---

## 📋 Sprint 1 (Week 1-2): Foundation

### Setup & Dependencies
- [ ] Install XMTP SDK: `pnpm add @xmtp/xmtp-js`
- [ ] Install crypto utilities: `pnpm add crypto-js`
- [ ] Add XMTP env vars to `.env.local`:
  ```bash
  NEXT_PUBLIC_XMTP_ENV=production  # or 'dev' for testing
  ```
- [ ] Update `package.json` scripts (if needed)

### Core Types & Schemas
- [ ] Create `lib/identity/ScendIdentity.ts`
  - [ ] Define `ScendIdentity` interface
  - [ ] Define `HCS22Binding` interface
  - [ ] Export type guards

- [ ] Create `lib/xmtp/types.ts`
  - [ ] Define `ConversationThread` interface
  - [ ] Define `XMTPMessage` interface
  - [ ] Define `XMTPStatus` type

- [ ] Extend `lib/stores/signalsStore.ts`
  - [ ] Add MESSAGE event types to `SignalEventType`
  - [ ] Add `MessageMetadata` interface
  - [ ] Add `xmtpConversationId` field to `SignalEvent`
  - [ ] Add `xmtpMessageId` field to `SignalEvent`

### Identity Resolution Service
- [ ] Create `lib/identity/resolver.service.ts`
  - [ ] Implement `IdentityResolver` class
  - [ ] Add `evmToHedera(evmAddress)` method
  - [ ] Add `hederaToEVM(hederaAccountId)` method
  - [ ] Add in-memory cache (5 min TTL)
  - [ ] Add error handling

- [ ] Create `lib/identity/identity.cache.ts`
  - [ ] Implement `IdentityCache` class
  - [ ] Add localStorage persistence
  - [ ] Add TTL expiration logic

- [ ] Create API endpoint `app/api/identity/resolve/route.ts`
  - [ ] GET handler for EVM → Hedera lookup
  - [ ] Query HCS-22 topic via Mirror Node
  - [ ] Return `{ hederaAccountId, handle, evmAddress }`

---

## 📋 Sprint 2 (Week 3-4): XMTP Client & UI

### XMTP Client
- [ ] Create `lib/xmtp/client.ts`
  - [ ] Implement `getXMTPClient(evmAddress)` singleton
  - [ ] Initialize with Magic.link signer
  - [ ] Add connection state management
  - [ ] Add error handling & reconnection logic

- [ ] Create `lib/xmtp/conversation.service.ts`
  - [ ] Implement `ConversationService` class
  - [ ] Add `listConversations()` method
  - [ ] Add `getConversation(id)` method
  - [ ] Add `createConversation(recipientEVM)` method

- [ ] Create `lib/xmtp/message.service.ts`
  - [ ] Implement `MessageService` class
  - [ ] Add `sendMessage(conversationId, content)` method
  - [ ] Add `getMessages(conversationId)` method
  - [ ] Add message formatting utilities

### SignalsStore Integration
- [ ] Create `lib/xmtp/sync.service.ts`
  - [ ] Implement `XMTPSyncService` class
  - [ ] Add `startSync(identity)` method
  - [ ] Subscribe to XMTP message stream
  - [ ] Convert XMTP messages → SignalEvents
  - [ ] Inject into `signalsStore`
  - [ ] Add error handling

- [ ] Modify `lib/stores/signalsStore.ts`
  - [ ] Update `add()` to handle MESSAGE events
  - [ ] Add `getMessagesByConversation(conversationId)` query
  - [ ] Ensure proper LRU eviction (200 cap)

### React Hooks
- [ ] Create `lib/xmtp/hooks/useXMTPStatus.ts`
  - [ ] Track XMTP connection state
  - [ ] Return `{ connected, connecting, error }`

- [ ] Create `lib/xmtp/hooks/useConversations.ts`
  - [ ] Fetch conversation list
  - [ ] Subscribe to new conversations
  - [ ] Return `{ conversations, loading, error }`

- [ ] Create `lib/xmtp/hooks/useMessages.ts`
  - [ ] Fetch messages for conversation
  - [ ] Subscribe to new messages
  - [ ] Return `{ messages, loading, error, sendMessage }`

---

## 📋 UI Components

### Conversation List
- [ ] Create `components/messages/ConversationList.tsx`
  - [ ] Map conversations to list items
  - [ ] Show participant handle (resolve via IdentityResolver)
  - [ ] Show last message preview
  - [ ] Show unread badge
  - [ ] Handle loading/error states

- [ ] Create `components/messages/ConversationListItem.tsx`
  - [ ] Display participant avatar
  - [ ] Display handle + Hedera account ID
  - [ ] Display last message timestamp
  - [ ] Display unread count
  - [ ] Click → navigate to thread

### Message Thread
- [ ] Create `components/messages/MessageThread.tsx`
  - [ ] Display messages in scrollable list
  - [ ] Auto-scroll to bottom on new message
  - [ ] Show loading skeleton
  - [ ] Handle empty state

- [ ] Create `components/messages/MessageBubble.tsx`
  - [ ] Display message content
  - [ ] Display sender handle
  - [ ] Display timestamp
  - [ ] Differentiate sent vs received (align left/right)
  - [ ] Add delivered/read indicators (future)

- [ ] Create `components/messages/MessageComposer.tsx`
  - [ ] Text input with auto-resize
  - [ ] Send button
  - [ ] Character counter (optional)
  - [ ] Handle enter key to send
  - [ ] Handle shift+enter for new line
  - [ ] Disable when sending

### Page Routes
- [ ] Create `app/(tabs)/messages/page.tsx`
  - [ ] Fetch conversations via `useConversations`
  - [ ] Render `ConversationList`
  - [ ] Handle empty state ("No conversations yet")
  - [ ] Add "New Message" button (future)

- [ ] Create `app/(tabs)/messages/[conversationId]/page.tsx`
  - [ ] Fetch messages via `useMessages`
  - [ ] Render `MessageThread`
  - [ ] Render `MessageComposer`
  - [ ] Handle invalid conversation ID

- [ ] Modify `app/(tabs)/layout.tsx`
  - [ ] Add "Messages" tab icon
  - [ ] Add unread badge to tab (future)

---

## 📋 API Routes

- [ ] Create `app/api/xmtp/init/route.ts`
  - [ ] POST handler
  - [ ] Check Magic.link auth
  - [ ] Initialize XMTP keys if needed
  - [ ] Return `{ initialized: true, evmAddress }`

- [ ] Create `app/api/xmtp/conversations/route.ts`
  - [ ] GET handler
  - [ ] Fetch conversations for current user
  - [ ] Resolve participant EVM → Hedera
  - [ ] Return enriched conversation list

- [ ] Create `app/api/xmtp/send/route.ts`
  - [ ] POST handler
  - [ ] Validate recipient EVM address
  - [ ] Send message via XMTP client
  - [ ] Create MESSAGE_SENT SignalEvent
  - [ ] Return `{ success: true, messageId }`

---

## 📋 Testing & Validation

### Unit Tests
- [ ] Test `IdentityResolver.evmToHedera()`
  - [ ] Valid EVM → Hedera
  - [ ] Invalid EVM → error
  - [ ] Cache hit
  - [ ] Cache miss → Mirror Node query

- [ ] Test `IdentityResolver.hederaToEVM()`
  - [ ] Valid Hedera → EVM
  - [ ] No binding found → error

- [ ] Test `XMTPSyncService.startSync()`
  - [ ] Message received → SignalEvent created
  - [ ] SignalEvent injected into store
  - [ ] Identity resolved correctly

### Integration Tests
- [ ] Test conversation creation flow
  - [ ] User A creates conversation with User B
  - [ ] User B sees conversation in list
  - [ ] Both users can see each other's Hedera IDs

- [ ] Test message send/receive flow
  - [ ] User A sends message
  - [ ] User B receives message
  - [ ] Both see message in thread
  - [ ] SignalsStore contains MESSAGE events

### Manual Testing
- [ ] Test with 2 test accounts
  - [ ] Login with Magic.link (both accounts)
  - [ ] Verify EVM addresses generated
  - [ ] Verify HCS-22 bindings exist
  - [ ] Create conversation
  - [ ] Send message (A → B)
  - [ ] Receive message (B sees it)
  - [ ] Reply (B → A)
  - [ ] Verify both users see full thread

---

## 📋 Success Metrics (Week 4 Demo)

### Performance
- [ ] **t₁ < 10s**: Time from login to first message sent
  - [ ] Measure with `performance.now()`
  - [ ] Target: 8-10 seconds
  - [ ] Optimize if >10s

### Reliability
- [ ] **100%**: Message delivery rate between TrustMesh users
  - [ ] Send 10 messages between 2 users
  - [ ] All 10 should appear in both threads

### Identity Resolution
- [ ] **0 errors**: EVM ↔ Hedera resolution
  - [ ] Test with 5 different user pairs
  - [ ] All should resolve correctly

### UX
- [ ] Messages display correctly in UI
- [ ] No UI glitches or flickering
- [ ] Loading states are smooth
- [ ] Error messages are helpful

---

## 📋 Documentation

- [ ] Update `README.md`
  - [ ] Add XMTP setup instructions
  - [ ] Add environment variables section

- [ ] Create `docs/XMTP_PHASE_1_SUMMARY.md`
  - [ ] Document what was built
  - [ ] Document API endpoints
  - [ ] Document component hierarchy
  - [ ] Document known issues/limitations

- [ ] Add JSDoc comments
  - [ ] All public functions
  - [ ] All interfaces/types
  - [ ] Complex logic blocks

---

## 📋 Pre-Phase 2 Prep

- [ ] Review Phase 1 with team
- [ ] Gather user feedback on messaging UX
- [ ] Identify pain points
- [ ] Plan ContextEngine integration (Phase 2)
- [ ] Update Phase 2 spec based on learnings

---

## 🚀 Week 4 Demo Script

**Goal**: Prove XMTP messaging works end-to-end with TrustMesh identity system.

### Demo Flow (5 minutes)
1. **Login** (User A)
   - Magic.link email login
   - Show Hedera account ID displayed
   - Show EVM address in dev console

2. **Navigate to Messages**
   - Click "Messages" tab
   - Show empty state

3. **Create Conversation** (with User B)
   - Click "New Message"
   - Enter User B's EVM address (or handle)
   - Show identity resolution: EVM → Hedera
   - Show User B's Hedera account ID in conversation header

4. **Send Message** (User A → User B)
   - Type: "Hey! Testing XMTP integration 👋"
   - Click Send
   - Show message appears instantly (optimistic UI)
   - Show timestamp

5. **Switch to User B**
   - Login with User B
   - Navigate to Messages
   - Show conversation with User A
   - Show received message

6. **Reply** (User B → User A)
   - Type: "It works! 🎉"
   - Send
   - Switch back to User A
   - Show reply received

7. **Show SignalsStore** (Dev Console)
   - Open browser console
   - Run: `signalsStore.getAll().filter(e => e.type.includes('MESSAGE'))`
   - Show MESSAGE_SENT and MESSAGE_RECEIVED events
   - Show EVM ↔ Hedera resolution in event metadata

### Key Talking Points
- "XMTP provides E2EE messaging without servers"
- "ScendIdentity unifies EVM (XMTP) with Hedera (trust layer)"
- "Next phase: ContextEngine will analyze messages and suggest trust actions"
- "Phase 3: Optional HCS anchoring for compliance"

---

## 🎯 Phase 1 Complete When:

- [ ] All checklist items ✅
- [ ] Demo script executes successfully
- [ ] All tests passing
- [ ] Code reviewed and merged to main
- [ ] Deployed to staging/production
- [ ] Metrics tracked in dashboard

---

**Status**: 🟡 In Progress  
**Last Updated**: 2025-11-09  
**Next Review**: End of Week 2
