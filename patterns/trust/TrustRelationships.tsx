"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Award, Crown, TrendingUp, RefreshCw } from "lucide-react"
import { trustEngine } from "../../packages/trust/TrustEngine"
import type { TrustRelationship, TrustScoreComponents } from "../../lib/types/TrustTypes"

interface TrustRelationshipsProps {
  currentUserId: string
}

export function TrustRelationships({ currentUserId }: TrustRelationshipsProps) {
  const [relationships, setRelationships] = useState<TrustRelationship[]>([])
  const [selectedRelationship, setSelectedRelationship] = useState<TrustRelationship | null>(null)
  const [scoreBreakdown, setScoreBreakdown] = useState<TrustScoreComponents | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRelationships()
  }, [currentUserId])

  const loadRelationships = async () => {
    setLoading(true)
    try {
      const allRelationships = trustEngine.getAllRelationships()
      const userRelationships = allRelationships.filter((r) => r.userA === currentUserId || r.userB === currentUserId)
      setRelationships(userRelationships)
    } catch (error) {
      console.error("Failed to load relationships:", error)
    } finally {
      setLoading(false)
    }
  }

  const viewScoreBreakdown = async (relationship: TrustRelationship) => {
    setSelectedRelationship(relationship)
    const otherUser = relationship.userA === currentUserId ? relationship.userB : relationship.userA
    const breakdown = await trustEngine.calculateTrustScore(currentUserId, otherUser)
    setScoreBreakdown(breakdown)
  }

  const getTokenIcon = (type: string) => {
    switch (type) {
      case "contact":
        return <Users className="h-3 w-3" />
      case "recognition":
        return <Award className="h-3 w-3" />
      case "circle":
        return <Crown className="h-3 w-3" />
      default:
        return null
    }
  }

  const getTokenColor = (type: string) => {
    switch (type) {
      case "contact":
        return "bg-blue-100 text-blue-800"
      case "recognition":
        return "bg-green-100 text-green-800"
      case "circle":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading relationships...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Trust Relationships
            <Badge variant="outline">{relationships.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {relationships.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No trust relationships yet</p>
                <Button onClick={loadRelationships} size="sm" className="mt-2">
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {relationships.map((relationship) => {
                  const otherUser = relationship.userA === currentUserId ? relationship.userB : relationship.userA
                  const activeTokens = relationship.tokens.filter((t) => t.isActive)
                  const tokenCounts = {
                    contact: activeTokens.filter((t) => t.type === "contact").length,
                    recognition: activeTokens.filter((t) => t.type === "recognition").length,
                    circle: activeTokens.filter((t) => t.type === "circle").length,
                  }

                  return (
                    <div
                      key={relationship.id}
                      className="p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => viewScoreBreakdown(relationship)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-sm">
                            {otherUser.slice(0, 8)}...{otherUser.slice(-6)}
                          </h3>
                          <p className="text-xs text-muted-foreground">{activeTokens.length} active tokens</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-lg font-bold">{relationship.trustScore}</div>
                            <div className="text-xs text-muted-foreground">Trust Score</div>
                          </div>
                          {relationship.mutualCircleTokens && (
                            <Badge variant="default" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Circle
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {tokenCounts.contact > 0 && (
                          <Badge className={getTokenColor("contact")}>
                            {getTokenIcon("contact")}
                            <span className="ml-1">{tokenCounts.contact}</span>
                          </Badge>
                        )}
                        {tokenCounts.recognition > 0 && (
                          <Badge className={getTokenColor("recognition")}>
                            {getTokenIcon("recognition")}
                            <span className="ml-1">{tokenCounts.recognition}</span>
                          </Badge>
                        )}
                        {tokenCounts.circle > 0 && (
                          <Badge className={getTokenColor("circle")}>
                            {getTokenIcon("circle")}
                            <span className="ml-1">{tokenCounts.circle}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedRelationship && scoreBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trust Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Contact Score:</span>
                  <span className="font-mono">{scoreBreakdown.contactScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Recognition Score:</span>
                  <span className="font-mono">{scoreBreakdown.recognitionScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Circle Score:</span>
                  <span className="font-mono">{scoreBreakdown.circleScore}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Frequency Penalty:</span>
                  <span className="font-mono text-red-600">-{scoreBreakdown.frequencyPenalty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Issuer Modulation:</span>
                  <span className="font-mono text-blue-600">+{scoreBreakdown.issuerModulation.toFixed(1)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Final Score:</span>
                  <span className="font-mono text-lg">{scoreBreakdown.finalScore}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
