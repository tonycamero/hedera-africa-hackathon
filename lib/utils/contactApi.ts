// lib/utils/contactApi.ts
export interface ApiContact {
  peerId: string
  handle: string
  bondedAt?: number
  // ...any other fields from the API response
}

export interface BondedContact {
  id: string           // normalized from peerId
  handle: string
  bondedAt?: number
}

export interface TrustLevels {
  allocatedTo: number
  receivedFrom: number
}

/**
 * Normalize /api/contacts payload into UI-friendly structures.
 */
export function normalizeContactsFromAPI(list: any[]): BondedContact[] {
  if (!Array.isArray(list)) return []
  return list.map((c: ApiContact) => ({
    id: (c as any).peerId ?? (c as any).id,
    handle: (c as any).handle ?? ((c as any).peerId ?? ''),
    bondedAt: (c as any).bondedAt,
  }))
}

/**
 * Convert object-of-objects trustLevels to a Map for the UI.
 */
export function trustLevelsObjectToMap(
  obj: Record<string, TrustLevels> | undefined | null
): Map<string, TrustLevels> {
  const map = new Map<string, TrustLevels>()
  if (!obj) return map
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') map.set(k, v)
  }
  return map
}

/**
 * Fetch contacts for a session and return normalized contacts + trust map.
 * Works both client & server (uses global fetch).
 */
export async function fetchContactsForSession(sessionId: string) {
  const res = await fetch(`/api/contacts?sessionId=${encodeURIComponent(sessionId)}`)
  const data = await res.json()
  if (!data?.success) {
    throw new Error(data?.error || 'Failed to load contacts')
  }
  return {
    contacts: normalizeContactsFromAPI(data.contacts),
    trustLevels: trustLevelsObjectToMap(data.trustLevels),
    raw: data,
  }
}