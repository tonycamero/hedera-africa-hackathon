import type { ChatContext } from "../../lib/types/ScendContext"
import { contextEngine } from "../../lib/context-engine/ContextEngine"
import { xmtpClient } from "../../packages/xmtp/XMTPClient"

export async function handleChatContext(context: ChatContext): Promise<void> {
  console.log(`[MessageHandler] Processing chat context:`, context)

  const { threadId, action, message, userId } = context.payload

  // Ensure XMTP client is initialized
  if (!xmtpClient.isReady()) {
    await xmtpClient.initialize(userId || "default-wallet")
  }

  switch (action) {
    case "notify":
      await handleNotification(threadId, message, userId)
      break

    case "message":
      await handleDirectMessage(threadId, message, userId)
      break

    case "system":
      await handleSystemMessage(message, userId)
      break

    default:
      console.warn(`[MessageHandler] Unknown action: ${action}`)
  }
}

async function handleNotification(threadId: string, message: string, userId?: string): Promise<void> {
  console.log(`[MessageHandler] Sending notification to ${threadId}: ${message}`)

  // Extract peer address from threadId (format: wallet:0xabc)
  const peerAddress = threadId.replace("wallet:", "")

  // Find or create conversation
  let conversation = await xmtpClient.getConversationByPeer(peerAddress)
  if (!conversation) {
    conversation = await xmtpClient.createConversation(peerAddress, "contact")
  }

  // Send notification message
  await xmtpClient.sendMessage(conversation.topic, `🔔 ${message}`, "system")
}

async function handleDirectMessage(threadId: string, message: string, userId?: string): Promise<void> {
  console.log(`[MessageHandler] Processing message from ${userId}: ${message}`)

  const peerAddress = threadId.replace("wallet:", "")

  // Check for trust-based message routing
  if (message.toLowerCase().includes("trst") || message.toLowerCase().includes("payment")) {
    // Trigger payment context for TRST-related messages
    const paymentContext = {
      type: "payment" as const,
      payload: {
        to: peerAddress,
        amount: extractTRSTAmount(message),
        reason: "Chat-triggered transfer",
        from: userId || "unknown",
      },
      timestamp: Date.now(),
      source: "chat-loop",
    }

    await contextEngine.processContext(paymentContext)
  }

  // Find or create conversation with appropriate trust level
  let conversation = await xmtpClient.getConversationByPeer(peerAddress)
  if (!conversation) {
    const trustLevel = determineTrustLevel(userId, peerAddress)
    conversation = await xmtpClient.createConversation(peerAddress, trustLevel)
  }

  // Send the message
  await xmtpClient.sendMessage(conversation.topic, message, userId || "anonymous")
}

async function handleSystemMessage(message: string, userId?: string): Promise<void> {
  console.log(`[MessageHandler] System message: ${message}`)

  // Broadcast system messages to all active conversations
  const conversations = await xmtpClient.getConversations()

  for (const conversation of conversations) {
    await xmtpClient.sendMessage(conversation.topic, `[System] ${message}`, "system")
  }
}

function extractTRSTAmount(message: string): number {
  const match = message.match(/(\d+)\s*trst/i)
  return match ? Number.parseInt(match[1]) : 1
}

function determineTrustLevel(userId?: string, peerAddress?: string): "contact" | "recognition" | "circle" {
  // TODO: Implement actual trust level determination based on token relationships
  // For now, default to contact level
  return "contact"
}

contextEngine.registerHandler("chat", handleChatContext)
