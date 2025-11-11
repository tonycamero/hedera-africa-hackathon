// lib/xmtp/readReceipts.ts
// XMTP-12: Local-only read receipts for privacy-friendly unread tracking

const STORAGE_KEY = 'trustmesh_xmtp_read_receipts_v1'

type ReceiptMap = Record<string, number> // conversationId -> lastReadMs

function loadReceipts(): ReceiptMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveReceipts(map: ReceiptMap) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore storage failures
  }
}

/**
 * Get last read timestamp for a conversation
 */
export function getLastRead(conversationId: string): number | null {
  const map = loadReceipts()
  return map[conversationId] ?? null
}

/**
 * Mark a conversation as read up to a specific timestamp
 * Only updates if the new timestamp is greater than the current one (monotonic)
 */
export function markConversationRead(
  conversationId: string,
  lastReadMs: number
) {
  const map = loadReceipts()
  const prev = map[conversationId] ?? 0
  if (lastReadMs <= prev) return
  map[conversationId] = lastReadMs
  saveReceipts(map)
}

/**
 * Given sorted messages (oldest -> newest), compute unread count vs lastReadMs
 */
export function computeUnreadCount(
  conversationId: string,
  messages: { sentAt: Date }[]
): number {
  const lastRead = getLastRead(conversationId) ?? 0
  return messages.filter(m => {
    const ts = m.sentAt.getTime()
    return ts > lastRead
  }).length
}
