/**
 * @jest-environment node
 * 
 * Tests for XMTP conversation helpers (LP-1)
 * 
 * Verifies:
 * - Stable conversation ID derivation
 * - Message preview formatting
 * - Self vs other message detection
 */

import { getConversationId, formatMessagePreview } from '@/lib/xmtp/conversationHelpers'
import type { Dm, DecodedMessage } from '@xmtp/browser-sdk'

describe('XMTP conversation helpers', () => {
  describe('getConversationId', () => {
    it('extracts topic as conversation ID', () => {
      const dm = {
        topic: 'xmtp/dm/abc123',
        id: 'fallback-id'
      } as Dm

      const conversationId = getConversationId(dm)
      expect(conversationId).toBe('xmtp/dm/abc123')
    })

    it('falls back to id if topic unavailable', () => {
      const dm = {
        id: 'fallback-id'
      } as Dm

      const conversationId = getConversationId(dm)
      expect(conversationId).toBe('fallback-id')
    })

    it('returns empty string if both topic and id missing', () => {
      const dm = {} as Dm

      const conversationId = getConversationId(dm)
      expect(conversationId).toBe('')
    })
  })

  describe('formatMessagePreview', () => {
    const currentUserInboxId = 'user-inbox-123'

    it('prefixes own messages with "You: "', () => {
      const message = {
        id: 'msg-1',
        content: 'Hello world',
        senderInboxId: currentUserInboxId,
        sentAt: new Date()
      } as DecodedMessage

      const preview = formatMessagePreview(message, currentUserInboxId)
      
      expect(preview.text).toBe('You: Hello world')
      expect(preview.isFromSelf).toBe(true)
    })

    it('does not prefix other users messages', () => {
      const message = {
        id: 'msg-1',
        content: 'Hello world',
        senderInboxId: 'other-inbox-456',
        sentAt: new Date()
      } as DecodedMessage

      const preview = formatMessagePreview(message, currentUserInboxId)
      
      expect(preview.text).toBe('Hello world')
      expect(preview.isFromSelf).toBe(false)
    })

    it('truncates long messages', () => {
      const longMessage = 'a'.repeat(100)
      const message = {
        id: 'msg-1',
        content: longMessage,
        senderInboxId: 'other-inbox-456',
        sentAt: new Date()
      } as DecodedMessage

      const preview = formatMessagePreview(message, currentUserInboxId, 50)
      
      expect(preview.text).toHaveLength(53) // 50 chars + '...'
      expect(preview.text.endsWith('...')).toBe(true)
    })

    it('respects custom maxLength', () => {
      const message = {
        id: 'msg-1',
        content: 'This is a longer message that should be truncated',
        senderInboxId: 'other-inbox-456',
        sentAt: new Date()
      } as DecodedMessage

      const preview = formatMessagePreview(message, currentUserInboxId, 10)
      
      expect(preview.text).toBe('This is a ...')
    })

    it('does not truncate short messages', () => {
      const message = {
        id: 'msg-1',
        content: 'Short',
        senderInboxId: currentUserInboxId,
        sentAt: new Date()
      } as DecodedMessage

      const preview = formatMessagePreview(message, currentUserInboxId, 50)
      
      expect(preview.text).toBe('You: Short')
      expect(preview.text).not.toContain('...')
    })

    it('handles non-string content', () => {
      const message = {
        id: 'msg-1',
        content: { type: 'attachment', url: 'https://example.com/file.pdf' },
        senderInboxId: 'other-inbox-456',
        sentAt: new Date()
      } as any

      const preview = formatMessagePreview(message, currentUserInboxId)
      
      expect(preview.text).toContain('type')
      expect(preview.text).toContain('attachment')
    })

    it('truncates "You: " prefix correctly for self messages', () => {
      const longMessage = 'a'.repeat(100)
      const message = {
        id: 'msg-1',
        content: longMessage,
        senderInboxId: currentUserInboxId,
        sentAt: new Date()
      } as DecodedMessage

      const preview = formatMessagePreview(message, currentUserInboxId, 50)
      
      // "You: " + 50 chars + "..."
      expect(preview.text.startsWith('You: ')).toBe(true)
      expect(preview.text).toHaveLength(58) // "You: " (5) + 50 + "..." (3)
    })
  })
})
