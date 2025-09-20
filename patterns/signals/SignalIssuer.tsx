"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SIGNAL_DEFINITIONS, type SignalDefinition } from "@/lib/types/SignalTypes"
import { SignalEngine } from "@/packages/signals/SignalEngine"

interface SignalIssuerProps {
  issuerId: string
  onSignalIssued?: (signal: any) => void
}

export function SignalIssuer({ issuerId, onSignalIssued }: SignalIssuerProps) {
  const [selectedSignal, setSelectedSignal] = useState<SignalDefinition | null>(null)
  const [recipient, setRecipient] = useState("")
  const [notes, setNotes] = useState("")
  const [isIssuing, setIsIssuing] = useState(false)

  const signalEngine = new SignalEngine()

  const handleIssueSignal = async () => {
    if (!selectedSignal || !recipient) return

    setIsIssuing(true)
    try {
      const signal = await signalEngine.issueSignal(selectedSignal.id, issuerId, recipient, notes)

      onSignalIssued?.(signal)

      // Reset form
      setSelectedSignal(null)
      setRecipient("")
      setNotes("")

      alert(`Signal "${selectedSignal.name}" issued successfully!`)
    } catch (error) {
      console.error("Failed to issue signal:", error)
      alert("Failed to issue signal. Please try again.")
    } finally {
      setIsIssuing(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📡</span>
          Issue Trust Signal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="signal-select">Select Signal</Label>
          <Select
            onValueChange={(value) => {
              const signal = SIGNAL_DEFINITIONS.find((s) => s.id === value)
              setSelectedSignal(signal || null)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a signal to issue" />
            </SelectTrigger>
            <SelectContent>
              {SIGNAL_DEFINITIONS.map((signal) => (
                <SelectItem key={signal.id} value={signal.id}>
                  <div className="flex items-center gap-2">
                    <span>{signal.emoji}</span>
                    <span>{signal.name}</span>
                    <Badge className="text-xs bg-green-100 text-green-700">Verified</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSignal && (
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{selectedSignal.emoji}</span>
                <div>
                  <h3 className="font-semibold">{selectedSignal.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{selectedSignal.description}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedSignal.category}</Badge>
                    <Badge className="bg-green-100 text-green-700">Verified</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Criteria:</strong> {selectedSignal.criteria}
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

        <Button onClick={handleIssueSignal} disabled={!selectedSignal || !recipient || isIssuing} className="w-full">
          {isIssuing ? "Issuing Signal..." : "Issue Signal"}
        </Button>
      </CardContent>
    </Card>
  )
}