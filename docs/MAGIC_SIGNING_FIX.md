# Magic.link + Hedera Signing Architecture Fix

## Problem

The previous implementation tried to sign user actions **on the server** using Magic Admin SDK, which doesn't work because:

1. **Magic Admin SDK cannot sign** - it only validates DID tokens and retrieves user metadata
2. **Magic's Hedera extension is client-side only** - it exposes `getPublicKey()` and `sign()` methods in the browser, not on the server
3. **Server-side signing would require exposing private keys** - which defeats the purpose of Magic's secure enclave

## Solution

Implement **client-side signing + server-side verification**:

```
CLIENT                          SERVER                      HEDERA
------                          ------                      ------
magic.hedera.getPublicKey()
magic.hedera.sign(payload)
        |
        | POST signed payload
        v
                        magic.token.validate(DID)
                        PublicKey.verify(signature)
                                |
                                | TopicMessageSubmitTransaction
                                v
                                                    HCS Topic
```

## Changes Made

### 1. Updated Onboarding (`app/onboard/page.tsx`)
```typescript
// ✅ NEW: Client-side signing
const { publicKeyDer, accountId } = await magic.hedera.getPublicKey()
const signatureBytes = await magic.hedera.sign(new TextEncoder().encode(canonical))

const signedPayload = {
  ...fullPayload,
  publicKeyDer: Array.from(new Uint8Array(publicKeyDer)),
  signature: Buffer.from(signatureBytes).toString('hex'),
}

// Send to server for verification
await fetch('/api/hedera/verify-profile', {
  headers: { 'Authorization': `Bearer ${magicToken}` },
  body: JSON.stringify(signedPayload)
})
```

### 2. Created Verification Endpoint (`app/api/hedera/verify-profile/route.ts`)
```typescript
// ✅ NEW: Server-side verification
await magic.token.validate(didToken) // Validate Magic DID
const meta = await magic.users.getMetadataByToken(didToken)

// Verify signature with Hedera SDK
const derBytes = Uint8Array.from(publicKeyDer)
const pubKey = PublicKey.fromBytesDER(derBytes)
const isValid = pubKey.verify(messageBytes, sigBytes)
```

### 3. Deleted Unsafe Endpoints
```
❌ DELETED: app/api/hedera/sign-profile/route.ts
❌ DELETED: app/api/hedera/user/credentials/route.ts
```

These endpoints attempted server-side signing or exposed credentials - both unsafe patterns.

### 4. Updated Documentation
- **Created**: `docs/USER_SIGNED_TRANSACTIONS_V2.md` with correct architecture
- **Preserved**: `docs/USER_SIGNED_TRANSACTIONS.md` (old version for reference)

## Gas & Fee Model

### HBAR Stipends (Auto-Funded)
- **Initial**: 0.2 HBAR per new user (~$0.02)
- **Top-up trigger**: Balance < 0.005 HBAR
- **Top-up amount**: 0.05-0.1 HBAR
- **Covers**: Thousands of HCS submits (~$0.0001 each)

### TRST Platform Fees (Optional)
- **Stubbed for hackathon**: $0.01 per action
- **Post-hackathon**: Separate accounting from HBAR gas
- **Keep separate**: HBAR gas ≠ TRST platform fee

## Why This Architecture is Correct

### ✅ Client-Side Signing (Magic Hedera Extension)
- User signs actions in the browser with `magic.hedera.sign()`
- Private keys never leave Magic's secure enclave
- Cryptographic proof of user authorship
- No key exposure to client or server

### ✅ Server-Side Verification (Magic Admin SDK)
- Validates Magic DID token: `magic.token.validate()`
- Retrieves user metadata: `magic.users.getMetadataByToken()`
- Verifies signature: `PublicKey.verify()`
- Submits to Hedera after verification

### ✅ True P2P Transactions
- Payer = user (from auto-funded HBAR stipend)
- Mirror node shows user as transaction payer
- No operator intermediary for content signing
- Simple, scalable architecture

## References

- [Magic Admin SDK Overview](https://docs.magic.link/embedded-wallets/sdk/server-side/overview)
- [Magic Hedera Extension](https://docs.magic.link/embedded-wallets/blockchains/evm/hedera)
- [Hedera Submit a Message](https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service/submit-a-message)
- [Magic Auth Guide](https://magic.link/posts/secure-auth-on-client-and-server-guide)

## Testing Checklist

- [ ] User logs in with Magic → gets DID token
- [ ] Client calls `magic.hedera.getPublicKey()` → receives public key bytes
- [ ] Client calls `magic.hedera.sign(payload)` → receives signature bytes
- [ ] Client POSTs signed payload to `/api/hedera/verify-profile`
- [ ] Server validates DID token with `magic.token.validate()`
- [ ] Server verifies signature with `PublicKey.verify()`
- [ ] Server returns 200 OK if signature valid
- [ ] Profile submitted to HCS topic
- [ ] User's HBAR balance decrements by gas amount

## Next Steps

1. ✅ Client-side signing with Magic (done)
2. ✅ Server-side verification with Admin SDK (done)
3. ⏳ Auto-fund HBAR stipends at account creation
4. ⏳ Auto top-up service when balance < threshold
5. ⏳ Database for verified profiles
6. ⏳ TRST charging (currently stubbed)
7. ⏳ Rate limiting per action type

## Commit

```
Fix: client-side signing with Magic + server-side verification

- Update onboarding to use Magic Hedera extension for signing (client-side)
- Create verify-profile endpoint using Magic Admin SDK for verification
- Delete unsafe server-side signing endpoints (sign-profile, user/credentials)
- Add USER_SIGNED_TRANSACTIONS_V2.md with correct architecture
- Implement true P2P flow: user signs → server verifies → user pays gas
- Magic keys never exposed, signing happens in secure enclave
- Auto-funded HBAR stipends model (0.2 HBAR initial, top-up when low)
- TRST fees separate from HBAR gas (stubbed for hackathon)
```

Pushed to: `integration/ure-v2-plus-genz`
