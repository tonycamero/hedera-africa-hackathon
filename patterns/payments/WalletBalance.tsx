"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, RefreshCw } from "lucide-react"
import { matterFiClient, type MatterFiWallet } from "../../packages/matterfi/MatterFiClient"

interface WalletBalanceProps {
  userId: string
  onSendPayment?: () => void
}

export function WalletBalance({ userId, onSendPayment }: WalletBalanceProps) {
  const [wallet, setWallet] = useState<MatterFiWallet | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadWallet()
  }, [userId])

  const loadWallet = async () => {
    setLoading(true)
    try {
      if (!matterFiClient.isReady()) {
        await matterFiClient.initialize()
      }

      let userWallet = matterFiClient.getWalletByUserId(userId)
      if (!userWallet) {
        userWallet = await matterFiClient.provisionWallet(userId)
      }

      setWallet(userWallet)
    } catch (error) {
      console.error("Failed to load wallet:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshBalance = async () => {
    if (wallet) {
      const balance = await matterFiClient.getWalletBalance(wallet.address)
      setWallet({ ...wallet, balance })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="ml-2">Loading wallet...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Wallet className="h-8 w-8 mx-auto mb-2" />
            <p>No wallet found</p>
            <Button onClick={loadWallet} size="sm" className="mt-2">
              Create Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            TRST Wallet
          </div>
          <Button onClick={refreshBalance} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{wallet.balance}</div>
          <div className="text-sm text-muted-foreground">TRST Balance</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Address:</span>
            <span className="font-mono text-xs">
              {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={wallet.isProvisioned ? "default" : "secondary"}>
              {wallet.isProvisioned ? "Active" : "Pending"}
            </Badge>
          </div>
        </div>

        {onSendPayment && (
          <Button onClick={onSendPayment} className="w-full">
            Send TRST
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
