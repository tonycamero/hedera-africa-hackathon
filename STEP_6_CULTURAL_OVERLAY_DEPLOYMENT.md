# Step 6: Cultural Overlay Catalog Deployment

**Status:** In Progress  
**Goal:** Seed base, GenZ, and African recognition catalogs to HCS topics

---

## 🎯 Objectives

1. ✅ Create HCS topics for GenZ and African overlays
2. ⏳ Configure environment variables for overlay topics
3. ⏳ Seed base catalog to recognition topic
4. ⏳ Seed GenZ overlay to GenZ topic
5. ⏳ Seed African overlay to African topic
6. ⏳ Verify catalog resolution in UI

---

## 📋 Prerequisites

### Existing Configuration
- ✅ Base recognition topic: `0.0.7148065` (configured as `NEXT_PUBLIC_TOPIC_RECOGNITION`)
- ✅ Catalog files generated in `scripts/out/`:
  - `catalog.v2-base.json` (35KB, 84 signals)
  - `catalog.v2-genz.overlay.json` (6.7KB, 15 overlays)
  - `catalog.v2-african.overlay.json` (6.7KB, 15 overlays)

### Required New Topics
- ⏳ GenZ overlay topic (needs creation)
- ⏳ African overlay topic (needs creation)

---

## 🔧 Step 1: Create Overlay Topics

### Option A: Via Hedera Portal (Manual)
1. Go to https://portal.hedera.com
2. Create two new topics:
   - **Topic 1:** `TrustMesh Recognition GenZ Overlay`
   - **Topic 2:** `TrustMesh Recognition African Overlay`
3. Note the topic IDs (format: `0.0.XXXXXXX`)

### Option B: Via Script (Automated)
```bash
# Using Hedera SDK
node scripts/create-overlay-topics.ts
```

---

## 🔧 Step 2: Configure Environment Variables

Add to `.env.local`:

```bash
# Recognition overlay topics (created in Step 1)
NEXT_PUBLIC_TOPIC_RECOGNITION_GENZ=0.0.XXXXXXX
NEXT_PUBLIC_TOPIC_RECOGNITION_AFRICAN=0.0.XXXXXXX
```

**Verify registry loads correctly:**
```bash
pnpm dev
# Check console for: "[Registry] ✅ Validated and froze topic registry"
```

---

## 🔧 Step 3: Configure Admin Seed Secret

Set admin secret for seed endpoints:

```bash
# Add to .env.local
ADMIN_SEED_SECRET=your-secure-random-string-here
```

**Generate a secure secret:**
```bash
openssl rand -hex 32
```

---

## 🔧 Step 4: Seed Catalogs to HCS

### Base Catalog
```bash
curl -X POST "http://localhost:3000/api/admin/seed-catalog?edition=base&fromDisk=true" \
  -H "x-admin-seed-secret: your-secure-random-string-here"
```

**Expected Response:**
```json
{
  "ok": true,
  "topicId": "0.0.7148065",
  "batches": 5,
  "total": 84
}
```

### GenZ Overlay
```bash
curl -X POST "http://localhost:3000/api/admin/seed-catalog?edition=genz&fromDisk=true" \
  -H "x-admin-seed-secret: your-secure-random-string-here"
```

**Expected Response:**
```json
{
  "ok": true,
  "topicId": "0.0.XXXXXXX",
  "batches": 1,
  "total": 15
}
```

### African Overlay
```bash
curl -X POST "http://localhost:3000/api/admin/seed-catalog?edition=african&fromDisk=true" \
  -H "x-admin-seed-secret: your-secure-random-string-here"
```

**Expected Response:**
```json
{
  "ok": true,
  "topicId": "0.0.XXXXXXX",
  "batches": 1,
  "total": 15
}
```

---

## 🔧 Step 5: Verify Seeding

