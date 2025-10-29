/**
 * Recognition store - in-memory for dev, will migrate to HCS mirror query
 */

import { RecognitionSignal } from '@/lib/recognition/types'

// In-memory cache (replace with HCS mirror query when ingestion is live)
const mem: RecognitionSignal[] = []

export const recognitionStore = {
  async add(signal: RecognitionSignal): Promise<RecognitionSignal> {
    mem.unshift(signal)
    return signal
  },

  async listForUser(accountId: string): Promise<RecognitionSignal[]> {
    // Return both inbound and outbound signals
    return mem.filter(
      s => s.to.accountId === accountId || s.from.accountId === accountId
    )
  },

  // Dev helper to clear cache
  async clear(): Promise<void> {
    mem.length = 0
  },
}
