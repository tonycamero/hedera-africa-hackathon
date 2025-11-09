# Optional NFT Minting - Test Guide

## Overview

Recognition signals can now optionally be minted as **HTS NFTs** (transferable assets) in addition to HCS messages. This is **opt-in** via checkbox in the UI or `mintAsNFT` flag in the API.

---

## Current State (Phase 1)

**Stub implementation:**
- ✅ Type system extended with `nftTokenId` and `nftSerialNumber`
- ✅ NFT service stub created at `lib/server/hts/nft.ts`
- ✅ API accepts `mintAsNFT` flag
- ✅ UI shows NFT checkbox in create modal
- ✅ Signal cards show NFT badge when present
- ❌ No real HTS token minting yet (returns mock data)

**When `RECOGNITION_NFT_TOKEN_ID` is not set:**
- Returns mock NFT result (safe stub)
- Logs: `[NFT] RECOGNITION_NFT_TOKEN_ID not set — returning mock NFT result.`

---

## Test Scenarios

### Scenario 1: HCS-Only (Default)

**Setup:**
1. Don't check "Mint as NFT" box in modal
2. OR set `mintAsNFT: false` in API request

**Expected:**
```json
{
  "ok": true,
  "signal": {
    "id": "uuid-...",
    "label": "No Cap",
    "emoji": "🔥",
    "lens": "genz",
    "txId": "0.0.5438869@...",
    // NO nftTokenId or nftSerialNumber
  }
}
```

**Card Display:**
```
🔥 No Cap
"Straight facts, zero lies"
from alice • 🔥 via GenZ lens • Jan 29
```

---

### Scenario 2: HCS + NFT (Opt-in, Stubbed)

**Setup:**
1. Check "Mint as NFT" box in modal
2. OR set `mintAsNFT: true` in API request
3. `RECOGNITION_NFT_TOKEN_ID` NOT set in env

**Expected:**
```json
{
  "ok": true,
  "signal": {
    "id": "uuid-...",
    "label": "Ubuntu",
    "emoji": "🌍",
    "lens": "african",
    "txId": "0.0.5438869@...",
    "nftTokenId": "0.0.mockToken",     // Mock value
    "nftSerialNumber": 12345            // Mock serial
  }
}
```

**Console Logs:**
```
[NFT] RECOGNITION_NFT_TOKEN_ID not set — returning mock NFT result.
[NFT] (stub) would mint 1 NFT with metadata bytes: 187
[recognition/create] Minted NFT: 0.0.mockToken #12345
```

**Card Display:**
```
🌍 Ubuntu
"I am because we are"
from eve • 🌍 via African lens • Jan 29 • NFT #12345
```

---

### Scenario 3: Real HTS Minting (Phase 2)

**Setup:**
1. Set `RECOGNITION_NFT_TOKEN_ID=0.0.YOUR_TOKEN_ID` in `.env.local`
2. Configure Hedera client in NFT service
3. Check "Mint as NFT" box

**Implementation needed:**
```typescript
// lib/server/hts/nft.ts (uncomment real SDK code)
const client = hederaClient()
const metadata = encodeNftMetadata(input)
const mintTx = await new TokenMintTransaction()
  .setTokenId(TokenId.fromString(tokenId))
  .addMetadata(metadata)
  .execute(client)
const receipt = await mintTx.getReceipt(client)
const serial = Number(receipt.serials?.[0].toString() ?? '0')
return { 
  tokenId, 
  serial, 
  txId: mintTx.transactionId.toString() 
}
```

**Expected:**
- Real Hedera NFT minted
- Serial number from actual token mint receipt
- txId is real Hedera transaction ID
- NFT shows in HashScan, wallets, etc.

---

## API Tests

### HCS-Only Recognition

```bash
curl -X POST http://localhost:3000/api/recognition/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Truth",
    "emoji": "💎",
    "description": "Honest and transparent",
    "lens": "base",
    "to": {"accountId": "0.0.123456"},
    "note": "Great work!"
  }' | jq
```

**Check response:**
- ✅ No `nftTokenId` or `nftSerialNumber`
- ✅ Has `txId` (HCS message)

---

### HCS + NFT Recognition (Stubbed)

