"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { contextEngine } from "../../lib/context-engine/ContextEngine"

interface SendPaymentFormProps {
  fromUserId: string
  onPaymentSent?: () => void
}

export function SendPaymentForm({ fromUserId, onPaymentSent }: SendPaymentFormProps) {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [campaignId, setCampaignId] = useState("")
  const [sending, setSending] = useState(false)

  const handleSendPayment = async () => {
    if (!recipient || !amount || Number.parseFloat(amount) <= 0) {
      return
    }

    setSending(true)
    try {
      await contextEngine.processContext({
        type: "payment",
        payload: {
          to: recipient,
          amount: Number.parseFloat(amount),
          reason: reason || "Direct transfer",
          campaignId: campaignId || undefined,
          from: fromUserId,
        },
        timestamp: Date.now(),
        source: "payment-form",
      })

      // Reset form
      setRecipient("")
      setAmount("")
      setReason("")
      setCampaignId("")

      onPaymentSent?.()
    } catch (error) {
      console.error("Payment failed:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send TRST Payment</CardTitle>
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
          <Label htmlFor="amount">Amount (TRST)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason (Optional)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What's this payment for?"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign">Campaign ID (Optional)</Label>
          <Input
            id="campaign"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            placeholder="campaign-123"
          />
        </div>

        <Button
          onClick={handleSendPayment}
          disabled={!recipient || !amount || Number.parseFloat(amount) <= 0 || sending}
          className="w-full"
        >
          {sending ? "Sending..." : `Send ${amount || "0"} TRST`}
        </Button>
      </CardContent>
    </Card>
  )
}
