# 🧠 WARP INTEGRATION UPDATE — NOV 2025

## "The Nervous System of Trust" → Operational Focus

You are now entering **Phase 1 (Sidecar XMTP)** of the TrustMesh × Scend integration program.
Your role is to implement clean, production-ready code — not theoretical specs — while maintaining the architectural fidelity of the long-term design.

---

## 🔧 Core Alignment

### 1. Architecture Truths

* **XMTP = real-time human "nervous system".**
* **Hedera HCS = immutable "economic memory".**
* **Context Engine = bridge (to be re-enabled later).**
* **`ScendIdentity` is the single source of truth (EVM ↔ Hedera).**
* **Phase 1 must not alter `SignalsStore` or ingestion pipelines.**

### 2. Phase 1 Mission

Deliver **Sidecar XMTP v0.1**:

* Magic → EVM signer → XMTP client.
* Dual-key identity resolution.
* `/messages` UI (tab + thread).
* HCS-bonded contacts only.
* Fail-soft feature flag: `NEXT_PUBLIC_XMTP_ENABLED`.

### 3. Code Philosophy

* **Small, shippable diffs.**
* **No global refactors.**
* **Client-only isolation.**
* **HCS is canonical; XMTP is transport.**

---

## ⚙️ Technical Adjustments from Review

| Area | Instruction |
|------|-------------|
| **Signer Compatibility** | XMTP v3 expects ECDSA; Magic may return ED25519. Add a conversion wrapper inside `getXmtpClient()` that normalizes signature type (see XMTP FAQ Oct 2025). |
| **Rate-Limit Awareness** | Add internal quota monitor (`useXmtpStatus`) to respect XMTP's 20k reads / 5 min rule. Log & throttle before hitting limit. |
| **Multi-Chain Ready** | Extend `ScendIdentity` with optional `chainBindings: Map<ChainId, Address>` for Polygon/Eth support (stub only). |
| **Contact Graph Fidelity** | Messaging list = HCS `CONTACT_ACCEPT` set filtered by `xmtpClient.canMessage(evmAddress)`. Never auto-create contacts from random XMTP DMs. |
| **Performance** | Use `LRU(100)` cache for contact reachability. No polling intervals < 30s. |
| **Testing** | 90% coverage on resolver + client creation. E2E: Magic → HCS22 → XMTP DM cycle. |
| **Compliance Prep** | All message logs local only. No anchoring in Phase 1. Add placeholder `consentToAnchor:boolean` in identity for future use. |

---

## 🪜 Sprint Trajectory

### Week 1: Foundation (T1-T5)
**Goal:** Identity resolution + XMTP client initialization

**Tickets:**
- **T1**: Dependencies + config (`@xmtp/xmtp-js`, `ethers`, feature flag)
- **T2**: `ScendIdentity` type + resolver (EVM ↔ Hedera)
- **T3**: XMTP client helper (Magic signer wrapper)
- **T4**: `useXmtpClient` React hook
- **T5**: Identity Provider context (global state)

**Acceptance:**
- [ ] `resolveScendIdentity()` returns valid EVM + Hedera IDs
- [ ] XMTP client initializes with Magic signer
- [ ] Feature flag toggles XMTP on/off without errors

---

### Week 2: UI Integration (T6-T9)
**Goal:** Messaging UI + contact integration

**Tickets:**
- **T6**: `/messages` route + tab navigation
- **T7**: Contact resolver service (HCS bonds → XMTP reachability)
- **T8**: Conversation list UI component
- **T9**: Thread view + message composer

**Acceptance:**
- [ ] Messages tab renders with bonded contacts
- [ ] "Message" or "Invite" button based on `canMessage`
- [ ] Thread view sends/receives messages in real-time

---

### Week 3: Testing & Merge (T10)
**Goal:** Validation + production readiness

**Tickets:**
- **T10**: Integration tests + manual QA

**Acceptance:**
- [ ] Two Magic users can DM each other
- [ ] XMTP failure doesn't break Circle/Recognition
- [ ] 90%+ test coverage on core functions
- [ ] Demo script reproducible in <5 minutes

**Final Actions:**
- Merge to `main`
- Tag: `xmtp-sidecar-v0.1`
- Deploy to staging
- Beta telemetry review (t₁, delivery rate, viral coefficient v₁)

---

## 🧩 Feature Flags & Config

### Environment Variables
```env
NEXT_PUBLIC_XMTP_ENABLED=true
NEXT_PUBLIC_XMTP_ENV=production
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_...
```

