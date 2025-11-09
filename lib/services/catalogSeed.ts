import crypto from "node:crypto"
import { submitToTopic } from "@/lib/hedera/serverClient"
import { topics } from "@/lib/registry/serverRegistry"

export type CatalogPayload = {
  v: 2
  type: "CATALOG_UPSERT" | "CATALOG_UPSERT_OVERLAY"
  edition: "base" | "genz" | "african"
  version: string // "2.0-base"|"2.0-genz"|"2.0-african"
  items: any[]
  iat: number
  idem: string
}

const BATCH_SIZE = 20 // conservative for HCS limits

export function chunk<T>(arr: T[], size = BATCH_SIZE): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export function expectAdmin(req: Request) {
  const token = (req.headers as any).get?.("x-admin-seed-secret")
  if (!token || token !== process.env.ADMIN_SEED_SECRET) {
    const e = new Error("unauthorized")
    ;(e as any).status = 401
    throw e
  }
}

function topicForEdition(edition: "base"|"genz"|"african") {
  const t = topics()
  if (edition === "base") return t.recognition
  if (edition === "genz") return t.recognition_genz
  return t.recognition_african
}

export function deriveIdem(items: any[]) {
  const key = items
    .map(it => `${it.base_id}|${it.type_id}|${it.name}|${it.description}`)
    .sort()
    .join("\n")
  return crypto.createHash("sha256").update(key).digest("hex")
}

export async function publishCatalog(payload: CatalogPayload) {
  const topicId = topicForEdition(payload.edition)
  if (!topicId) throw new Error(`No topic configured for edition=${payload.edition}`)

  // CRITICAL: Overlays must not redefine economics
  if (payload.edition !== "base") {
    for (const item of payload.items) {
      if ("trustValue" in item || "rarity" in item) {
        throw new Error(
          `overlay_must_not_define_economics: ${payload.edition} overlay contains trustValue/rarity. ` +
          `Economics are enforced from base catalog only. Item: ${item.base_id}`
        )
      }
    }
  }

  // sanity: idem should match items
  const computed = deriveIdem(payload.items)
  if (computed !== payload.idem) {
    throw new Error(`idem mismatch: provided=${payload.idem} computed=${computed}`)
  }

  // send header/meta first
  const header = {
    v: payload.v,
    type: payload.type,
    edition: payload.edition,
    version: payload.version,
    iat: payload.iat,
    idem: payload.idem,
    total: payload.items.length,
    schema: "CATALOG_HEADER",
  }
  await submitToTopic(topicId, JSON.stringify(header))

  // send batches
  const batches = chunk(payload.items)
  let seq = 0
  for (const items of batches) {
    const batchMsg = {
      v: payload.v,
      type: payload.type,
      edition: payload.edition,
      version: payload.version,
      schema: "CATALOG_BATCH",
      idem: payload.idem,
      index: seq,
      count: items.length,
      items,
    }
    await submitToTopic(topicId, JSON.stringify(batchMsg))
    seq++
  }

  // send footer
  const footer = {
    v: payload.v,
    type: payload.type,
    edition: payload.edition,
    version: payload.version,
    schema: "CATALOG_FOOTER",
    idem: payload.idem,
    batches: batches.length,
    total: payload.items.length,
  }
  await submitToTopic(topicId, JSON.stringify(footer))

  return { topicId, batches: batches.length, total: payload.items.length }
}
