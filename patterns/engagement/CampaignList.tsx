"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Trophy, Calendar } from "lucide-react"
import { hederaClient, type CampaignData } from "../../packages/hedera/HederaClient"
import { contextEngine } from "../../lib/context-engine/ContextEngine"

interface CampaignListProps {
  userId: string
  onCampaignSelect?: (campaign: CampaignData) => void
}

export function CampaignList({ userId, onCampaignSelect }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      if (!hederaClient.isReady()) {
        await hederaClient.initialize()
      }

      const allCampaigns = hederaClient.getAllCampaigns()
      setCampaigns(allCampaigns)
    } catch (error) {
      console.error("Failed to load campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const joinCampaign = async (campaignId: string) => {
    try {
      await contextEngine.processContext({
        type: "engagement",
        payload: {
          campaignId,
          action: "join",
          userId,
        },
        timestamp: Date.now(),
        source: "campaign-list",
      })

      // Refresh campaigns
      await loadCampaigns()
    } catch (error) {
      console.error("Failed to join campaign:", error)
    }
  }

  const completeCampaign = async (campaignId: string) => {
    try {
      await contextEngine.processContext({
        type: "engagement",
        payload: {
          campaignId,
          action: "complete",
          userId,
        },
        timestamp: Date.now(),
        source: "campaign-list",
      })

      // Refresh campaigns
      await loadCampaigns()
    } catch (error) {
      console.error("Failed to complete campaign:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading campaigns...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Campaigns
          </div>
          <Badge variant="outline">{campaigns.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {campaigns.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No campaigns available</p>
              <Button onClick={loadCampaigns} size="sm" className="mt-2">
                Refresh
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {campaigns.map((campaign) => {
                const isParticipant = campaign.participants.includes(userId)
                const hasRewards = campaign.rewards.some((nft) => nft.owner === userId)

                return (
                  <div
                    key={campaign.id}
                    className="p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onCampaignSelect?.(campaign)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">{campaign.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{campaign.description}</p>
                      </div>
                      <div className="flex gap-1">
                        {isParticipant && (
                          <Badge variant="secondary" className="text-xs">
                            Joined
                          </Badge>
                        )}
                        {hasRewards && (
                          <Badge variant="default" className="text-xs">
                            Rewarded
                          </Badge>
                        )}
                        {campaign.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.participants.length}
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {campaign.rewards.length}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {campaign.startDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!isParticipant && campaign.isActive && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            joinCampaign(campaign.id)
                          }}
                          size="sm"
                          className="flex-1"
                        >
                          Join Campaign
                        </Button>
                      )}
                      {isParticipant && !hasRewards && campaign.isActive && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            completeCampaign(campaign.id)
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          Complete & Claim
                        </Button>
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
  )
}
