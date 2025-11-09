# Quick Test Guide - TRST Payment Fix

## Pre-Test Checklist

✅ Files changed:
- `app/api/hedera/submit-transaction/route.ts` (simplified to 50 lines)
- `lib/hedera/transferTRST.ts` (now uses Magic's complete signed transaction)
- `app/api/hedera/prepare-trst-payment/route.ts` (already correct - user as fee payer)

✅ Expected behavior:
- Server prepares frozen transaction with user as fee payer
- Client signs completely with Magic
- Server executes signed transaction (no signature manipulation)

---

## Test Steps

### 1. Start Dev Server

```bash
npm run dev
```

### 2. Login with Magic

Navigate to: http://localhost:3000
- Click "Login with Magic"
- Enter your Hedera testnet email
- Complete Magic authentication

### 3. Navigate to Recognition Mint

URL: http://localhost:3000/recognition-mint (or wherever the mint page is)

### 4. Trigger Recognition Mint

- Fill in recognition mint form
- Click "Mint Recognition NFT"
- **Watch console logs**

### 5. Observe TRST Payment Flow

After successful NFT mint, TRST payment should trigger automatically.

**Expected Console Logs (in order):**

```
[TRST Payment] Transferring 0.01 TRST to treasury 0.0.5864559
[TRST Payment] Got public key from Magic: { type, isArray, length, first20Chars }
[TRST Payment] Transfer details: { from, to, token, amount }
[TRST Payment] Requesting server to prepare frozen transaction...
[TRST Prepare] Preparing payment: 10000 tiny units from 0.0.7168693 to 0.0.5864559
[TRST Prepare] Transaction frozen, serializing for client signature...
[TRST Prepare] Transaction prepared successfully
[TRST Payment] Received frozen transaction from server, signing with Magic...
[TRST Payment] Signed with Magic, submitting to server...
[Hedera Submit] Submitting TRST_PAYMENT
[Hedera Submit] Executing signed transaction...
[Hedera Submit] Success: 0.0.xxxxx@xxxxxxxxx.xxxxxxxxx
[Hedera Submit] Status: SUCCESS
[TRST Payment] Success: 0.0.xxxxx@xxxxxxxxx.xxxxxxxxx
```

### 6. Verify on HashScan

Copy the transaction ID from console: `0.0.xxxxx@xxxxxxxxx.xxxxxxxxx`

Go to: https://hashscan.io/testnet/transaction/0.0.xxxxx@xxxxxxxxx.xxxxxxxxx

**Verify:**
- ✅ Transaction status: SUCCESS
- ✅ Token Transfer: 10,000 tiny TRST (0.01 TRST)
- ✅ From: User account (0.0.7168693)
- ✅ To: Treasury account (0.0.5864559)

---

## What to Look For

### ✅ Success Indicators

- No "signature array mismatch" error
- No "invalid public key length" error
- Clean console logs with all 3 steps (prepare → sign → submit)
- Transaction appears on HashScan within ~5 seconds
- Recognition mint page shows "Payment successful"

### ❌ Failure Indicators

If you see these errors, **stop and report back:**

1. **"Magic did not return signed transaction bytes"**
   - Magic's API changed or `signedResult` structure is different
   - Check what Magic actually returns: `console.log(signedResult)`

2. **"Signature array must match the number of transactions"**
   - This shouldn't happen anymore (we removed addSignature)
   - If it does, something went wrong with the refactor

3. **"Transaction submission failed"**
   - Check server logs for Hedera SDK errors
   - Verify user has enough HBAR for transaction fees
   - Verify token association still valid

4. **"Missing transactionBytesBase64"**
   - Client didn't send the signed transaction properly
   - Check network tab: POST to `/api/hedera/submit-transaction`
   - Verify request body has `transactionBytesBase64` field

---

## Debug Commands

### Check User Token Balance

```bash
curl "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.7168693/tokens?token.id=0.0.5361653"
```

### Check Treasury Token Balance

```bash
curl "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.5864559/tokens?token.id=0.0.5361653"
```

### Check Recent Transactions

```bash
curl "https://testnet.mirrornode.hedera.com/api/v1/transactions?account.id=0.0.7168693&limit=5&order=desc"
```

---

## Rollback Instructions

If test fails catastrophically:

```bash
# Revert changes
git checkout HEAD -- app/api/hedera/submit-transaction/route.ts
git checkout HEAD -- lib/hedera/transferTRST.ts

# Restart dev server
npm run dev
```

---

## Next Actions After Successful Test

1. ✅ Test multiple payments in a row (ensure no state issues)
2. ✅ Test with different TRST amounts
3. ✅ Test error handling (insufficient balance, network issues)
4. ✅ Apply same pattern to other Hedera transactions (NFT mint, etc.)
5. ✅ Clean up debug logs
6. ✅ Commit changes with detailed commit message

---

## Notes

- User pays transaction fees (HBAR) from their own account
- TRST amount: 10,000 tiny units = 0.01 TRST (6 decimals)
- Transaction typically confirms in 3-5 seconds on testnet
- Magic's `sign()` method should return complete signed transaction
- Server never calls `addSignature()` anymore

---

**Last Updated:** $(date)
**Author:** Warp AI Agent
**Related:** `docs/TRST_PAYMENT_FIX.md`
