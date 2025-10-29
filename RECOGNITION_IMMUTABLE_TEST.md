# Immutable Recognition Signals - Test Script

## Core Principle

**Recognition signals are FROZEN at mint time.**
- Minter's lens determines available vocabulary
- Selected metadata (label, emoji, description) is stored permanently
- ALL viewers see the exact same metadata forever
- No lens overlay transformation on read

---

## Test Scenarios

### Scenario 1: Base Lens → GenZ Viewer

**Setup:**
1. Alice uses **Base lens** (🧭)
2. Bob uses **GenZ lens** (🔥)

**Steps:**
1. Alice opens CreateRecognitionModal
2. Modal shows Base catalog:
   - 💎 Truth
   - 🦁 Courage
   - 🦉 Wisdom
   - 🤝 Kindness
   - 💡 Innovation
3. Alice selects **💎 Truth** and sends to Bob
4. Bob opens `/signals` page

**Expected Result:**
- Bob sees: **💎 Truth** (NOT transformed to GenZ vocabulary)
- Footer shows: "via Base (Universal) lens"
- Description: "Honest and transparent"

---

### Scenario 2: GenZ Lens → African Viewer

**Setup:**
1. Carol uses **GenZ lens** (🔥)
2. David uses **African lens** (🌍)

**Steps:**
1. Carol opens CreateRecognitionModal
2. Modal shows GenZ catalog:
   - 🔥 No Cap
   - ✨ Good Vibes
   - 🎵 That Slaps
   - 🐐 GOAT
   - 💯 Based
3. Carol selects **🔥 No Cap** with note: "You really showed up today!"
4. David opens `/signals` page

**Expected Result:**
- David sees: **🔥 No Cap** (NOT "Truth" or "Ubuntu")
- Description: "Straight facts, zero lies"
- Note: "You really showed up today!"
- Footer shows: "via GenZ lens"

---

### Scenario 3: African Lens → Base Viewer

**Setup:**
1. Eve uses **African lens** (🌍)
2. Frank uses **Base lens** (🧭)

**Steps:**
1. Eve opens CreateRecognitionModal
2. Modal shows African catalog:
   - 🌍 Ubuntu
   - 🦅 Sankofa
   - 🤲 Ujamaa
   - 🙌 Harambee
   - 🔗 Umoja
3. Eve selects **🌍 Ubuntu** and sends to Frank
4. Frank opens `/signals` page

**Expected Result:**
- Frank sees: **🌍 Ubuntu** (NOT "Truth")
- Description: "I am because we are"
- Footer shows: "via African (Ubuntu) lens"

---

### Scenario 4: Mixed Feed

**Setup:**
1. Alice (Base) sends 💎 Truth
2. Carol (GenZ) sends 🔥 No Cap
3. Eve (African) sends 🌍 Ubuntu
4. All to Bob

**Steps:**
1. Bob opens `/signals` page
2. Switches lens between Base → GenZ → African

**Expected Result (same regardless of Bob's active lens):**
```
┌─────────────────────────────────────┐
│ 💎 Truth                            │
│ from Alice                          │
│ "Honest and transparent"            │
│ 🧭 via Base (Universal) lens       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔥 No Cap                           │
│ from Carol                          │
│ "Straight facts, zero lies"         │
│ 🔥 via GenZ lens                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🌍 Ubuntu                           │
│ from Eve                            │
│ "I am because we are"               │
│ 🌍 via African (Ubuntu) lens        │
└─────────────────────────────────────┘
```

---

## API Tests

### Create Recognition

```bash
# Get Magic token from browser console:
# await magic.user.getIdToken()

curl -X POST http://localhost:3000/api/recognition/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "No Cap",
    "emoji": "🔥",
    "description": "Straight facts, zero lies",
    "lens": "genz",
    "to": {
      "accountId": "0.0.123456",
      "handle": "bob"
    },
    "note": "Thanks for the help!"
  }' | jq
```

**Expected Response:**
```json
{
  "ok": true,
  "signal": {
    "id": "uuid-here",
    "label": "No Cap",
    "emoji": "🔥",
    "description": "Straight facts, zero lies",
    "lens": "genz",
    "from": { "accountId": "0.0.654321" },
    "to": { "accountId": "0.0.123456", "handle": "bob" },
    "note": "Thanks for the help!",
    "timestamp": "2025-01-29T...",
    "txId": "0.0.5438869@..."
  }
}
```

### List Recognitions

```bash
curl -X GET http://localhost:3000/api/recognition/list \
  -H "Authorization: Bearer <TOKEN>" | jq
```

**Expected Response:**
```json
{
  "signals": [
    {
      "id": "uuid-1",
      "label": "No Cap",
      "emoji": "🔥",
      "lens": "genz",
      ...
    },
    {
      "id": "uuid-2",
      "label": "Ubuntu",
      "emoji": "🌍",
      "lens": "african",
      ...
    }
  ]
}
```

---

## Integration Checks

### 1. TRST Spending
Check console logs:
```
[SettlementPort] Spending 0.010000 TRST: wallet=<accountId>, amount=0.010000
```

### 2. HCS Publishing
Check console logs:
```
[HCS21] Published RECOGNITION_MINT event to topic 0.0.5438869
```

### 3. In-Memory Cache
Multiple creates should show in list endpoint immediately.

---

## Success Criteria

✅ **Immutable Recognition Complete** when:

1. Minter's lens determines available vocabulary (picker)
2. Selected metadata is frozen permanently at mint time
3. All viewers see identical label/emoji/description
4. Viewer's lens switch does NOT transform existing signals
5. TRST spending works (0.01 TRST per mint)
6. HCS events published correctly
7. Signals persist in recognitionStore
8. Modal shows lens-specific catalogs correctly

---

## Known Limitations (Dev Phase)

- **In-memory storage:** Signals cleared on server restart (migrate to HCS mirror later)
- **Mock auth:** requireMagic returns mock user (integrate real Magic validation)
- **No HCS ingestion:** List endpoint uses memory cache (wire up mirror query)

---

## Next Steps

After verifying immutable recognition:

**Step 9:** Add recognition creation UI to contacts/circle pages
**Step 10:** TRST balance display and top-up flows
**Phase 2:** Migrate recognitionStore to HCS mirror query
**Phase 3:** NFT minting for recognition signals (on-chain provenance)

---

## Example User Journey

1. **Onboarding:** Accept stipend (1.35 TRST)
2. **Lens choice:** Select GenZ lens (free)
3. **Create profile:** Profile published to HCS
4. **Send recognition:** 🔥 No Cap to friend (0.01 TRST)
5. **View signals:** See all received recognitions with frozen metadata
6. **Switch lens:** Unlock African lens (1 TRST) → recognition UI changes but existing signals unchanged
7. **Send again:** 🌍 Ubuntu to another friend (0.01 TRST)
8. **Feed shows both:** 🔥 No Cap and 🌍 Ubuntu coexist unchanged

The minter's cultural intent is preserved forever. 🔒
