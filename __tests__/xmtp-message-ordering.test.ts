/**
 * @jest-environment node
 * 
 * Tests for XMTP message ordering helpers (XMTP-11)
 * 
 * Verifies:
 * - Deterministic message sorting
 * - De-duplication via upsert
 * - Stable ordering for streamed messages
 */

import { sortMessages, upsertMessage } from '@/lib/xmtp/messageOrdering'

describe('XMTP message ordering helpers', () => {
  const makeMsg = (id: string, ms: number) => ({
    id,
    sentAt: new Date(ms),
  })

  describe('sortMessages', () => {
    it('orders by sentAt ascending', () => {
      const msgs = [
        makeMsg('b', 2000),
        makeMsg('a', 1000),
        makeMsg('c', 1500),
      ]

      const sorted = sortMessages(msgs)
      expect(sorted.map(m => m.id)).toEqual(['a', 'c', 'b'])
    })

    it('falls back to id when sentAt equal', () => {
      const ms = Date.now()
      const msgs = [
        makeMsg('z', ms),
        makeMsg('a', ms),
        makeMsg('m', ms),
      ]

      const sorted = sortMessages(msgs)
      expect(sorted.map(m => m.id)).toEqual(['a', 'm', 'z'])
    })

    it('returns a new array without mutating original', () => {
      const msgs = [
        makeMsg('b', 2000),
        makeMsg('a', 1000),
      ]
      const original = [...msgs]

      sortMessages(msgs)
      
      expect(msgs).toEqual(original)
    })

    it('handles empty array', () => {
      const sorted = sortMessages([])
      expect(sorted).toEqual([])
    })

    it('handles single message', () => {
      const msgs = [makeMsg('a', 1000)]
      const sorted = sortMessages(msgs)
      expect(sorted).toEqual(msgs)
    })
  })

  describe('upsertMessage', () => {
    it('appends when id does not exist', () => {
      const existing = [makeMsg('a', 1000)]
      const next = makeMsg('b', 2000)

      const result = upsertMessage(existing, next)
      expect(result).toHaveLength(2)
      expect(result.map(m => m.id)).toEqual(['a', 'b'])
    })

    it('replaces when id exists', () => {
      const existing = [makeMsg('a', 1000)]
      const replacement = makeMsg('a', 5000)

      const result = upsertMessage(existing, replacement)
      expect(result).toHaveLength(1)
      expect(result[0].sentAt.getTime()).toBe(5000)
    })

    it('preserves order when replacing', () => {
      const existing = [
        makeMsg('a', 1000),
        makeMsg('b', 2000),
        makeMsg('c', 3000),
      ]
      const replacement = makeMsg('b', 2500)

      const result = upsertMessage(existing, replacement)
      expect(result.map(m => m.id)).toEqual(['a', 'b', 'c'])
      expect(result[1].sentAt.getTime()).toBe(2500)
    })

    it('returns a new array without mutating original', () => {
      const existing = [makeMsg('a', 1000)]
      const original = [...existing]
      const next = makeMsg('b', 2000)

      upsertMessage(existing, next)
      
      expect(existing).toEqual(original)
    })

    it('handles empty array', () => {
      const next = makeMsg('a', 1000)
      const result = upsertMessage([], next)
      expect(result).toEqual([next])
    })
  })

  describe('combined upsert + sort', () => {
    it('maintains stable ordering when streaming new messages', () => {
      const base = [makeMsg('a', 1000), makeMsg('b', 2000)]
      const newMsg = makeMsg('c', 1500)

      const upserted = upsertMessage(base, newMsg)
      const sorted = sortMessages(upserted)

      expect(sorted.map(m => m.id)).toEqual(['a', 'c', 'b'])
    })

    it('handles duplicate streaming messages gracefully', () => {
      const base = [makeMsg('a', 1000), makeMsg('b', 2000)]
      
      // Simulate receiving 'b' again from stream
      const duplicate = makeMsg('b', 2000)
      const upserted = upsertMessage(base, duplicate)
      const sorted = sortMessages(upserted)

      expect(sorted).toHaveLength(2)
      expect(sorted.map(m => m.id)).toEqual(['a', 'b'])
    })

    it('correctly orders messages received out-of-order', () => {
      let messages = [makeMsg('a', 1000)]
      
      // Message 'c' arrives before 'b'
      messages = sortMessages(upsertMessage(messages, makeMsg('c', 3000)))
      messages = sortMessages(upsertMessage(messages, makeMsg('b', 2000)))

      expect(messages.map(m => m.id)).toEqual(['a', 'b', 'c'])
    })
  })
})
