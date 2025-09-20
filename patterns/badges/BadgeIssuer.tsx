"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BADGE_DEFINITIONS, type BadgeDefinition } from "@/lib/types/BadgeTypes"
import { BadgeEngine } from "@/packages/badges/BadgeEngine"

interface BadgeIssuerProps {
  issuerId: string
  onBadgeIssued?: (badge: any) => void
}

export function BadgeIssuer({ issuerId, onBadgeIssued }: BadgeIssuerProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null)
  const [recipient, setRecipient] = useState("")
  const [notes, setNotes] = useState("")
  const [isIssuing, setIsIssuing] = useState(false)

  const badgeEngine = new BadgeEngine()

  const handleIssueBadge = async () => {
    if (!selectedBadge || !recipient) return

    setIsIssuing(true)
    try {
      const badge = await badgeEngine.issueBadge(selectedBadge.id, issuerId, recipient, notes)

      onBadgeIssued?.(badge)

      // Reset form
      setSelectedBadge(null)
      setRecipient("")
      setNotes("")

      alert(`Badge "${selectedBadge.name}" issued successfully!`)
    } catch (error) {
      console.error("Failed to issue badge:", error)
      alert("Failed to issue badge. Please try again.")
    } finally {
      setIsIssuing(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "rare":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-blue-100 text-blue-800 border-blue-300"
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎖️</span>
          Issue Badge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="badge-select">Select Badge</Label>
          <Select
            onValueChange={(value) => {
              const badge = BADGE_DEFINITIONS.find((b) => b.id === value)
              setSelectedBadge(badge || null)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a badge to issue" />
            </SelectTrigger>
            <SelectContent>
              {BADGE_DEFINITIONS.map((badge) => (
                <SelectItem key={badge.id} value={badge.id}>
                  <div className="flex items-center gap-2">
                    <span>{badge.emoji}</span>
                    <span>{badge.name}</span>
                    <Badge className={`text-xs ${getRarityColor(badge.rarity)}`}>{badge.rarity}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBadge && (
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{selectedBadge.emoji}</span>
                <div>
                  <h3 className="font-semibold">{selectedBadge.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{selectedBadge.description}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedBadge.category}</Badge>
                    <Badge className={getRarityColor(selectedBadge.rarity)}>{selectedBadge.rarity}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Criteria:</strong> {selectedBadge.criteria}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <Label htmlFor="recipient">Recipient Address/ID</Label>
          <Input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient's address or ID"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional context or notes..."
            rows={3}
          />
        </div>

        <Button onClick={handleIssueBadge} disabled={!selectedBadge || !recipient || isIssuing} className="w-full">
          {isIssuing ? "Issuing Badge..." : "Issue Badge"}
        </Button>
      </CardContent>
    </Card>
  )
}
