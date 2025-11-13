# Loop Two+ Extended Payments
## TRST/TRST-USD Beyond Circle/Contacts (Future Implementation)

> **Goal**: Enable TRST/TRST-USD payments to recipients outside the user's social graph while maintaining anti-surveillance architecture and bounded trust network properties.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Recipient Types](#recipient-types)
3. [User Stories](#user-stories)
4. [Implementation Flows](#implementation-flows)
5. [Privacy & Anti-Surveillance](#privacy--anti-surveillance)
6. [Integration Points](#integration-points)
7. [Technical Specifications](#technical-specifications)
8. [Open Questions](#open-questions)
9. [Non-Goals](#non-goals)

---

## Purpose

**Problem**: Currently, TRST/TRST-USD payments are limited to Circle/Contacts, which creates friction for legitimate use cases like paying vendors, accepting payment links, or one-off transactions.

**Solution**: Extend payment capabilities beyond the social graph without breaking:
- Bounded trust network (Circle of 9 + Contacts)
- Anti-surveillance guarantees (no global "who paid whom" graph)
- Privacy-first architecture (local-only metadata)
- Treasury/compliance constraints (KYB, audit trails)

**Philosophy**:
> "If someone wants to send TRST/USD to someone outside their graph, they can create an account from the payment link or add their existing Hedera wallet or EVM account."

---

## Recipient Types

### Type A: Existing Contact
**Description**: Someone already in your Circle or Contacts list.

**What's Required**:
- Contact relationship exists (HCS CONTACT_ACCEPT)
- Identity resolved via HCS-22 (Hedera ↔ EVM)
- Optional XMTP conversation established

**Privacy Properties**:
- ✅ Already part of bounded social graph
- ✅ No new surveillance surface
- ✅ Existing auth-scoped queries work

**Current Status**: ✅ **Already Implemented** (Loop Two)

---

### Type B: External Wallet
**Description**: Someone with a wallet (Hedera/EVM/BIP47) but NOT in your social graph.

**What's Required**:
- Valid Hedera account ID (`0.0.xxxxx`)
- Valid EVM address (`0x...`)
- BIP47 payment code (future MatterFi integration)

**Privacy Properties**:
- ✅ Payment is transactional, not social
- ✅ Recipient NOT added to Circle/Contacts automatically
- ✅ No global "frequent payees" directory
- ✅ Optional local-only "recent recipients" list (localStorage)

**Current Status**: ❌ **Not Implemented** (Future: Loop Three)

**UX Flow**:
```
User: "Send TRST" → "New Recipient"
  ↓
Options:
  • Paste Hedera account ID (0.0.xxxxx)
  • Paste/scan EVM address (0x...)
  • Paste BIP47 payment code (future)
  ↓
Validation:
  • Check format (Hedera ID, EVM checksum, etc.)
  • Optional: Query balance to confirm account exists
  ↓
Send Flow:
  • Amount + memo (optional)
  • Confirm + sign transaction
  • Show "External recipient" indicator (no handle/avatar)
  ↓
Local Storage (Optional):
  • Save to "Recent Recipients" (localStorage only)
  • NOT synced to server or social graph
```

**Storage**:
```typescript
// localStorage only (never server-side)
const RECENT_RECIPIENTS_KEY = 'trustmesh_recent_recipients_v1'

interface RecentRecipient {
  address: string           // Hedera or EVM
  addressType: 'hedera' | 'evm' | 'bip47'
  label?: string            // User-provided nickname
  lastUsed: number          // Timestamp
  transactionCount: number  // How many times sent
}
```

---

### Type C: New Human (Payment Link)
**Description**: Someone with NO wallet yet; you want to send them TRST/TRST-USD via a claimable link.

**What's Required**:
- Amount + token (TRST or TRST-USD)
- Optional memo
- Optional expiry (default: 7 days)

**Privacy Properties**:
- ✅ No global "payment link directory"
- ✅ Link is one-shot, narrow-scoped
- ✅ Issuer only learns "claimed / expired", not browser metadata
- ✅ No backdoor into global relationship graph
- ✅ Remains transactional until both sides choose to bond

**Current Status**: ❌ **Not Implemented** (Future: Loop Three)

**UX Flow (Sender)**:
```
User: "Send TRST" → "Create Payment Link"
  ↓
Form:
  • Amount (TRST or TRST-USD)
  • Optional memo
  • Optional expiry (24h / 7d / 30d / custom)
  ↓
Backend:
  • Create PendingPayment record (escrowed)
  • Generate short URL: pay.trustmesh.xyz/claim/abc123
  ↓
Share Link:
  • Copy to clipboard
  • QR code
  • Share via messaging (XMTP if contact, external otherwise)
  ↓
Track Status:
  • Show "Unclaimed / Claimed / Expired"
  • Option to cancel (before claimed)
```

**UX Flow (Recipient)**:
```
Opens Link: pay.trustmesh.xyz/claim/abc123
  ↓
Shows:
  • "You've been sent 15 TRST-USD by Tony"
  • Amount, token, memo
  ↓
Claim Options:
  A. "Claim with email" → Magic.link auth
     ↓ Auto-provision EVM keypair + HCS-22 identity
     ↓ Funds released to new account
  
  B. "Use my existing wallet"
     ↓ Paste Hedera account ID or EVM address
     ↓ Verify ownership (sign message)
     ↓ Funds released to provided account
  ↓
Post-Claim (Optional):
  • Suggest: "Add Tony to contacts / start DM"
  • Do NOT force social connection
```

**Storage**:
```typescript
// Backend: PendingPayment table
interface PendingPayment {
  id: string                    // Short random ID (for URL)
  senderAccountId: string       // Hedera account ID (sender)
  amount: number
  tokenId: string               // TRST or TRST-USD token ID
  memo?: string
  status: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED'
  claimedBy?: string            // Recipient account ID (once claimed)
  claimedAt?: Date
  createdAt: Date
  expiresAt: Date
}
```

---

## User Stories

### Story 1: Pay a Vendor with Hedera Account
> "I need to pay my web developer who only has a Hedera account. I don't want to add them to my Circle, just send payment."

**Flow**: Type B (External Wallet)
- User taps "Send TRST" → "New Recipient"
- Pastes vendor's Hedera account ID (`0.0.54321`)
- Enters amount (50 TRST-USD) + memo ("Website redesign")
- Confirms → payment sent
- Vendor appears in "Recent Recipients" (local only)

**Privacy**: Vendor NOT added to social graph, no Circle relationship created.

---

### Story 2: Gift TRST to a Friend (No Wallet)
> "I want to send 10 TRST to my friend as a gift. They don't have a wallet yet."

**Flow**: Type C (Payment Link)
- User taps "Send TRST" → "Create Payment Link"
- Enters amount (10 TRST) + memo ("Happy Birthday!")
- Generates link + QR code
- Shares via text message
- Friend opens link, claims with email (Magic.link)
- Friend's new account receives 10 TRST
- Optional: Friend can then message user to thank them (XMTP)

**Privacy**: No relationship forced. Friend can choose to add user as contact later.

---

### Story 3: One-Time Payment Without Social Overhead
> "I bought something on a local marketplace. I just want to pay the seller, not connect socially."

**Flow**: Type B (External Wallet)
- Seller provides EVM address (`0xABC...`)
- User sends TRST-USD to address
- Transaction complete
- No Circle/Contact relationship created
- Optional: User adds seller to local "frequent payees" for future reference

**Privacy**: Transaction stays transactional. No forced social connection.

---

## Implementation Flows

### Flow 1: Send to External Wallet

**Screens**:
1. **New Recipient Entry**
   - Text input: "Paste Hedera account ID or EVM address"
   - Optional: "Scan QR code"
   - Validation indicator (green checkmark / red error)

2. **Validation**
   - Hedera format: `0.0.xxxxx` (regex validation)
   - EVM format: `0x[a-fA-F0-9]{40}` + checksum validation
   - Optional: Query Hedera Mirror Node to confirm account exists

3. **Payment Details**
   - Amount input
   - Token selector (TRST / TRST-USD)
   - Memo field (optional, max 100 chars)
   - Fee estimate

4. **Confirmation**
   - Show recipient address (truncated: `0.0...54321`)
   - Show "⚠️ External recipient (not in your Circle)"
   - Confirm button

5. **Transaction**
   - Sign transaction (Magic.link)
   - Submit to Hedera
   - Show success with transaction ID

**Storage (Local Only)**:
```typescript
// Save to localStorage for "Recent Recipients" convenience
interface RecentRecipient {
  address: string
  addressType: 'hedera' | 'evm'
  label?: string              // User can add nickname
  lastUsed: number
  transactionCount: number
}

// Never synced to server
localStorage.setItem('trustmesh_recent_recipients_v1', JSON.stringify([...]))
```

---

### Flow 2: Create Payment Link

**Backend API**:
```typescript
// POST /api/payments/create-link
interface CreateLinkRequest {
  amount: number
  tokenId: string           // TRST or TRST-USD
  memo?: string
  expiryHours?: number      // Default: 168 (7 days)
}

interface CreateLinkResponse {
  linkId: string            // Short random ID
  url: string               // pay.trustmesh.xyz/claim/{linkId}
  qrCodeDataUrl: string     // Base64 QR code image
  expiresAt: Date
}

// Implementation
async function createPaymentLink(req: CreateLinkRequest): Promise<CreateLinkResponse> {
  // 1. Validate sender has sufficient balance
  const balance = await getBalance(req.senderAccountId, req.tokenId)
  if (balance < req.amount) {
    throw new Error('Insufficient balance')
  }

  // 2. Create PendingPayment record
  const linkId = generateShortId() // e.g., 'abc123def'
  const expiresAt = new Date(Date.now() + (req.expiryHours || 168) * 3600000)
  
  await db.pendingPayments.create({
    id: linkId,
    senderAccountId: req.senderAccountId,
    amount: req.amount,
    tokenId: req.tokenId,
    memo: req.memo,
    status: 'PENDING',
    createdAt: new Date(),
    expiresAt
  })

  // 3. Escrow funds (transfer to escrow account)
  await escrowFunds(req.senderAccountId, req.amount, req.tokenId, linkId)

  // 4. Generate QR code
  const url = `${PAYMENT_LINK_BASE_URL}/claim/${linkId}`
  const qrCodeDataUrl = await generateQRCode(url)

  return { linkId, url, qrCodeDataUrl, expiresAt }
}
```

**Frontend Component**:
```typescript
// components/payments/CreatePaymentLink.tsx
export function CreatePaymentLink() {
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState<'TRST' | 'TRST-USD'>('TRST-USD')
  const [memo, setMemo] = useState('')
  const [expiry, setExpiry] = useState(168) // 7 days
  const [link, setLink] = useState<CreateLinkResponse | null>(null)

  const handleCreate = async () => {
    const response = await createPaymentLink({
      amount: parseFloat(amount),
      tokenId: token === 'TRST' ? TRST_TOKEN_ID : TRST_USD_TOKEN_ID,
      memo,
      expiryHours: expiry
    })
    setLink(response)
  }

  if (link) {
    return (
      <PaymentLinkSuccess
        url={link.url}
        qrCode={link.qrCodeDataUrl}
        amount={amount}
        token={token}
        expiresAt={link.expiresAt}
      />
    )
  }

  return (
    <form>
      {/* Amount + token + memo + expiry inputs */}
      <button onClick={handleCreate}>Create Payment Link</button>
    </form>
  )
}
```

---

### Flow 3: Claim Payment Link

**Backend API**:
```typescript
// GET /api/payments/link/:linkId
// Returns payment details (amount, memo, sender handle, status)

// POST /api/payments/claim-link
interface ClaimLinkRequest {
  linkId: string
  claimMethod: 'magic' | 'existing_wallet'
  
  // If magic: email for Magic.link auth
  email?: string
  
  // If existing_wallet: account ID + signature proof
  accountId?: string
  signatureProof?: string
}

interface ClaimLinkResponse {
  success: boolean
  transactionId?: string        // Hedera transaction ID
  recipientAccountId?: string   // Where funds were sent
  error?: string
}

// Implementation
async function claimPaymentLink(req: ClaimLinkRequest): Promise<ClaimLinkResponse> {
  // 1. Fetch PendingPayment
  const payment = await db.pendingPayments.findOne({ id: req.linkId })
  
  if (!payment) {
    throw new Error('Payment link not found')
  }
  
  if (payment.status !== 'PENDING') {
    throw new Error(`Payment link ${payment.status.toLowerCase()}`)
  }
  
  if (new Date() > payment.expiresAt) {
    await db.pendingPayments.update({ id: req.linkId }, { status: 'EXPIRED' })
    throw new Error('Payment link expired')
  }

  // 2. Resolve recipient account
  let recipientAccountId: string

  if (req.claimMethod === 'magic') {
    // Magic.link flow: auto-provision identity
    const magicAuth = await Magic.auth.loginWithMagicLink({ email: req.email })
    const { hederaAccountId } = await resolveOrProvision(magicAuth.issuer)
    recipientAccountId = hederaAccountId
  } else {
    // Existing wallet flow: verify ownership
    const verified = await verifySignature(req.accountId!, req.signatureProof!)
    if (!verified) {
      throw new Error('Invalid signature proof')
    }
    recipientAccountId = req.accountId!
  }

  // 3. Release funds from escrow
  const txId = await releaseFunds(
    payment.amount,
    payment.tokenId,
    recipientAccountId,
    req.linkId
  )

  // 4. Update payment record
  await db.pendingPayments.update(
    { id: req.linkId },
    {
      status: 'CLAIMED',
      claimedBy: recipientAccountId,
      claimedAt: new Date()
    }
  )

  return {
    success: true,
    transactionId: txId,
    recipientAccountId
  }
}
```

**Frontend Component**:
```typescript
// app/claim/[linkId]/page.tsx
export default function ClaimPaymentPage({ params }: { params: { linkId: string } }) {
  const [payment, setPayment] = useState<PendingPayment | null>(null)
  const [claimMethod, setClaimMethod] = useState<'magic' | 'existing_wallet'>('magic')
  const [email, setEmail] = useState('')
  const [accountId, setAccountId] = useState('')

  useEffect(() => {
    // Fetch payment details
    fetch(`/api/payments/link/${params.linkId}`)
      .then(res => res.json())
      .then(setPayment)
  }, [params.linkId])

  const handleClaim = async () => {
    if (claimMethod === 'magic') {
      await claimPaymentLink({
        linkId: params.linkId,
        claimMethod: 'magic',
        email
      })
    } else {
      // Sign message to prove ownership
      const signatureProof = await signOwnershipProof(accountId)
      await claimPaymentLink({
        linkId: params.linkId,
        claimMethod: 'existing_wallet',
        accountId,
        signatureProof
      })
    }
  }

  if (!payment) return <LoadingSpinner />

  return (
    <div>
      <h1>Payment from {payment.senderHandle}</h1>
      <p>Amount: {payment.amount} {payment.tokenSymbol}</p>
      {payment.memo && <p>Memo: {payment.memo}</p>}

      <div>
        <h2>Choose how to claim:</h2>
        
        <button onClick={() => setClaimMethod('magic')}>
          Claim with Email (Magic.link)
        </button>
        
        <button onClick={() => setClaimMethod('existing_wallet')}>
          Use My Existing Wallet
        </button>
      </div>

      {claimMethod === 'magic' && (
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      )}

      {claimMethod === 'existing_wallet' && (
        <input
          type="text"
          placeholder="Hedera account ID or EVM address"
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
        />
      )}

      <button onClick={handleClaim}>Claim Payment</button>
    </div>
  )
}
```

---

## Privacy & Anti-Surveillance

### Core Constraints Maintained

**1. No Global Payment Graph**
- ❌ No API endpoint: `GET /api/payments/global` (who paid whom)
- ❌ No "top counterparties" analytics
- ❌ No viral payment graphs or visualizations

**Per-User Views Only**:
```typescript
// ✅ Allowed: User's own payment history
GET /api/payments/my-transactions
Response: [
  { to: "0.0.54321", amount: 50, token: "TRST-USD", timestamp: ... },
  { from: "0.0.12345", amount: 10, token: "TRST", timestamp: ... }
]

// ✅ Allowed: User's pending payment links
GET /api/payments/my-links
Response: [
  { linkId: "abc123", amount: 15, status: "PENDING", expiresAt: ... }
]

// ❌ Forbidden: All payments in the network
GET /api/payments/all-transactions
```

**2. Local-Only "Frequent Payees"**
```typescript
// localStorage only - NEVER synced to server
const RECENT_RECIPIENTS_KEY = 'trustmesh_recent_recipients_v1'

// User can see their own recent sends
// No cross-user analytics
// No "who else sends to this address" data
```

**3. Payment Link Privacy**
```typescript
// Minimal metadata stored
interface PendingPayment {
  id: string                    // Random ID, not sequential
  senderAccountId: string       // Only sender, not full profile
  amount: number
  tokenId: string
  memo?: string                 // Optional, user-provided
  status: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED'
  claimedBy?: string            // Only after claim
  createdAt: Date
  expiresAt: Date
  
  // ❌ NOT stored:
  // - Recipient IP address
  // - Browser user agent
  // - Geographic location
  // - Referrer URL
  // - Social graph hints
}

// Short TTL (7 days default)
// Auto-expire + cleanup
// No permanent "who sent payment links to whom" history
```

**4. Optional Contact Suggestion (Not Forced)**
```typescript
// After claiming payment link:
// ✅ Suggest: "Would you like to add [Sender] as a contact?"
// ❌ Do NOT auto-add to Circle
// ❌ Do NOT auto-create XMTP conversation
// ❌ Do NOT force social connection

// User must explicitly choose to add contact
// Respects bounded graph architecture
```

---

### Surveillance Comparison

| Capability | Traditional Venmo/PayPal | TrustMesh Extended Payments |
|------------|--------------------------|----------------------------|
| **Global user search** | ✅ Anyone can find anyone | ❌ No global directory |
| **"Who pays whom" graph** | ✅ Public transaction feed | ❌ Per-user views only |
| **Social recommendations** | ✅ "People you may know" from payments | ❌ No cross-user analytics |
| **Payment history mining** | ✅ Platform sees all transactions | ❌ E2E encrypted, minimal metadata |
| **Permanent payment links** | ✅ Links never expire | ❌ Short TTL (7 days default) |
| **Recipient metadata leak** | ✅ IP, browser, location logged | ❌ Minimal logging, auto-purge |

---

## Integration Points

### Uses Existing Infrastructure

**1. Magic.link Auth**
- Payment link claims via email (Magic.link)
- Auto-provision EVM keypair
- HCS-22 identity binding (Hedera ↔ EVM)

**2. HCS-22 Identity Resolution**
- Resolve Hedera → EVM
- Resolve EVM → Hedera
- Cache for 5 minutes (existing pattern)

**3. TRST/TRST-USD Treasury**
- Uses existing mint/burn rails
- CraftTrust + Brale integration
- Brinks custody proof (for TRST-USD backing)

**4. Hedera Consensus Service (HCS)**
- Transaction anchoring
- Audit trail (compliance)
- Settlement status

**5. Optional XMTP Integration**
- If both sender + recipient have XMTP
- Suggest starting DM after payment
- Not required for payment flow

---

### New Infrastructure Required

**1. Payment Link Service**
```
/api/payments/create-link       (POST)
/api/payments/link/:linkId      (GET)
/api/payments/claim-link        (POST)
/api/payments/cancel-link       (POST)
/api/payments/my-links          (GET)
```

**2. Escrow Account**
- Hedera account to hold pending payment funds
- Multi-sig for security
- Auto-release on claim
- Auto-refund on expiry

**3. Address Validation Service**
```typescript
// Validate Hedera account ID format
// Validate EVM address checksum
// Optional: Query Mirror Node to confirm account exists
// Optional: BIP47 payment code validation (future)
```

**4. Signature Verification**
```typescript
// For "existing wallet" claim flow
// User signs message to prove ownership
// Backend verifies signature before releasing funds
```

---

## Technical Specifications

### Database Schema

```sql
-- Pending payment links
CREATE TABLE pending_payments (
  id VARCHAR(20) PRIMARY KEY,          -- Short random ID (e.g., 'abc123def')
  sender_account_id VARCHAR(50) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  token_id VARCHAR(50) NOT NULL,       -- TRST or TRST-USD token ID
  memo TEXT,
  status VARCHAR(20) NOT NULL,         -- PENDING, CLAIMED, EXPIRED, CANCELLED
  claimed_by VARCHAR(50),              -- Recipient account ID (once claimed)
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  
  INDEX idx_sender (sender_account_id),
  INDEX idx_status (status),
  INDEX idx_expires (expires_at)
);

-- Cleanup job: Delete expired payments after 30 days
CREATE EVENT cleanup_expired_payments
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM pending_payments
  WHERE status = 'EXPIRED'
    AND expires_at < NOW() - INTERVAL 30 DAY;
```

### Environment Variables

```env
# Payment link configuration
PAYMENT_LINK_BASE_URL=https://pay.trustmesh.xyz
PAYMENT_LINK_DEFAULT_EXPIRY_HOURS=168  # 7 days

# Escrow account (Hedera multi-sig)
ESCROW_ACCOUNT_ID=0.0.999999
ESCROW_PRIVATE_KEY=...

# Token IDs
TRST_TOKEN_ID=0.0.111111
TRST_USD_TOKEN_ID=0.0.222222

# Feature flags
ENABLE_EXTERNAL_WALLETS=true
ENABLE_PAYMENT_LINKS=true
ENABLE_BIP47_PAYMENTS=false  # Future
```

---

## Open Questions

### 1. Auto-Suggest "Add to Contacts"?
**Question**: After multiple payments to the same external address, should we suggest adding them as a contact?

**Options**:
- A. Never suggest (keep transactional forever)
- B. Suggest after 3+ payments
- C. Suggest based on payment volume threshold
- D. Let user manually add anytime

**Recommendation**: **Option D** - Provide manual "Add to Contacts" button, never auto-suggest. Respects bounded graph, no forced connections.

---

### 2. Payment Activity → Oracle Input?
**Question**: Should payment patterns be fed into oracle services (matchmaking, reputation)?

**Options**:
- A. Never include payment data (keep completely separate)
- B. Include only aggregate stats ("user has made 10 external payments")
- C. Include with explicit opt-in (user chooses to share payment patterns)

**Recommendation**: **Option C** - Privacy-preserving aggregates with opt-in. Example: "User has high transaction volume" → suggests trustworthiness, but doesn't reveal WHO they paid.

---

### 3. Payment Link Expiry Defaults?
**Question**: What should the default expiry be for payment links?

**Options**:
- 24 hours (secure, but inconvenient)
- 7 days (balanced, recommended)
- 30 days (convenient, but security risk)
- Custom per link (user chooses)

**Recommendation**: **7 days default, custom option**. Balances convenience + security.

---

### 4. Refund on Expiry?
**Question**: When a payment link expires, what happens to escrowed funds?

**Options**:
- A. Auto-refund to sender immediately
- B. Auto-refund after grace period (e.g., 24 hours)
- C. Require sender to manually claim refund

**Recommendation**: **Option A** - Auto-refund immediately on expiry. Simplest UX, no stuck funds.

---

### 5. Payment Link Analytics?
**Question**: What analytics should we track for payment links?

**Allowed (Per-User)**:
- ✅ My created links (count, total value, claim rate)
- ✅ My claimed links (count, total received)

**Forbidden (Global)**:
- ❌ Total payment links created (reveals network activity)
- ❌ Average claim time (timing attack vector)
- ❌ Most active senders/recipients (surveillance)

**Recommendation**: Per-user analytics only, no global stats.

---

## Non-Goals

### Explicitly NOT Building

**1. Global Discoverable Profiles**
- ❌ No "Find users by payment history"
- ❌ No "Top senders/receivers" leaderboard
- ❌ No payment-based social recommendations

**2. Payment-Based Inbox**
- ❌ No "Here's everyone who has ever paid you"
- ❌ No unsolicited payment requests from strangers
- ❌ No spam payments with messages

**3. Social Ranking from Payments**
- ❌ No "most active payers" badge
- ❌ No "payment influencer" gamification
- ❌ No cross-user payment volume comparisons

**4. Permanent Payment History Exposure**
- ❌ No indefinite storage of payment links
- ❌ No public transaction feeds (Venmo-style)
- ❌ No "what's trending" payment activity

**5. Payment-Driven Social Graph Expansion**
- ❌ No auto-add to Circle after payment
- ❌ No "people who paid similar amounts" suggestions
- ❌ No viral payment chains

---

## Implementation Checklist

### Phase 1: External Wallet Payments (2 weeks)
- [ ] Address validation service (Hedera + EVM)
- [ ] "Send to New Recipient" UI flow
- [ ] Transaction signing + submission
- [ ] Recent recipients (localStorage)
- [ ] Tests: Format validation, successful send, error handling

### Phase 2: Payment Links (3 weeks)
- [ ] `pending_payments` database table
- [ ] Escrow account setup (Hedera multi-sig)
- [ ] Backend APIs: create-link, claim-link, cancel-link
- [ ] Frontend: CreatePaymentLink component
- [ ] Frontend: ClaimPaymentPage component
- [ ] QR code generation
- [ ] Magic.link claim flow
- [ ] Existing wallet claim flow (signature verification)
- [ ] Auto-expiry + refund job
- [ ] Tests: E2E claim flows, expiry, cancellation

### Phase 3: Polish & Privacy Audits (1 week)
- [ ] Privacy audit: Verify no global payment graph exposed
- [ ] Security audit: Escrow account, signature verification
- [ ] UX testing: Payment link claim flows
- [ ] Performance testing: Escrow release latency
- [ ] Documentation: User guides, developer docs

### Phase 4: BIP47 Payment Codes (Future)
- [ ] MatterFi SDK integration
- [ ] BIP47 address validation
- [ ] Stealth address generation
- [ ] Tests: BIP47 send + receive flows

---

## Success Metrics

### Technical
- ✅ Payment link claim rate: >80%
- ✅ External wallet send success rate: >95%
- ✅ Average claim latency: <5 seconds
- ✅ Escrow refund rate (expired links): <10%

### Privacy
- ✅ Zero global payment graph leaks (penetration testing)
- ✅ Per-user query enforcement (100% compliance)
- ✅ Minimal metadata stored (audit verification)
- ✅ Auto-purge expired links (30-day cleanup)

### User Adoption
- ✅ % of users who send to external wallets: Track growth
- ✅ % of users who create payment links: Track usage
- ✅ Average payment link value: Monitor for abuse
- ✅ Repeat external wallet sends: Measure convenience value

---

## Conclusion

This design extends TRST/TRST-USD payments beyond the Circle/Contacts boundary while preserving:

1. **Bounded Social Graph** - Circle + Contacts remain first-class relationships
2. **Anti-Surveillance** - No global "who paid whom" graph
3. **Privacy-First** - Local-only frequent payees, minimal payment link metadata
4. **User Control** - Optional contact addition, never forced
5. **Compliance** - Audit trails, KYB gates, settlement status

**This maintains the core TrustMesh philosophy**:
> "Transactional payments stay transactional. Social connections stay bounded. Users control when transactions become relationships."

**Ready for implementation when the team is ready to extend Loop Two!** 🚀
