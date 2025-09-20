export interface XMTPMessage {
  id: string
  content: string
  senderAddress: string
  timestamp: Date
  conversationTopic: string
  trustLevel?: "contact" | "recognition" | "circle"
}

export interface XMTPConversation {
  topic: string
  peerAddress: string
  createdAt: Date
  lastMessage?: XMTPMessage
  trustLevel: "contact" | "recognition" | "circle"
  messageCount: number
}

export class XMTPClientWrapper {
  private isConnected = false
  private conversations: Map<string, XMTPConversation> = new Map()
  private messages: Map<string, XMTPMessage[]> = new Map()

  async initialize(walletAddress: string): Promise<void> {
    console.log(`[XMTPClient] Initializing for wallet: ${walletAddress}`)

    // TODO: Initialize actual XMTP client
    // const client = await Client.create(signer, { env: "production" })

    this.isConnected = true
    console.log(`[XMTPClient] Connected successfully`)
  }

  async createConversation(
    peerAddress: string,
    trustLevel: "contact" | "recognition" | "circle" = "contact",
  ): Promise<XMTPConversation> {
    const topic = `conversation:${peerAddress}:${Date.now()}`

    const conversation: XMTPConversation = {
      topic,
      peerAddress,
      createdAt: new Date(),
      trustLevel,
      messageCount: 0,
    }

    this.conversations.set(topic, conversation)
    this.messages.set(topic, [])

    console.log(`[XMTPClient] Created conversation with ${peerAddress} (trust: ${trustLevel})`)
    return conversation
  }

  async sendMessage(conversationTopic: string, content: string, senderAddress: string): Promise<XMTPMessage> {
    const conversation = this.conversations.get(conversationTopic)
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationTopic}`)
    }

    const message: XMTPMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      senderAddress,
      timestamp: new Date(),
      conversationTopic,
      trustLevel: conversation.trustLevel,
    }

    const messages = this.messages.get(conversationTopic) || []
    messages.push(message)
    this.messages.set(conversationTopic, messages)

    conversation.lastMessage = message
    conversation.messageCount++

    console.log(`[XMTPClient] Message sent in ${conversationTopic}: ${content}`)
    return message
  }

  async getConversations(): Promise<XMTPConversation[]> {
    return Array.from(this.conversations.values())
  }

  async getMessages(conversationTopic: string): Promise<XMTPMessage[]> {
    return this.messages.get(conversationTopic) || []
  }

  async getConversationByPeer(peerAddress: string): Promise<XMTPConversation | null> {
    for (const conversation of this.conversations.values()) {
      if (conversation.peerAddress === peerAddress) {
        return conversation
      }
    }
    return null
  }

  isReady(): boolean {
    return this.isConnected
  }
}

export const xmtpClient = new XMTPClientWrapper()
