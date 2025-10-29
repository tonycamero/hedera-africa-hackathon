# Multi-Cultural Recognition Catalog System

Complete setup guide for the Recognition Signals v2 system with GenZ and African cultural overlays.

---

## 🎯 **Architecture Overview**

### **The Overlay Model:**
```
Base Catalog (84 signals)
  ↓
  ├─→ GenZ Overlay (cultural language)
  └─→ African Overlay (Ubuntu philosophy)

User sees their preferred lens, but:
- Same base_id (universal recognition)
- Same trust economics (0.2-0.5)
- Same rarity (common/rare/legendary)
```

### **HCS Topic Structure:**
```
topics().recognition          → Base catalog (CATALOG_UPSERT)
topics().recognition_genz     → GenZ overlay (CATALOG_UPSERT_OVERLAY)
topics().recognition_african  → African overlay (CATALOG_UPSERT_OVERLAY)
```

---

## 📦 **Setup Instructions**

### **1. Environment Variables**

Add to `.env.local`:

```bash
# Recognition Topics
NEXT_PUBLIC_TOPIC_RECOGNITION=0.0.7148065          # Base (required)
NEXT_PUBLIC_TOPIC_RECOGNITION_GENZ=0.0.XXXXXXX     # GenZ (optional)
NEXT_PUBLIC_TOPIC_RECOGNITION_AFRICAN=0.0.XXXXXXX  # African (optional)

# Admin Auth for Seed Endpoints
ADMIN_SEED_SECRET=choose-a-long-random-string

# HCS Configuration (existing)
NEXT_PUBLIC_HCS_ENABLED=true
HEDERA_NETWORK=testnet
```

### **2. Generate Catalogs**

```bash
# Generate all TS and JSON catalog files
cd scripts
python3 generate-multicultural-signals.py

# Output:
# ✅ lib/data/recognitionSignals-base.ts
# ✅ lib/data/recognitionSignals-genz.ts  
# ✅ lib/data/recognitionSignals-african.ts
# ✅ scripts/out/catalog.v2-base.json (84 items)
# ✅ scripts/out/catalog.v2-genz.overlay.json (15 items)
# ✅ scripts/out/catalog.v2-african.overlay.json (15 items)
```

### **3. Seed to HCS**

```bash
# Set admin secret
export ADMIN_SEED_SECRET="your-secret"

# Seed all catalogs
node scripts/seed-catalogs.mjs

# Or seed individually:
curl -X POST \
  -H "x-admin-seed-secret: $ADMIN_SEED_SECRET" \
  "http://localhost:3000/api/admin/seed-catalog-v2-base?fromDisk=true"
```

---

## 🔧 **Development Workflow**

### **Adding New Signals:**

1. **Edit base catalog:**
   ```bash
   nano scripts/signals-v2-data.json
   # Add signal to appropriate category
   ```

2. **Add cultural overlays:**
   ```bash
   # Update GenZ version
   nano scripts/signals-genz-overlay.json
   
   # Update African version  
   nano scripts/signals-african-overlay.json
   ```

3. **Upgrade overlay IDs:**
   ```bash
   node scripts/upgrade-overlays.mjs
   ```

4. **Validate coverage:**
   ```bash
   node scripts/validate-overlays.mjs
   # Target: 84/84 mapped for both overlays
   ```

5. **Regenerate everything:**
   ```bash
   python3 scripts/generate-multicultural-signals.py
   ```

6. **Reseed:**
   ```bash
   export ADMIN_SEED_SECRET="your-secret"
   node scripts/seed-catalogs.mjs
   ```

---

## 📁 **File Structure**

```
scripts/
├── signals-v2-data.json              # BASE catalog (trust values, rarity)
├── signals-genz-overlay.json         # GenZ cultural overlay
├── signals-african-overlay.json      # African cultural overlay
├── upgrade-overlays.mjs              # Add base_id/type_id to overlays
├── validate-overlays.mjs             # Check coverage (84/84)
├── generate-multicultural-signals.py # Generate all outputs
├── seed-catalogs.mjs                 # Seed to HCS
└── out/
    ├── catalog.v2-base.json          # HCS payload (base)
    ├── catalog.v2-genz.overlay.json  # HCS payload (GenZ)
    └── catalog.v2-african.overlay.json # HCS payload (African)

lib/
├── data/
│   ├── recognitionSignals-base.ts    # UI catalog (base)
│   ├── recognitionSignals-genz.ts    # UI catalog (GenZ)
│   └── recognitionSignals-african.ts # UI catalog (African)
├── services/
│   └── catalogSeed.ts                # Chunked HCS publishing
└── registry/
    └── serverRegistry.ts             # Topic registry (extended)

app/api/admin/
├── seed-catalog-v2-base/route.ts
├── seed-catalog-v2-genz/route.ts
└── seed-catalog-v2-african/route.ts
```

---

## 🔐 **Security**

### **Admin Authentication:**
All seed endpoints require `x-admin-seed-secret` header matching `ADMIN_SEED_SECRET` env var.

