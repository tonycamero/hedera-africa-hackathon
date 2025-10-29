import fs from "node:fs";
import path from "node:path";

const files = [
  { p: "signals-genz-overlay.json", edition: "genz" },
  { p: "signals-african-overlay.json", edition: "african" },
];

const RAR = new Map([
  ["legendary","legendary"],["Legendary","legendary"],
  ["rare","rare"],["Rare","rare"],
  ["common","common"],["Common","common"]
]);

function upgradeOne(obj, edition) {
  let changed = 0, total = 0, missingMapsTo = 0;
  for (const [k, arr] of Object.entries(obj)) {
    if (k.startsWith("_")) continue;
    for (const s of arr) {
      total++;
      if (!s.maps_to) { missingMapsTo++; continue; }
      const base_id = s.maps_to;
      const rarity = RAR.get(s.rarity) ?? s.rarity?.toString().toLowerCase() ?? "common";
      const type_id = `${base_id}@2-${edition}`;

      if (s.base_id !== base_id || s.type_id !== type_id || s.rarity !== rarity) {
        s.base_id = base_id;
        s.type_id = type_id;
        s.rarity = rarity;       // normalize
        changed++;
      }
      // trust should mirror base economics; keep existing numeric value intact
    }
  }
  return { changed, total, missingMapsTo };
}

for (const f of files) {
  const raw = fs.readFileSync(f.p, "utf8");
  const obj = JSON.parse(raw);
  const { changed, total, missingMapsTo } = upgradeOne(obj, f.edition);

  if (missingMapsTo) {
    console.warn(`[WARN] ${f.p}: ${missingMapsTo} entries missing "maps_to" (skipped).`);
  }
  const out = JSON.stringify(obj, null, 2);
  fs.writeFileSync(f.p, out);
  console.log(`✅ Upgraded ${path.basename(f.p)} → ${changed}/${total} entries updated`);
}
