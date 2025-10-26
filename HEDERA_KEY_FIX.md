# Hedera Key Configuration Fix

## Problem
The `.env.local` had **mismatched credentials**:
- Operator ID: `0.0.5864857` (ECDSA account)
- Operator Key: `0x2394be44...` (hex, but actually the **ED25519** account's private key)

Mirror Node data showed transactions were actually signed by `0.0.5864559` (ED25519 account).

## Root Cause
Keys were swapped between the two accounts:
- **ED25519 account `0.0.5864559`**: DER key = `302e0201...ab55c8a`
- **ECDSA account `0.0.5864857`**: Hex key = `0xf74a89b2...dc3caf25a`

## Solution
Updated `.env.local` to use the **correct ED25519 account and DER-encoded key**:

```env
HEDERA_OPERATOR_ID=0.0.5864559
HEDERA_OPERATOR_KEY=302e020100300506032b6570042204202394be44d8d169c79781083dce7038b7ca6a6318dd30fc5c082cf2417ab55c8a
```

## Validation
- `serverClient.ts` already handles DER format (line 36-38)
- `assertOperatorMatchesKey` validates key-account match on boot
- Mirror Node confirms `0.0.5864559` is the actual payer account

## Next Steps
1. Restart dev server: `pnpm dev`
2. Test profile update: should no longer throw `INVALID_SIGNATURE`
3. Verify HCS ingestion works correctly