### **Production Checklist:**
- [ ] Rotate `ADMIN_SEED_SECRET` before deployment
- [ ] Only expose seed endpoints to internal network/VPN
- [ ] Log all catalog update attempts with timestamps
- [ ] Verify HCS topic ownership before seeding

---

## 🎨 **Cultural Overlay Examples**

### **Base (Professional/Institutional):**
```
Strategic Visionary
"Exceptional ability to see the big picture and guide long-term strategy"
```

### **GenZ:**
```
Main Character Energy
"Has that CEO mindset, sees the vision before it's obvious"
```

### **African (Ubuntu Philosophy):**
```
Ọgá Visionary
"Sees the path forward with ancestral wisdom"
```

**Key:** Same `base_id: "strategic-visionary"`, same trust value (0.5), same rarity (legendary).

---

## 🚀 **API Endpoints**

### **Seed Base Catalog:**
```bash
POST /api/admin/seed-catalog-v2-base
Headers: x-admin-seed-secret: <secret>
Body: catalog.v2-base.json payload

# Or read from disk:
POST /api/admin/seed-catalog-v2-base?fromDisk=true
```

### **Seed GenZ Overlay:**
```bash
POST /api/admin/seed-catalog-v2-genz
Headers: x-admin-seed-secret: <secret>
Body: catalog.v2-genz.overlay.json payload
```

### **Seed African Overlay:**
```bash
POST /api/admin/seed-catalog-v2-african
Headers: x-admin-seed-secret: <secret>
Body: catalog.v2-african.overlay.json payload
```

### **Response Format:**
```json
{
  "ok": true,
  "topicId": "0.0.7148065",
  "batches": 5,
  "total": 84
}
```

---

## 📊 **HCS Message Structure**

### **Header Message:**
```json
{
  "v": 2,
  "type": "CATALOG_UPSERT",
  "edition": "base",
  "version": "2.0-base",
  "iat": 1761234567,
  "idem": "abc123...",
  "total": 84,
  "schema": "CATALOG_HEADER"
}
```

### **Batch Message:**
```json
{
  "v": 2,
  "type": "CATALOG_UPSERT",
  "edition": "base",
  "version": "2.0-base",
  "schema": "CATALOG_BATCH",
  "idem": "abc123...",
  "index": 0,
  "count": 20,
  "items": [...]
}
```

### **Footer Message:**
```json
{
  "v": 2,
  "type": "CATALOG_UPSERT",
  "edition": "base",
  "version": "2.0-base",
  "schema": "CATALOG_FOOTER",
  "idem": "abc123...",
  "batches": 5,
  "total": 84
}
```

---

## 🧪 **Testing**

### **Local Dev:**
```bash
# 1. Start dev server
pnpm dev

# 2. Generate catalogs
cd scripts && python3 generate-multicultural-signals.py

# 3. Seed
export ADMIN_SEED_SECRET="test-secret"
node scripts/seed-catalogs.mjs

# 4. Verify in Mirror Node
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.7148065/messages?order=desc&limit=3" | jq .
```

### **Coverage Validation:**
```bash
node scripts/validate-overlays.mjs

# Expected output:
# === genz ===
# mapped: 84 / base: 84
# missing: 0
# 
# === african ===
# mapped: 84 / base: 84
# missing: 0
```

---

## 🎯 **Current Status**

### **✅ Complete:**
- Base catalog (84 signals)
- GenZ overlay (15 signals mapped)
- African overlay (15 signals mapped)
- Generator pipeline
- HCS seed endpoints
- Registry integration

### **🚧 In Progress:**
- Complete GenZ overlay (69 more signals)
- Complete African overlay (69 more signals)
- Frontend lens resolver
- User preference storage

### **📋 Next Steps:**
1. Expand overlays to full 84 coverage
2. Create frontend lens switcher
3. Build catalog loader with overlay resolution
4. Add user preference persistence

---

## 🆘 **Troubleshooting**

### **"Missing ADMIN_SEED_SECRET":**
```bash
export ADMIN_SEED_SECRET="your-secret"
```

### **"No topic configured for edition=genz":**
Add to `.env.local`:
```
NEXT_PUBLIC_TOPIC_RECOGNITION_GENZ=0.0.XXXXXXX
```

### **"idem mismatch":**
Regenerate catalogs:
```bash
python3 scripts/generate-multicultural-signals.py
```

### **Overlays incomplete:**
```bash
# Check coverage
node scripts/validate-overlays.mjs

# Add missing signals to overlay JSONs
# Then run:
node scripts/upgrade-overlays.mjs
```

---

## 📚 **References**

- **Base Catalog:** `RECOGNITION_SIGNALS_V2_CURATED.md`
- **Grok Corrections:** `GROK_CORRECTIONS_APPLIED.md`
- **URE Documentation:** `lib/registry/README.md`
- **Migration Guide:** See conversation history for #1, #2, #3 steps

---

*System ready for production deployment with proper topic configuration.*
