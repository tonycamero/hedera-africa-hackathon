/**
 * @jest-environment jsdom
 * 
 * Tests for XMTP read receipts (XMTP-12)
 * 
 * Verifies:
 * - Local read receipt storage
 * - Monotonic timestamp updates
 * - Unread count computation
 */

import {
  getLastRead,
  markConversationRead,
  computeUnreadCount,
} from '@/lib/xmtp/readReceipts'

describe('XMTP read receipts', () => {
  const conversationId = 'convo-123'

  beforeEach(() => {
    // Reset localStorage between tests
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  afterAll(() => {
    jest.clearAllTimers()
    jest.restoreAllMocks()
  })

  describe('markConversationRead', () => {
    it('stores monotonically increasing timestamps', () => {
      markConversationRead(conversationId, 1000)
      expect(getLastRead(conversationId)).toBe(1000)

      // Older timestamp should not overwrite
      markConversationRead(conversationId, 500)
      expect(getLastRead(conversationId)).toBe(1000)

      // Newer timestamp should overwrite
      markConversationRead(conversationId, 5000)
      expect(getLastRead(conversationId)).toBe(5000)
    })

    it('handles multiple conversations independently', () => {
      markConversationRead('convo-1', 1000)
      markConversationRead('convo-2', 2000)

      expect(getLastRead('convo-1')).toBe(1000)
      expect(getLastRead('convo-2')).toBe(2000)
    })

    it('returns null for never-read conversations', () => {
      expect(getLastRead('never-seen')).toBeNull()
    })

    it('persists across function calls (uses localStorage)', () => {
      markConversationRead(conversationId, 3000)
      
      // Simulate reload by directly checking localStorage
      const stored = window.localStorage.getItem('trustmesh_xmtp_read_receipts_v1')
      expect(stored).toBeTruthy()
      
      const parsed = JSON.parse(stored!)
      expect(parsed[conversationId]).toBe(3000)
    })
  })

  describe('computeUnreadCount', () => {
    it('counts messages after lastRead', () => {
      const msgs = [
        { sentAt: new Date(1000) },
        { sentAt: new Date(2000) },
        { sentAt: new Date(3000) },
      ]

      // Nothing read yet
      expect(computeUnreadCount(conversationId, msgs)).toBe(3)

      markConversationRead(conversationId, 1500)
      expect(computeUnreadCount(conversationId, msgs)).toBe(2)

      markConversationRead(conversationId, 3000)
      expect(computeUnreadCount(conversationId, msgs)).toBe(0)
    })

    it('returns 0 when all messages are read', () => {
      const msgs = [
        { sentAt: new Date(1000) },
        { sentAt: new Date(2000) },
      ]

      markConversationRead(conversationId, 5000)
      expect(computeUnreadCount(conversationId, msgs)).toBe(0)
    })

    it('handles empty message list', () => {
      expect(computeUnreadCount(conversationId, [])).toBe(0)
    })

    it('counts all messages when conversation never read', () => {
      const msgs = [
        { sentAt: new Date(1000) },
        { sentAt: new Date(2000) },
        { sentAt: new Date(3000) },
      ]

      expect(computeUnreadCount('never-read', msgs)).toBe(3)
    })

    it('handles messages with exact lastRead timestamp correctly', () => {
      const msgs = [
        { sentAt: new Date(1000) },
        { sentAt: new Date(2000) },
        { sentAt: new Date(3000) },
      ]

      // Mark as read exactly at message 2's timestamp
      markConversationRead(conversationId, 2000)
      
      // Messages > 2000 should be unread (only message 3)
      expect(computeUnreadCount(conversationId, msgs)).toBe(1)
    })
  })

  describe('localStorage edge cases', () => {
    it('handles malformed localStorage data gracefully', () => {
      window.localStorage.setItem('trustmesh_xmtp_read_receipts_v1', 'invalid json')
      
      // Should return null and not throw
      expect(getLastRead(conversationId)).toBeNull()
      
      // Should be able to write new data
      markConversationRead(conversationId, 1000)
      expect(getLastRead(conversationId)).toBe(1000)
    })

    it('handles missing localStorage gracefully', () => {
      // Mock localStorage as unavailable
      const originalLocalStorage = window.localStorage
      Object.defineProperty(window, 'localStorage', {
        get() { return undefined },
        configurable: true
      })

      // Should not throw
      expect(() => markConversationRead(conversationId, 1000)).not.toThrow()
      expect(() => getLastRead(conversationId)).not.toThrow()
      
      // Restore
      Object.defineProperty(window, 'localStorage', {
        get() { return originalLocalStorage },
        configurable: true
      })
    })
  })
})