### Check HCS Mirror Node
```bash
# Base catalog (should show header + 5 batches + footer = 7 messages)
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.7148065/messages?limit=10&order=desc"

# GenZ overlay (should show header + 1 batch + footer = 3 messages)
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.XXXXXXX/messages?limit=10&order=desc"

# African overlay (should show header + 1 batch + footer = 3 messages)
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.XXXXXXX/messages?limit=10&order=desc"
```

### Expected Message Structure
Each catalog should have:
1. **CATALOG_HEADER** - Meta information (edition, version, idem, total count)
2. **CATALOG_BATCH(es)** - Signal definitions in batches of 20
3. **CATALOG_FOOTER** - Confirmation (total, batch count)

---

## 🧪 Step 6: Test in UI

### Base Lens (Default)
1. Visit recognition UI
2. Should show all 84 base signals
3. Verify trustValue and rarity are present

### GenZ Lens
1. Switch to GenZ lens (via lens selector)
2. Should show 84 signals with 15 GenZ overlays applied
3. Verify GenZ variants have custom name/description
4. Economics (trustValue/rarity) should come from base

### African Lens
1. Switch to African lens
2. Should show 84 signals with 15 African overlays applied
3. Verify African variants have custom name/description
4. Economics (trustValue/rarity) should come from base

---

## 📊 Catalog Statistics

### Base Catalog
- **Signals:** 84
- **Categories:** 6 (Collaboration, Leadership, Innovation, Communication, Support, Achievement)
- **Size:** 35KB
- **Batches:** 5 (20 items each, except last)

### GenZ Overlay
- **Overlays:** 15 (~18% coverage)
- **Size:** 6.7KB
- **Batches:** 1
- **No economics** (pure cultural translation)

### African Overlay
- **Overlays:** 15 (~18% coverage)
- **Size:** 6.7KB
- **Batches:** 1
- **No economics** (pure cultural translation)

---

## 🔒 Security Considerations

### Admin Endpoint Protection
- ✅ Requires `x-admin-seed-secret` header
- ✅ Secret must match `ADMIN_SEED_SECRET` env var
- ✅ Returns 401 if unauthorized
- ✅ Never expose admin secret in client code

### Economics Validation
- ✅ Overlay catalogs CANNOT define `trustValue` or `rarity`
- ✅ Throws error if overlay attempts to override economics
- ✅ Economics enforced from base catalog only

### Idempotency
- ✅ Each catalog has unique `idem` (SHA-256 hash of items)
- ✅ Prevents duplicate seeding
- ✅ Enables verification of catalog integrity

---

## 🐛 Troubleshooting

### "No topic configured for edition=genz"
- Check `.env.local` has `NEXT_PUBLIC_TOPIC_RECOGNITION_GENZ`
- Restart dev server to reload environment

### "overlay_must_not_define_economics"
- Overlay JSON file contains `trustValue` or `rarity`
- Remove economics from overlay files
- Re-run generator script if needed

### "idem mismatch"
- Catalog items changed after idem was generated
- Re-run generator script to regenerate catalogs

### 401 Unauthorized
- Check `x-admin-seed-secret` header matches `.env.local`
- Verify admin secret is not empty

### Empty response from mirror node
- Wait 5-10 seconds for HCS consensus
- Check topic ID is correct
- Verify Hedera operator credentials are valid

---

## 📝 Next Steps (Step 7)

After successful seeding:
1. Update UI components to resolve overlays
2. Implement lens selector in recognition UI
3. Test multi-lens switching
4. Verify overlay resolution logic
5. Add telemetry for lens usage

---

## ✅ Success Criteria

- [ ] Base catalog seeded (84 signals, 5 batches)
- [ ] GenZ overlay seeded (15 overlays, 1 batch)
- [ ] African overlay seeded (15 overlays, 1 batch)
- [ ] All messages visible on Hedera Mirror Node
- [ ] Registry resolves all three topic IDs
- [ ] No errors in console
- [ ] Ready for UI overlay resolution (Step 7)

---

**Current Status:** Awaiting topic creation and environment configuration
