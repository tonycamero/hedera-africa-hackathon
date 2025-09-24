"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { RefreshCw, Clock, Users, Shield, Award, FileText } from "lucide-react"

interface HCSMessage {
  id: string
  type: string
  topicType: 'PROFILE' | 'CONTACT' | 'TRUST' | 'SIGNAL'
  topicId: string
  timestamp: string
  from: string
  to?: string
  payload: any
  sequenceNumber?: number
}

export function ActivityFeed() {
  const [messages, setMessages] = useState<HCSMessage[]>([])
  const [loading, setLoading] = useState(false)

  // For MVP demo, we'll show a combination of:
  // 1. Seeded data (from the seed script)
  // 2. Any new messages we submit
  const loadDemoMessages = () => {
    const demoMessages: HCSMessage[] = [
      {
        id: 'profile_1',
        type: 'PROFILE_UPDATE',
        topicType: 'PROFILE',
        topicId: process.env.NEXT_PUBLIC_TOPIC_PROFILE || '0.0.6889641',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        from: '0.0.5864559',
        payload: { handle: 'alice_dev', bio: 'Blockchain developer passionate about trust networks', visibility: 'public' }
      },
      {
        id: 'contact_1',
        type: 'CONTACT_REQUEST',
        topicType: 'CONTACT',
        topicId: process.env.NEXT_PUBLIC_TOPIC_CONTACT || '0.0.6889642',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        from: '0.0.5864559',
        to: '0.0.5864559',
        payload: { to: '0.0.5864559', fromProfileId: '0.0.5864559' }
      },
      {
        id: 'trust_1',
        type: 'TRUST_ALLOCATE',
        topicType: 'TRUST',
        topicId: process.env.NEXT_PUBLIC_TOPIC_TRUST || '0.0.6889643',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        from: '0.0.5864559',
        to: '0.0.5864559',
        payload: { to: '0.0.5864559', weight: 3 }
      },
      {
        id: 'signal_1',
        type: 'SIGNAL_MINT',
        topicType: 'SIGNAL',
        topicId: process.env.NEXT_PUBLIC_TOPIC_SIGNAL || '0.0.6889644',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        from: '0.0.5864559',
        to: '0.0.5864559',
        payload: { tokenId: 'sig-001', kind: 'achievement', name: 'Code Review Champion' }
      }
    ]

    // Add any messages from localStorage (for demo persistence)
    const storedMessages = localStorage.getItem('trustmesh_demo_messages')
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages)
        demoMessages.push(...parsed)
      } catch (e) {
        console.warn('Failed to parse stored messages:', e)
      }
    }

    setMessages(demoMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
  }

  useEffect(() => {
    loadDemoMessages()
  }, [])

  const refreshFeed = () => {
    setLoading(true)
    // Simulate loading delay
    setTimeout(() => {
      loadDemoMessages()
      setLoading(false)
    }, 500)
  }

  const getTopicIcon = (topicType: string) => {
    switch (topicType) {
      case 'PROFILE':
        return <FileText className="h-4 w-4" />
      case 'CONTACT':
        return <Users className="h-4 w-4" />
      case 'TRUST':
        return <Shield className="h-4 w-4" />
      case 'SIGNAL':
        return <Award className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTopicColor = (topicType: string) => {
    switch (topicType) {
      case 'PROFILE':
        return 'bg-blue-100 text-blue-800'
      case 'CONTACT':
        return 'bg-green-100 text-green-800'
      case 'TRUST':
        return 'bg-purple-100 text-purple-800'
      case 'SIGNAL':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatMessageDescription = (message: HCSMessage) => {
    const fromShort = message.from.slice(-6)
    const toShort = message.to ? message.to.slice(-6) : ''

    switch (message.type) {
      case 'PROFILE_UPDATE':
        return `Profile updated by ${fromShort}: ${message.payload.handle}`
      case 'CONTACT_REQUEST':
        return `Contact request from ${fromShort} to ${toShort}`
      case 'CONTACT_ACCEPT':
        return `Contact accepted by ${fromShort} from ${toShort}`
      case 'TRUST_ALLOCATE':
        return `Trust allocated by ${fromShort} to ${toShort} (weight: ${message.payload.weight})`
      case 'TRUST_REVOKE':
        return `Trust revoked by ${fromShort} from ${toShort}`
      case 'SIGNAL_MINT':
        return `Signal "${message.payload.name}" minted by ${fromShort}`
      case 'SIGNAL_TRANSFER':
        return `Signal transferred by ${fromShort} to ${toShort}`
      default:
        return `${message.type} by ${fromShort}`
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            TrustMesh Activity Feed
          </CardTitle>
          <Button onClick={refreshFeed} size="sm" variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Live activity across PROFILE • CONTACT • TRUST • SIGNAL topics
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {messages.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activity found</p>
              <p className="text-xs">Run the seed script to populate demo data</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getTopicIcon(message.topicType)}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{formatMessageDescription(message)}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • Topic: {message.topicId.slice(-6)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getTopicColor(message.topicType)}>
                    {message.topicType}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Helper function to add new messages (for the write action)
export function addMessageToFeed(message: Omit<HCSMessage, 'id'>) {
  const newMessage = {
    ...message,
    id: `${message.topicType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  const storedMessages = localStorage.getItem('trustmesh_demo_messages')
  let messages = []
  
  if (storedMessages) {
    try {
      messages = JSON.parse(storedMessages)
    } catch (e) {
      console.warn('Failed to parse stored messages:', e)
    }
  }
  
  messages.push(newMessage)
  
  // Keep only last 50 messages
  if (messages.length > 50) {
    messages = messages.slice(-50)
  }
  
  localStorage.setItem('trustmesh_demo_messages', JSON.stringify(messages))
  
  return newMessage
}