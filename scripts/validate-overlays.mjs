import fs from "node:fs";

const base = JSON.parse(fs.readFileSync("signals-v2-data.json","utf8"));
const genz = JSON.parse(fs.readFileSync("signals-genz-overlay.json","utf8"));
const afr  = JSON.parse(fs.readFileSync("signals-african-overlay.json","utf8"));

const baseIds = new Set(Object.values(base).flat().map(s => s.id));

function flatten(overlayObj) {
  const out = [];
  for (const [k,v] of Object.entries(overlayObj)) {
    if (!k.startsWith("_")) out.push(...v);
  }
  return out;
}

function report(name, overlay) {
  const flat = flatten(overlay);
  const mapped = new Set(flat.map(x => x.base_id || x.maps_to));
  const missing = [...baseIds].filter(id => !mapped.has(id));
  console.log(`=== ${name} ===`);
  console.log(`mapped: ${mapped.size} / base: ${baseIds.size}`);
  console.log(`missing: ${missing.length}`);
  if (missing.length) {
    console.log("First 20 missing:", missing.slice(0,20));
  }
  console.log("");
}

report("genz", genz);
report("african", afr);

console.log(`✅ Base catalog has ${baseIds.size} signals`);
console.log(`🎯 Target: Full coverage (84/84) for production-ready overlays`);
