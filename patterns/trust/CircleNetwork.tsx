"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Crown, Users, Clock, CheckCircle, XCircle, Send } from "lucide-react"
import { trustEngine } from "../../packages/trust/TrustEngine"
import type { CircleNetworkType, CircleToken, CircleInvitation } from "../../lib/types/TrustTypes"

interface CircleNetworkProps {
  currentUserId: string
}

export function CircleNetworkComponent({ currentUserId }: CircleNetworkProps) {
  const [network, setNetwork] = useState<CircleNetworkType | null>(null)
  const [circleTokens, setCircleTokens] = useState<CircleToken[]>([])
  const [invitations, setInvitations] = useState<CircleInvitation[]>([])
  const [newInviteUser, setNewInviteUser] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCircleData()
  }, [currentUserId])

  const loadCircleData = async () => {
    setLoading(true)
    try {
      const userNetwork = await trustEngine.getOrCreateCircleNetwork(currentUserId)
      const tokens = trustEngine.getCircleTokens(currentUserId)
      const userInvitations = trustEngine.getCircleInvitations(currentUserId)

      setNetwork(userNetwork)
      setCircleTokens(tokens)
      setInvitations(userInvitations)
    } catch (error) {
      console.error("Failed to load circle data:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendCircleInvitation = async () => {
    if (!newInviteUser.trim()) return

    try {
      await trustEngine.createCircleInvitation(
        currentUserId,
        newInviteUser,
        "Would you like to join my circle of trust?",
      )
      setNewInviteUser("")
      await loadCircleData()
    } catch (error) {
      console.error("Failed to send invitation:", error)
      alert(error instanceof Error ? error.message : "Failed to send invitation")
    }
  }

  const acceptInvitation = async (invitationId: string) => {
    try {
      await trustEngine.acceptCircleInvitation(invitationId)
      await loadCircleData()
    } catch (error) {
      console.error("Failed to accept invitation:", error)
      alert(error instanceof Error ? error.message : "Failed to accept invitation")
    }
  }

  const revokeCircleToken = async (tokenId: string) => {
    try {
      await trustEngine.revokeCircleToken(tokenId, "User requested revocation")
      await loadCircleData()
    } catch (error) {
      console.error("Failed to revoke token:", error)
      alert(error instanceof Error ? error.message : "Failed to revoke token")
    }
  }

  const getTokenStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "revoked":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getTokenStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "revoked":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading circle network...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!network) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Crown className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Failed to load circle network</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressPercentage = (network.activeCircles.length / 9) * 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Circle of Trust
            {network.isUnlocked && <Badge variant="default">Unlocked</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Circle Progress</span>
              <span>{network.activeCircles.length}/9 Active</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground">{network.availableSlots} slots remaining</div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{network.activeCircles.length}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{network.pendingOutbound.length}</div>
              <div className="text-xs text-muted-foreground">Pending Out</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{network.pendingInbound.length}</div>
              <div className="text-xs text-muted-foreground">Pending In</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Send Circle Invitation</label>
            <div className="flex gap-2">
              <Input
                value={newInviteUser}
                onChange={(e) => setNewInviteUser(e.target.value)}
                placeholder="User ID or wallet address"
                disabled={network.availableSlots <= 0}
              />
              <Button
                onClick={sendCircleInvitation}
                disabled={!newInviteUser.trim() || network.availableSlots <= 0}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {network.availableSlots <= 0 && (
              <p className="text-xs text-red-600">
                No available circle slots. Revoke existing tokens to send new invitations.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Circle Invitations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-48">
              <div className="space-y-2 p-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">
                        {invitation.from === currentUserId ? "To: " : "From: "}
                        {(invitation.from === currentUserId ? invitation.to : invitation.from).slice(0, 8)}...
                      </div>
                      {invitation.message && (
                        <div className="text-xs text-muted-foreground mt-1">{invitation.message}</div>
                      )}
                    </div>
                    {invitation.to === currentUserId && (
                      <Button onClick={() => acceptInvitation(invitation.id)} size="sm">
                        Accept
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Circle Tokens</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64">
            {circleTokens.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No circle tokens yet</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {circleTokens.map((token) => {
                  const isOutbound = token.issuer === currentUserId
                  const otherUser = isOutbound ? token.recipient : token.issuer

                  return (
                    <div key={token.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTokenStatusIcon(token.status)}
                        <div>
                          <div className="font-medium text-sm">
                            {isOutbound ? "→" : "←"} {otherUser.slice(0, 8)}...{otherUser.slice(-6)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isOutbound ? "Issued" : "Received"} • Weight: {token.weight}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTokenStatusColor(token.status)}>{token.status}</Badge>
                        {isOutbound && token.status !== "revoked" && (
                          <Button
                            onClick={() => revokeCircleToken(token.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            Revoke
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
    </div>
  )
}

export { CircleNetworkComponent as CircleNetwork }
