// lib/xmtp/conversationHelpers.ts
// LP-1: Helpers for conversation ID derivation and message preview

import type { Dm, DecodedMessage } from '@xmtp/browser-sdk'
import { computeUnreadCount } from './readReceipts'
import { sortMessages } from './messageOrdering'

/**
 * Get stable conversation ID from XMTP DM
 * Uses topic as the unique identifier
 */
export function getConversationId(dm: Dm): string {
  // V3 DMs use 'topic' as the unique identifier
  return (dm as any).topic ?? (dm as any).id ?? ''
}

/**
 * Format a message for preview display
 */
export function formatMessagePreview(
  message: DecodedMessage,
  currentUserInboxId: string,
  maxLength: number = 50
): { text: string; isFromSelf: boolean } {
  const isFromSelf = message.senderInboxId === currentUserInboxId
  const content = typeof message.content === 'string' 
    ? message.content 
    : JSON.stringify(message.content)
  
  const truncated = content.length > maxLength
    ? content.substring(0, maxLength) + '...'
    : content
  
  const prefix = isFromSelf ? 'You: ' : ''
  
  return {
    text: prefix + truncated,
    isFromSelf
  }
}

/**
 * Get conversation metadata including unread count and last message
 */
export async function getConversationMetadata(
  dm: Dm,
  currentUserInboxId: string
): Promise<{
  conversationId: string
  unreadCount: number
  lastMessage: {
    content: string
    sentAt: Date
    isFromSelf: boolean
  } | null
}> {
  const conversationId = getConversationId(dm)
  
  // Sync messages to get latest
  await dm.sync()
  const messages = await dm.messages()
  
  // Sort messages to ensure consistent ordering
  const sorted = sortMessages(
    messages.map(m => ({
      id: m.id,
      sentAt: m.sentAt
    }))
  )
  
  // Compute unread count
  const unreadCount = computeUnreadCount(conversationId, sorted)
  
  // Get last message
  let lastMessage = null
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1]
    const preview = formatMessagePreview(lastMsg, currentUserInboxId)
    lastMessage = {
      content: preview.text,
      sentAt: lastMsg.sentAt,
      isFromSelf: preview.isFromSelf
    }
  }
  
  return {
    conversationId,
    unreadCount,
    lastMessage
  }
}