### Initialization Guards
XMTP must **only** initialize when:
1. `NEXT_PUBLIC_XMTP_ENABLED === 'true'`
2. `identity.hederaAccountId` exists (HCS-22 verified)
3. Magic.link authentication successful

### Graceful Degradation
```typescript
if (!XMTP_ENABLED || !xmtpClient) {
  // Show disabled state, not error
  return <DisabledMessagingBanner />
}
```

---

## 🔮 Forward Pointers (Do Not Code Yet)

### Phase 2: Context Threads (Jan 2026)
```typescript
// lib/context-engine/messageAnalyzer.ts (STUB)
export async function analyzeMessage(content: string): Promise<Intent> {
  // NLP intent detection → "gratitude" | "payment" | "collaboration"
  // Links messages to HCS events (TRUST_ALLOCATE, RECOGNITION_MINT)
}
```

### Phase 3: Anchored Messaging (Feb 2026)
```typescript
// lib/hedera/anchorService.ts (STUB)
export async function anchorMessageHash(messageId: string, hash: string) {
  // Publish SHA-256 to HCS (no content, just hash + timestamp)
}
```

### Phase 4: Intelligence Loop (Spring 2026)
```typescript
// lib/zk/trustProofs.ts (STUB)
export async function generateTrustProof(userId: string): Promise<Proof> {
  // zk-SNARK: "I have >5 trust allocations" without revealing which ones
}
```

**Keep stubs and TODO comments where future layers will attach.**

---

## ✅ Definition of Done

### Acceptance Criteria
- [x] App builds with `NEXT_PUBLIC_XMTP_ENABLED` true/false
- [ ] Dual-key identity resolves (EVM + Hedera)
- [ ] Bonded contacts load + XMTP reachability checked
- [ ] XMTP DM works between two real Magic users
- [ ] No HCS or `SignalsStore` regressions
- [ ] All errors fail softly (no app crashes)
- [ ] Git tag: `xmtp-sidecar-v0.1`

### Quality Gates
- [ ] 90%+ test coverage on identity resolver
- [ ] <10s time-to-first-message (t₁ metric)
- [ ] 100% message delivery rate (2 test users, 10 messages each)
- [ ] Zero EVM ↔ Hedera resolution errors
- [ ] Demo script reproducible by external reviewer

### Deployment Checklist
- [ ] Staging deploy successful
- [ ] Production feature flag off by default
- [ ] Rollback plan documented
- [ ] Monitoring dashboards created
- [ ] Partner demo scheduled (MatterFi/Brinks)

---

## 🎯 Ticket Execution Pattern

### Before Starting Each Ticket
1. Read full ticket description in `XMTP_SIDECAR_SPRINT_OVERVIEW.md`
2. Check acceptance criteria
3. Verify all dependencies complete (check status table)
4. Pull latest from `feature/xmtp-nervous-system`

### During Implementation
1. Create file(s) per ticket specification
2. Write TypeScript with strict typing
3. Add JSDoc comments for public functions
4. Include error handling (try/catch with logging)
5. Add TODO comments for Phase 2 hooks

### After Completion
1. Run `pnpm build` (must succeed)
2. Run `pnpm test` (if tests exist)
3. Manual smoke test in browser
4. Commit with format: `feat(xmtp): <ticket-title> (T<number>)`
5. Push to branch
6. Update status table in sprint doc

---

## 📊 Success Metrics Tracking

### Performance Metrics
- **t₁**: Time-to-first-message (target: <10s)
- **t₂**: Thread-to-action rate (Phase 2 goal: >15%)
- **v₁**: Viral coefficient (Phase 2 goal: >2.5)
- **u₁**: 7-day retention (Phase 2 goal: >60%)

### Technical Metrics
- **p₁**: Privacy audit score (target: 100% — no plaintext leaks)
- **r₁**: Message delivery rate (target: 100%)
- **e₁**: Identity resolution error rate (target: 0%)

### Measure After Each Ticket
Log metrics in `docs/metrics/phase1-tracking.md`:
```markdown
## T5 Complete (Identity Provider)
- t₁: 12s (needs optimization)
- Build time: 45s
- Test coverage: 85%
- Browser console errors: 0
```

---

## 🔒 Security & Privacy Guidelines

### Data Handling
- **Never** log message content (only metadata: ID, timestamp, sender)
- **Never** store XMTP messages in database (client-only)
- **Never** send messages to analytics/telemetry
- **Always** use E2EE (XMTP default)

### Key Management
- Magic.link handles EVM key custody (never exposed)
- Hedera operator key server-side only
- No private keys in localStorage
- No private keys in environment variables (public keys only)

