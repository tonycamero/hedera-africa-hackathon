import { signalsStore } from "@/lib/stores/signalsStore"
import { hcsFeedService } from "@/lib/services/HCSFeedService"
import { getBondedContactsFromHCS } from "@/lib/services/HCSDataUtils"

type CircleData = {
  sessionId: string
  bondedContacts: Array<{ id: string; handle: string }>
  trustStats: { allocatedOut: number; pendingOut: number; cap: number }
  recentSignals: any[]
}

async function loadEvents(): Promise<any[]> {
  // Store first
  const getAllSignals = (signalsStore as any).getAllSignals?.bind(signalsStore)
                      || (signalsStore as any).getAll?.bind?.(signalsStore)
  if (getAllSignals) {
    try {
      const events = getAllSignals()
      if (Array.isArray(events) && events.length > 0) return events
    } catch {}
  }
  // Fallback
  try {
    const events = await (hcsFeedService as any).getAllFeedEvents?.()
    if (Array.isArray(events) && events.length > 0) return events
  } catch {}
  return []
}

/**
 * Returns the Circle page view-model using a single source of truth.
 */
export async function getCircleVM(sessionId: string): Promise<CircleData> {
  const events = await loadEvents()

  const bonded = getBondedContactsFromHCS(events, sessionId) || []
  const bondedContacts = bonded
    .filter((b: any) => b.id && b.id !== sessionId) // avoid self
    .map((b: any) => ({
      id: b.id || b.peerId || b.userId,
      handle: b.handle || b.name || b.display || b.id
    }))

  // Simple trust stats calculation from contact events
  const contactEvents = events.filter((e: any) => 
    e.type === 'CONTACT_REQUEST' || e.type === 'CONTACT_ACCEPT'
  )
  
  // Count accepted connections (green LEDs)
  const acceptedConnections = contactEvents.filter((e: any) => 
    e.type === 'CONTACT_ACCEPT' && 
    (e.actor === sessionId || e.target === sessionId)
  ).length / 2 // Divide by 2 since each connection creates 2 events
  
  // Count pending outbound requests (yellow LEDs) 
  const pendingRequests = contactEvents.filter((e: any) => 
    e.type === 'CONTACT_REQUEST' && 
    e.actor === sessionId &&
    // Only count as pending if no corresponding ACCEPT exists
    !contactEvents.some((acceptEvent: any) => 
      acceptEvent.type === 'CONTACT_ACCEPT' &&
      acceptEvent.target === sessionId &&
      acceptEvent.actor === e.target
    )
  ).length

  const trustStats = {
    allocatedOut: Math.floor(acceptedConnections),
    pendingOut: pendingRequests,
    cap: 9
  }

  // keep it light; caller can slice for UI
  const recentSignals = Array.isArray(events)
    ? events
        .filter((e: any) => e?.type && e?.ts)
        .sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0))
        .slice(0, 50)
    : []

  return {
    sessionId,
    bondedContacts,
    trustStats,
    recentSignals
  }
}

/**
 * Quick diagnostic to see what source we ended up using.
 */
export async function getCircleSourceSnapshot(sessionId: string) {
  let storeCount = 0
  try {
    const getAllSignals = (signalsStore as any).getAllSignals?.bind(signalsStore)
                        || (signalsStore as any).getAll?.bind?.(signalsStore)
    const ev = getAllSignals ? getAllSignals() : []
    storeCount = Array.isArray(ev) ? ev.length : 0
  } catch {}
  let feedCount = 0
  try {
    const ev = await (hcsFeedService as any).getAllFeedEvents?.()
    feedCount = Array.isArray(ev) ? ev.length : 0
  } catch {}
  return { storeCount, feedCount }
}