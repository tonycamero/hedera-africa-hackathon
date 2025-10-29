#!/usr/bin/env python3
"""
Multi-cultural Recognition Signals Generator
- Reads:
    scripts/signals-v2-data.json           (BASE canon; trust/rarity source of truth)
    scripts/signals-genz-overlay.json      (overlay text/icons; must have base_id & type_id)
    scripts/signals-african-overlay.json   (overlay text/icons; must have base_id & type_id)
- Writes TypeScript (for UI):
    lib/data/recognitionSignals-base.ts
    lib/data/recognitionSignals-genz.ts
    lib/data/recognitionSignals-african.ts
- Writes HCS-ready JSON payloads (for seeding):
    scripts/out/catalog.v2-base.json
    scripts/out/catalog.v2-genz.overlay.json
    scripts/out/catalog.v2-african.overlay.json
"""

import json, hashlib, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # repo root
SCRIPTS = ROOT / "scripts"
OUT = SCRIPTS / "out"
OUT.mkdir(exist_ok=True)

# ---------- Load inputs ----------
base_data      = json.loads((SCRIPTS / "signals-v2-data.json").read_text(encoding="utf-8"))
genz_overlay   = json.loads((SCRIPTS / "signals-genz-overlay.json").read_text(encoding="utf-8"))
african_overlay= json.loads((SCRIPTS / "signals-african-overlay.json").read_text(encoding="utf-8"))

CATEGORY_MAP = {
    'professional_leadership': ('professional', 'leadership'),
    'professional_knowledge': ('professional', 'knowledge'),
    'professional_execution': ('professional', 'execution'),
    'academic_scholarship': ('academic', 'scholarship'),
    'academic_study': ('academic', 'study'),
    'academic_collaboration': ('academic', 'collaboration'),
    'social_character': ('social', 'character'),
    'social_connection': ('social', 'connection'),
    'social_energy': ('social', 'energy'),
    'civic_service': ('civic', 'community-service'),
    'civic_participation': ('civic', 'civic-participation'),
    'civic_environmental': ('civic', 'environmental')
}