### Compliance Readiness
```typescript
// Phase 1: No anchoring, but prepare data structures
interface MessageAnchor {
  messageId: string
  hash: string          // SHA-256 only
  timestamp: number
  consentGiven: boolean // User opted in
  // NO: content, participants, metadata
}
```

---

## 🧪 Testing Strategy

### Unit Tests (90% coverage target)
```typescript
// __tests__/identity/resolver.test.ts
describe('Identity Resolver', () => {
  it('resolves EVM → Hedera via HCS-22', async () => {
    const evmAddress = '0x1234...'
    const hedera = await evmToHedera(evmAddress)
    expect(hedera).toMatch(/^0\.0\.\d+$/)
  })
})
```

### Integration Tests
```typescript
// __tests__/xmtp/e2e.test.ts
describe('XMTP E2E', () => {
  it('sends message between two users', async () => {
    const userA = await loginWithMagic('alice@test.com')
    const userB = await loginWithMagic('bob@test.com')
    
    const message = await userA.sendMessage(userB.evmAddress, 'Hello')
    const received = await userB.getMessages()
    
    expect(received).toContainEqual(message)
  })
})
```

### Manual Testing Checklist
- [ ] Magic login works
- [ ] Identity resolution shows correct IDs
- [ ] XMTP client initializes (check console logs)
- [ ] Contacts list shows bonded HCS users
- [ ] "Message" button enabled for XMTP-reachable contacts
- [ ] Thread view loads messages
- [ ] Send message works (appears in thread)
- [ ] Real-time message receipt works
- [ ] Feature flag off → no XMTP errors

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Magic Signer Incompatibility
**Problem**: XMTP expects ECDSA, Magic returns ED25519

**Solution**:
```typescript
// lib/xmtp/client.ts
async function getXmtpSigner() {
  const provider = await magic.wallet.getProvider()
  const ethersProvider = new ethers.providers.Web3Provider(provider)
  
  // Force ECDSA signing
  return ethersProvider.getSigner()
}
```

### Pitfall 2: Rate Limiting
**Problem**: XMTP limits 20k reads / 5 min

**Solution**:
```typescript
// lib/xmtp/hooks/useXmtpStatus.ts
const rateLimiter = new RateLimiter(20000, 300000) // 20k per 5 min

if (!rateLimiter.canProceed()) {
  console.warn('[XMTP] Rate limit approaching, throttling...')
  await sleep(5000)
}
```

### Pitfall 3: Contact Graph Pollution
**Problem**: Random XMTP messages create fake contacts

**Solution**:
```typescript
// lib/services/contactsForMessaging.ts
export async function getContactsForMessaging() {
  // ONLY return HCS-bonded contacts
  const bondedFromHCS = signalsStore.getAll()
    .filter(e => e.type === 'CONTACT_ACCEPT')
  
  // Check XMTP reachability
  return bondedFromHCS.map(contact => ({
    ...contact,
    canMessage: await xmtpClient.canMessage(contact.evmAddress)
  }))
}
```

---

## 📍 Operational Reminders

### Code Style
- Use existing TrustMesh patterns (check `lib/stores/signalsStore.ts` for reference)
- Follow Next.js 15 conventions (`'use client'` for React hooks)
- Prefer functional components over class components
- Use TypeScript strict mode

### Git Workflow
```bash
# Before each ticket
git pull origin feature/xmtp-nervous-system

# After ticket complete
git add <files>
git commit -m "feat(xmtp): <description> (T<number>)"
git push origin feature/xmtp-nervous-system

# Update sprint doc status table
```

### Communication
- Commit messages follow Conventional Commits
- Link to ticket number in commit (T1-T10)
- Update `XMTP_SIDECAR_SPRINT_OVERVIEW.md` status table
- Post blockers/questions in GitHub issues

---

## 🎬 Ready to Execute

You now have:
1. ✅ Ground truth architecture (`XMTP_INTEGRATION_SPEC.md`)
2. ✅ Sprint plan with 10 tickets (`XMTP_SIDECAR_SPRINT_OVERVIEW.md`)
3. ✅ Operational fine-tuning (this document)

**Next Action**: Execute **T1** (Dependencies + Config)

```bash
# Install dependencies
pnpm add @xmtp/xmtp-js ethers

# Create config file
# File: lib/config/xmtp.ts
```

**Start coding. Ship fast. Stay aligned.** 🚀

---

**Status**: ✅ Ready for T1 Execution  
**Branch**: `feature/xmtp-nervous-system`  
**Last Updated**: 2025-11-09  
**Alignment**: Locked with ground truth docs
