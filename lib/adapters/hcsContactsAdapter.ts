import { signalsStore } from "@/lib/stores/signalsStore"
import { hcsFeedService } from "@/lib/services/HCSFeedService"
import { getBondedContactsFromHCS } from "@/lib/services/HCSDataUtils"

type BondedContact = {
  id: string
  handle: string
  bondedAt?: number
}

async function loadEventsStoreFirst(): Promise<any[]> {
  // Prefer store (live+cache) if available
  const getAllSignals = (signalsStore as any).getAllSignals?.bind(signalsStore)
                      || (signalsStore as any).getAll?.bind?.(signalsStore)
  if (getAllSignals) {
    try {
      const events = getAllSignals()
      if (Array.isArray(events) && events.length > 0) return events
    } catch {}
  }
  // Fallback to HCS feed service
  try {
    const events = await (hcsFeedService as any).getAllFeedEvents?.()
    if (Array.isArray(events) && events.length > 0) return events
  } catch {}
  return []
}

/**
 * Returns bonded contacts for a given session, using:
 *   1) SignalsStore (preferred)
 *   2) HCSFeedService (fallback)
 */
export async function getBondedContactsAdapter(sessionId: string): Promise<BondedContact[]> {
  console.log('[HCSContactsAdapter] Loading events for session:', sessionId)
  const events = await loadEventsStoreFirst()
  console.log('[HCSContactsAdapter] Loaded events count:', events.length)
  console.log('[HCSContactsAdapter] Event types:', events.map(e => e.type).filter((t, i, arr) => arr.indexOf(t) === i))
  
  const bonded = getBondedContactsFromHCS(events, sessionId) || []
  console.log('[HCSContactsAdapter] Processed bonded contacts:', bonded)
  
  // Keep it simple: only id/handle/bondedAt
  return bonded.map((b: any) => ({
    id: b.id || b.peerId || b.userId,
    handle: b.handle || b.name || b.display || b.id,
    bondedAt: b.bondedAt || b.ts || b.timestamp
  }))
}

/**
 * Quick counts for debugging sources.
 */
export async function getContactsSourceCounts(sessionId: string) {
  // Store
  let storeCount = 0
  try {
    const getAllSignals = (signalsStore as any).getAllSignals?.bind(signalsStore)
                        || (signalsStore as any).getAll?.bind?.(signalsStore)
    const ev = getAllSignals ? getAllSignals() : []
    storeCount = Array.isArray(ev) ? ev.length : 0
  } catch {}
  // Feed
  let feedCount = 0
  try {
    const ev = await (hcsFeedService as any).getAllFeedEvents?.()
    feedCount = Array.isArray(ev) ? ev.length : 0
  } catch {}
  // Bonded preview
  const bonded = await getBondedContactsAdapter(sessionId)
  return { storeCount, feedCount, bondedCount: bonded.length }
}