DEFAULT_STATS = {
    'Legendary': {'popularity': 90, 'impact': 95, 'authenticity': 92, 'difficulty': 85},
    'Rare':      {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    'Common':    {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65}
}

def flatten_overlay(overlay_obj):
    items = []
    for k, arr in overlay_obj.items():
        if k.startswith("_"): continue
        items.extend(arr)
    return items

genz_flat    = flatten_overlay(genz_overlay)
african_flat = flatten_overlay(african_overlay)

# ---------- Indexes ----------
base_signals = {}
for cat_key, arr in base_data.items():
    for s in arr:
        base_signals[s['id']] = s

def ensure_overlay_coverage(name, flat):
    mapped = {x.get('base_id') or x.get('maps_to') for x in flat}
    missing = [bid for bid in base_signals.keys() if bid not in mapped]
    return mapped, missing

mapped_g, missing_g = ensure_overlay_coverage("genz", genz_flat)
mapped_a, missing_a = ensure_overlay_coverage("african", african_flat)

# ---------- Validation (soft warning) ----------
if missing_g:
    print(f"[WARN] GenZ overlay missing {len(missing_g)} base_ids:", missing_g[:10], "...")
if missing_a:
    print(f"[WARN] African overlay missing {len(missing_a)} base_ids:", missing_a[:10], "...")

# ---------- TS generation (UI) ----------
def ts_header(variant_desc):
    return f"""export type SignalCategory = 'social' | 'academic' | 'professional' | 'civic'
export type CulturalVariant = 'base' | 'genz' | 'african'

export interface RecognitionSignal {{
  id: string
  name: string
  description: string
  category: SignalCategory
  subcategory?: string
  number: number
  icon: string
  isActive: boolean
  trustValue: number
  extendedDescription: string
  rarity: 'Common' | 'Rare' | 'Legendary'
  stats: {{
    popularity: number
    impact: number
    authenticity: number
    difficulty: number
  }}
  traits: {{
    personality: string[]
    skills: string[]
    environment: string[]
  }}
  backstory: string
  culturalContext?: string
  tips: string[]
  tags: string[]
  v: number
  culturalVariant: CulturalVariant
}}

// Recognition Signals v2 - {variant_desc}
export const recognitionSignals: RecognitionSignal[] = [
"""

def overlay_lookup(variant, base_id):
    if variant == "genz":
        for x in genz_flat:
            if x.get('base_id') == base_id or x.get('maps_to') == base_id:
                return x
    if variant == "african":
        for x in african_flat:
            if x.get('base_id') == base_id or x.get('maps_to') == base_id:
                return x
    return None

def gen_ts(variant="base"):
    header = ts_header({
        "base":"BASE (canonical economics)",
        "genz":"GenZ cultural overlay",
        "african":"African cultural overlay"
    }[variant])
    out = [header]
    number = 1
    for cat_key, arr in base_data.items():
        category, subcategory = CATEGORY_MAP[cat_key]
        out.append(f"\n  // {category.upper()} - {subcategory.title()} ({len(arr)} signals)\n")
        for s in arr:
            name = s['name']; short = s['short']; longd = s['long']; icon = s['icon']; cctx = None
            if variant != "base":
                ov = overlay_lookup(variant, s['id'])
                if ov:
                    name = ov.get('name', name)
                    short = ov.get('short', short)
                    longd = ov.get('long', longd)
                    icon = ov.get('icon', icon)
                    cctx = ov.get('cultural_notes')
            stats = DEFAULT_STATS[s['rarity']]
            block = f"""  {{
    id: '{s['id']}',
    name: '{name}',
    description: `{short}`,
    category: '{category}',
    subcategory: '{subcategory}',
    number: {number},
    icon: '{icon}',
    isActive: true,
    trustValue: {s['trust']},
    extendedDescription: `{longd}`,
    rarity: '{s['rarity']}',
    stats: {json.dumps(stats)},
    traits: {{
      personality: [],
      skills: [],
      environment: []
    }},
    backstory: `Generated from v2 catalog - {s['rarity']} signal for {subcategory}.`,
"""
            if cctx:
                block += f"    culturalContext: `{cctx}`,\n"
            block += f"""    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: {json.dumps(s['tags'])},
    v: 2,
    culturalVariant: '{variant}'
  }},"""
            out.append(block)
            number += 1
    out.append("]\n\nexport default recognitionSignals\n")
    return "\n".join(out)

# Write TS files
(ROOT / "lib/data/recognitionSignals-base.ts").write_text(gen_ts("base"), encoding="utf-8")
(ROOT / "lib/data/recognitionSignals-genz.ts").write_text(gen_ts("genz"), encoding="utf-8")
(ROOT / "lib/data/recognitionSignals-african.ts").write_text(gen_ts("african"), encoding="utf-8")
print("✅ TS catalogs written (base/genz/african)")

# ---------- HCS catalog JSON (for seeding) ----------
def canonical_item_for_base(s):
    cat, subcat = next((CATEGORY_MAP[k] for k,v in base_data.items() if s in v), (None, None))
    return {
        "base_id": s["id"],
        "type_id": f"{s['id']}@2-base",
        "name": s["name"],
        "description": s["short"],
        "icon": s["icon"],
        "tags": s["tags"],
        "category": cat,
        "subcategory": subcat,
        "trustValue": s["trust"],
        "rarity": s["rarity"]
    }

def overlay_item(s_base, overlay_obj):
    cat, subcat = next((CATEGORY_MAP[k] for k,v in base_data.items() if s_base in v), (None, None))
    return {
        "base_id": s_base["id"],
        "type_id": overlay_obj["type_id"],
        "name": overlay_obj.get("name", s_base["name"]),
        "description": overlay_obj.get("short", s_base["short"]),
        "icon": overlay_obj.get("icon", s_base["icon"]),
        "tags": overlay_obj.get("tags", s_base["tags"]),
        "category": cat,
        "subcategory": subcat,
        "trustValue": s_base["trust"],
        "rarity": s_base["rarity"]
    }

def hash_idem(items):
    def key(it):
        return f"{it['base_id']}|{it['type_id']}|{it['name']}|{it['description']}|{it['icon']}|{','.join(it.get('tags',[]))}"
    payload = "\n".join(sorted(key(it) for it in items))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def write_catalog_payload(kind, edition, items, version):
    iat = int(time.time())
    payload = {
        "v": 2,
        "type": "CATALOG_UPSERT" if kind == "base" else "CATALOG_UPSERT_OVERLAY",
        "edition": edition,
        "version": version,
        "items": items,
        "iat": iat,
        "idem": hash_idem(items)
    }
    fname = {
        "base": OUT / "catalog.v2-base.json",
        "genz": OUT / "catalog.v2-genz.overlay.json",
        "african": OUT / "catalog.v2-african.overlay.json"
    }[edition]
    fname.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ HCS catalog written → {fname.name}  (items: {len(items)})")

# Build base items
base_items = [canonical_item_for_base(s) for arr in base_data.values() for s in arr]
write_catalog_payload("base", "base", base_items, "2.0-base")

# Build overlay items
def build_overlay_items(flat_overlay, label):
    items = []
    for ov in flat_overlay:
        base_id = ov.get("base_id") or ov.get("maps_to")
        if not base_id or base_id not in base_signals:
            continue
        items.append(overlay_item(base_signals[base_id], ov))
    write_catalog_payload("overlay", label, items, f"2.0-{label}")

build_overlay_items(genz_flat, "genz")
build_overlay_items(african_flat, "african")

print("🎯 JSON catalogs ready for HCS seeding (base + overlays).")
