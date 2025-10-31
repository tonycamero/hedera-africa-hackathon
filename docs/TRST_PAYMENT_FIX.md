# TRST Payment Flow Fix - Clean Pattern

**Status:** ✅ Implemented (ready to test)

**Problem:** "Signature array must match the number of transactions" error

**Root Cause:** Server was calling `addSignature()` on a transaction that already had internal signed transaction list (multi-node structure). You can't add one signature to the outer wrapper — you have to add it to each internal signed tx.

---

## The Clean Solution

**Principle:** Server never manipulates signatures. Client signs, server executes.

### Flow

```
1. Server prepares frozen transaction
   └─> User is fee payer (setTransactionId from user account)
   └─> Frozen with server client (gets network/node IDs)
   └─> Returns base64 frozen bytes

2. Client signs with Magic
   └─> Magic.hedera.sign({ transaction: frozenBase64 })
   └─> Returns fully signed transaction bytes
   
3. Server executes signed transaction
   └─> Transaction.fromBytes(signedBytes)
   └─> tx.execute(client)
   └─> No addSignature() call
```

---

## Files Changed

### ✅ `/app/api/hedera/submit-transaction/route.ts`

**Before:** 100+ lines, tried to parse public key, called `addSignature()`

**After:** ~50 lines
- Accepts `transactionBytesBase64` (fully signed)
- `Transaction.fromBytes()` → `execute()` → done
- No signature manipulation

### ✅ `/lib/hedera/transferTRST.ts`

**Before:** Sent `frozenTransactionBytes`, `signatureBytes`, `publicKeyDer` separately

**After:**
- Calls `magic.hedera.sign({ transaction: base64 })`
- Extracts `signedTransaction` from result
- Sends complete signed transaction to server

### ✅ `/app/api/hedera/prepare-trst-payment/route.ts`

**Already correct:**
- Sets `TransactionId.generate(fromAccount)` → user is fee payer
- Freezes with server client
- Returns frozen bytes

---

## Why This Works

### ❌ Old Pattern (Broken)
```
Server freezes with server operator
  └─> Server becomes required signer
  └─> Transaction needs 2 signatures (server + user)
  └─> Client signs → server tries addSignature()
  └─> Error: "signature array mismatch" (multi-node tx structure)
```

### ✅ New Pattern (Clean)
```
Server freezes with user as fee payer
  └─> Only user signature required
  └─> Client signs completely
  └─> Server just executes (no mutation)
  └─> Works with multi-node tx lists
```

---

## Testing Checklist

- [ ] Start dev server: `npm run dev`
- [ ] Login with Magic (Hedera testnet)
- [ ] Navigate to Recognition Mint page
- [ ] Complete recognition mint (should succeed)
- [ ] TRST payment should trigger after mint
- [ ] Check console logs:
  - `[TRST Prepare] Transaction prepared successfully`
  - `[TRST Payment] Signed with Magic, submitting to server...`
  - `[Hedera Submit] Executing signed transaction...`
  - `[Hedera Submit] Success: 0.0.xxxxx@xxxxxxxxx.xxxxxxxxx`

---

## Rollback Plan

If this breaks, revert to the old pattern by restoring the original files from git:

```bash
git checkout HEAD -- app/api/hedera/submit-transaction/route.ts
git checkout HEAD -- lib/hedera/transferTRST.ts
```

The prepare endpoint doesn't need rollback (user-as-payer was already correct).

---

## Next Steps

If this works:

1. ✅ Remove all the old debugging logs
2. ✅ Apply same pattern to other Hedera transaction types (NFT mint, etc.)
3. ✅ Update docs/SOP for "Magic + Hedera transaction signing"
4. ✅ Consider moving prepare logic to a shared service

---

## Key Insight

**The Hedera SDK internally creates a list of "signed transactions" (one per node) when you freeze a transaction.**

When you call `addSignature()`, it tries to add that signature to **each** internal signed tx in the list. If you already froze it and it has an internal structure, you can't just slap one signature on the outer wrapper.

**Solution:** Don't call `addSignature()` on the server. Let Magic return the fully signed transaction and just execute it.

---

## Credits

Pattern suggested by: [Your architecture notes from conversation summary]

**Golden Rule:** Server prepares, client signs, server executes. No signature manipulation on server.
