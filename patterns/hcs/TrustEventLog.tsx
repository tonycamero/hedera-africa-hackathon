"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Clock, Users, Award, Crown, Send, Coins, FileText, TrendingUp, RefreshCw } from "lucide-react"
import { hcsLogger } from "../../packages/hedera/HCSLogger"
import type { TrustEvent, TrustEventType } from "../../lib/types/HCSTypes"

interface TrustEventLogProps {
  userId?: string
}

export function TrustEventLog({ userId }: TrustEventLogProps) {
  const [events, setEvents] = useState<TrustEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<TrustEvent[]>([])
  const [filterType, setFilterType] = useState<TrustEventType | "all">("all")
  const [searchUser, setSearchUser] = useState("")
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadEvents()
    loadStats()
  }, [userId])

  useEffect(() => {
    applyFilters()
  }, [events, filterType, searchUser])

  const loadEvents = async () => {
    setLoading(true)
    try {
      if (!hcsLogger.isReady()) {
        await hcsLogger.initialize()
      }

      let eventList: TrustEvent[]
      if (userId) {
        eventList = await hcsLogger.getUserEvents(userId, 100)
      } else {
        eventList = await hcsLogger.getAllEvents(100)
      }

      setEvents(eventList)
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const globalStats = await hcsLogger.getGlobalStats()
      setStats(globalStats)
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  const applyFilters = () => {
    let filtered = events

    if (filterType !== "all") {
      filtered = filtered.filter((event) => event.type === filterType)
    }

    if (searchUser.trim()) {
      filtered = filtered.filter(
        (event) =>
          event.actor.toLowerCase().includes(searchUser.toLowerCase()) ||
          (event.target && event.target.toLowerCase().includes(searchUser.toLowerCase())),
      )
    }

    setFilteredEvents(filtered)
  }

  const getEventIcon = (type: TrustEventType) => {
    switch (type) {
      case "trust_token_issued":
      case "trust_token_revoked":
        return <Award className="h-4 w-4" />
      case "circle_token_issued":
      case "circle_token_activated":
      case "circle_token_revoked":
        return <Crown className="h-4 w-4" />
      case "circle_invitation_sent":
      case "circle_invitation_accepted":
        return <Users className="h-4 w-4" />
      case "payment_sent":
      case "payment_received":
        return <Coins className="h-4 w-4" />
      case "message_sent":
        return <Send className="h-4 w-4" />
      case "trust_score_updated":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getEventColor = (type: TrustEventType) => {
    switch (type) {
      case "trust_token_issued":
        return "bg-green-100 text-green-800"
      case "trust_token_revoked":
        return "bg-red-100 text-red-800"
      case "circle_token_issued":
        return "bg-purple-100 text-purple-800"
      case "circle_token_activated":
        return "bg-blue-100 text-blue-800"
      case "circle_token_revoked":
        return "bg-red-100 text-red-800"
      case "circle_invitation_sent":
        return "bg-yellow-100 text-yellow-800"
      case "circle_invitation_accepted":
        return "bg-green-100 text-green-800"
      case "payment_sent":
        return "bg-emerald-100 text-emerald-800"
      case "trust_score_updated":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatEventDescription = (event: TrustEvent) => {
    const { type, actor, target, data } = event
    const actorShort = actor.slice(0, 8) + "..."
    const targetShort = target ? target.slice(0, 8) + "..." : ""

    switch (type) {
      case "trust_token_issued":
        return `${actorShort} issued ${data.tokenType} token to ${targetShort} (weight: ${data.weight})`
      case "trust_token_revoked":
        return `${actorShort} revoked ${data.tokenType} token from ${targetShort}`
      case "circle_token_issued":
        return `${actorShort} sent circle token to ${targetShort} (${data.status})`
      case "circle_token_activated":
        return `Circle tokens activated between ${actorShort} and ${targetShort}`
      case "circle_token_revoked":
        return `${actorShort} revoked circle token with ${targetShort}`
      case "circle_invitation_sent":
        return `${actorShort} sent circle invitation to ${targetShort}`
      case "circle_invitation_accepted":
        return `${actorShort} accepted circle invitation from ${targetShort}`
      case "payment_sent":
        return `${actorShort} sent ${data.amount} TRST to ${targetShort}`
      case "trust_score_updated":
        return `Trust score updated between ${actorShort} and ${targetShort}: ${data.oldScore} → ${data.newScore}`
      default:
        return `${type.replace(/_/g, " ")} by ${actorShort}`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading trust events...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              HCS Trust Event Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{Object.keys(stats.eventsByType).length}</div>
                <div className="text-sm text-muted-foreground">Event Types</div>
              </div>
              <div>
                <div className="text-sm font-mono">{stats.topicId?.slice(0, 12)}...</div>
                <div className="text-sm text-muted-foreground">HCS Topic</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trust Event Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select value={filterType} onValueChange={(value: TrustEventType | "all") => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="trust_token_issued">Trust Token Issued</SelectItem>
                  <SelectItem value="trust_token_revoked">Trust Token Revoked</SelectItem>
                  <SelectItem value="circle_token_issued">Circle Token Issued</SelectItem>
                  <SelectItem value="circle_token_activated">Circle Token Activated</SelectItem>
                  <SelectItem value="circle_token_revoked">Circle Token Revoked</SelectItem>
                  <SelectItem value="circle_invitation_sent">Circle Invitation Sent</SelectItem>
                  <SelectItem value="circle_invitation_accepted">Circle Invitation Accepted</SelectItem>
                  <SelectItem value="payment_sent">Payment Sent</SelectItem>
                  <SelectItem value="trust_score_updated">Trust Score Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search User</label>
              <Input
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="User ID or partial address"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
            </div>
            <Button onClick={loadEvents} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trust Event Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {filteredEvents.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No trust events found</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getEventIcon(event.type)}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{formatEventDescription(event)}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getEventColor(event.type)}>{event.type.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
