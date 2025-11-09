#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const BASE_URL = process.env.SEED_BASE_URL || "http://localhost:3000"
const ADMIN = process.env.ADMIN_SEED_SECRET

if (!ADMIN) {
  console.error("❌ Missing ADMIN_SEED_SECRET in env")
  console.error("   Set via: export ADMIN_SEED_SECRET='your-secret'")
  process.exit(1)
}

async function post(url, body) {
  console.log(`📤 POST ${url}`)
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-seed-secret": ADMIN,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} ${JSON.stringify(json)}`)
  }
  return json
}

function load(p) {
  const fullPath = path.join(process.cwd(), "scripts", "out", p)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`)
  }
  return JSON.parse(fs.readFileSync(fullPath, "utf8"))
}

async function run() {
  console.log("🚀 Seeding Recognition Catalogs to HCS\n")
  
  try {
    console.log("📦 Loading catalog payloads...")
    const base = load("catalog.v2-base.json")
    const genz = load("catalog.v2-genz.overlay.json")
    const african = load("catalog.v2-african.overlay.json")
    console.log(`✅ Loaded: base (${base.items.length}), genz (${genz.items.length}), african (${african.items.length})\n`)

    console.log("1️⃣  Seeding BASE catalog...")
    const baseResult = await post(`${BASE_URL}/api/admin/seed-catalog?edition=base`, base)
    console.log(`   ✅ ${baseResult.total} items → ${baseResult.batches} batches → topic ${baseResult.topicId}\n`)

    console.log("2️⃣  Seeding GENZ overlay...")
    const genzResult = await post(`${BASE_URL}/api/admin/seed-catalog?edition=genz`, genz)
    console.log(`   ✅ ${genzResult.total} items → ${genzResult.batches} batches → topic ${genzResult.topicId}\n`)

    console.log("3️⃣  Seeding AFRICAN overlay...")
    const africanResult = await post(`${BASE_URL}/api/admin/seed-catalog?edition=african`, african)
    console.log(`   ✅ ${africanResult.total} items → ${africanResult.batches} batches → topic ${africanResult.topicId}\n`)

    console.log("🎉 All catalogs seeded successfully!")
    console.log("\n📊 Summary:")
    console.log(`   Base:    ${baseResult.total} signals`)
    console.log(`   GenZ:    ${genzResult.total} overlays`)
    console.log(`   African: ${africanResult.total} overlays`)
  } catch (error) {
    console.error("\n❌ Seed failed:", error.message)
    process.exit(1)
  }
}

run()
