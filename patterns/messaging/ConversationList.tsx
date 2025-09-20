"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { xmtpClient, type XMTPConversation } from "../../packages/xmtp/XMTPClient"

interface ConversationListProps {
  onSelectConversation?: (conversation: XMTPConversation) => void
}

export function ConversationList({ onSelectConversation }: ConversationListProps) {
  const [conversations, setConversations] = useState<XMTPConversation[]>([])

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    if (xmtpClient.isReady()) {
      const convs = await xmtpClient.getConversations()
      setConversations(convs)
    }
  }

  const getTrustColor = (trustLevel: string) => {
    switch (trustLevel) {
      case "circle":
        return "bg-purple-100 text-purple-800"
      case "recognition":
        return "bg-blue-100 text-blue-800"
      case "contact":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Conversations
          <Badge variant="outline">{conversations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No conversations yet</div>
          ) : (
            <div className="space-y-2 p-4">
              {conversations.map((conversation) => (
                <div
                  key={conversation.topic}
                  className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onSelectConversation?.(conversation)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {conversation.peerAddress.slice(0, 8)}...{conversation.peerAddress.slice(-6)}
                    </span>
                    <Badge className={getTrustColor(conversation.trustLevel)}>{conversation.trustLevel}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{conversation.messageCount} messages</div>
                  {conversation.lastMessage && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {conversation.lastMessage.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