```bash
curl -X POST http://localhost:3000/api/recognition/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "No Cap",
    "emoji": "🔥",
    "description": "Straight facts, zero lies",
    "lens": "genz",
    "to": {"accountId": "0.0.123456"},
    "note": "You really showed up!",
    "mintAsNFT": true
  }' | jq
```

**Check response:**
- ✅ Has `nftTokenId` (mock or real depending on env)
- ✅ Has `nftSerialNumber` 
- ✅ Has `txId` (HCS message)

**Check console logs:**
```
[NFT] RECOGNITION_NFT_TOKEN_ID not set — returning mock NFT result.
[NFT] (stub) would mint 1 NFT with metadata bytes: 187
[recognition/create] Minted NFT: 0.0.mockToken #45678
```

---

## UI Tests

### Create Modal

1. Open CreateRecognitionModal
2. Select recognition type (e.g., "No Cap")
3. Look for NFT checkbox at bottom:
   ```
   ☐ Mint as NFT (transferable asset)
   Create a transferable token that can be shown in wallets and marketplaces.
   Costs additional 0.001 HBAR for minting.
   ```
4. Check the box
5. Footer updates: "Costs 0.01 TRST + 0.001 HBAR (NFT mint)"
6. Submit

---

### Signals Page

1. Navigate to `/signals`
2. Find recognition with NFT
3. Card footer shows:
   ```
   from alice • 🔥 via GenZ lens • Jan 29 • NFT #12345
   ```
4. NFT badge shown in purple with serial number

---

## Cost Breakdown

| Option | HCS Message | NFT Mint | Total |
|--------|-------------|----------|-------|
| **HCS-only** | Included | — | 0.01 TRST |
| **HCS + NFT** | Included | 0.001 HBAR | 0.01 TRST + 0.001 HBAR |

---

## Metadata Encoding

**NFT metadata structure:**
```json
{
  "t": "recognition",
  "l": "No Cap",
  "e": "🔥",
  "d": "Straight facts, zero lies",
  "x": "genz",
  "p": {
    "hcsMessageId": "0.0.5438869@...",
    "from": "0.0.alice",
    "to": "0.0.bob",
    "timestamp": "2025-01-29T..."
  }
}
```

**Encoded as UTF-8 bytes** (~150-250 bytes depending on content)

---

## When to Use NFT Minting

### Use HCS-only when:
- ✅ Recognition is purely social (not collectible)
- ✅ Speed matters (no NFT mint latency)
- ✅ Cost sensitive (no HBAR mint fee)
- ✅ Internal app only (not shown in external wallets)

### Use HCS + NFT when:
- ✅ Recognition should be transferable
- ✅ User wants badge in wallet/showcase
- ✅ Recognition is achievement/certification
- ✅ External composability needed (other apps can see it)

---

## Phase 2 Implementation Checklist

When ready to enable real HTS minting:

- [ ] Create recognition NFT collection token on Hedera
- [ ] Set `RECOGNITION_NFT_TOKEN_ID` in environment
- [ ] Configure Hedera client with operator keys
- [ ] Uncomment real SDK code in `lib/server/hts/nft.ts`
- [ ] Test minting on testnet
- [ ] Add NFT image generation (optional: badge images with emoji)
- [ ] Add IPFS pinning (optional: metadata + images)
- [ ] Add auto-association for recipients (optional)
- [ ] Add NFT transfer UI (optional: "Gift this recognition")

---

## Success Criteria

✅ **Stub implementation complete** when:
1. Default behavior is HCS-only (no NFT unless opted-in)
2. Checkbox appears in create modal
3. `mintAsNFT: true` returns mock NFT result
4. Signal cards show NFT badge when present
5. No crashes when `RECOGNITION_NFT_TOKEN_ID` is missing
6. Console logs indicate stub is active

✅ **Real implementation ready** when:
1. Environment configured with token ID and client
2. Real HTS NFT minted on testnet
3. Serial number matches Hedera receipt
4. NFT visible in HashScan
5. Metadata encoded correctly
6. Cost calculation accurate

---

## Notes

- **No breaking changes:** Existing HCS-only flow unchanged
- **Safe to ship:** Stub returns mock data, no network calls
- **Easy upgrade:** Swap stub for real SDK when ready
- **Cost transparency:** UI shows HBAR fee when NFT selected
- **Future-proof:** Type system ready for NFT references

The architecture supports **optional collectible recognition** without forcing all signals to be NFTs. Users choose per-mint based on intent.
