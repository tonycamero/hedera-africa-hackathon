// lib/xmtp/messageOrdering.ts
// XMTP-11: Deterministic message ordering and de-duplication helpers

/**
 * Sort messages by sentAt (asc), then by id as a tie-breaker
 * Ensures consistent ordering regardless of arrival order
 */
export function sortMessages<T extends { id: string; sentAt: Date | number }>(messages: T[]): T[] {
  return [...messages].sort((a, b) => {
    const at = a.sentAt instanceof Date ? a.sentAt.getTime() : new Date(a.sentAt).getTime();
    const bt = b.sentAt instanceof Date ? b.sentAt.getTime() : new Date(b.sentAt).getTime();
    
    if (at !== bt) return at - bt;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Upsert a message into an array (replace if same id, else append)
 * Prevents duplicate messages from streams
 */
export function upsertMessage<T extends { id: string }>(existing: T[], next: T): T[] {
  const idx = existing.findIndex(m => m.id === next.id);
  if (idx === -1) {
    return [...existing, next];
  }
  const clone = [...existing];
  clone[idx] = next;
  return clone;
}
