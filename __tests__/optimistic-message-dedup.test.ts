/**
 * @jest-environment node
 * 
 * Tests for optimistic message deduplication (LP-3)
 * 
 * Verifies that temp messages are replaced by real XMTP messages
 * when they arrive via stream, preventing duplicates in the UI.
 */

describe('Optimistic message deduplication', () => {
  /**
   * Simulates the filter logic used in MessageThread stream handler
   */
  function removeTempDuplicates(
    messages: Array<{ id: string; content: string; isSent: boolean; sentAt: Date }>,
    newMessage: { id: string; content: string; isSent: boolean; sentAt: Date }
  ) {
    return messages.filter(m => 
      !(m.id.startsWith('temp-') && 
        m.content === newMessage.content && 
        m.isSent === newMessage.isSent &&
        Math.abs(m.sentAt.getTime() - newMessage.sentAt.getTime()) < 5000)
    )
  }

  it('removes temp message when real message arrives with same content', () => {
    const tempMsg = {
      id: 'temp-123-abc',
      content: 'Hello world',
      isSent: true,
      sentAt: new Date(1000)
    }

    const realMsg = {
      id: 'real-xmtp-456',
      content: 'Hello world',
      isSent: true,
      sentAt: new Date(1050) // 50ms later
    }

    const messages = [tempMsg]
    const filtered = removeTempDuplicates(messages, realMsg)

    expect(filtered).toHaveLength(0)
    expect(filtered).not.toContain(tempMsg)
  })

  it('keeps temp message if content differs', () => {
    const tempMsg = {
      id: 'temp-123-abc',
      content: 'Hello world',
      isSent: true,
      sentAt: new Date(1000)
    }

    const realMsg = {
      id: 'real-xmtp-456',
      content: 'Different message',
      isSent: true,
      sentAt: new Date(1050)
    }

    const messages = [tempMsg]
    const filtered = removeTempDuplicates(messages, realMsg)

    expect(filtered).toHaveLength(1)
    expect(filtered).toContain(tempMsg)
  })

  it('keeps temp message if sender differs', () => {
    const tempMsg = {
      id: 'temp-123-abc',
      content: 'Hello world',
      isSent: true, // Sent by me
      sentAt: new Date(1000)
    }

    const realMsg = {
      id: 'real-xmtp-456',
      content: 'Hello world',
      isSent: false, // Received from other
      sentAt: new Date(1050)
    }

    const messages = [tempMsg]
    const filtered = removeTempDuplicates(messages, realMsg)

    expect(filtered).toHaveLength(1)
    expect(filtered).toContain(tempMsg)
  })

  it('keeps temp message if timestamp difference too large (>5s)', () => {
    const tempMsg = {
      id: 'temp-123-abc',
      content: 'Hello world',
      isSent: true,
      sentAt: new Date(1000)
    }

    const realMsg = {
      id: 'real-xmtp-456',
      content: 'Hello world',
      isSent: true,
      sentAt: new Date(10000) // 9 seconds later (outside 5s window)
    }

    const messages = [tempMsg]
    const filtered = removeTempDuplicates(messages, realMsg)

    expect(filtered).toHaveLength(1)
    expect(filtered).toContain(tempMsg)
  })

  it('only removes matching temp message, keeps others', () => {
    const tempMsg1 = {
      id: 'temp-123-abc',
      content: 'Hello world',
      isSent: true,
      sentAt: new Date(1000)
    }

    const tempMsg2 = {
      id: 'temp-456-def',
      content: 'Another message',
      isSent: true,
      sentAt: new Date(2000)
    }

    const realMsg = {
      id: 'real-xmtp-789',
      content: 'Hello world', // Matches tempMsg1 only
      isSent: true,
      sentAt: new Date(1050)
    }

    const messages = [tempMsg1, tempMsg2]
    const filtered = removeTempDuplicates(messages, realMsg)

    expect(filtered).toHaveLength(1)
    expect(filtered).toContain(tempMsg2)
    expect(filtered).not.toContain(tempMsg1)
  })

  it('does not remove non-temp messages', () => {
    const realMsg1 = {
      id: 'real-xmtp-123',
      content: 'Hello world',
      isSent: true,
      sentAt: new Date(1000)
    }

    const realMsg2 = {
      id: 'real-xmtp-456',
      content: 'Hello world', // Same content
      isSent: true,
      sentAt: new Date(1050)
    }

    const messages = [realMsg1]
    const filtered = removeTempDuplicates(messages, realMsg2)

    // Should keep realMsg1 because it doesn't start with 'temp-'
    expect(filtered).toHaveLength(1)
    expect(filtered).toContain(realMsg1)
  })

  it('handles multiple temp messages with same content', () => {
    const tempMsg1 = {
      id: 'temp-123-abc',
      content: 'Hello',
      isSent: true,
      sentAt: new Date(1000)
    }

    const tempMsg2 = {
      id: 'temp-456-def',
      content: 'Hello', // Same content
      isSent: true,
      sentAt: new Date(1010)
    }

    const realMsg = {
      id: 'real-xmtp-789',
      content: 'Hello',
      isSent: true,
      sentAt: new Date(1020)
    }

    const messages = [tempMsg1, tempMsg2]
    const filtered = removeTempDuplicates(messages, realMsg)

    // Both temp messages should be removed
    expect(filtered).toHaveLength(0)
  })

  it('uses 5-second window correctly at boundary', () => {
    const tempMsg = {
      id: 'temp-123-abc',
      content: 'Hello',
      isSent: true,
      sentAt: new Date(1000)
    }

    // Exactly 5 seconds later (4999ms should remove, 5000ms should keep)
    const realMsgWithin = {
      id: 'real-xmtp-456',
      content: 'Hello',
      isSent: true,
      sentAt: new Date(1000 + 4999)
    }

    const realMsgOutside = {
      id: 'real-xmtp-789',
      content: 'Hello',
      isSent: true,
      sentAt: new Date(1000 + 5000)
    }

    // Within window - should remove
    expect(removeTempDuplicates([tempMsg], realMsgWithin)).toHaveLength(0)

    // Outside window - should keep
    expect(removeTempDuplicates([tempMsg], realMsgOutside)).toHaveLength(1)
  })
})
