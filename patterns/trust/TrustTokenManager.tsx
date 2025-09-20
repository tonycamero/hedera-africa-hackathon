"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Award, Crown, AlertCircle } from "lucide-react"
import { trustEngine } from "../../packages/trust/TrustEngine"
import type { TrustTokenType } from "../../lib/types/TrustTypes"

interface TrustTokenManagerProps {
  currentUserId: string
}

export function TrustTokenManager({ currentUserId }: TrustTokenManagerProps) {
  const [recipient, setRecipient] = useState("")
  const [tokenType, setTokenType] = useState<TrustTokenType>("contact")
  const [reason, setReason] = useState("")
  const [context, setContext] = useState("")
  const [issuing, setIssuing] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadProfile()
  }, [currentUserId])

  const loadProfile = async () => {
    const userProfile = await trustEngine.getOrCreateProfile(currentUserId)
    setProfile(userProfile)
  }

  const issueToken = async () => {
    if (!recipient || !tokenType) return

    setIssuing(true)
    try {
      await trustEngine.issueToken(tokenType, currentUserId, recipient, reason || undefined, context || undefined)

      // Reset form
      setRecipient("")
      setReason("")
      setContext("")

      // Reload profile
      await loadProfile()
    } catch (error) {
      console.error("Failed to issue token:", error)
      alert(error instanceof Error ? error.message : "Failed to issue token")
    } finally {
      setIssuing(false)
    }
  }

  const getTokenIcon = (type: TrustTokenType) => {
    switch (type) {
      case "contact":
        return <Users className="h-4 w-4" />
      case "recognition":
        return <Award className="h-4 w-4" />
      case "circle":
        return <Crown className="h-4 w-4" />
    }
  }

  const getTokenColor = (type: TrustTokenType) => {
    switch (type) {
      case "contact":
        return "bg-blue-100 text-blue-800"
      case "recognition":
        return "bg-green-100 text-green-800"
      case "circle":
        return "bg-purple-100 text-purple-800"
    }
  }

  const canIssueCircleToken = profile?.tokenCounts?.circle?.issued < 9

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Issue Trust Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="User ID or wallet address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tokenType">Token Type</Label>
            <Select value={tokenType} onValueChange={(value: TrustTokenType) => setTokenType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contact">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contact Token (Weight: 1)
                  </div>
                </SelectItem>
                <SelectItem value="recognition">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Recognition Token (Weight: 5)
                  </div>
                </SelectItem>
                <SelectItem value="circle" disabled={!canIssueCircleToken}>
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Circle Token (Weight: 25)
                    {!canIssueCircleToken && <AlertCircle className="h-3 w-3 text-red-500" />}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {tokenType === "circle" && !canIssueCircleToken && (
              <p className="text-sm text-red-600">
                Circle token limit reached (9/9). Revoke existing tokens to issue new ones.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you issuing this token?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context (Optional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Additional context or campaign ID"
              rows={2}
            />
          </div>

          <Button
            onClick={issueToken}
            disabled={!recipient || !tokenType || issuing || (tokenType === "circle" && !canIssueCircleToken)}
            className="w-full"
          >
            {issuing ? "Issuing..." : `Issue ${tokenType} Token`}
          </Button>
        </CardContent>
      </Card>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Your Trust Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{profile.tokenCounts.contact.issued}</div>
                <div className="text-sm text-muted-foreground">Contact Issued</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{profile.tokenCounts.recognition.issued}</div>
                <div className="text-sm text-muted-foreground">Recognition Issued</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{profile.tokenCounts.circle.issued}/9</div>
                <div className="text-sm text-muted-foreground">Circle Issued</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <div className="font-semibold">Total Trust Score</div>
                <div className="text-sm text-muted-foreground">Across all relationships</div>
              </div>
              <div className="text-2xl font-bold">{profile.totalScore}</div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Circle Unlocked</div>
                <div className="text-sm text-muted-foreground">9 mutual circle connections</div>
              </div>
              <Badge variant={profile.circleUnlocked ? "default" : "secondary"}>
                {profile.circleUnlocked ? "Yes" : "No"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Issuer Class</div>
                <div className="text-sm text-muted-foreground">Trust modulation factor</div>
              </div>
              <Badge variant="outline" className="capitalize">
                {profile.issuerClass}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
